'use client'

import { useState, useTransition } from 'react'
import { createManualLedgerEntry } from '@/app/actions/ledger'
import { formatINR } from '@/lib/utils'

export default function LedgerEntryForm({ accounts }: { accounts: any[] }) {
 const [activeTab, setActiveTab] = useState<'DEBIT' | 'CREDIT'>('DEBIT') // Default to DEBIT (Expense)
 const [isPending, startTransition] = useTransition()

 async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
 e.preventDefault()
 const formData = new FormData(e.currentTarget)
 
 const accountId = formData.get('accountId') as string
 const amount = parseFloat(formData.get('amount') as string)
 const description = formData.get('description') as string

 if (!accountId || amount <= 0 || !description) return

 startTransition(async () => {
 try {
 await createManualLedgerEntry({
 accountId,
 type: activeTab,
 amount,
 description
 })
 // Reset form
 e.currentTarget.reset()
 } catch (error: any) {
 alert(error.message)
 }
 })
 }

 return (
 <div className="bg-white rounded-2xl border border-brand-charcoal/10 shadow-sm sticky top-24 overflow-hidden transition-colors">
 
 {/* Tab Navigation */}
 <div className="flex border-b border-brand-charcoal/10 ">
 <button
 onClick={() => setActiveTab('DEBIT')}
 className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${
 activeTab === 'DEBIT' 
 ? 'bg-rose-50 text-rose-600 border-b-2 border-rose-600 ' 
 : 'text-brand-charcoal/50 hover:bg-brand-cream/50 '
 }`}
 >
 🔴 Record Expense
 </button>
 <button
 onClick={() => setActiveTab('CREDIT')}
 className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${
 activeTab === 'CREDIT' 
 ? 'bg-emerald-50 text-emerald-600 border-b-2 border-emerald-600 ' 
 : 'text-brand-charcoal/50 hover:bg-brand-cream/50 '
 }`}
 >
 🟢 Add Funds
 </button>
 </div>

 <div className="p-6">
 <h3 className="font-bold text-lg text-brand-charcoal mb-2">
 {activeTab === 'DEBIT' ? 'Record Expense' : 'Add Funds'}
 </h3>
 <p className="text-xs text-brand-charcoal/50 mb-6">
 {activeTab === 'DEBIT' 
 ? 'Money will be subtracted from the selected account.' 
 : 'Money will be added to the selected account.'}
 </p>

 <form onSubmit={handleSubmit} className="space-y-4">
 <div>
 <label className="block text-[10px] uppercase tracking-wider font-bold text-brand-charcoal/50 mb-1">
 Select Account
 </label>
 <select name="accountId" required className="w-full bg-brand-cream/50 border border-brand-charcoal/10 rounded-lg px-3 py-2.5 text-sm font-medium text-brand-charcoal focus:border-brand-gold outline-none transition-colors">
 {accounts.map(a => (
 <option key={a.id} value={a.id}>{a.name} ({formatINR(a.balance)})</option>
 ))}
 </select>
 </div>
 
 <div>
 <label className="block text-[10px] uppercase tracking-wider font-bold text-brand-charcoal/50 mb-1">
 Amount (₹)
 </label>
 <input name="amount" type="number" step="0.01" required className="w-full bg-brand-cream/50 border border-brand-charcoal/10 rounded-lg px-3 py-2.5 text-sm font-mono font-bold text-brand-charcoal focus:border-brand-gold outline-none transition-colors" placeholder="0.00" />
 </div>
 
 <div>
 <label className="block text-[10px] uppercase tracking-wider font-bold text-brand-charcoal/50 mb-1">
 {activeTab === 'DEBIT' ? 'Expense Description' : 'Income Source'}
 </label>
 <input name="description" required className="w-full bg-brand-cream/50 border border-brand-charcoal/10 rounded-lg px-3 py-2.5 text-sm text-brand-charcoal focus:border-brand-gold outline-none transition-colors" placeholder={activeTab === 'DEBIT' ? "e.g. Paid Electricity Bill" : "e.g. Owner Capital Added"} />
 </div>
 
 <button type="submit" disabled={isPending} className={`w-full font-bold py-2.5 rounded-lg transition-colors shadow-sm mt-2 disabled:opacity-50 text-brand-cream ${activeTab === 'DEBIT' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
 {isPending ? 'Saving...' : (activeTab === 'DEBIT' ? 'Submit Expense' : 'Add Funds')}
 </button>
 </form>
 </div>
 </div>
 )
}
