'use client'

import { useState, useTransition } from 'react'
import ReceiptModal, { type ReceiptData } from '@/components/ReceiptModal'
import { processRefund } from '@/app/actions/refund'
import RefundModal from '@/components/RefundModal'
import { formatINR } from '@/lib/utils'

type InvoiceItem = {
 productId: string
 quantity: number
 unitRate: any
 totalPrice: any
 product?: {
 name: string
 }
}

type Invoice = {
 id: string
 invoiceNumber: string
 grossAmount: any
 discountAmt: any
 gstAmount: any
 netAmount: any
 paymentMode: string
 createdAt: Date | string
 isRefunded: boolean
 type: string
 customer?: {
 name: string | null
 phone?: string | null
 } | null
 items: InvoiceItem[]
}

export default function LedgerTable({ invoices }: { invoices: Invoice[] }) {
 const [searchTerm, setSearchTerm] = useState('')
 const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null)
 const [refundInvoice, setRefundInvoice] = useState<Invoice | null>(null)
 const [isPending, startTransition] = useTransition()

 function handleProcessRefund(invoice: Invoice) {
 setRefundInvoice(invoice)
 }

 // Search by Invoice Number or Customer Name
 const filteredInvoices = invoices.filter((inv) => {
 const matchInv = inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())
 const matchCust = inv.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false
 return matchInv || matchCust
 })

 function handleReprint(invoice: Invoice) {
 const formattedDate = new Date(invoice.createdAt).toLocaleString('en-US', {
 dateStyle: 'medium',
 timeStyle: 'short',
 })

 const items = invoice.items.map((item) => ({
 productId: item.productId,
 name: item.product?.name || 'Retail Item',
 unitRate: Number(item.unitRate),
 quantity: item.quantity,
 totalPrice: Number(item.totalPrice),
 }))

 setSelectedReceipt({
 invoiceNumber: invoice.invoiceNumber,
 grossAmount: Number(invoice.grossAmount),
 discountAmt: Number(invoice.discountAmt),
 gstAmount: Number(invoice.gstAmount),
 netAmount: Number(invoice.netAmount),
 paymentMode: invoice.paymentMode,
 date: formattedDate,
 items,
 customerName: invoice.customer?.name || 'Walk-in Shopper',
 })
 }

 return (
 <>
 <ReceiptModal data={selectedReceipt} onClose={() => setSelectedReceipt(null)} />
 <RefundModal invoice={refundInvoice} onClose={() => setRefundInvoice(null)} />

 <div className="space-y-6">
 {/* Search Filter Bar */}
 <div className="bg-white p-4 border border-brand-charcoal/10 rounded-2xl shadow-sm flex items-center justify-between gap-4 transition-colors">
 <div className="w-full sm:w-80 relative">
 <input
 type="text"
 placeholder="Search by invoice # or customer name..."
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="w-full text-xs bg-brand-cream/50 border border-brand-charcoal/10 rounded-lg px-3.5 py-2.5 text-brand-charcoal focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold transition-all font-medium placeholder:text-brand-charcoal/40 "
 />
 </div>
 <div className="text-xs font-semibold text-brand-charcoal/50 ">
 Showing <span className="font-mono font-bold text-brand-charcoal ">{filteredInvoices.length}</span> records
 </div>
 </div>

 {/* Ledger Transactions Table */}
 <div className="bg-white border border-brand-charcoal/10 rounded-2xl shadow-sm overflow-hidden transition-colors">
 <div className="overflow-x-auto">
 <table className="w-full text-left border-collapse text-sm">
 <thead>
 <tr className="bg-brand-cream/50 border-b border-brand-charcoal/10 text-xs uppercase tracking-wider font-bold text-brand-charcoal/50 ">
 <th className="py-3.5 px-6">Invoice #</th>
 <th className="py-3.5 px-6">Date & Time</th>
 <th className="py-3.5 px-6">Customer</th>
 <th className="py-3.5 px-6">Payment Mode</th>
 <th className="py-3.5 px-6 text-right">Net Amount</th>
 <th className="py-3.5 px-6 text-right">Receipt</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 font-medium">
 {filteredInvoices.length === 0 ? (
 <tr>
 <td colSpan={6} className="text-center py-12 text-brand-charcoal/40 text-sm">
 No invoices found matching your search criteria.
 </td>
 </tr>
 ) : (
 filteredInvoices.map((inv) => {
 const dateStr = new Date(inv.createdAt).toLocaleString('en-US', {
 month: 'short',
 day: 'numeric',
 year: 'numeric',
 hour: '2-digit',
 minute: '2-digit',
 })

 return (
 <tr key={inv.id} className="hover:bg-brand-cream/50/80 transition-colors">
 <td className="py-4 px-6 font-mono font-bold text-brand-gold ">
 {inv.invoiceNumber}
 </td>
 <td className="py-4 px-6 text-xs text-brand-charcoal/50 ">
 {dateStr}
 </td>
 <td className="py-4 px-6 text-xs text-brand-charcoal font-bold">
 {inv.customer?.name ? (
 <span className="bg-brand-gold/10 text-brand-gold px-2.5 py-1 rounded-md border border-indigo-100 ">
 👤 {inv.customer.name}
 </span>
 ) : (
 <span className="text-brand-charcoal/40 italic">Walk-in Shopper</span>
 )}
 </td>
 <td className="py-4 px-6">
 <span className="text-[10px] font-extrabold uppercase tracking-wider bg-brand-cream text-slate-700 px-2 py-1 rounded">
 {inv.paymentMode}
 </span>
 </td>
 <td className="py-4 px-6 text-right font-mono font-extrabold text-brand-charcoal ">
 <span className={inv.type === 'REFUND' ? 'text-rose-600 ' : ''}>
 {formatINR(Number(inv.netAmount))}
 </span>
 </td>
 <td className="py-4 px-6 text-right flex justify-end gap-2">
 {inv.type === 'SALE' && !inv.isRefunded && (
 <button
 onClick={() => handleProcessRefund(inv)}
 disabled={isPending}
 className="text-xs bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1 disabled:opacity-50"
 >
 <span>↩️ Return / Exchange</span>
 </button>
 )}
 {inv.type === 'REFUND' && (
 <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-1.5 rounded-lg flex items-center">
 🔴 REFUND
 </span>
 )}
 {inv.isRefunded && inv.type === 'SALE' && (
 <span className="text-[10px] font-bold text-brand-charcoal/40 bg-brand-cream px-2 py-1.5 rounded-lg flex items-center">
 REFUNDED
 </span>
 )}
 <button
 onClick={() => handleReprint(inv)}
 className="text-xs bg-brand-cream hover:bg-brand-cream/80 text-slate-700 font-bold px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1"
 >
 <span>🖨️ Re-print</span>
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
 </div>
 </>
 )
}