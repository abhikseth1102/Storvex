import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import SignOutButton from '@/components/SignOutButton'
import { formatINR } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function AdvancedReportsPage() {
 const session = await auth()
 const tenantId = session?.user?.tenantId
 if (!tenantId) return <div>Unauthorized</div>

 // Fetch all valid sale items
 const saleItems = await prisma.saleItem.findMany({
 where: {
 invoice: {
 tenantId,
 isRefunded: false,
 }
 },
 include: {
 product: {
 select: { hsnCode: true, name: true, category: { select: { name: true } } }
 },
 invoice: {
 select: { createdAt: true }
 }
 }
 })

 // 1. Tax Wise Aggregation
 const taxWise = saleItems.reduce((acc, item) => {
 const rate = item.gstRate || 0
 if (!acc[rate]) {
 acc[rate] = { taxableValue: 0, gstAmount: 0 }
 }
 // Taxable value is total price minus item discount
 const taxableValue = (item.totalPrice || 0) - (item.discountAmt || 0)
 acc[rate].taxableValue += taxableValue
 acc[rate].gstAmount += item.gstAmount || 0
 return acc
 }, {} as Record<number, { taxableValue: number, gstAmount: number }>)

 // 2. HSN Wise Aggregation
 const hsnWise = saleItems.reduce((acc, item) => {
 const hsn = item.product.hsnCode || 'Uncategorized'
 if (!acc[hsn]) {
 acc[hsn] = { qty: 0, taxableValue: 0, gstAmount: 0, category: item.product.category?.name || 'N/A' }
 }
 acc[hsn].qty += item.quantity
 acc[hsn].taxableValue += (item.totalPrice || 0) - (item.discountAmt || 0)
 acc[hsn].gstAmount += item.gstAmount || 0
 return acc
 }, {} as Record<string, { qty: number, taxableValue: number, gstAmount: number, category: string }>)

  // 3. Category Wise Aggregation
  const categoryWise = saleItems.reduce((acc, item) => {
    const category = item.product.category?.name || 'Uncategorized'
    if (!acc[category]) {
      acc[category] = { qty: 0, taxableValue: 0, gstAmount: 0 }
    }
    acc[category].qty += item.quantity
    acc[category].taxableValue += (item.totalPrice || 0) - (item.discountAmt || 0)
    acc[category].gstAmount += item.gstAmount || 0
    return acc
  }, {} as Record<string, { qty: number, taxableValue: number, gstAmount: number }>)

  // 4. Top Customers Ledger
  const allCustomers = await prisma.customer.findMany({
    where: { tenantId },
    include: {
      invoices: {
        where: { type: 'SALE', isRefunded: false },
        select: { netAmount: true, gstAmount: true }
      }
    }
  })

  const topCustomers = allCustomers.map(c => ({
    name: c.name,
    company: c.companyName || '-',
    totalSpent: c.invoices.reduce((sum, inv) => sum + inv.netAmount, 0),
    totalGst: c.invoices.reduce((sum, inv) => sum + inv.gstAmount, 0),
    invoiceCount: c.invoices.length
  })).filter(c => c.totalSpent > 0).sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 20)

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
 <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-rose-200/20 blur-[120px] mix-blend-multiply"></div>
 <div className="absolute top-[20%] -right-[10%] w-[40%] h-[60%] rounded-full bg-sky-200/20 blur-[120px] mix-blend-multiply"></div>
 <div className="absolute -bottom-[10%] left-[20%] w-[60%] h-[50%] rounded-full bg-brand-gold/10 blur-[120px] mix-blend-multiply"></div>
 </div>
 <header className="bg-white/60 backdrop-blur-xl border-b border-brand-charcoal/5 sticky top-0 z-20 transition-colors">
 <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
 <div className="flex items-center space-x-4">
 <Link
 href="/reports"
 className="text-xs font-bold text-brand-charcoal/50 hover:text-brand-gold bg-brand-cream hover:bg-brand-gold/10 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
 >
 ← Back
 </Link>
 <span className="font-bold text-lg text-brand-charcoal ">
 Advanced <span className="text-sm font-sans font-extrabold uppercase tracking-widest text-brand-gold bg-brand-gold/10 px-2 py-0.5 rounded-full ml-1">Registers</span>
 </span>
 </div>
 <div className="flex items-center space-x-3">
 <SignOutButton />
 </div>
 </div>
 </header>

 <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
 
 {/* Tax Wise Summary */}
 <section className="bg-white p-6 rounded-2xl border border-brand-charcoal/10 shadow-sm transition-colors">
 <div className="flex items-center gap-3 mb-6">
 <span className="text-2xl">📊</span>
 <h2 className="font-extrabold text-lg text-brand-charcoal ">Tax Wise Sales Register</h2>
 </div>
 
 <div className="overflow-x-auto">
 <table className="w-full text-left border-collapse text-sm">
 <thead>
 <tr className="bg-brand-cream/50 text-brand-charcoal/50 border-y border-brand-charcoal/10 ">
 <th className="py-3 px-4 font-bold uppercase tracking-wider text-xs">GST Slab</th>
 <th className="py-3 px-4 font-bold uppercase tracking-wider text-xs text-right">Taxable Value</th>
 <th className="py-3 px-4 font-bold uppercase tracking-wider text-xs text-right">Total GST</th>
 <th className="py-3 px-4 font-bold uppercase tracking-wider text-xs text-right">Total Invoice Value</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 ">
 {Object.entries(taxWise).length === 0 && (
 <tr><td colSpan={4} className="p-4 text-center text-brand-charcoal/40">No data available</td></tr>
 )}
 {Object.entries(taxWise).sort(([a], [b]) => Number(a) - Number(b)).map(([rate, data]) => (
 <tr key={rate} className="hover:bg-brand-cream/50 transition-colors">
 <td className="py-3 px-4 font-bold">{rate}% GST</td>
 <td className="py-3 px-4 font-mono text-right">{formatINR(data.taxableValue)}</td>
 <td className="py-3 px-4 font-mono text-right text-brand-gold ">{formatINR(data.gstAmount)}</td>
 <td className="py-3 px-4 font-mono text-right font-extrabold">{formatINR(data.taxableValue + data.gstAmount)}</td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </section>

 {/* HSN Wise Summary */}
 <section className="bg-white p-6 rounded-2xl border border-brand-charcoal/10 shadow-sm transition-colors">
 <div className="flex items-center gap-3 mb-6">
 <span className="text-2xl">📦</span>
 <h2 className="font-extrabold text-lg text-brand-charcoal ">HSN Wise Sales Register</h2>
 </div>
 
 <div className="overflow-x-auto">
 <table className="w-full text-left border-collapse text-sm">
 <thead>
 <tr className="bg-brand-cream/50 text-brand-charcoal/50 border-y border-brand-charcoal/10 ">
 <th className="py-3 px-4 font-bold uppercase tracking-wider text-xs">HSN Code</th>
 <th className="py-3 px-4 font-bold uppercase tracking-wider text-xs">Category</th>
 <th className="py-3 px-4 font-bold uppercase tracking-wider text-xs text-center">Total Qty Sold</th>
 <th className="py-3 px-4 font-bold uppercase tracking-wider text-xs text-right">Taxable Value</th>
 <th className="py-3 px-4 font-bold uppercase tracking-wider text-xs text-right">Total GST</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 ">
 {Object.entries(hsnWise).length === 0 && (
 <tr><td colSpan={5} className="p-4 text-center text-brand-charcoal/40">No data available</td></tr>
 )}
 {Object.entries(hsnWise).sort((a, b) => b[1].qty - a[1].qty).map(([hsn, data]) => (
 <tr key={hsn} className="hover:bg-brand-cream/50 transition-colors">
 <td className="py-3 px-4 font-mono font-bold">{hsn}</td>
 <td className="py-3 px-4 text-brand-charcoal/70 text-xs">{data.category}</td>
 <td className="py-3 px-4 text-center font-bold">{data.qty}</td>
 <td className="py-3 px-4 font-mono text-right">{formatINR(data.taxableValue)}</td>
 <td className="py-3 px-4 font-mono text-right text-brand-gold ">{formatINR(data.gstAmount)}</td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </section>

  {/* Category Wise Summary */}
  <section className="bg-white/90 backdrop-blur-sm p-6 rounded-3xl border border-brand-charcoal/5 shadow-sm transition-colors">
    <div className="flex items-center gap-3 mb-6">
      <span className="text-2xl">🛍️</span>
      <h2 className="font-extrabold text-lg text-brand-charcoal ">Category Wise Sales Register</h2>
    </div>
    
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse text-sm">
        <thead>
          <tr className="bg-brand-cream/50 text-brand-charcoal/50 border-y border-brand-charcoal/10 ">
            <th className="py-3 px-4 font-bold uppercase tracking-wider text-xs">Category</th>
            <th className="py-3 px-4 font-bold uppercase tracking-wider text-xs text-center">Total Qty Sold</th>
            <th className="py-3 px-4 font-bold uppercase tracking-wider text-xs text-right">Taxable Value</th>
            <th className="py-3 px-4 font-bold uppercase tracking-wider text-xs text-right">Total GST</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-brand-charcoal/5">
          {Object.entries(categoryWise).length === 0 && (
            <tr><td colSpan={4} className="p-4 text-center text-brand-charcoal/40">No data available</td></tr>
          )}
          {Object.entries(categoryWise).sort((a, b) => b[1].qty - a[1].qty).map(([category, data]) => (
            <tr key={category} className="hover:bg-brand-cream/50 transition-colors">
              <td className="py-3 px-4 font-bold">{category}</td>
              <td className="py-3 px-4 text-center font-bold">{data.qty}</td>
              <td className="py-3 px-4 font-mono text-right">{formatINR(data.taxableValue)}</td>
              <td className="py-3 px-4 font-mono text-right text-brand-gold ">{formatINR(data.gstAmount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </section>

  {/* Top Customers Ledger */}
  <section className="bg-white/90 backdrop-blur-sm p-6 rounded-3xl border border-brand-charcoal/5 shadow-sm transition-colors">
    <div className="flex items-center gap-3 mb-6">
      <span className="text-2xl">👑</span>
      <h2 className="font-extrabold text-lg text-brand-charcoal ">Top Customers Ledger</h2>
    </div>
    
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse text-sm">
        <thead>
          <tr className="bg-brand-cream/50 text-brand-charcoal/50 border-y border-brand-charcoal/10 ">
            <th className="py-3 px-4 font-bold uppercase tracking-wider text-xs">Customer Name</th>
            <th className="py-3 px-4 font-bold uppercase tracking-wider text-xs">Company</th>
            <th className="py-3 px-4 font-bold uppercase tracking-wider text-xs text-center">Invoices</th>
            <th className="py-3 px-4 font-bold uppercase tracking-wider text-xs text-right">Total GST Paid</th>
            <th className="py-3 px-4 font-bold uppercase tracking-wider text-xs text-right">Total Spent</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-brand-charcoal/5">
          {topCustomers.length === 0 && (
            <tr><td colSpan={5} className="p-4 text-center text-brand-charcoal/40">No data available</td></tr>
          )}
          {topCustomers.map((customer, idx) => (
            <tr key={idx} className="hover:bg-brand-cream/50 transition-colors">
              <td className="py-3 px-4 font-bold flex items-center gap-2">
                {idx < 3 && <span className="text-brand-gold">★</span>}
                {customer.name}
              </td>
              <td className="py-3 px-4 text-brand-charcoal/70 text-xs">{customer.company}</td>
              <td className="py-3 px-4 text-center font-bold">{customer.invoiceCount}</td>
              <td className="py-3 px-4 font-mono text-right text-brand-gold/70">{formatINR(customer.totalGst)}</td>
              <td className="py-3 px-4 font-mono text-right font-extrabold">{formatINR(customer.totalSpent)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </section>

  </main>
 </div>
 )
}
