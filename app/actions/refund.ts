'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function processRefund(invoiceId: string) {
  const session = await auth()
  if (!session?.user?.tenantId) {
    throw new Error('Unauthorized')
  }

  const tenantId = session.user.tenantId

  // 1. Fetch original invoice with items
  const originalInvoice = await prisma.saleInvoice.findUnique({
    where: {
      id: invoiceId,
      tenantId,
    },
    include: {
      items: true
    }
  })

  if (!originalInvoice) {
    throw new Error('Invoice not found')
  }

  if (originalInvoice.isRefunded) {
    throw new Error('Invoice has already been refunded')
  }

  if (originalInvoice.type === 'REFUND') {
    throw new Error('Cannot refund a refund invoice')
  }

  // 2. Perform atomic transaction
  await prisma.$transaction(async (tx) => {
    // 2a. Mark original as refunded
    await tx.saleInvoice.update({
      where: { id: invoiceId },
      data: { isRefunded: true }
    })

    // 2b. Create new refund invoice with negative amounts
    const refundInvoice = await tx.saleInvoice.create({
      data: {
        tenantId,
        customerId: originalInvoice.customerId,
        invoiceNumber: `REF-${originalInvoice.invoiceNumber}`,
        grossAmount: -originalInvoice.grossAmount,
        discountAmt: -originalInvoice.discountAmt,
        netAmount: -originalInvoice.netAmount,
        paymentMode: originalInvoice.paymentMode,
        type: 'REFUND',
        isRefunded: true, // A refund invoice shouldn't be refundable
        items: {
          create: originalInvoice.items.map(item => ({
            productId: item.productId,
            quantity: -item.quantity,
            unitRate: item.unitRate, // Keeping unitRate positive, totalPrice negative
            totalPrice: -item.totalPrice
          }))
        }
      }
    })

    // 2c. Restock the items
    for (const item of originalInvoice.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stockQty: {
            increment: item.quantity
          }
        }
      })
    }
  })

  // Revalidate relevant pages so UI reflects the changes instantly
  revalidatePath('/invoices')
  revalidatePath('/inventory')
  revalidatePath('/customers')
  revalidatePath('/')

  return { success: true }
}

export async function processPartialRefund(invoiceId: string, returns: { productId: string, returnQty: number }[]) {
  const session = await auth()
  const tenantId = session?.user?.tenantId
  if (!tenantId) throw new Error('Unauthorized')

  const originalInvoice = await prisma.saleInvoice.findUnique({
    where: { id: invoiceId, tenantId },
    include: { items: true }
  })

  if (!originalInvoice) throw new Error('Invoice not found')
  if (originalInvoice.type === 'REFUND') throw new Error('Cannot refund a refund invoice')

  const itemsToReturn = returns.filter(r => r.returnQty > 0)
  if (itemsToReturn.length === 0) throw new Error('No items selected for return')

  try {
    await prisma.$transaction(async (tx) => {
      let totalRefundGross = 0
      let totalRefundDiscount = 0
      let totalRefundNet = 0
      
      const refundItemsData = []

      for (const ret of itemsToReturn) {
        const origItem = originalInvoice.items.find(i => i.productId === ret.productId)
        if (!origItem) continue
        
        const qty = Number(ret.returnQty) || 0
        const origQty = Number(origItem.quantity) || 1
        const proportion = qty / origQty
        
        const gross = (Number(origItem.totalPrice) || 0) * proportion
        const discount = (Number(origItem.discountAmt) || 0) * proportion
        const gst = (Number(origItem.gstAmount) || 0) * proportion
        const net = gross - discount + gst

        totalRefundGross += gross
        totalRefundDiscount += discount
        totalRefundNet += net

        refundItemsData.push({
          productId: origItem.productId,
          quantity: -qty,
          unitRate: Number(origItem.unitRate) || 0,
          discountAmt: -discount,
          gstRate: Number(origItem.gstRate) || 0,
          gstAmount: -gst,
          totalPrice: -gross
        })

        // Restock
        await tx.product.update({
          where: { id: origItem.productId },
          data: { stockQty: { increment: qty } }
        })
      }

      const calculatedGst = totalRefundNet - totalRefundGross + totalRefundDiscount

      // Create partial refund invoice
      await tx.saleInvoice.create({
        data: {
          tenantId,
          customerId: originalInvoice.customerId || null,
          invoiceNumber: `PR-${originalInvoice.invoiceNumber}-${Date.now().toString().slice(-4)}`,
          grossAmount: -totalRefundGross,
          discountAmt: -totalRefundDiscount,
          gstAmount: -calculatedGst,
          netAmount: -totalRefundNet,
          paymentMode: originalInvoice.paymentMode,
          type: 'REFUND',
          isRefunded: true,
          items: {
            create: refundItemsData
          }
        }
      })
    })
  } catch (err: any) {
    require('fs').writeFileSync('C:/Users/user/storvex/prisma-error.txt', err.message || String(err))
    throw err
  }

  revalidatePath('/invoices')
  revalidatePath('/inventory')
  return { success: true }
}
