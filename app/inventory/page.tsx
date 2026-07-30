import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import SignOutButton from '@/components/SignOutButton'
import InventoryTable from '@/components/InventoryTable'
import AddProductModal from '@/components/AddProductModal'
import { formatINR } from '@/lib/utils'

export default async function InventoryPage() {
  const session = await auth()
  if (!session?.user?.tenantId) redirect('/api/auth/signin')
  if (session.user.role !== 'ADMIN') redirect('/pos')

  const tenantId = session.user.tenantId

  // Fetch all products with their categories
  const products = await prisma.product.findMany({
    where: { tenantId },
    orderBy: { name: 'asc' },
    include: {
      category: {
        select: { name: true },
      },
    },
  })

  // Fetch categories for AddProductModal
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
  })

  // Calculate high-level Inventory KPIs using schema fields
  const totalSkus = products.length
  const outOfStockCount = products.filter((p) => p.stockQty <= 0).length
  const lowStockCount = products.filter((p) => p.stockQty > 0 && p.stockQty <= 5).length
  
  // Total Valuation = Sum of (Cost Price * Stock Qty) across all positive inventory
  const totalValuation = products.reduce((sum, p) => {
    const validStock = Math.max(0, p.stockQty)
    return sum + Number(p.costPrice || p.sellingRate) * validStock
  }, 0)

  return (
    <div 
      className="min-h-screen font-sans pb-12 bg-brand-cream selection:bg-brand-gold/30 relative overflow-hidden z-0"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Cpath d='M0 10 Q 10 5, 20 10 T 40 10 M0 30 Q 10 25, 20 30 T 40 30' fill='none' stroke='rgba(28,28,30,0.08)' stroke-width='1'/%3E%3Cpath d='M10 0 Q 5 10, 10 20 T 10 40 M30 0 Q 25 10, 30 20 T 30 40' fill='none' stroke='rgba(28,28,30,0.08)' stroke-width='1'/%3E%3C/svg%3E")`,
        backgroundSize: '40px 40px'
      }}
    >
      {/* Artistic Free-form Background (Cool Sage & Sky for Inventory) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-teal-200/20 blur-[120px] mix-blend-multiply"></div>
        <div className="absolute top-[20%] -right-[10%] w-[40%] h-[60%] rounded-full bg-sky-300/15 blur-[120px] mix-blend-multiply"></div>
        <div className="absolute -bottom-[10%] left-[20%] w-[60%] h-[50%] rounded-full bg-brand-gold/10 blur-[120px] mix-blend-multiply"></div>
      </div>

      {/* Navigation Header */}
      <header className="bg-white/60 backdrop-blur-xl border-b border-brand-charcoal/5 sticky top-0 z-20 transition-colors">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href="/"
              className="text-xs font-bold text-brand-charcoal/50 hover:text-brand-gold bg-brand-cream/50 hover:bg-brand-gold/10 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 shadow-sm"
            >
              ← Dashboard
            </Link>
            <span className="font-serif text-2xl tracking-wide text-brand-charcoal flex items-center gap-2">
              Storvex <span className="text-sm font-sans font-extrabold uppercase tracking-widest text-brand-gold bg-brand-gold/10 px-2 py-0.5 rounded-full ml-1">Inventory Base</span>
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <Link
              href="/invoices"
              className="text-xs bg-white/80 hover:bg-brand-cream text-brand-charcoal font-bold px-4 py-2 rounded-xl transition-all shadow-sm border border-brand-charcoal/5 hover:border-brand-gold/30"
            >
              📊 Sales Ledger
            </Link>
            <Link
              href="/pos"
              className="text-xs bg-brand-charcoal hover:bg-black text-brand-cream font-bold px-4 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
            >
              <span>🖥️ Open POS Terminal</span>
            </Link>
            
            <div className="flex gap-3 pl-2 border-l border-brand-charcoal/10">
              <Link
                href="/inventory/print-barcodes"
                className="px-4 py-2 bg-brand-cream hover:bg-brand-cream/80 text-brand-charcoal text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-2 border border-brand-charcoal/5"
              >
                🏷️ Print Barcodes
              </Link>
              <AddProductModal categories={categories} />
            </div>
            <div className="pl-2 border-l border-brand-charcoal/10">
              <SignOutButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        
        {/* Top KPI Cards (Boutique Style) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-3xl border border-brand-charcoal/5 shadow-[0_4px_20px_-4px_rgba(28,28,30,0.05)] transition-all hover:shadow-[0_8px_30px_-4px_rgba(28,28,30,0.08)]">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-brand-charcoal/40">Total SKUs</p>
            <h3 className="text-3xl font-serif text-brand-charcoal mt-2">
              {totalSkus}
            </h3>
            <p className="text-xs text-brand-charcoal/50 font-medium mt-2">
              Active product types
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-3xl border border-brand-charcoal/5 shadow-[0_4px_20px_-4px_rgba(28,28,30,0.05)] transition-all hover:shadow-[0_8px_30px_-4px_rgba(28,28,30,0.08)] relative overflow-hidden group">
            <div className="absolute inset-0 bg-brand-gold/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-brand-charcoal/40 relative z-10">Inventory Valuation</p>
            <h3 className="text-3xl font-serif text-brand-gold mt-2 relative z-10">
              {formatINR(totalValuation)}
            </h3>
            <p className="text-xs text-brand-charcoal/50 font-medium mt-2 relative z-10">
              Total wholesale capital
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-3xl border border-amber-500/10 shadow-[0_4px_20px_-4px_rgba(28,28,30,0.05)] transition-all hover:shadow-[0_8px_30px_-4px_rgba(28,28,30,0.08)] relative overflow-hidden group">
            <div className="absolute inset-0 bg-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-brand-charcoal/40 relative z-10">Low Stock Warning</p>
            <h3 className="text-3xl font-serif text-amber-600 mt-2 relative z-10">
              {lowStockCount}
            </h3>
            <p className="text-xs text-amber-700/70 font-medium mt-2 relative z-10">
              Items with ≤ 5 units left
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-3xl border border-rose-500/10 shadow-[0_4px_20px_-4px_rgba(28,28,30,0.05)] transition-all hover:shadow-[0_8px_30px_-4px_rgba(28,28,30,0.08)] relative overflow-hidden group">
            <div className="absolute inset-0 bg-rose-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-brand-charcoal/40 relative z-10">Out of Stock</p>
            <h3 className="text-3xl font-serif text-rose-600 mt-2 relative z-10">
              {outOfStockCount}
            </h3>
            <p className="text-xs text-rose-700/70 font-medium mt-2 relative z-10">
              Needs immediate restock
            </p>
          </div>
        </div>

        {/* Interactive Stock Management Table */}
        <InventoryTable products={products} />

      </main>
    </div>
  )
}