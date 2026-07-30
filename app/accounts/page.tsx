import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import SignOutButton from '@/components/SignOutButton'
import { formatINR } from '@/lib/utils'
import { revalidatePath } from 'next/cache'
import LedgerEntryForm from '@/components/LedgerEntryForm'

export default async function AccountsPage() {
 const session = await auth()
 if (!session?.user?.tenantId) redirect('/api/auth/signin')
 if (session.user.role !== 'ADMIN') redirect('/pos')

 const tenantId = session.user.tenantId

 const accounts = await prisma.account.findMany({
 where: { tenantId },
 include: {
 transactions: {
 orderBy: { createdAt: 'desc' },
 take: 50 // Show last 50 transactions
 }
 },
 orderBy: { createdAt: 'asc' }
 })

 // Group transactions globally across all accounts for the journal view
 const allTransactions = accounts.flatMap(a => 
 a.transactions.map(t => ({ ...t, accountName: a.name }))
 ).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

 const totalCash = accounts.filter(a => a.type === 'CASH').reduce((sum, a) => sum + a.balance, 0)
 const totalBank = accounts.filter(a => a.type === 'BANK').reduce((sum, a) => sum + a.balance, 0)



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
 <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-stone-300/30 blur-[120px] mix-blend-multiply"></div>
 <div className="absolute top-[20%] -right-[10%] w-[40%] h-[60%] rounded-full bg-zinc-300/20 blur-[120px] mix-blend-multiply"></div>
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
 Storvex <span className="text-sm font-sans font-extrabold uppercase tracking-widest text-brand-gold bg-brand-gold/10 px-2 py-0.5 rounded-full ml-1">General Ledger</span>
 </span>
 </div>
 <div className="flex items-center space-x-3">
 <SignOutButton />
 </div>
 </div>
 </header>

 <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
 {/* KPI Cards */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div className="bg-white p-6 rounded-2xl border border-brand-charcoal/10 shadow-sm">
 <p className="text-xs font-bold uppercase tracking-wider text-brand-charcoal/40">Total Cash in Drawer</p>
 <h3 className="text-3xl font-serif text-emerald-600 mt-2">
 {formatINR(totalCash)}
 </h3>
 </div>
 <div className="bg-white p-6 rounded-2xl border border-brand-charcoal/10 shadow-sm">
 <p className="text-xs font-bold uppercase tracking-wider text-brand-charcoal/40">Total Bank Balance</p>
 <h3 className="text-3xl font-serif text-brand-gold mt-2">
 {formatINR(totalBank)}
 </h3>
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
 
 {/* Main Journal Table */}
 <div className="lg:col-span-2 space-y-6">
 <div className="bg-white border border-brand-charcoal/10 rounded-2xl shadow-sm overflow-hidden">
 <div className="p-4 border-b border-brand-charcoal/10 flex justify-between items-center">
 <h3 className="font-bold text-lg text-brand-charcoal ">Journal Entries</h3>
 </div>
 <div className="overflow-x-auto">
 <table className="w-full text-left border-collapse text-sm">
 <thead>
 <tr className="bg-brand-cream/50 border-b border-brand-charcoal/10 text-xs uppercase tracking-wider font-bold text-brand-charcoal/50">
 <th className="py-3 px-4">Date</th>
 <th className="py-3 px-4">Account</th>
 <th className="py-3 px-4">Description</th>
 <th className="py-3 px-4 text-right">Debit (Out)</th>
 <th className="py-3 px-4 text-right">Credit (In)</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 font-medium">
 {allTransactions.length === 0 ? (
 <tr>
 <td colSpan={5} className="text-center py-8 text-brand-charcoal/40">No entries yet.</td>
 </tr>
 ) : (
 allTransactions.map((tx) => (
 <tr key={tx.id} className="hover:bg-brand-cream/50 transition-colors">
 <td className="py-3 px-4 text-xs text-brand-charcoal/50 font-mono">
 {new Date(tx.createdAt).toLocaleString('en-IN')}
 </td>
 <td className="py-3 px-4 text-xs font-bold text-slate-700 ">
 {tx.accountName}
 </td>
 <td className="py-3 px-4 text-sm text-brand-charcoal ">
 {tx.description}
 </td>
 <td className="py-3 px-4 text-right font-mono text-rose-600 font-bold">
 {tx.type === 'DEBIT' ? formatINR(tx.amount) : '-'}
 </td>
 <td className="py-3 px-4 text-right font-mono text-emerald-600 font-bold">
 {tx.type === 'CREDIT' ? formatINR(tx.amount) : '-'}
 </td>
 </tr>
 ))
 )}
 </tbody>
 </table>
 </div>
 </div>
 </div>

 {/* Manual Entry Form */}
 <div className="lg:col-span-1">
 <LedgerEntryForm accounts={accounts} />
 </div>

 </div>
 </main>
 </div>
 )
}
