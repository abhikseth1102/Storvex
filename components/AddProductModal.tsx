'use client'

import { useState } from 'react'
import { createProduct } from '@/app/actions/products'

type Category = {
 id: string
 name: string
}

export default function AddProductModal({ categories }: { categories: Category[] }) {
 const [isOpen, setIsOpen] = useState(false)
 const [isSubmitting, setIsSubmitting] = useState(false)

 async function handleSubmit(formData: FormData) {
 setIsSubmitting(true)
 try {
 await createProduct(formData)
 setIsOpen(false) // Close modal on success!
 } catch (error) {
 alert('Failed to add product. Please check all fields.')
 console.error(error)
 } finally {
 setIsSubmitting(false)
 }
 }

 return (
 <>
 {/* Trigger Button on Dashboard */}
 <button
 onClick={() => setIsOpen(true)}
 className="px-4 py-2 bg-brand-charcoal hover:bg-black text-brand-cream text-sm font-semibold rounded-lg shadow-sm transition-all duration-150 flex items-center gap-2 cursor-pointer"
 >
 <span>+</span> Add New Product
 </button>

 {/* Pop-up Modal Backdrop */}
 {isOpen && (
 <div className="fixed inset-0 z-50 bg-brand-charcoal/50 backdrop-blur-sm flex items-center justify-center p-4">
 <div className="bg-white rounded-2xl shadow-xl border border-brand-charcoal/10 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
 {/* Modal Header */}
 <div className="px-6 py-4 border-b border-brand-charcoal/5 flex justify-between items-center bg-brand-cream/50">
 <h3 className="font-bold text-lg text-brand-charcoal">Add POS Inventory Item</h3>
 <button
 onClick={() => setIsOpen(false)}
 className="text-brand-charcoal/40 hover:text-brand-charcoal/70 font-bold text-xl leading-none cursor-pointer"
 >
 &times;
 </button>
 </div>

 {/* Modal Form */}
 <form action={handleSubmit} className="p-6 space-y-4">
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div>
 <label className="block text-xs font-bold uppercase tracking-wider text-brand-charcoal/70 mb-1">
 Product Name
 </label>
 <input
 type="text"
 name="name"
 required
 placeholder="e.g., Wireless Barcode Scanner"
 className="w-full px-3 py-2 border border-brand-charcoal/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-brand-charcoal"
 />
 </div>
 <div>
 <label className="block text-xs font-bold uppercase tracking-wider text-brand-charcoal/70 mb-1">
 Cost Price (₹)
 </label>
 <input
 type="number"
 name="costPrice"
 step="0.01"
 required
 placeholder="250.00"
 className="w-full px-3 py-2 border border-brand-charcoal/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-brand-charcoal"
 />
 </div>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
 <div>
 <label className="block text-xs font-bold uppercase tracking-wider text-brand-charcoal/70 mb-1">
 Retail MRP (₹)
 </label>
 <input
 type="number"
 name="price"
 step="0.01"
 required
 placeholder="499.00"
 className="w-full px-3 py-2 border border-brand-charcoal/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-brand-charcoal"
 />
 </div>
 <div>
 <label className="block text-xs font-bold uppercase tracking-wider text-brand-charcoal/70 mb-1">
 Wholesale B2B Rate (₹)
 </label>
 <input
 type="number"
 name="wholesaleRate"
 step="0.01"
 defaultValue="0"
 placeholder="350.00"
 className="w-full px-3 py-2 border border-brand-charcoal/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-brand-charcoal"
 />
 </div>
 <div>
 <label className="block text-xs font-bold uppercase tracking-wider text-brand-charcoal/70 mb-1">
 GST Rate (%)
 </label>
 <input
 type="number"
 name="gstRate"
 step="1"
 defaultValue="0"
 min="0"
 max="100"
 required
 placeholder="18"
 className="w-full px-3 py-2 border border-brand-charcoal/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-brand-charcoal"
 />
 </div>
 <div>
 <label className="block text-xs font-bold uppercase tracking-wider text-brand-charcoal/70 mb-1">
 Initial Stock
 </label>
 <input
 type="number"
 name="stock"
 required
 placeholder="25"
 className="w-full px-3 py-2 border border-brand-charcoal/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-brand-charcoal"
 />
 </div>
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-xs font-bold uppercase tracking-wider text-brand-charcoal/70 mb-1">
 Size
 </label>
 <input
 type="text"
 name="size"
 placeholder="e.g. XL, 32"
 className="w-full px-3 py-2 border border-brand-charcoal/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-brand-charcoal"
 />
 </div>
 <div>
 <label className="block text-xs font-bold uppercase tracking-wider text-brand-charcoal/70 mb-1">
 Color
 </label>
 <input
 type="text"
 name="color"
 placeholder="e.g. Navy Blue"
 className="w-full px-3 py-2 border border-brand-charcoal/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-brand-charcoal"
 />
 </div>
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-xs font-bold uppercase tracking-wider text-brand-charcoal/70 mb-1">
 Category
 </label>
 <select
 name="categoryId"
 required
 className="w-full px-3 py-2 border border-brand-charcoal/20 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-brand-charcoal cursor-pointer"
 >
 <option value="">Select Category...</option>
 {categories.map((cat) => (
 <option key={cat.id} value={cat.id}>
 {cat.name}
 </option>
 ))}
 </select>
 </div>
 <div>
 <label className="block text-xs font-bold uppercase tracking-wider text-brand-charcoal/70 mb-1">
 SKU / Barcode (Optional)
 </label>
 <input
 type="text"
 name="sku"
 placeholder="Auto-generated if empty"
 className="w-full px-3 py-2 border border-brand-charcoal/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-brand-charcoal"
 />
 </div>
 </div>

 {/* Modal Actions */}
 <div className="pt-4 border-t border-brand-charcoal/5 flex justify-end space-x-3">
 <button
 type="button"
 onClick={() => setIsOpen(false)}
 className="px-4 py-2 text-sm font-medium text-brand-charcoal/70 bg-brand-cream hover:bg-brand-cream/80 rounded-lg transition-colors cursor-pointer"
 >
 Cancel
 </button>
 <button
 type="submit"
 disabled={isSubmitting}
 className="px-4 py-2 text-sm font-semibold text-brand-cream bg-brand-charcoal hover:bg-black disabled:bg-indigo-400 rounded-lg shadow-sm transition-all flex items-center gap-2 cursor-pointer"
 >
 {isSubmitting ? 'Saving to Neon...' : 'Save Product'}
 </button>
 </div>
 </form>
 </div>
 </div>
 )}
 </>
 )
}