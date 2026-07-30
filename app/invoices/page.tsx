import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import SignOutButton from '@/components/SignOutButton'
import LedgerTable from '@/components/LedgerTable' // <-- Import our new Client Component
import { formatINR } from '@/lib/utils'

export default async function InvoicesPage() {
 const session = await auth()
 if (!session?.user?.tenantId) redirect('/api/auth/signin')
 if (session.user.role !== 'ADMIN') redirect('/pos')

 const tenantId = session.user.tenantId

 // 1. Fetch invoices, and deeply include the Product name for the receipt!
 const invoices = await prisma.saleInvoice.findMany({
 where: { tenantId },
 orderBy: { createdAt: 'desc' },
 include: {
 customer: {
 select: { name: true, phone: true }
 },
 items: {
 include: {
 product: {
 select: { name: true }, // Plucks the product name from the database
 },
 },
 },
 },
 })

 // 2. Calculate Top-Level Revenue KPIs
 const totalRevenue = invoices.reduce((sum, inv) => sum + Number(inv.netAmount), 0)
 const totalSales = invoices.length
 const avgOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0

 return (
 <div 
 className="min-h-screen font-sans pb-12 bg-brand-cream selection:bg-brand-gold/30 relative overflow-hidden z-0"
 style={{
 backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Cpath d='M0 10 Q 10 5, 20 10 T 40 10 M0 30 Q 10 25, 20 30 T 40 30' fill='none' stroke='rgba(28,28,30,0.08)' stroke-width='1'/%3E%3Cpath d='M10 0 Q 5 10, 10 20 T 10 40 M30 0 Q 25 10, 30 20 T 30 40' fill='none' stroke='rgba(28,28,30,0.08)' stroke-width='1'/%3E%3C/svg%3E")`,
 backgroundSize: '40px 40px'
 }}
 >
 {/* Artistic Free-form Background */}
 <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
 <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-200/20 blur-[120px] mix-blend-multiply"></div>
 <div className="absolute top-[20%] -right-[10%] w-[40%] h-[60%] rounded-full bg-emerald-200/20 blur-[120px] mix-blend-multiply"></div>
 <div className="absolute -bottom-[10%] left-[20%] w-[60%] h-[50%] rounded-full bg-brand-gold/10 blur-[120px] mix-blend-multiply"></div>
 </div>
 {/* Navigation Header */}
 <header className="bg-white/60 backdrop-blur-xl border-b border-brand-charcoal/5 sticky top-0 z-20 transition-colors">
 <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
 <div className="flex items-center space-x-4">
 <Link
 href="/"
 className="text-xs font-bold text-brand-charcoal/50 hover:text-brand-gold bg-brand-cream hover:bg-brand-gold/10 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
 >
 ← Back to Dashboard
 </Link>
 <span className="font-bold text-lg text-brand-charcoal ">
 Storvex <span className="text-sm font-sans font-extrabold uppercase tracking-widest text-brand-gold bg-brand-gold/10 px-2 py-0.5 rounded-full ml-1">Sales Ledger</span>
 </span>
 </div>

 <div className="flex items-center space-x-3">
 <Link
 href="/pos"
 className="text-xs bg-brand-charcoal hover:bg-black text-brand-cream font-bold px-3.5 py-1.5 rounded-lg transition-colors shadow-sm flex items-center gap-1.5"
 >
 <span>🖥️ Open POS Terminal</span>
 </Link>
 <SignOutButton />
 </div>
 </div>
 </header>

 {/* Main Content Viewport */}
 <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
 
 {/* Top KPI Cards */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 <div className="bg-white p-6 rounded-2xl border border-brand-charcoal/10 shadow-sm transition-colors">
 <p className="text-xs font-bold uppercase tracking-wider text-brand-charcoal/40">Total Revenue</p>
 <h3 className="text-3xl font-serif text-brand-charcoal mt-2">
 {formatINR(totalRevenue)}
 </h3>
 <p className="text-xs text-emerald-600 font-semibold mt-2 flex items-center gap-1">
 <span>↗</span> Live tenant earnings
 </p>
 </div>

 <div className="bg-white p-6 rounded-2xl border border-brand-charcoal/10 shadow-sm transition-colors">
 <p className="text-xs font-bold uppercase tracking-wider text-brand-charcoal/40">Total Transactions</p>
 <h3 className="text-3xl font-serif text-brand-charcoal mt-2">
 {totalSales}
 </h3>
 <p className="text-xs text-brand-gold font-semibold mt-2">
 Completed POS checkouts
 </p>
 </div>

 <div className="bg-white p-6 rounded-2xl border border-brand-charcoal/10 shadow-sm transition-colors">
 <p className="text-xs font-bold uppercase tracking-wider text-brand-charcoal/40">Average Order Value</p>
 <h3 className="text-3xl font-serif text-brand-charcoal mt-2">
 {formatINR(avgOrderValue)}
 </h3>
 <p className="text-xs text-brand-charcoal/50 font-semibold mt-2">
 Per customer basket
 </p>
 </div>
 </div>

 {/* 
 NEW: We replaced the static HTML table with our interactive Client Component!
 We pass the securely fetched database invoices directly into it.
 */}
 <LedgerTable invoices={invoices} />

 </main>
 </div>
 )
}