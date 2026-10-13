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

export type BulkProductRow = {
  name: string
  categoryName: string
  sku?: string
  costPrice: number
  sellingRate: number
  wholesaleRate?: number
  gstRate?: number
  stockQty: number
}

// 4. Bulk CSV / Store Catalog Migration Action (Review 3 Milestone)
export async function bulkImportProducts(rows: BulkProductRow[]) {
  const session = await auth()
  if (!session?.user?.tenantId) throw new Error('Unauthorized: No tenant context found')
  const tenantId = session.user.tenantId

  if (!rows || rows.length === 0) {
    throw new Error('No valid product rows provided for import')
  }

  let importedCount = 0

  await prisma.$transaction(async (tx) => {
    for (const row of rows) {
      if (!row.name || isNaN(row.sellingRate) || isNaN(row.costPrice)) continue

      const catName = (row.categoryName || 'Apparel').trim()
      const category = await tx.category.upsert({
        where: { name: catName },
        update: {},
        create: { name: catName },
      })

      const sku = (row.sku || `SKU-${Math.random().toString(36).substring(2, 8).toUpperCase()}`).trim()
      const existing = await tx.product.findFirst({
        where: { tenantId, sku },
      })

      if (existing) {
        await tx.product.update({
          where: { id: existing.id },
          data: {
            name: row.name.trim(),
            categoryId: category.id,
            costPrice: Number(row.costPrice),
            sellingRate: Number(row.sellingRate),
            wholesaleRate: Number(row.wholesaleRate || Math.round(row.sellingRate * 0.8)),
            gstRate: Number(row.gstRate ?? 12),
            stockQty: Number(row.stockQty || 0),
          },
        })
      } else {
        await tx.product.create({
          data: {
            tenantId,
            name: row.name.trim(),
            categoryId: category.id,
            sku,
            barcode: sku,
            costPrice: Number(row.costPrice),
            sellingRate: Number(row.sellingRate),
            wholesaleRate: Number(row.wholesaleRate || Math.round(row.sellingRate * 0.8)),
            gstRate: Number(row.gstRate ?? 12),
            stockQty: Number(row.stockQty || 0),
          },
        })
      }
      importedCount++
    }
  })

  revalidatePath('/')
  revalidatePath('/pos')
  revalidatePath('/inventory')

  return { success: true, importedCount }
}