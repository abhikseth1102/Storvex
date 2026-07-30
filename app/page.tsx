import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import SignOutButton from '@/components/SignOutButton'
import AddProductModal from '@/components/AddProductModal'
import BoutiqueNav from '@/components/BoutiqueNav'
import { Search } from 'lucide-react'

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.tenantId || session.user.role !== 'ADMIN') {
    redirect('/pos')
  }

  const tenantId = session.user.tenantId

  // 1. Fetch categories and count only the products belonging to THIS tenant
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: {
          products: {
            where: { tenantId },
          },
        },
      },
    },
  })

  // 2. Stats for the 4 Widgets
  const totalProducts = await prisma.product.count({ where: { tenantId } })
  const lowStockCount = await prisma.product.count({ where: { tenantId, stockQty: { lt: 10 } } })
  
  const retailInvoices = await prisma.saleInvoice.count({ where: { tenantId, isB2b: false, type: 'SALE' } })
  const wholesaleInvoices = await prisma.saleInvoice.count({ where: { tenantId, isB2b: true, type: 'SALE' } })

  return (
    <div 
      className="min-h-screen font-sans pb-16 bg-brand-cream selection:bg-brand-gold/30 relative overflow-hidden z-0"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Cpath d='M0 10 Q 10 5, 20 10 T 40 10 M0 30 Q 10 25, 20 30 T 40 30' fill='none' stroke='rgba(28,28,30,0.08)' stroke-width='1'/%3E%3Cpath d='M10 0 Q 5 10, 10 20 T 10 40 M30 0 Q 25 10, 30 20 T 30 40' fill='none' stroke='rgba(28,28,30,0.08)' stroke-width='1'/%3E%3C/svg%3E")`,
        backgroundSize: '40px 40px'
      }}
    >
      
      {/* Artistic Free-form Background (Watercolor / Dye Wash effect) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-brand-gold/20 blur-[120px] mix-blend-multiply"></div>
        <div className="absolute top-[20%] -right-[10%] w-[40%] h-[60%] rounded-full bg-sky-300/10 blur-[120px] mix-blend-multiply"></div>
        <div className="absolute -bottom-[10%] left-[20%] w-[60%] h-[50%] rounded-full bg-rose-200/20 blur-[120px] mix-blend-multiply"></div>
      </div>

      {/* Editorial Top Bar */}
      <header className="border-b border-brand-charcoal/5 bg-white/60 backdrop-blur-xl sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center space-x-3 w-1/3">
            <div className="w-10 h-10 border border-brand-gold flex items-center justify-center text-brand-gold font-serif italic text-2xl rounded-full bg-brand-cream/50 shadow-sm">
              S
            </div>
            <span className="font-serif text-2xl tracking-wide text-brand-charcoal">
              Storvex
            </span>
          </div>

          {/* Ambient AI Command Bar */}
          <div className="hidden md:flex w-1/3 justify-center">
            <div className="relative w-full max-w-md group">
              <Search strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-charcoal/40 group-hover:text-brand-gold transition-colors" />
              <input 
                type="text" 
                placeholder="Ask Storvex or search..." 
                className="w-full bg-brand-cream/50 border border-brand-charcoal/10 rounded-full py-2 pl-10 pr-12 text-sm text-brand-charcoal placeholder:text-brand-charcoal/40 focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold/50 transition-all shadow-sm"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-medium text-brand-charcoal/40 bg-white border border-brand-charcoal/10 rounded-md shadow-sm">⌘</kbd>
                <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-medium text-brand-charcoal/40 bg-white border border-brand-charcoal/10 rounded-md shadow-sm">K</kbd>
              </div>
            </div>
          </div>

          {/* Profile & Actions */}
          <div className="flex items-center justify-end space-x-6 w-1/3">
            <div className="flex flex-col text-right">
              <span className="text-sm font-medium text-brand-charcoal">{session.user.name}</span>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-brand-gold">
                {session.user.role}
              </span>
            </div>
            <SignOutButton />
          </div>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="max-w-6xl mx-auto px-6 py-10">
        
        {/* Boutique Welcome Hero */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12 border-b border-brand-charcoal/10 pb-8">
          <div>
            <h1 className="font-serif text-4xl sm:text-5xl tracking-tight text-brand-charcoal mb-3">
              Mission Control
            </h1>
            <p className="text-brand-charcoal/60 text-sm font-medium">
              Command inventory, unlock real-time intelligence, and scale your brand.
            </p>
          </div>
          <div className="flex-shrink-0">
            <AddProductModal categories={categories} />
          </div>
        </div>

        {/* Dashboard Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* LEFT COLUMN: Metrics & Categories */}
          <div className="lg:col-span-7 space-y-10">
            
            {/* 4 Dynamic Stat Cards */}
            <div>
              <h2 className="text-xs uppercase tracking-widest text-brand-charcoal/50 font-semibold mb-4">
                Overview
              </h2>
              <div className="grid grid-cols-2 gap-4">
                
                {/* Active SKUs */}
                <div className="bg-brand-charcoal text-white p-5 rounded-2xl shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" fill="none"/></svg>
                  </div>
                  <div className="text-brand-gold text-[10px] uppercase tracking-widest font-bold mb-1">Active SKUs</div>
                  <div className="text-3xl font-serif mb-1">{totalProducts}</div>
                  <div className="text-xs text-white/50 font-medium">↑ 12% vs last month</div>
                </div>

                {/* Low Stock Alerts */}
                <div className="bg-white border border-rose-200 p-5 rounded-2xl shadow-sm hover:border-rose-300 transition-colors">
                  <div className="flex items-center gap-2 text-rose-600 text-[10px] uppercase tracking-widest font-bold mb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                    Low Stock Alerts
                  </div>
                  <div className="text-3xl font-serif text-brand-charcoal mb-1">{lowStockCount}</div>
                  <div className="text-xs text-brand-charcoal/40 font-medium">Items under 10 units</div>
                </div>

                {/* Retail Checkouts */}
                <div className="bg-white border border-brand-charcoal/10 p-5 rounded-2xl shadow-sm hover:border-brand-gold/30 transition-colors">
                  <div className="text-brand-charcoal/50 text-[10px] uppercase tracking-widest font-bold mb-1">Retail Volume</div>
                  <div className="text-3xl font-serif text-brand-charcoal mb-1">{retailInvoices}</div>
                  <div className="text-xs text-emerald-600 font-medium">↑ Steady flow</div>
                </div>

                {/* Wholesale Volume */}
                <div className="bg-white border border-brand-charcoal/10 p-5 rounded-2xl shadow-sm hover:border-brand-gold/30 transition-colors">
                  <div className="text-brand-charcoal/50 text-[10px] uppercase tracking-widest font-bold mb-1">Wholesale POs</div>
                  <div className="text-3xl font-serif text-brand-charcoal mb-1">{wholesaleInvoices}</div>
                  <div className="text-xs text-brand-gold font-medium">High margin</div>
                </div>

              </div>
            </div>

            {/* Category Overview */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs uppercase tracking-widest text-brand-charcoal/50 font-semibold">
                  Catalog by Category
                </h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="bg-white p-5 rounded-2xl border border-brand-charcoal/10 shadow-sm flex flex-col justify-between hover:border-brand-gold/50 transition-colors"
                  >
                    <span className="font-semibold text-sm text-brand-charcoal truncate" title={category.name}>
                      {category.name}
                    </span>
                    <div className="mt-4 flex items-center justify-between text-xs text-brand-charcoal/60">
                      <span>Items:</span>
                      <span className="font-mono font-medium">
                        {category._count.products}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Quick Actions & Modules */}
          <div className="lg:col-span-5">
            <BoutiqueNav />
          </div>

        </div>
      </main>
    </div>
  )
}