'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// 1. Create a New Product (Matched exactly to schema.prisma)
export async function createProduct(formData: FormData) {
  const session = await auth()
  if (!session?.user?.tenantId) throw new Error('Unauthorized: No tenant context found')

  const name = formData.get('name') as string
  const categoryId = formData.get('categoryId') as string
  const sellingRate = parseFloat(formData.get('price') as string)
  const wholesaleRate = parseFloat(formData.get('wholesaleRate') as string) || 0
  const costPrice = parseFloat(formData.get('costPrice') as string)
  const gstRate = parseFloat(formData.get('gstRate') as string)
  const stockQty = parseInt(formData.get('stock') as string)
  const skuInput = formData.get('sku') as string
  const size = formData.get('size') as string
  const color = formData.get('color') as string

  // Simple auto-sku if empty
  const sku = skuInput || `SKU-${Math.random().toString(36).substring(2, 8).toUpperCase()}`

  if (!name || !categoryId || isNaN(sellingRate) || isNaN(stockQty) || isNaN(costPrice)) {
    throw new Error('Invalid form data provided')
  }

  await prisma.product.create({
    data: {
      tenantId: session.user.tenantId,
      name,
      categoryId,
      sellingRate,
      wholesaleRate,
      costPrice,
      gstRate,
      stockQty,
      sku,
      barcode: sku,
      size: size || null,
      color: color || null,
    },
  })

  revalidatePath('/')
  revalidatePath('/pos')
  revalidatePath('/inventory')
}

// 2. Atomic Stock Adjustment using `stockQty`
export async function adjustStock(productId: string, amount: number) {
  const session = await auth()
  if (!session?.user?.tenantId) throw new Error('Unauthorized')

  await prisma.product.update({
    where: {
      id: productId,
      tenantId: session.user.tenantId,
    },
    data: {
      stockQty: {
        increment: amount, // Atomically modifies stock_qty without race conditions
      },
    },
  })

  revalidatePath('/')
  revalidatePath('/pos')
  revalidatePath('/inventory')
}

// 3. Delete a Product
export async function deleteProduct(productId: string) {
  const session = await auth()
  if (!session?.user?.tenantId) throw new Error('Unauthorized')

  await prisma.product.delete({
    where: {
      id: productId,
      tenantId: session.user.tenantId,
    },
  })

  revalidatePath('/')
  revalidatePath('/pos')
  revalidatePath('/inventory')
}