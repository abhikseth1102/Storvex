'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function adjustStock(data: {
  productId: string
  type: 'DAMAGE' | 'LOSS' | 'AUDIT' | 'PROMO'
  quantity: number
  reason: string
}) {
  const session = await auth()
  const tenantId = session?.user?.tenantId
  if (!tenantId) throw new Error('Unauthorized')

  await prisma.$transaction(async (tx) => {
    await tx.stockAdjustment.create({
      data: {
        tenantId,
        productId: data.productId,
        type: data.type,
        quantity: data.quantity,
        reason: data.reason
      }
    })

    await tx.product.update({
      where: { id: data.productId, tenantId },
      data: { stockQty: { increment: data.quantity } }
    })
  })

  revalidatePath('/inventory')
  revalidatePath('/pos')
  return { success: true }
}
