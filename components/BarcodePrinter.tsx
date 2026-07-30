'use client'

import { useState } from 'react'
import Barcode from 'react-barcode'
import { formatINR } from '@/lib/utils'

type Product = {
 id: string
 name: string
 barcode: string | null
 sku: string | null
 size: string | null
 color: string | null
 sellingRate: any
 brand: string | null
}

export default function BarcodePrinter({ products }: { products: Product[] }) {
 const [selectedProduct, setSelectedProduct] = useState<string>('')
 const [quantity, setQuantity] = useState<number>(10)
 
 const [printQueue, setPrintQueue] = useState<{product: Product, quantity: number}[]>([])

 function addToQueue() {
 if (!selectedProduct || quantity <= 0) return
 const prod = products.find(p => p.id === selectedProduct)
 if (prod) {
 setPrintQueue([...printQueue, { product: prod, quantity }])
 setSelectedProduct('')
 setQuantity(10)
 }
 }

 function clearQueue() {
 setPrintQueue([])
 }

 return (
 <div className="space-y-6">
 <div className="bg-white border border-brand-charcoal/10 rounded-2xl shadow-sm p-6 print:hidden">
 <h2 className="text-lg font-bold text-brand-charcoal mb-4">Add to Print Queue</h2>
 <div className="flex flex-col sm:flex-row gap-4 items-end">
 <div className="flex-1 w-full">
 <label className="block text-xs font-bold text-brand-charcoal/50 mb-1">Select Product</label>
 <select
 value={selectedProduct}
 onChange={(e) => setSelectedProduct(e.target.value)}
 className="w-full text-sm bg-brand-cream/50 border border-brand-charcoal/10 rounded-xl px-4 py-2.5 text-brand-charcoal focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold"
 >
 <option value="">-- Choose a product to print --</option>
 {products.filter(p => p.barcode || p.sku).map(p => (
 <option key={p.id} value={p.id}>
 {p.name} {p.size ? `(Size: ${p.size})` : ''} - {p.barcode || p.sku}
 </option>
 ))}
 </select>
 </div>
 <div className="w-full sm:w-32">
 <label className="block text-xs font-bold text-brand-charcoal/50 mb-1">Stickers</label>
 <input
 type="number"
 min="1"
 max="500"
 value={quantity}
 onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
 className="w-full text-sm font-bold font-mono bg-brand-cream/50 border border-brand-charcoal/10 rounded-xl px-4 py-2.5 text-brand-charcoal focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold"
 />
 </div>
 <button
 onClick={addToQueue}
 disabled={!selectedProduct || quantity <= 0}
 className="w-full sm:w-auto px-6 py-2.5 bg-brand-charcoal hover:bg-black disabled:opacity-50 text-brand-cream text-sm font-bold rounded-xl shadow-sm transition-all"
 >
 Add to Queue
 </button>
 </div>
 </div>

 {printQueue.length > 0 && (
 <div className="bg-white border border-brand-charcoal/10 rounded-2xl shadow-sm p-6 print:hidden">
 <div className="flex justify-between items-center mb-4">
 <h2 className="text-lg font-bold text-brand-charcoal ">
 Print Queue ({printQueue.reduce((acc, curr) => acc + curr.quantity, 0)} stickers)
 </h2>
 <div className="flex gap-2">
 <button
 onClick={clearQueue}
 className="px-4 py-2 text-sm font-bold text-brand-charcoal/70 hover:bg-brand-cream rounded-lg"
 >
 Clear All
 </button>
 <button
 onClick={() => window.print()}
 className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-brand-cream text-sm font-bold rounded-lg shadow-sm"
 >
 🖨️ Print Labels (Ctrl+P)
 </button>
 </div>
 </div>
 
 <div className="text-xs text-brand-charcoal/50 p-3 bg-amber-50 border border-amber-200 rounded-lg">
 <strong>Print Instructions:</strong> Set paper size to A4. Disable headers/footers in print settings. Set margins to minimum or none.
 </div>
 </div>
 )}

 {/* PRINT AREA */}
 {printQueue.length > 0 && (
 <div className="bg-white shadow-xl min-h-[A4] print:shadow-none print:m-0 print:bg-transparent">
 {/* We use a grid for standard sticker sheets (e.g. 3 columns, 8 rows per page) */}
 <div className="grid grid-cols-3 gap-2 p-4 print:p-0">
 {printQueue.map((item, qIdx) => 
 Array.from({ length: item.quantity }).map((_, i) => (
 <div key={`${qIdx}-${i}`} className="border border-dashed border-brand-charcoal/20 print:border-none p-3 flex flex-col items-center justify-center text-center h-[120px] break-inside-avoid">
 <div className="text-[9px] font-bold text-brand-charcoal/50 uppercase tracking-widest mb-0.5">
 {item.product.brand || 'STORVEX'}
 </div>
 <div className="text-[10px] font-bold text-brand-charcoal leading-tight line-clamp-1">
 {item.product.name}
 </div>
 {(item.product.size || item.product.color) && (
 <div className="text-[9px] font-bold text-slate-700 mt-0.5">
 {item.product.size && `Size: ${item.product.size}`}
 {item.product.size && item.product.color && ` • `}
 {item.product.color && `Color: ${item.product.color}`}
 </div>
 )}
 <div className="mt-1 transform scale-[0.6] origin-top">
 <Barcode 
 value={item.product.barcode || item.product.sku || '000000'}
 height={40}
 fontSize={16}
 margin={0}
 displayValue={true}
 />
 </div>
 <div className="text-xs font-extrabold text-brand-charcoal mt-[-10px]">
 MRP: {formatINR(Number(item.product.sellingRate))}
 </div>
 </div>
 ))
 )}
 </div>
 </div>
 )}
 </div>
 )
}
