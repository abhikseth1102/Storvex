'use client'

import { useState, useTransition } from 'react'
import { createCustomer, deleteCustomer } from '@/app/actions/customers'
import { formatINR } from '@/lib/utils'

// Perfectly aligned with your Prisma Customer & SaleInvoice models
type CustomerWithStats = {
 id: string
 name: string
 phone: string | null
 city: string | null
 balance: number
 createdAt: Date
 invoices: {
 id: string
 netAmount: any
 }[]
}

export default function CustomerTable({ customers }: { customers: CustomerWithStats[] }) {
 const [searchTerm, setSearchTerm] = useState('')
 const [isModalOpen, setIsModalOpen] = useState(false)
 const [settleCustomer, setSettleCustomer] = useState<CustomerWithStats | null>(null)
 const [isPending, startTransition] = useTransition()
 const [loadingId, setLoadingId] = useState<string | null>(null)

 // Filter by Name, Phone, or City
 const filteredCustomers = customers.filter(
 (c) =>
 c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
 (c.phone && c.phone.includes(searchTerm)) ||
 (c.city && c.city.toLowerCase().includes(searchTerm.toLowerCase()))
 )

 // Handle Form Submission for New Customer
 function handleCreate(formData: FormData) {
 startTransition(async () => {
 try {
 await createCustomer(formData)
 setIsModalOpen(false)
 } catch (error) {
 alert('Failed to create customer. Please check your inputs.')
 }
 })
 }

 // Handle Deletion
 function handleDelete(id: string, name: string) {
 if (!confirm(`Are you sure you want to delete customer "${name}"? This will not delete their historical invoices.`)) return
 setLoadingId(id)
 startTransition(async () => {
 await deleteCustomer(id)
 setLoadingId(null)
 })
 }

 // Handle Settle Balance
 function handleSettlePayment(e: React.FormEvent<HTMLFormElement>) {
 e.preventDefault()
 if (!settleCustomer) return
 const formData = new FormData(e.currentTarget)
 const amount = parseFloat(formData.get('amount') as string)
 
 startTransition(async () => {
 try {
 const { receiveCustomerPayment } = await import('@/app/actions/customers')
 await receiveCustomerPayment({
 customerId: settleCustomer.id,
 amount,
 paymentMode: formData.get('paymentMode') as string,
 referenceNo: formData.get('referenceNo') as string
 })
 setSettleCustomer(null)
 alert('Payment recorded successfully!')
 } catch (error: any) {
 alert(error.message)
 }
 })
 }

 return (
 <div className="space-y-6">
 {/* Search Bar & Add Customer Button */}
 <div className="bg-white p-6 border border-brand-charcoal/10 rounded-2xl shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-colors">
 <div className="w-full sm:w-80 relative">
 <input
 type="text"
 placeholder="Search by name, phone, or city..."
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="w-full text-xs bg-brand-cream/50 border border-brand-charcoal/10 rounded-lg px-3.5 py-2.5 text-brand-charcoal focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold transition-all placeholder:text-brand-charcoal/40 "
 />
 </div>

 <button
 onClick={() => setIsModalOpen(true)}
 className="w-full sm:w-auto bg-brand-charcoal hover:bg-black text-brand-cream text-xs font-bold px-4 py-2.5 rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2"
 >
 <span>+ Add New Customer</span>
 </button>
 </div>

 {/* Main CRM Table */}
 <div className="bg-white border border-brand-charcoal/10 rounded-2xl shadow-sm overflow-hidden transition-colors">
 <div className="overflow-x-auto">
 <table className="w-full text-left border-collapse text-sm">
 <thead>
 <tr className="bg-brand-cream/50 border-b border-brand-charcoal/10 text-xs uppercase tracking-wider font-bold text-brand-charcoal/50 ">
 <th className="py-3.5 px-6">Customer Name</th>
 <th className="py-3.5 px-6">Phone Number</th>
 <th className="py-3.5 px-6">City / Location</th>
 <th className="py-3.5 px-6 text-center">Total Orders</th>
 <th className="py-3.5 px-6 text-right">Lifetime Spend</th>
 <th className="py-3.5 px-6 text-right">Balance Due</th>
 <th className="py-3.5 px-6 text-right">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 font-medium">
 {filteredCustomers.length === 0 ? (
 <tr>
 <td colSpan={6} className="text-center py-12 text-brand-charcoal/40 text-sm">
 No customers found. Click "+ Add New Customer" to register your first shopper!
 </td>
 </tr>
 ) : (
 filteredCustomers.map((c) => {
 const totalOrders = c.invoices.length
 const lifetimeSpend = c.invoices.reduce((sum, inv) => sum + Number(inv.netAmount), 0)
 const isVIP = lifetimeSpend > 200 // Tag high-spending customers as VIPs!
 const isLoading = loadingId === c.id

 return (
 <tr
 key={c.id}
 className={`hover:bg-brand-cream/50/80 transition-colors ${
 isLoading ? 'opacity-50 pointer-events-none' : ''
 }`}
 >
 {/* Name & VIP Badge */}
 <td className="py-4 px-6 font-bold text-brand-charcoal flex items-center gap-2">
 <span>{c.name}</span>
 {isVIP && (
 <span className="text-[10px] bg-amber-100 text-amber-800 border border-amber-200 font-extrabold px-2 py-0.5 rounded-full">
 ★ VIP
 </span>
 )}
 </td>

 {/* Phone */}
 <td className="py-4 px-6 font-mono text-xs text-brand-charcoal/70 ">
 {c.phone || <span className="text-slate-300 italic">No phone</span>}
 </td>

 {/* City */}
 <td className="py-4 px-6 text-brand-charcoal/70 text-xs">
 {c.city || <span className="text-slate-300 italic">Not specified</span>}
 </td>

 {/* Total Orders */}
 <td className="py-4 px-6 text-center">
 <span className="bg-brand-cream text-slate-700 font-mono font-bold px-2.5 py-1 rounded-md text-xs">
 {totalOrders}
 </span>
 </td>

 {/* Lifetime Spend */}
 <td className="py-4 px-6 text-right font-mono font-extrabold text-brand-charcoal ">
 {formatINR(lifetimeSpend)}
 </td>

 {/* Balance Due */}
 <td className="py-4 px-6 text-right font-mono font-bold text-rose-600 ">
 {c.balance > 0 ? formatINR(c.balance) : '-'}
 </td>

 {/* Actions */}
 <td className="py-4 px-6 text-right flex items-center justify-end gap-3">
 {c.balance > 0 && (
 <button
 onClick={() => setSettleCustomer(c)}
 className="text-xs bg-brand-gold/10 text-brand-gold hover:bg-indigo-100 font-bold px-3 py-1.5 rounded transition-colors shadow-sm"
 >
 Receive Payment
 </button>
 )}
 <button
 onClick={() => handleDelete(c.id, c.name)}
 className="text-brand-charcoal/40 hover:text-rose-600 transition-colors text-xs font-semibold underline decoration-slate-300 hover:decoration-rose-300 underline-offset-4"
 >
 Delete
 </button>
 </td>
 </tr>
 )
 })
 )}
 </tbody>
 </table>
 </div>
 </div>

 {/* ADD CUSTOMER MODAL */}
 {isModalOpen && (
 <div className="fixed inset-0 bg-brand-charcoal/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
 <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-brand-charcoal/5 animate-in fade-in zoom-in-95 duration-150">
 <div className="flex justify-between items-center pb-4 border-b border-brand-charcoal/5 ">
 <h3 className="font-bold text-lg text-brand-charcoal ">Register New Customer</h3>
 <button
 onClick={() => setIsModalOpen(false)}
 className="text-brand-charcoal/40 hover:text-brand-charcoal/70 text-sm font-bold"
 >
 ✕
 </button>
 </div>

 <form action={handleCreate} className="space-y-4 mt-4">
 <div>
 <label className="block text-xs font-bold uppercase tracking-wider text-brand-charcoal/70 mb-1">
 Full Name *
 </label>
 <input
 type="text"
 name="name"
 required
 placeholder="e.g. Rahul Sharma"
 className="w-full text-sm bg-brand-cream/50 border border-brand-charcoal/10 rounded-lg px-3.5 py-2 text-brand-charcoal focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold"
 />
 </div>

 <div>
 <label className="block text-xs font-bold uppercase tracking-wider text-brand-charcoal/70 mb-1">
 Phone Number
 </label>
 <input
 type="tel"
 name="phone"
 placeholder="e.g. +91 98765 43210"
 className="w-full text-sm bg-brand-cream/50 border border-brand-charcoal/10 rounded-lg px-3.5 py-2 text-brand-charcoal focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold font-mono"
 />
 </div>

 <div>
 <label className="block text-xs font-bold uppercase tracking-wider text-brand-charcoal/70 mb-1">
 City / Location
 </label>
 <input
 type="text"
 name="city"
 placeholder="e.g. Bangalore, Mumbai"
 className="w-full text-sm bg-brand-cream/50 border border-brand-charcoal/10 rounded-lg px-3.5 py-2 text-brand-charcoal focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold"
 />
 </div>

 <div className="pt-4 flex justify-end gap-2 border-t border-brand-charcoal/5 mt-6">
 <button
 type="button"
 onClick={() => setIsModalOpen(false)}
 className="px-4 py-2 text-xs font-bold text-brand-charcoal/70 hover:bg-brand-cream rounded-lg transition-colors"
 >
 Cancel
 </button>
 <button
 type="submit"
 disabled={isPending}
 className="px-4 py-2 text-xs font-bold bg-brand-charcoal hover:bg-black disabled:opacity-50 text-brand-cream rounded-lg transition-colors shadow-sm"
 >
 {isPending ? 'Saving...' : 'Save Customer'}
 </button>
 </div>
 </form>
 </div>
 </div>
 )}

 {/* SETTLE BALANCE MODAL */}
 {settleCustomer && (
 <div className="fixed inset-0 bg-brand-charcoal/60 backdrop-blur-sm flex justify-center items-center p-4 z-50">
 <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-200 border border-brand-charcoal/10 transition-colors">
 <h3 className="font-extrabold text-xl mb-1 text-brand-charcoal ">Receive Payment</h3>
 <p className="text-xs text-brand-charcoal/50 mb-6">
 Settle outstanding debt for {settleCustomer.name}. Current Balance: <strong className="text-rose-500">{formatINR(settleCustomer.balance)}</strong>
 </p>
 <form onSubmit={handleSettlePayment} className="space-y-4">
 <div>
 <label className="block text-[10px] uppercase tracking-wider font-bold text-brand-charcoal/50 mb-1">Amount Paid (₹) *</label>
 <input required name="amount" type="number" max={settleCustomer.balance} step="0.01" defaultValue={settleCustomer.balance} className="w-full bg-brand-cream/50 border border-brand-charcoal/10 rounded-lg px-4 py-2.5 text-sm font-mono font-bold text-brand-charcoal focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 outline-none transition-all" />
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-[10px] uppercase tracking-wider font-bold text-brand-charcoal/50 mb-1">Payment Mode *</label>
 <select required name="paymentMode" className="w-full bg-brand-cream/50 border border-brand-charcoal/10 rounded-lg px-4 py-2.5 text-sm font-medium text-brand-charcoal focus:border-brand-gold outline-none transition-all">
 <option value="UPI">UPI</option>
 <option value="CASH">Cash</option>
 <option value="CARD">Card</option>
 </select>
 </div>
 <div>
 <label className="block text-[10px] uppercase tracking-wider font-bold text-brand-charcoal/50 mb-1">Reference No (Optional)</label>
 <input name="referenceNo" className="w-full bg-brand-cream/50 border border-brand-charcoal/10 rounded-lg px-4 py-2.5 text-sm font-mono text-brand-charcoal focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 outline-none transition-all" placeholder="Txn ID" />
 </div>
 </div>
 <div className="flex justify-end gap-3 pt-6 border-t border-brand-charcoal/5 mt-6">
 <button type="button" onClick={() => setSettleCustomer(null)} className="px-5 py-2.5 text-sm font-bold text-brand-charcoal/70 hover:bg-brand-cream rounded-xl transition-colors">Cancel</button>
 <button type="submit" disabled={isPending} className="px-5 py-2.5 text-sm font-bold bg-brand-charcoal hover:bg-black text-brand-cream rounded-xl disabled:opacity-50 transition-colors shadow-md">Confirm Payment</button>
 </div>
 </form>
 </div>
 </div>
 )}
 </div>
 )
}