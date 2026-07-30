'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

type CartItem = {
  productId: string
  quantity: number
  unitRate: number
  totalPrice: number
  gstRate: number
  gstAmount: number
  discountAmt?: number
}

type CheckoutPayload = {
  items: CartItem[]
  paymentMode: 'CASH' | 'CARD' | 'CREDIT' | 'SPLIT' | 'UPI'
  discountAmt: number
  customerId?: string | null
  pointsToRedeem?: number
  paidCash?: number
  paidCard?: number
  paidCredit?: number
  isB2b?: boolean
}

export async function processCheckout(payload: CheckoutPayload) {
  const session = await auth()
  if (!session?.user?.tenantId) throw new Error('Unauthorized: No tenant context found')

  const tenantId = session.user.tenantId
  const { items, paymentMode, discountAmt, customerId, pointsToRedeem = 0, isB2b = false } = payload

  if (!items || items.length === 0) {
    throw new Error('Cart is empty')
  }

  // Calculate points discount (e.g. 10 points = $1)
  const pointsDiscount = Math.floor(pointsToRedeem / 10)

  // 1. Calculate financial totals
  const grossAmount = items.reduce((sum, item) => sum + item.totalPrice, 0)
  const totalGST = items.reduce((sum, item) => sum + item.gstAmount, 0)
  const netAmount = Math.max(0, grossAmount + totalGST - discountAmt - pointsDiscount)
  
  // Earn 1 point for every $10 spent
  const earnedPoints = Math.floor(netAmount / 10)

  // 2. Generate a random invoice number (e.g., INV-884920)
  const invoiceNumber = `INV-${Math.floor(100000 + Math.random() * 900000)}`

  // 3. Execute atomic database transaction
  const invoice = await prisma.$transaction(async (tx) => {
    // A. Decrement stock for all purchased items atomicaly
    for (const item of items) {
      await tx.product.update({
        where: { id: item.productId, tenantId },
        data: {
          stockQty: {
            decrement: item.quantity,
          },
        },
      })
    }

    // Default Due Date: If Credit, 15 days from now
    let dueDate = undefined
    if (paymentMode === 'CREDIT' || (payload.paidCredit && payload.paidCredit > 0)) {
      dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + 15) // Net 15 terms
    }

    // B. Create the SaleInvoice and attach the customer if selected!
    const newInvoice = await tx.saleInvoice.create({
      data: {
        invoiceNumber,
        grossAmount,
        discountAmt: discountAmt + pointsDiscount, // Track total discount
        gstAmount: totalGST,
        netAmount,
        paymentMode,
        paidCash: payload.paidCash || 0,
        paidCard: payload.paidCard || 0,
        paidCredit: payload.paidCredit || 0,
        isB2b,
        dueDate,
        tenantId,
        customerId: customerId || null,
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitRate: item.unitRate,
            totalPrice: item.totalPrice,
            gstRate: item.gstRate,
            gstAmount: item.gstAmount,
            discountAmt: item.discountAmt || 0,
          })),
        },
      },
      include: {
        customer: {
          select: { name: true, phone: true },
        },
        tenant: {
          select: { gstin: true, pan: true },
        },
      },
    })

    // C. Update Customer Loyalty Points
    if (customerId) {
      await tx.customer.update({
        where: { id: customerId }, // tenantId check ensures it's the right tenant
        data: {
          loyaltyPoints: {
            increment: earnedPoints - pointsToRedeem
          }
        }
      })
    }

    // D. Accounts Receivable (Customer Ledger)
    if (paymentMode === 'CREDIT' || (payload.paidCredit && payload.paidCredit > 0)) {
      if (!customerId) throw new Error('Customer must be selected for Store Credit purchases.')
      const creditAmount = paymentMode === 'CREDIT' ? netAmount : payload.paidCredit!
      
      await tx.customer.update({
        where: { id: customerId },
        data: {
          balance: { increment: creditAmount }
        }
      })
    }

    // E. General Ledger (Cash Book & Bank Book)
    const cashAmount = paymentMode === 'CASH' ? netAmount : (payload.paidCash || 0)
    if (cashAmount > 0) {
      let cashAccount = await tx.account.findFirst({ where: { tenantId, type: 'CASH' } })
      if (!cashAccount) {
        cashAccount = await tx.account.create({ data: { tenantId, name: 'Main Cash Drawer', type: 'CASH', balance: 0 } })
      }
      await tx.account.update({
        where: { id: cashAccount.id },
        data: { balance: { increment: cashAmount } }
      })
      await tx.ledgerTransaction.create({
        data: {
          tenantId, accountId: cashAccount.id, type: 'CREDIT', amount: cashAmount,
          description: `Cash Sale ${invoiceNumber}`, referenceId: newInvoice.id
        }
      })
    }

    const bankAmount = paymentMode === 'UPI' || paymentMode === 'CARD' ? netAmount : (payload.paidCard || 0)
    if (bankAmount > 0) {
      let bankAccount = await tx.account.findFirst({ where: { tenantId, type: 'BANK' } })
      if (!bankAccount) {
        bankAccount = await tx.account.create({ data: { tenantId, name: 'Main Bank Account', type: 'BANK', balance: 0 } })
      }
      await tx.account.update({
        where: { id: bankAccount.id },
        data: { balance: { increment: bankAmount } }
      })
      await tx.ledgerTransaction.create({
        data: {
          tenantId, accountId: bankAccount.id, type: 'CREDIT', amount: bankAmount,
          description: `${paymentMode} Sale ${invoiceNumber}`, referenceId: newInvoice.id
        }
      })
    }

    return newInvoice
  })

  // 4. Refresh dashboards and CRM stats
  revalidatePath('/')
  revalidatePath('/pos')
  revalidatePath('/invoices')
  revalidatePath('/inventory')
  revalidatePath('/customers')

  // Return formatted data to trigger the thermal receipt modal on the client
  return {
    success: true,
    invoice: {
      invoiceNumber: invoice.invoiceNumber,
      grossAmount: invoice.grossAmount,
      discountAmt: invoice.discountAmt,
      gstAmount: invoice.gstAmount,
      netAmount: invoice.netAmount,
      paymentMode: invoice.paymentMode,
      date: new Date(invoice.createdAt).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
      customerName: invoice.customer?.name || null,
      gstin: invoice.tenant?.gstin || null,
      pan: invoice.tenant?.pan || null,
    },
  }
}