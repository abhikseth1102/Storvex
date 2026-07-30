'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function createManualLedgerEntry(data: {
  accountId: string
  type: 'CREDIT' | 'DEBIT'
  amount: number
  description: string
}) {
  const session = await auth()
  if (!session?.user?.tenantId) throw new Error('Unauthorized')
  
  const tenantId = session.user.tenantId
  const { accountId, type, amount, description } = data

  if (!accountId || !type || amount <= 0 || !description) {
    throw new Error('Invalid input')
  }

  await prisma.$transaction(async (tx) => {
    await tx.ledgerTransaction.create({
      data: {
        tenantId,
        accountId,
        type,
        amount,
        description
      }
    })
    
    // CREDIT increases balance (money IN), DEBIT decreases (money OUT)
    await tx.account.update({
      where: { id: accountId },
      data: { balance: type === 'CREDIT' ? { increment: amount } : { decrement: amount } }
    })
  })

  revalidatePath('/accounts')
  return { success: true }
}
