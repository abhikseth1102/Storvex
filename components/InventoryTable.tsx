'use client'

import { useState, useTransition } from 'react'
import { deleteProduct } from '@/app/actions/products'
import { adjustStock } from '@/app/actions/inventory'
import { formatINR } from '@/lib/utils'

// Perfectly aligned with your Prisma Product model
type Product = {
 id: string
 name: string
 sellingRate: any
 wholesaleRate: any
 costPrice: any
 stockQty: number
 size: string | null
 color: string | null
 category: { name: string } | null
}

export default function InventoryTable({ products }: { products: Product[] }) {
 const [searchTerm, setSearchTerm] = useState('')
 const [isPending, startTransition] = useTransition()
 const [loadingId, setLoadingId] = useState<string | null>(null)

 // Audit Modal State
 const [adjustModalOpen, setAdjustModalOpen] = useState(false)
 const [adjustProduct, setAdjustProduct] = useState<Product | null>(null)
 const [adjustType, setAdjustType] = useState<'DAMAGE' | 'LOSS' | 'AUDIT' | 'PROMO'>('AUDIT')
 const [adjustQty, setAdjustQty] = useState<number | ''>('')
 const [adjustReason, setAdjustReason] = useState('')

 // Filter products by name or category based on search input
 const filteredProducts = products.filter(
 (p) =>
 p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
 p.category?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
 (p.size && p.size.toLowerCase().includes(searchTerm.toLowerCase())) ||
 (p.color && p.color.toLowerCase().includes(searchTerm.toLowerCase()))
 )

 function openAdjustModal(p: Product) {
 setAdjustProduct(p)
 setAdjustType('AUDIT')
 setAdjustQty('')
 setAdjustReason('')
 setAdjustModalOpen(true)
 }

 function submitAdjustment() {
 if (!adjustProduct || adjustQty === '' || isNaN(adjustQty)) return
 setLoadingId(adjustProduct.id)
 startTransition(async () => {
 try {
 await adjustStock({
 productId: adjustProduct.id,
 type: adjustType,
 quantity: adjustQty,
 reason: adjustReason
 })
 setAdjustModalOpen(false)
 } catch (error) {
 alert('Failed to adjust stock. Please try again.')
 } finally {
 setLoadingId(null)
 }
 })
 }

 // Handle Product Deletion
 function handleDelete(id: string, name: string) {
 if (!confirm(`Are you sure you want to permanently delete "${name}"?`)) return
 setLoadingId(id)
 startTransition(async () => {
 await deleteProduct(id)
 setLoadingId(null)
 })
 }

 return (
 <div className="bg-white border border-brand-charcoal/10 rounded-2xl shadow-sm overflow-hidden space-y-4 transition-colors">
 {/* Search Bar & Header Controls */}
 <div className="p-6 border-b border-brand-charcoal/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
 <div>
 <h2 className="text-lg font-bold text-brand-charcoal ">SKU Stock Management</h2>
 <p className="text-xs text-brand-charcoal/40 ">
 Monitor stock levels and process shipment restocks instantly without leaving the dashboard.
 </p>
 </div>

 <div className="w-full sm:w-72 relative">
 <input
 type="text"
 placeholder="Search products, size, color..."
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="w-full text-xs bg-brand-cream/50 border border-brand-charcoal/10 rounded-lg px-3.5 py-2 text-brand-charcoal focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold transition-all placeholder:text-brand-charcoal/40 :text-brand-charcoal/50"
 />
 </div>
 </div>

 {/* Main Stock Table */}
 <div className="overflow-x-auto">
 <table className="w-full text-left border-collapse text-sm">
 <thead>
 <tr className="bg-brand-cream/50 border-y border-brand-charcoal/10 text-xs uppercase tracking-wider font-bold text-brand-charcoal/50 ">
 <th className="py-3.5 px-6">Product Info</th>
 <th className="py-3.5 px-6">Category / Specs</th>
 <th className="py-3.5 px-6 text-right">Rates (Ret/Whl)</th>
 <th className="py-3.5 px-6 text-center">Stock Status</th>
 <th className="py-3.5 px-6 text-center">Stock Audit</th>
 <th className="py-3.5 px-6 text-right">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 font-medium">
 {filteredProducts.length === 0 ? (
 <tr>
 <td colSpan={6} className="text-center py-12 text-brand-charcoal/40 text-sm">
 No inventory items match your search criteria.
 </td>
 </tr>
 ) : (
 filteredProducts.map((p) => {
 const isLowStock = p.stockQty > 0 && p.stockQty <= 5
 const isOutOfStock = p.stockQty <= 0
 const isLoading = loadingId === p.id

 return (
 <tr
 key={p.id}
 className={`hover:bg-brand-cream/50/80 :bg-brand-charcoal/90/30 transition-colors ${
 isLoading ? 'opacity-50 pointer-events-none' : ''
 }`}
 >
 {/* Product Name */}
 <td className="py-4 px-6 font-bold text-brand-charcoal ">{p.name}</td>

 {/* Category Badge & Specs */}
 <td className="py-4 px-6">
 <div className="flex flex-col gap-1 items-start">
 <span className="text-xs bg-brand-cream text-brand-charcoal/70 px-2.5 py-1 rounded-md font-semibold">
 {p.category?.name || 'Uncategorized'}
 </span>
 {(p.size || p.color) && (
 <div className="text-[10px] text-brand-charcoal/50 font-mono mt-0.5">
 {p.size && <span>Size: {p.size}</span>}
 {p.size && p.color && <span> • </span>}
 {p.color && <span>Color: {p.color}</span>}
 </div>
 )}
 </div>
 </td>

 {/* Rates */}
 <td className="py-4 px-6 text-right">
 <div className="flex flex-col items-end">
 <span className="font-mono text-brand-charcoal/70 font-bold">{formatINR(Number(p.sellingRate))}</span>
 <span className="font-mono text-xs text-brand-gold mt-0.5" title="Wholesale Rate">B2B: {formatINR(Number(p.wholesaleRate))}</span>
 </div>
 </td>

 {/* Stock Status with Visual Alerts */}
 <td className="py-4 px-6 text-center">
 <div className="inline-flex items-center gap-1.5 font-mono font-bold">
 <span
 className={`px-3 py-1 rounded-full text-xs ${
 isOutOfStock
 ? 'bg-rose-100 text-rose-700 border border-rose-200 animate-pulse'
 : isLowStock
 ? 'bg-amber-100 text-amber-800 border border-amber-200'
 : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
 }`}
 >
 {p.stockQty} units
 </span>
 </div>
 {isLowStock && (
 <p className="text-[10px] text-amber-600 font-bold mt-1">⚠️ Low Stock</p>
 )}
 {isOutOfStock && (
 <p className="text-[10px] text-rose-600 font-bold mt-1">🚨 Out of Stock</p>
 )}
 </td>

 {/* Audit Stock Action */}
 <td className="py-4 px-6 text-center">
 <button
 onClick={() => openAdjustModal(p)}
 className="bg-brand-cream hover:bg-indigo-100 :bg-indigo-900/40 text-brand-gold font-bold px-3 py-1.5 rounded-lg text-xs transition-colors"
 >
 Tally / Adjust
 </button>
 </td>

 {/* Delete Action */}
 <td className="py-4 px-6 text-right">
 <button
 onClick={() => handleDelete(p.id, p.name)}
 className="text-brand-charcoal/40 hover:text-rose-600 :text-rose-500 transition-colors text-xs font-semibold underline decoration-slate-300 hover:decoration-rose-300 :decoration-rose-500 underline-offset-4"
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

 {/* Stock Adjustment Modal */}
 {adjustModalOpen && adjustProduct && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-charcoal/60 backdrop-blur-sm transition-opacity">
 <div className="bg-white border border-brand-charcoal/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
 <h3 className="font-extrabold text-lg text-brand-charcoal mb-1">
 Adjust Stock Level
 </h3>
 <p className="text-xs text-brand-charcoal/50 mb-4 truncate">
 {adjustProduct.name}
 </p>
 
 <div className="space-y-4">
 <div>
 <label className="block text-xs font-bold uppercase text-brand-charcoal/70 mb-1">
 Adjustment Type
 </label>
 <select
 value={adjustType}
 onChange={(e) => setAdjustType(e.target.value as any)}
 className="w-full bg-brand-cream/50 border border-brand-charcoal/10 rounded-lg px-3 py-2 text-sm text-brand-charcoal font-medium focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold outline-none"
 >
 <option value="AUDIT">Inventory Audit (Tally)</option>
 <option value="DAMAGE">Damaged Goods</option>
 <option value="LOSS">Lost/Stolen</option>
 <option value="PROMO">Promotional Giveaway</option>
 </select>
 </div>

 <div>
 <label className="block text-xs font-bold uppercase text-brand-charcoal/70 mb-1">
 Quantity Delta (e.g. -2 or 5)
 </label>
 <input
 type="number"
 value={adjustQty}
 onChange={(e) => setAdjustQty(e.target.value === '' ? '' : parseInt(e.target.value))}
 placeholder="-2"
 className="w-full bg-brand-cream/50 border border-brand-charcoal/10 rounded-lg px-3 py-2 text-sm text-brand-charcoal font-bold font-mono focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold outline-none"
 />
 </div>

 <div>
 <label className="block text-xs font-bold uppercase text-brand-charcoal/70 mb-1">
 Reason (Optional)
 </label>
 <input
 type="text"
 value={adjustReason}
 onChange={(e) => setAdjustReason(e.target.value)}
 placeholder="e.g. Found extra box during audit"
 className="w-full bg-brand-cream/50 border border-brand-charcoal/10 rounded-lg px-3 py-2 text-sm text-brand-charcoal focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold outline-none"
 />
 </div>

 <div className="flex justify-end gap-2 pt-4">
 <button
 onClick={() => setAdjustModalOpen(false)}
 className="px-4 py-2 text-sm font-bold text-brand-charcoal/70 hover:bg-brand-cream :bg-brand-charcoal/90 rounded-xl transition-colors"
 >
 Cancel
 </button>
 <button
 onClick={submitAdjustment}
 disabled={isPending || adjustQty === '' || isNaN(adjustQty as number)}
 className="bg-brand-charcoal hover:bg-black disabled:opacity-50 text-brand-cream text-sm font-bold px-4 py-2 rounded-xl transition-colors shadow-sm"
 >
 {isPending ? 'Saving...' : 'Confirm Adjust'}
 </button>
 </div>
 </div>
 </div>
 </div>
 )}
 </div>
 )
}