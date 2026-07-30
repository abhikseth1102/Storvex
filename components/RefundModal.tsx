'use client'

import { useState, useTransition, useEffect } from 'react'
import { processPartialRefund } from '@/app/actions/refund'
import { formatINR } from '@/lib/utils'

type InvoiceItem = {
 productId: string
 quantity: number
 unitRate: any
 totalPrice: any
 product?: { name: string }
}

type Invoice = {
 id: string
 invoiceNumber: string
 netAmount: any
 items: InvoiceItem[]
}

export default function RefundModal({
 invoice,
 onClose
}: {
 invoice: Invoice | null
 onClose: () => void
}) {
 const [returnQtys, setReturnQtys] = useState<Record<string, number>>({})
 const [isPending, startTransition] = useTransition()

 // Reset state when invoice changes
 useEffect(() => {
 setReturnQtys({})
 }, [invoice])

 if (!invoice) return null

 function handleQtyChange(productId: string, val: number, max: number) {
 if (isNaN(val)) val = 0
 const qty = Math.max(0, Math.min(val, max))
 setReturnQtys(prev => ({ ...prev, [productId]: qty }))
 }

 function handleSubmit() {
 if (!invoice) return

 const returns = Object.entries(returnQtys).map(([productId, returnQty]) => ({
 productId,
 returnQty
 })).filter(r => r.returnQty > 0)

 if (returns.length === 0) return alert('Select at least one item to return')

 startTransition(async () => {
 try {
 await processPartialRefund(invoice.id, returns)
 alert('Partial refund processed successfully!')
 onClose()
 } catch (err: any) {
 alert(err.message || 'Refund failed')
 }
 })
 }

 const totalReturnItems = Object.values(returnQtys).reduce((a, b) => a + b, 0)

 return (
 <div className="fixed inset-0 bg-brand-charcoal/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity">
 <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-150 border border-brand-charcoal/10 flex flex-col max-h-[90vh]">
 
 <div className="p-5 border-b border-brand-charcoal/5 flex justify-between items-center bg-brand-cream/50 rounded-t-2xl">
 <div>
 <h3 className="font-extrabold text-lg text-brand-charcoal flex items-center gap-2">
 <span>↩️</span> Return / Exchange Items
 </h3>
 <p className="text-xs text-brand-charcoal/50 font-mono mt-1">Invoice: {invoice.invoiceNumber}</p>
 </div>
 <button
 onClick={onClose}
 className="text-brand-charcoal/40 hover:text-slate-700 font-bold"
 >
 ✕
 </button>
 </div>

 <div className="p-5 flex-1 overflow-y-auto space-y-4">
 <p className="text-xs font-semibold text-brand-charcoal/70 bg-brand-gold/10 p-3 rounded-lg border border-indigo-100 ">
 Specify the quantity of each item the customer is returning. The exact refund amount will be automatically calculated and the items will be returned to inventory.
 </p>

 <div className="space-y-3">
 {invoice.items.map(item => {
 const returning = returnQtys[item.productId] || 0
 return (
 <div key={item.productId} className="flex items-center justify-between p-3 border border-brand-charcoal/10 rounded-xl bg-white ">
 <div className="flex-1">
 <p className="font-bold text-sm text-brand-charcoal ">{item.product?.name}</p>
 <p className="text-xs text-brand-charcoal/50 font-mono">Purchased: {item.quantity} @ {formatINR(Number(item.unitRate))}</p>
 </div>
 <div className="flex items-center gap-2">
 <label className="text-[10px] font-bold text-brand-charcoal/40 uppercase">Return Qty:</label>
 <input
 type="number"
 min="0"
 max={item.quantity}
 value={returning === 0 ? '' : returning}
 onChange={(e) => handleQtyChange(item.productId, parseInt(e.target.value), item.quantity)}
 placeholder="0"
 className="w-16 text-center text-sm font-bold bg-brand-cream/50 border border-brand-charcoal/20 rounded-lg px-2 py-1.5 focus:outline-none focus:border-brand-gold transition-colors"
 />
 </div>
 </div>
 )
 })}
 </div>
 </div>

 <div className="p-5 border-t border-brand-charcoal/5 bg-brand-cream/50 rounded-b-2xl flex justify-between items-center">
 <div className="text-sm font-bold text-brand-charcoal/70 ">
 Returning <span className="text-brand-gold ">{totalReturnItems}</span> items
 </div>
 <div className="flex gap-2">
 <button
 onClick={onClose}
 className="px-4 py-2 text-sm font-bold text-brand-charcoal/70 hover:bg-brand-cream/80 rounded-xl transition-colors"
 >
 Cancel
 </button>
 <button
 onClick={handleSubmit}
 disabled={isPending || totalReturnItems === 0}
 className="px-5 py-2 text-sm font-bold text-brand-cream bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-xl shadow-sm transition-colors"
 >
 {isPending ? 'Processing...' : 'Confirm Return'}
 </button>
 </div>
 </div>
 
 </div>
 </div>
 )
}
