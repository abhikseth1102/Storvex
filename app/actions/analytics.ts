'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function getDashboardMetrics() {
  const session = await auth()
  if (!session?.user?.tenantId) throw new Error('Unauthorized')
  
  const tenantId = session.user.tenantId

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  // 1. Revenue over 30 days & B2B/B2C Split
  const recentInvoices = await prisma.saleInvoice.findMany({
    where: {
      tenantId,
      createdAt: { gte: thirtyDaysAgo },
      type: 'SALE',
      isRefunded: false
    },
    select: {
      netAmount: true,
      createdAt: true,
      isB2b: true
    },
    orderBy: { createdAt: 'asc' }
  })

  const revenueByDate: Record<string, number> = {}
  let retailRevenue = 0
  let wholesaleRevenue = 0

  recentInvoices.forEach(inv => {
    const dateKey = inv.createdAt.toISOString().split('T')[0]
    revenueByDate[dateKey] = (revenueByDate[dateKey] || 0) + inv.netAmount
    
    if (inv.isB2b) {
      wholesaleRevenue += inv.netAmount
    } else {
      retailRevenue += inv.netAmount
    }
  })

  const revenueData = Object.keys(revenueByDate).map(date => ({
    date,
    revenue: revenueByDate[date]
  }))

  const b2bVsB2c = [
    { name: 'Retail (B2C)', value: retailRevenue },
    { name: 'Wholesale (B2B)', value: wholesaleRevenue }
  ].filter(d => d.value > 0)

  // 2. Sale Items Analysis (Top SKUs, Category Sales, Profitability)
  const recentSaleItems = await prisma.saleItem.findMany({
    where: {
      invoice: {
        tenantId,
        type: 'SALE',
        isRefunded: false,
        createdAt: { gte: thirtyDaysAgo }
      }
    },
    include: {
      product: { 
        select: { 
          name: true,
          costPrice: true,
          category: { select: { name: true } }
        } 
      }
    }
  })

  const skuVolume: Record<string, { name: string, quantity: number }> = {}
  const categoryVolume: Record<string, number> = {}
  let totalCogs = 0
  let totalRevenue = 0

  recentSaleItems.forEach(item => {
    // SKU aggregation
    if (!skuVolume[item.productId]) {
      skuVolume[item.productId] = { name: item.product.name, quantity: 0 }
    }
    skuVolume[item.productId].quantity += item.quantity

    // Category aggregation (Sales Value)
    const catName = item.product.category?.name || 'Uncategorized'
    categoryVolume[catName] = (categoryVolume[catName] || 0) + item.totalPrice

    // Profitability
    totalRevenue += item.totalPrice
    totalCogs += (item.product.costPrice * item.quantity)
  })

  const topSkus = Object.values(skuVolume)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5)

  const categorySales = Object.keys(categoryVolume).map(name => ({
    name,
    value: categoryVolume[name]
  })).sort((a, b) => b.value - a.value)

  const profitability = {
    totalRevenue,
    totalCogs,
    grossMargin: totalRevenue > 0 ? ((totalRevenue - totalCogs) / totalRevenue) * 100 : 0
  }

  // 3. Low Stock Forecast
  const lowStockProducts = await prisma.product.findMany({
    where: {
      tenantId,
      stockQty: { lt: 10 }
    },
    select: {
      id: true,
      name: true,
      stockQty: true
    },
    orderBy: { stockQty: 'asc' },
    take: 10
  })

  return {
    revenueData,
    topSkus,
    lowStockProducts,
    categorySales,
    b2bVsB2c,
    profitability
  }
}
