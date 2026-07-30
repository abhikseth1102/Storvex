'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function createCustomer(formData: FormData) {
  const session = await auth()
  if (!session?.user?.tenantId) throw new Error('Unauthorized: No tenant context found')

  const name = formData.get('name') as string
  const phone = (formData.get('phone') as string) || null
  const city = (formData.get('city') as string) || null
  const companyName = (formData.get('companyName') as string) || null
  const gstin = (formData.get('gstin') as string) || null
  const billingAddress = (formData.get('billingAddress') as string) || null

  if (!name || name.trim() === '') {
    throw new Error('Customer name is required')
  }

  const newCustomer = await prisma.customer.create({
    data: {
      name: name.trim(),
      phone: phone ? phone.trim() : null,
      city: city ? city.trim() : null,
      companyName: companyName ? companyName.trim() : null,
      gstin: gstin ? gstin.trim().toUpperCase() : null,
      billingAddress: billingAddress ? billingAddress.trim() : null,
      tenantId: session.user.tenantId,
    },
  })

  revalidatePath('/customers')
  revalidatePath('/pos')

  // Return the new customer so client components can auto-select them!
  return { success: true, customer: newCustomer }
}

export async function deleteCustomer(customerId: string) {
  const session = await auth()
  if (!session?.user?.tenantId) throw new Error('Unauthorized')

  await prisma.customer.delete({
    where: {
      id: customerId,
      tenantId: session.user.tenantId,
    },
  })

  revalidatePath('/customers')
  revalidatePath('/pos')
}

export async function receiveCustomerPayment(data: {
  customerId: string,
  amount: number,
  paymentMode: string,
  referenceNo?: string
}) {
  const session = await auth()
  const tenantId = session?.user?.tenantId
  if (!tenantId) throw new Error('Unauthorized')
  if (data.amount <= 0) throw new Error('Amount must be positive')

  await prisma.$transaction(async (tx) => {
    const payment = await tx.customerPayment.create({
      data: {
        tenantId,
        customerId: data.customerId,
        amount: data.amount,
        paymentMode: data.paymentMode,
        referenceNo: data.referenceNo || null
      }
    })
    
    await tx.customer.update({
      where: { id: data.customerId },
      data: { balance: { decrement: data.amount } }
    })

    // General Ledger Automation
    const accountType = data.paymentMode === 'CASH' ? 'CASH' : 'BANK'
    let account = await tx.account.findFirst({ where: { tenantId, type: accountType } })
    if (!account) {
      const accName = accountType === 'CASH' ? 'Main Cash Drawer' : 'Main Bank Account'
      account = await tx.account.create({ data: { tenantId, name: accName, type: accountType, balance: 0 } })
    }
    
    // Customer Payments are money IN, so we increment balance
    await tx.account.update({
      where: { id: account.id },
      data: { balance: { increment: data.amount } }
    })
    
    await tx.ledgerTransaction.create({
      data: {
        tenantId,
        accountId: account.id,
        type: 'CREDIT',
        amount: data.amount,
        description: `Customer Payment via ${data.paymentMode}`,
        referenceId: payment.id
      }
    })
  })

  revalidatePath('/customers')
  return { success: true }
}