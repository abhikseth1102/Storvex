import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import SignOutButton from '@/components/SignOutButton'
import PosTerminal from '@/components/PosTerminal'

export default async function PosPage() {
  const session = await auth()
  if (!session?.user?.tenantId) redirect('/api/auth/signin')

  const tenantId = session.user.tenantId

  // 1. Fetch active inventory products
  const products = await prisma.product.findMany({
    where: { tenantId },
    orderBy: { name: 'asc' },
    include: {
      category: { select: { name: true } },
    },
  })

  // 2. Fetch registered customers for the CRM dropdown
  const customers = await prisma.customer.findMany({
    where: { tenantId },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      phone: true,
      companyName: true,
      gstin: true,
      loyaltyPoints: true,
    },
  })

  return (
    <div 
      className="min-h-screen font-sans pb-6 bg-brand-cream selection:bg-brand-gold/30 relative overflow-hidden z-0"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Cpath d='M0 10 Q 10 5, 20 10 T 40 10 M0 30 Q 10 25, 20 30 T 40 30' fill='none' stroke='rgba(28,28,30,0.08)' stroke-width='1'/%3E%3Cpath d='M10 0 Q 5 10, 10 20 T 10 40 M30 0 Q 25 10, 30 20 T 30 40' fill='none' stroke='rgba(28,28,30,0.08)' stroke-width='1'/%3E%3C/svg%3E")`,
        backgroundSize: '40px 40px'
      }}
    >
      {/* Artistic Free-form Background (Warm Amber & Rose for POS) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-[10%] -right-[10%] w-[50%] h-[50%] rounded-full bg-amber-300/20 blur-[120px] mix-blend-multiply"></div>
        <div className="absolute top-[30%] -left-[10%] w-[40%] h-[60%] rounded-full bg-rose-300/15 blur-[120px] mix-blend-multiply"></div>
        <div className="absolute -bottom-[10%] right-[20%] w-[60%] h-[50%] rounded-full bg-brand-gold/10 blur-[120px] mix-blend-multiply"></div>
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
              Storvex <span className="text-sm font-sans font-extrabold uppercase tracking-widest text-brand-gold bg-brand-gold/10 px-2 py-0.5 rounded-full ml-1">Terminal</span>
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <Link
              href="/customers"
              className="text-xs bg-white/80 hover:bg-brand-cream text-brand-charcoal font-bold px-4 py-2 rounded-xl transition-all shadow-sm border border-brand-charcoal/5 hover:border-brand-gold/30"
            >
              👥 CRM Directory
            </Link>
            <Link
              href="/invoices"
              className="text-xs bg-white/80 hover:bg-brand-cream text-brand-charcoal font-bold px-4 py-2 rounded-xl transition-all shadow-sm border border-brand-charcoal/5 hover:border-brand-gold/30"
            >
              📊 Sales Ledger
            </Link>
            <div className="pl-2 border-l border-brand-charcoal/10">
              <SignOutButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Terminal Viewport */}
      <main className="max-w-7xl mx-auto px-6 pt-6">
        <PosTerminal products={products} customers={customers} />
      </main>
    </div>
  )
}