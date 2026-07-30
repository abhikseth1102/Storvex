'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function createSupplier(formData: FormData) {
  const session = await auth()
  if (!session?.user?.tenantId) throw new Error('Unauthorized')
  
  const tenantId = session.user.tenantId
  const name = formData.get('name') as string
  const contactName = formData.get('contactName') as string
  const email = formData.get('email') as string
  const phone = formData.get('phone') as string
  const address = formData.get('address') as string
  const gstin = formData.get('gstin') as string

  if (!name) throw new Error('Supplier name is required')

  const supplier = await prisma.supplier.create({
    data: {
      tenantId,
      name,
      contactName: contactName || null,
      email: email || null,
      phone: phone || null,
      address: address || null,
      gstin: gstin || null,
    }
  })

  revalidatePath('/procurement')
  return { success: true, supplier }
}

export async function createPurchaseOrder(data: {
  supplierId: string,
  poNumber: string,
  items: { productId: string, quantity: number, unitCost: number, gstAmount?: number }[]
}) {
  const session = await auth()
  if (!session?.user?.tenantId) throw new Error('Unauthorized')
  
  const tenantId = session.user.tenantId

  if (!data.items || data.items.length === 0) {
    throw new Error('Must include at least one item')
  }

  const totalAmount = data.items.reduce((sum, item) => sum + (item.quantity * item.unitCost) + (item.gstAmount || 0), 0)

  const po = await prisma.purchaseOrder.create({
    data: {
      tenantId,
      supplierId: data.supplierId,
      poNumber: data.poNumber,
      status: 'ISSUED',
      totalAmount,
      items: {
        create: data.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitCost: item.unitCost,
          gstAmount: item.gstAmount || 0,
          totalCost: (item.quantity * item.unitCost) + (item.gstAmount || 0)
        }))
      }
    }
  })

  revalidatePath('/procurement')
  return { success: true, po }
}

export async function receivePurchaseOrder(poId: string) {
  const session = await auth()
  if (!session?.user?.tenantId) throw new Error('Unauthorized')
  
  const tenantId = session.user.tenantId

  const po = await prisma.purchaseOrder.findUnique({
    where: { id: poId, tenantId },
    include: { items: true }
  })

  if (!po) throw new Error('Purchase Order not found')
  if (po.status === 'RECEIVED') throw new Error('Already received')

  await prisma.$transaction(async (tx) => {
    // 1. Mark PO as RECEIVED
    await tx.purchaseOrder.update({
      where: { id: poId },
      data: { status: 'RECEIVED' }
    })

    // 2. Increment stock in the database automatically
    for (const item of po.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stockQty: { increment: item.quantity },
          costPrice: item.unitCost
        }
      })
    }

    // 3. Add to Supplier Balance (Accounts Payable)
    await tx.supplier.update({
      where: { id: po.supplierId },
      data: {
        balance: { increment: po.totalAmount }
      }
    })
  })

  revalidatePath('/procurement')
  revalidatePath('/inventory')
  return { success: true }
}

export async function recordSupplierPayment(data: {
  supplierId: string,
  amount: number,
  paymentMode: string,
  referenceNo?: string
}) {
  const session = await auth()
  const tenantId = session?.user?.tenantId
  if (!tenantId) throw new Error('Unauthorized')

  if (data.amount <= 0) throw new Error('Amount must be positive')

  await prisma.$transaction(async (tx) => {
    const payment = await tx.supplierPayment.create({
      data: {
        tenantId,
        supplierId: data.supplierId,
        amount: data.amount,
        paymentMode: data.paymentMode,
        referenceNo: data.referenceNo || null
      }
    })
    
    await tx.supplier.update({
      where: { id: data.supplierId },
      data: {
        balance: { decrement: data.amount }
      }
    })

    // General Ledger Automation
    const accountType = data.paymentMode === 'CASH' ? 'CASH' : 'BANK'
    let account = await tx.account.findFirst({ where: { tenantId, type: accountType } })
    if (!account) {
      const accName = accountType === 'CASH' ? 'Main Cash Drawer' : 'Main Bank Account'
      account = await tx.account.create({ data: { tenantId, name: accName, type: accountType, balance: 0 } })
    }
    
    // Payments are money OUT, so we decrement balance
    await tx.account.update({
      where: { id: account.id },
      data: { balance: { decrement: data.amount } }
    })
    
    await tx.ledgerTransaction.create({
      data: {
        tenantId,
        accountId: account.id,
        type: 'DEBIT',
        amount: data.amount,
        description: `Supplier Payment via ${data.paymentMode}`,
        referenceId: payment.id
      }
    })
  })

  revalidatePath('/procurement')
  return { success: true }
}
