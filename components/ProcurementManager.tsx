'use client'

import { useState, useTransition } from 'react'
import { createSupplier, createPurchaseOrder, receivePurchaseOrder } from '@/app/actions/procurement'
import { formatINR } from '@/lib/utils'

export default function ProcurementManager({ suppliers, purchaseOrders, products }: any) {
 const [activeTab, setActiveTab] = useState<'POS' | 'SUPPLIERS'>('POS')
 
 // States
 const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false)
 const [isPoModalOpen, setIsPoModalOpen] = useState(false)
 const [settleSupplier, setSettleSupplier] = useState<any>(null)
 const [pending, startTransition] = useTransition()

 // PO Form State
 const [poSupplierId, setPoSupplierId] = useState('')
 const [poItems, setPoItems] = useState<{productId: string, quantity: number, unitCost: number}[]>([])

 const handleSupplierSubmit = (e: React.FormEvent<HTMLFormElement>) => {
 e.preventDefault()
 const formData = new FormData(e.currentTarget)
 startTransition(async () => {
 try {
 await createSupplier(formData)
 setIsSupplierModalOpen(false)
 } catch (err: any) {
 alert(err.message)
 }
 })
 }

 const handlePOSubmit = (e: React.FormEvent) => {
 e.preventDefault()
 if (!poSupplierId) return alert('Select a supplier')
 if (poItems.length === 0) return alert('Add at least one item')
 
 startTransition(async () => {
 try {
 await createPurchaseOrder({
 supplierId: poSupplierId,
 poNumber: `PO-${Date.now()}`,
 items: poItems
 })
 setIsPoModalOpen(false)
 setPoItems([])
 } catch(err: any) {
 alert(err.message)
 }
 })
 }

 const handleReceiveStock = (poId: string) => {
 if (!confirm('Are you sure you want to receive this stock? This will update inventory and increase the supplier balance.')) return
 startTransition(async () => {
 try {
 await receivePurchaseOrder(poId)
 alert('Stock received and supplier balance updated!')
 } catch (err: any) {
 alert(err.message)
 }
 })
 }

 const handleSettlePayment = (e: React.FormEvent<HTMLFormElement>) => {
 e.preventDefault()
 if (!settleSupplier) return
 const formData = new FormData(e.currentTarget)
 const amount = parseFloat(formData.get('amount') as string)
 
 startTransition(async () => {
 try {
 // we import recordSupplierPayment dynamically to avoid needing it in the top imports if it's not exported
 const { recordSupplierPayment } = await import('@/app/actions/procurement')
 await recordSupplierPayment({
 supplierId: settleSupplier.id,
 amount,
 paymentMode: formData.get('paymentMode') as string,
 referenceNo: formData.get('referenceNo') as string
 })
 setSettleSupplier(null)
 alert('Payment recorded successfully!')
 } catch (err: any) {
 alert(err.message)
 }
 })
 }

 return (
 <div className="space-y-6">
 {/* Tab Navigation */}
 <div className="flex gap-4 border-b border-brand-charcoal/10 transition-colors">
 <button
 onClick={() => setActiveTab('POS')}
 className={`pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'POS' ? 'border-brand-gold text-brand-gold ' : 'border-transparent text-brand-charcoal/50 hover:text-slate-700 '}`}
 >
 📦 Purchase Orders
 </button>
 <button
 onClick={() => setActiveTab('SUPPLIERS')}
 className={`pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'SUPPLIERS' ? 'border-brand-gold text-brand-gold ' : 'border-transparent text-brand-charcoal/50 hover:text-slate-700 '}`}
 >
 🏢 Suppliers Directory
 </button>
 </div>

 {/* Suppliers Tab */}
 {activeTab === 'SUPPLIERS' && (
 <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
 <div className="flex justify-between items-center">
 <h2 className="text-lg font-bold text-brand-charcoal ">Approved Suppliers</h2>
 <button onClick={() => setIsSupplierModalOpen(true)} className="bg-brand-charcoal hover:bg-black text-brand-cream font-bold px-4 py-2.5 rounded-xl text-xs transition-colors shadow-sm flex items-center gap-2">
 <span>+ New Supplier</span>
 </button>
 </div>
 
 <div className="bg-white border border-brand-charcoal/10 rounded-2xl shadow-sm overflow-hidden transition-colors">
 <table className="w-full text-left text-sm">
 <thead className="bg-brand-cream/50 border-b border-brand-charcoal/10 text-[10px] uppercase tracking-wider text-brand-charcoal/50 font-bold">
 <tr>
 <th className="px-6 py-4">Company Name</th>
 <th className="px-6 py-4">Contact</th>
 <th className="px-6 py-4">GSTIN</th>
 <th className="px-6 py-4 text-right">Balance</th>
 <th className="px-6 py-4 text-right">Action</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 ">
 {suppliers.length === 0 ? (
 <tr>
 <td colSpan={5} className="p-8 text-center text-brand-charcoal/40 font-medium">No suppliers registered yet.</td>
 </tr>
 ) : suppliers.map((s: any) => (
 <tr key={s.id} className="hover:bg-brand-cream/50 transition-colors">
 <td className="px-6 py-4 font-bold text-brand-charcoal ">{s.name}</td>
 <td className="px-6 py-4 text-brand-charcoal/70 ">
 <div>{s.contactName || '-'}</div>
 <div className="text-xs font-mono">{s.phone || ''}</div>
 </td>
 <td className="px-6 py-4 font-mono text-brand-charcoal/70 ">{s.gstin || '-'}</td>
 <td className="px-6 py-4 text-right font-bold text-rose-600 ">{s.balance > 0 ? formatINR(s.balance) : '-'}</td>
 <td className="px-6 py-4 text-right">
 {s.balance > 0 && (
 <button onClick={() => setSettleSupplier(s)} className="text-xs bg-brand-gold/10 text-brand-gold hover:bg-indigo-100 font-bold px-4 py-2 rounded-lg transition-colors shadow-sm ml-auto">
 Settle Balance
 </button>
 )}
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 )}

 {/* PO Tab */}
 {activeTab === 'POS' && (
 <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
 <div className="flex justify-between items-center">
 <h2 className="text-lg font-bold text-brand-charcoal ">Purchase Orders</h2>
 <button onClick={() => setIsPoModalOpen(true)} className="bg-brand-charcoal hover:bg-black text-brand-cream font-bold px-4 py-2.5 rounded-xl text-xs transition-colors shadow-sm flex items-center gap-2">
 <span>+ Draft Purchase Order</span>
 </button>
 </div>

 <div className="bg-white border border-brand-charcoal/10 rounded-2xl shadow-sm overflow-hidden transition-colors">
 <table className="w-full text-left text-sm">
 <thead className="bg-brand-cream/50 border-b border-brand-charcoal/10 text-[10px] uppercase tracking-wider text-brand-charcoal/50 font-bold">
 <tr>
 <th className="px-6 py-4">PO Number</th>
 <th className="px-6 py-4">Supplier</th>
 <th className="px-6 py-4 text-right">Total Amount</th>
 <th className="px-6 py-4 text-center">Status</th>
 <th className="px-6 py-4 text-right">Action</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 ">
 {purchaseOrders.length === 0 ? (
 <tr>
 <td colSpan={5} className="p-8 text-center text-brand-charcoal/40 font-medium">No purchase orders found.</td>
 </tr>
 ) : purchaseOrders.map((po: any) => (
 <tr key={po.id} className="hover:bg-brand-cream/50 transition-colors">
 <td className="px-6 py-4 font-mono font-bold text-brand-gold ">{po.poNumber}</td>
 <td className="px-6 py-4 font-bold text-brand-charcoal ">{po.supplier.name}</td>
 <td className="px-6 py-4 text-right font-mono font-extrabold text-brand-charcoal ">{formatINR(po.totalAmount)}</td>
 <td className="px-6 py-4 text-center">
 {po.status === 'ISSUED' ? (
 <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2.5 py-1 rounded-md border border-amber-200 ">ISSUED</span>
 ) : (
 <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-md border border-emerald-200 ">RECEIVED</span>
 )}
 </td>
 <td className="px-6 py-4 text-right">
 {po.status === 'ISSUED' ? (
 <button disabled={pending} onClick={() => handleReceiveStock(po.id)} className="text-xs bg-emerald-600 hover:bg-emerald-700 text-brand-cream font-bold px-4 py-2 rounded-lg transition-colors disabled:opacity-50 shadow-sm flex items-center justify-center gap-1.5 ml-auto">
 <span>📦 Receive Stock</span>
 </button>
 ) : (
 <span className="text-xs text-brand-charcoal/40 italic">Inventory Updated</span>
 )}
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 )}

 {/* Supplier Modal */}
 {isSupplierModalOpen && (
 <div className="fixed inset-0 bg-brand-charcoal/60 backdrop-blur-sm flex justify-center items-center p-4 z-50">
 <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-200 border border-brand-charcoal/10 transition-colors">
 <h3 className="font-extrabold text-xl mb-1 text-brand-charcoal ">Add New Supplier</h3>
 <p className="text-xs text-brand-charcoal/50 mb-6">Register a new vendor for procurement.</p>
 <form onSubmit={handleSupplierSubmit} className="space-y-4">
 <div>
 <label className="block text-[10px] uppercase tracking-wider font-bold text-brand-charcoal/50 mb-1">Company Name *</label>
 <input required name="name" className="w-full bg-brand-cream/50 border border-brand-charcoal/10 rounded-lg px-4 py-2.5 text-sm font-medium text-brand-charcoal focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 outline-none transition-all" placeholder="e.g. Acme Corp" />
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-[10px] uppercase tracking-wider font-bold text-brand-charcoal/50 mb-1">Contact Person</label>
 <input name="contactName" className="w-full bg-brand-cream/50 border border-brand-charcoal/10 rounded-lg px-4 py-2.5 text-sm font-medium text-brand-charcoal focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 outline-none transition-all" placeholder="e.g. Jane Doe" />
 </div>
 <div>
 <label className="block text-[10px] uppercase tracking-wider font-bold text-brand-charcoal/50 mb-1">GSTIN</label>
 <input name="gstin" className="w-full bg-brand-cream/50 border border-brand-charcoal/10 rounded-lg px-4 py-2.5 text-sm font-mono text-brand-charcoal focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 outline-none transition-all uppercase" placeholder="27XXXXX1234X1Z5" />
 </div>
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-[10px] uppercase tracking-wider font-bold text-brand-charcoal/50 mb-1">Email</label>
 <input name="email" type="email" className="w-full bg-brand-cream/50 border border-brand-charcoal/10 rounded-lg px-4 py-2.5 text-sm font-medium text-brand-charcoal focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 outline-none transition-all" placeholder="jane@acme.com" />
 </div>
 <div>
 <label className="block text-[10px] uppercase tracking-wider font-bold text-brand-charcoal/50 mb-1">Phone</label>
 <input name="phone" className="w-full bg-brand-cream/50 border border-brand-charcoal/10 rounded-lg px-4 py-2.5 text-sm font-mono text-brand-charcoal focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 outline-none transition-all" placeholder="+91 98765 43210" />
 </div>
 </div>
 <div className="flex justify-end gap-3 pt-6 border-t border-brand-charcoal/5 mt-6">
 <button type="button" onClick={() => setIsSupplierModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-brand-charcoal/70 hover:bg-brand-cream rounded-xl transition-colors">Cancel</button>
 <button type="submit" disabled={pending} className="px-5 py-2.5 text-sm font-bold bg-brand-charcoal hover:bg-black text-brand-cream rounded-xl disabled:opacity-50 transition-colors shadow-md">Save Supplier</button>
 </div>
 </form>
 </div>
 </div>
 )}

 {/* PO Modal */}
 {isPoModalOpen && (
 <div className="fixed inset-0 bg-brand-charcoal/60 backdrop-blur-sm flex justify-center items-center p-4 z-50">
 <div className="bg-white rounded-2xl w-full max-w-2xl p-6 shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 border border-brand-charcoal/10 transition-colors">
 <h3 className="font-extrabold text-xl mb-1 text-brand-charcoal ">Draft Purchase Order</h3>
 <p className="text-xs text-brand-charcoal/50 mb-4 pb-4 border-b border-brand-charcoal/5 ">Create a new PO to request stock from a supplier.</p>
 
 <div className="flex-1 overflow-y-auto space-y-6 py-2 pr-2 custom-scrollbar">
 <div>
 <label className="block text-[10px] uppercase tracking-wider font-bold text-brand-charcoal/50 mb-1">Select Supplier *</label>
 <select value={poSupplierId} onChange={e => setPoSupplierId(e.target.value)} className="w-full bg-brand-cream/50 border border-brand-charcoal/10 rounded-lg px-4 py-2.5 text-sm font-medium text-brand-charcoal focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 outline-none transition-colors">
 <option value="">-- Choose Supplier --</option>
 {suppliers.map((s:any) => <option key={s.id} value={s.id}>{s.name}</option>)}
 </select>
 </div>

 <div className="bg-brand-cream/50 p-5 rounded-2xl border border-brand-charcoal/10 shadow-inner transition-colors">
 <h4 className="font-bold text-sm mb-3 text-brand-charcoal ">Add Line Item</h4>
 <div className="flex gap-3 items-end">
 <div className="flex-1">
 <label className="block text-[10px] uppercase tracking-wider font-bold text-brand-charcoal/50 mb-1">Product</label>
 <select id="poProd" className="w-full bg-white border border-brand-charcoal/10 rounded-lg px-3 py-2 text-xs font-medium text-brand-charcoal outline-none focus:border-brand-gold transition-colors">
 {products.map((p:any) => <option key={p.id} value={p.id}>{p.name} (Current Cost: {formatINR(p.costPrice)})</option>)}
 </select>
 </div>
 <div className="w-24">
 <label className="block text-[10px] uppercase tracking-wider font-bold text-brand-charcoal/50 mb-1">Qty</label>
 <input type="number" id="poQty" placeholder="0" className="w-full bg-white border border-brand-charcoal/10 rounded-lg px-3 py-2 text-xs font-mono text-brand-charcoal outline-none focus:border-brand-gold transition-colors" min="1" />
 </div>
 <div className="w-28">
 <label className="block text-[10px] uppercase tracking-wider font-bold text-brand-charcoal/50 mb-1">Unit Cost (₹)</label>
 <input type="number" id="poCost" placeholder="0.00" className="w-full bg-white border border-brand-charcoal/10 rounded-lg px-3 py-2 text-xs font-mono text-brand-charcoal outline-none focus:border-brand-gold transition-colors" min="0" step="0.01" />
 </div>
 <button type="button" onClick={() => {
 const sel = document.getElementById('poProd') as HTMLSelectElement
 const qty = document.getElementById('poQty') as HTMLInputElement
 const cost = document.getElementById('poCost') as HTMLInputElement
 if (!sel.value || !qty.value || !cost.value) return alert('Please fill in all item fields')
 setPoItems([...poItems, { productId: sel.value, quantity: parseInt(qty.value), unitCost: parseFloat(cost.value) }])
 qty.value = ''
 cost.value = ''
 }} className="bg-brand-charcoal/90 text-brand-cream font-bold px-4 py-2 rounded-lg text-xs hover:bg-brand-charcoal transition-colors shadow-sm">
 Add
 </button>
 </div>
 </div>

 {poItems.length > 0 && (
 <div className="border border-brand-charcoal/10 rounded-xl overflow-hidden shadow-sm transition-colors">
 <table className="w-full text-xs text-left">
 <thead className="bg-brand-cream border-b border-brand-charcoal/10 ">
 <tr>
 <th className="p-3 text-brand-charcoal/70 font-bold uppercase tracking-wider text-[10px]">Item</th>
 <th className="p-3 text-brand-charcoal/70 font-bold uppercase tracking-wider text-[10px]">Qty</th>
 <th className="p-3 text-brand-charcoal/70 font-bold uppercase tracking-wider text-[10px]">Cost</th>
 <th className="p-3 text-brand-charcoal/70 font-bold uppercase tracking-wider text-[10px]">Total</th>
 <th className="p-3"></th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 ">
 {poItems.map((item, idx) => {
 const pName = products.find((p:any) => p.id === item.productId)?.name
 return (
 <tr key={idx} className="bg-white hover:bg-brand-cream/50 transition-colors">
 <td className="p-3 font-bold text-brand-charcoal ">{pName}</td>
 <td className="p-3 text-brand-charcoal/70 ">{item.quantity}</td>
 <td className="p-3 font-mono text-brand-charcoal/70 ">{formatINR(item.unitCost)}</td>
 <td className="p-3 font-mono font-bold text-brand-charcoal ">{formatINR(item.quantity * item.unitCost)}</td>
 <td className="p-3 text-right">
 <button onClick={() => setPoItems(poItems.filter((_, i) => i !== idx))} className="text-[10px] font-bold text-rose-500 hover:text-rose-700 uppercase tracking-wider bg-rose-50 hover:bg-rose-100 px-2 py-1 rounded transition-colors">Remove</button>
 </td>
 </tr>
 )
 })}
 </tbody>
 </table>
 </div>
 )}
 </div>
 
 <div className="flex justify-between items-center pt-6 border-t border-brand-charcoal/10 mt-6 bg-brand-cream/50 -mx-6 -mb-6 px-6 py-5 rounded-b-2xl transition-colors">
 <div className="font-bold text-sm text-brand-charcoal/70 uppercase tracking-wider">
 Total PO Amount: <span className="font-mono font-extrabold text-xl text-brand-gold block sm:inline sm:ml-2">{formatINR(poItems.reduce((s, i) => s + (i.quantity * i.unitCost), 0))}</span>
 </div>
 <div className="flex gap-3">
 <button type="button" onClick={() => setIsPoModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-brand-charcoal/70 hover:bg-brand-cream/80 bg-brand-cream rounded-xl transition-colors">Cancel</button>
 <button type="button" onClick={handlePOSubmit} disabled={pending || poItems.length === 0} className="px-5 py-2.5 text-sm font-bold bg-brand-charcoal hover:bg-black text-brand-cream rounded-xl disabled:opacity-50 transition-colors shadow-md flex items-center gap-2">
 <span>📨 Issue PO</span>
 </button>
 </div>
 </div>
 </div>
 </div>
 )}

 {/* Settle Balance Modal */}
 {settleSupplier && (
 <div className="fixed inset-0 bg-brand-charcoal/60 backdrop-blur-sm flex justify-center items-center p-4 z-50">
 <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-200 border border-brand-charcoal/10 transition-colors">
 <h3 className="font-extrabold text-xl mb-1 text-brand-charcoal ">Settle Balance</h3>
 <p className="text-xs text-brand-charcoal/50 mb-6">Record a payment to {settleSupplier.name}. Current Balance: <strong className="text-rose-500">{formatINR(settleSupplier.balance)}</strong></p>
 <form onSubmit={handleSettlePayment} className="space-y-4">
 <div>
 <label className="block text-[10px] uppercase tracking-wider font-bold text-brand-charcoal/50 mb-1">Amount to Pay (₹) *</label>
 <input required name="amount" type="number" max={settleSupplier.balance} step="0.01" defaultValue={settleSupplier.balance} className="w-full bg-brand-cream/50 border border-brand-charcoal/10 rounded-lg px-4 py-2.5 text-sm font-mono font-bold text-brand-charcoal focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 outline-none transition-all" />
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-[10px] uppercase tracking-wider font-bold text-brand-charcoal/50 mb-1">Payment Mode *</label>
 <select required name="paymentMode" className="w-full bg-brand-cream/50 border border-brand-charcoal/10 rounded-lg px-4 py-2.5 text-sm font-medium text-brand-charcoal focus:border-brand-gold outline-none transition-all">
 <option value="UPI">UPI</option>
 <option value="CASH">Cash</option>
 <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS)</option>
 <option value="CHEQUE">Cheque</option>
 </select>
 </div>
 <div>
 <label className="block text-[10px] uppercase tracking-wider font-bold text-brand-charcoal/50 mb-1">Reference No (Optional)</label>
 <input name="referenceNo" className="w-full bg-brand-cream/50 border border-brand-charcoal/10 rounded-lg px-4 py-2.5 text-sm font-mono text-brand-charcoal focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 outline-none transition-all" placeholder="Txn ID or Cheque No" />
 </div>
 </div>
 <div className="flex justify-end gap-3 pt-6 border-t border-brand-charcoal/5 mt-6">
 <button type="button" onClick={() => setSettleSupplier(null)} className="px-5 py-2.5 text-sm font-bold text-brand-charcoal/70 hover:bg-brand-cream rounded-xl transition-colors">Cancel</button>
 <button type="submit" disabled={pending} className="px-5 py-2.5 text-sm font-bold bg-brand-charcoal hover:bg-black text-brand-cream rounded-xl disabled:opacity-50 transition-colors shadow-md">Confirm Payment</button>
 </div>
 </form>
 </div>
 </div>
 )}

 </div>
 )
}
