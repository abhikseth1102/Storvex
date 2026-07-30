'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { processCheckout } from '@/app/actions/checkout'
import { createCustomer } from '@/app/actions/customers'
import ReceiptModal, { type ReceiptData } from '@/components/ReceiptModal'
import { formatINR } from '@/lib/utils'

type Product = {
 id: string
 name: string
 sellingRate: any
 wholesaleRate: any
 stockQty: number
 barcode: string | null
 category: { name: string } | null
 gstRate: number
}

type Customer = {
 id: string
 name: string
 phone: string | null
 companyName: string | null
 gstin: string | null
 loyaltyPoints: number
}

type CartItem = {
 productId: string
 name: string
 unitRate: number
 quantity: number
 totalPrice: number
 maxStock: number
 gstRate: number
 gstAmount: number
 discountAmt: number
}

type HeldBill = {
 id: string
 name: string
 cart: CartItem[]
 selectedCustomerId: string
 pointsToRedeem: number
 discountAmt: number
}

export default function PosTerminal({
 products,
 customers,
}: {
 products: Product[]
 customers: Customer[]
}) {
 const [cart, setCart] = useState<CartItem[]>([])
 const [searchTerm, setSearchTerm] = useState('')
 const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
 const [paymentMode, setPaymentMode] = useState<'CASH' | 'CARD' | 'UPI' | 'CREDIT' | 'SPLIT'>('CASH')
 const [discountAmt, setDiscountAmt] = useState<number>(0)
 const [selectedCustomerId, setSelectedCustomerId] = useState<string>('')
 const [pointsToRedeem, setPointsToRedeem] = useState<number>(0)
 
 const [isWholesaleMode, setIsWholesaleMode] = useState(false)
 
 const [paidCash, setPaidCash] = useState<number>(0)
 const [paidCard, setPaidCard] = useState<number>(0)

 const [heldBills, setHeldBills] = useState<HeldBill[]>([])
 
 // NEW: Quick-Register Customer Modal State
 const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false)
 const [customerPending, startCustomerTransition] = useTransition()
 
 const [isPending, startTransition] = useTransition()
 const [receiptData, setReceiptData] = useState<ReceiptData | null>(null)
 const searchInputRef = useRef<HTMLInputElement>(null)

 const categories = ['ALL', ...Array.from(new Set(products.map((p) => p.category?.name || 'Other')))]

 const filteredProducts = products.filter((p) => {
 const matchesSearch =
 p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
 (p.barcode && p.barcode.includes(searchTerm))
 const matchesCat = selectedCategory === 'ALL' || (p.category?.name || 'Other') === selectedCategory
 return matchesSearch && matchesCat
 })

 function addToCart(product: Product) {
 if (product.stockQty <= 0) {
 alert('This item is currently out of stock!')
 return
 }

 setCart((prevCart) => {
 const existing = prevCart.find((item) => item.productId === product.id)
 if (existing) {
 if (existing.quantity + 1 > product.stockQty) {
 alert(`Only ${product.stockQty} units available in stock!`)
 return prevCart
 }
 return prevCart.map((item) =>
 item.productId === product.id
 ? { 
 ...item, 
 quantity: item.quantity + 1, 
 totalPrice: (item.quantity + 1) * item.unitRate,
 gstAmount: (item.quantity + 1) * item.unitRate * ((item.gstRate || 0) / 100)
 }
 : item
 )
 } else {
 const rate = isWholesaleMode ? (Number(product.wholesaleRate) || Number(product.sellingRate)) : Number(product.sellingRate)
 return [
 ...prevCart,
 {
 productId: product.id,
 name: product.name,
 unitRate: rate,
 quantity: 1,
 totalPrice: rate,
 maxStock: product.stockQty,
 gstRate: product.gstRate || 0,
 gstAmount: rate * ((product.gstRate || 0) / 100),
 discountAmt: 0,
 },
 ]
 }
 })
 }

 function updateQuantity(productId: string, delta: number) {
 setCart((prevCart) =>
 prevCart
 .map((item) => {
 if (item.productId === productId) {
 const newQty = item.quantity + delta
 if (newQty > item.maxStock) {
 alert(`Maximum stock available is ${item.maxStock}`)
 return item
 }
 return newQty > 0
 ? { 
 ...item, 
 quantity: newQty, 
 totalPrice: newQty * item.unitRate,
 gstAmount: (newQty * item.unitRate) * ((item.gstRate || 0) / 100)
 }
 : null
 }
 return item
 })
 .filter(Boolean) as CartItem[]
 )
 }

 function updateItemDiscount(productId: string, discount: number) {
 setCart((prevCart) =>
 prevCart.map((item) => {
 if (item.productId === productId) {
 const validDiscount = Math.max(0, Math.min(discount, item.totalPrice))
 const taxableAmount = item.totalPrice - validDiscount
 return {
 ...item,
 discountAmt: validDiscount,
 gstAmount: taxableAmount * ((item.gstRate || 0) / 100)
 }
 }
 return item
 })
 )
 }

 function handleHoldBill() {
 if (cart.length === 0) return
 setHeldBills([...heldBills, {
 id: Date.now().toString(),
 name: `Bill ${heldBills.length + 1}`,
 cart,
 selectedCustomerId,
 pointsToRedeem,
 discountAmt
 }])
 setCart([])
 setSelectedCustomerId('')
 setPointsToRedeem(0)
 setDiscountAmt(0)
 setPaidCash(0)
 setPaidCard(0)
 }

 function handleRestoreBill(id: string) {
 const bill = heldBills.find(b => b.id === id)
 if (bill) {
 setCart(bill.cart)
 setSelectedCustomerId(bill.selectedCustomerId)
 setPointsToRedeem(bill.pointsToRedeem)
 setDiscountAmt(bill.discountAmt)
 setHeldBills(heldBills.filter(b => b.id !== id))
 }
 }

 const grossAmount = cart.reduce((sum, item) => sum + (item.totalPrice || 0), 0)
 const totalGST = cart.reduce((sum, item) => sum + (item.gstAmount || 0), 0)
 const pointsDiscount = Math.floor(pointsToRedeem / 10)
 const netAmount = Math.max(0, grossAmount + totalGST - (discountAmt || 0) - pointsDiscount)

 function handleCheckout() {
 if (cart.length === 0) return

 startTransition(async () => {
 try {
 const result = await processCheckout({
 items: cart.map((item) => ({
 productId: item.productId,
 quantity: item.quantity,
 unitRate: item.unitRate,
 totalPrice: item.totalPrice || 0,
 gstRate: item.gstRate || 0,
 gstAmount: item.gstAmount || 0,
 discountAmt: item.discountAmt || 0,
 })),
 paymentMode,
 discountAmt,
 customerId: selectedCustomerId || null,
 pointsToRedeem,
 paidCash: paymentMode === 'SPLIT' ? paidCash : 0,
 paidCard: paymentMode === 'SPLIT' ? paidCard : 0,
 isB2b: isWholesaleMode,
 })

 if (result.success && result.invoice) {
 const matchedCustomer = customers.find(c => c.id === selectedCustomerId)
 
 setReceiptData({
 invoiceNumber: result.invoice.invoiceNumber,
 grossAmount: result.invoice.grossAmount,
 discountAmt: result.invoice.discountAmt,
 gstAmount: result.invoice.gstAmount,
 netAmount: result.invoice.netAmount,
 paymentMode: result.invoice.paymentMode,
 date: result.invoice.date,
 gstin: result.invoice.gstin || (matchedCustomer?.gstin) || undefined,
 pan: result.invoice.pan || undefined,
 items: [...cart],
 customerName: matchedCustomer ? matchedCustomer.name : 'Walk-in Shopper',
 isB2b: isWholesaleMode,
 })
 setCart([])
 setDiscountAmt(0)
 setPointsToRedeem(0)
 setSelectedCustomerId('')
 }
 } catch (error: any) {
 alert(`Checkout failed: ${error.message || 'Unknown error'}`)
 }
 })
 }

 // Recalculate cart rates when mode toggles
 useEffect(() => {
 setCart(prevCart => prevCart.map(item => {
 const product = products.find(p => p.id === item.productId)
 if (!product) return item
 const rate = isWholesaleMode ? (Number(product.wholesaleRate) || Number(product.sellingRate)) : Number(product.sellingRate)
 
 const newTotalPrice = rate * item.quantity
 const validDiscount = Math.min(item.discountAmt || 0, newTotalPrice)
 const taxableAmount = newTotalPrice - validDiscount
 
 return {
 ...item,
 unitRate: rate,
 totalPrice: newTotalPrice,
 discountAmt: validDiscount,
 gstAmount: taxableAmount * ((item.gstRate || 0) / 100)
 }
 }))
 }, [isWholesaleMode, products])

 useEffect(() => {
 const handleKeyDown = (e: KeyboardEvent) => {
 // Don't intercept if user is typing in an input (except search where we want F-keys to work anyway)
 if (e.target instanceof HTMLInputElement && e.key !== 'F4' && e.key !== 'F8' && e.key !== 'F9' && e.key !== 'F10' && e.key !== 'F11' && e.key !== 'F12') {
 return
 }

 switch (e.key) {
 case 'F4':
 e.preventDefault()
 searchInputRef.current?.focus()
 break
 case 'F8':
 e.preventDefault()
 handleHoldBill()
 break
 case 'F9':
 e.preventDefault()
 setPaymentMode('CASH')
 break
 case 'F10':
 e.preventDefault()
 setPaymentMode('CARD')
 break
 case 'F11':
 e.preventDefault()
 setPaymentMode('UPI')
 break
 case 'F12':
 e.preventDefault()
 setPaymentMode('SPLIT')
 break
 case 'Enter':
 // We can't easily intercept a general Enter for checkout without breaking other inputs,
 // but we can add a hotkey like F2 or just rely on the F-keys for now.
 break
 }
 }
 window.addEventListener('keydown', handleKeyDown)
 return () => window.removeEventListener('keydown', handleKeyDown)
 }, [cart, selectedCustomerId, pointsToRedeem, discountAmt, paymentMode, paidCash, paidCard])

 return (
 <>
 <ReceiptModal data={receiptData} onClose={() => setReceiptData(null)} />

 {/* NEW: QUICK ADD CUSTOMER MODAL */}
 {isCustomerModalOpen && (
 <div className="fixed inset-0 bg-brand-charcoal/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
 <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-brand-charcoal/5 animate-in fade-in zoom-in-95 duration-150 transition-colors">
 <div className="flex justify-between items-center pb-3 border-b border-brand-charcoal/5 ">
 <h3 className="font-bold text-base text-brand-charcoal ">⚡ Quick-Register Shopper</h3>
 <button
 type="button"
 onClick={() => setIsCustomerModalOpen(false)}
 className="text-brand-charcoal/40 hover:text-brand-charcoal/70 :text-slate-300 text-sm font-bold"
 >
 ✕
 </button>
 </div>

 <form
 action={(formData) => {
 startCustomerTransition(async () => {
 try {
 const res = await createCustomer(formData)
 if (res?.success && res.customer) {
 // Automatically select the newly registered shopper!
 setSelectedCustomerId(res.customer.id)
 setIsCustomerModalOpen(false)
 }
 } catch (err: any) {
 alert(`Error: ${err.message || 'Failed to register customer'}`)
 }
 })
 }}
 className="space-y-3 mt-4 text-left"
 >
 <div>
 <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-charcoal/70 mb-1">
 Full Name *
 </label>
 <input
 type="text"
 name="name"
 required
 placeholder="e.g. Priya Patel"
 className="w-full text-xs bg-brand-cream/50 border border-brand-charcoal/10 rounded-lg px-3 py-2 text-brand-charcoal focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold font-medium transition-colors"
 />
 </div>

 <div>
 <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-charcoal/70 mb-1">
 Phone Number
 </label>
 <input
 type="tel"
 name="phone"
 placeholder="e.g. +91 98765 43210"
 className="w-full text-xs bg-brand-cream/50 border border-brand-charcoal/10 rounded-lg px-3 py-2 text-brand-charcoal focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold font-mono transition-colors"
 />
 </div>

 <div>
 <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-charcoal/70 mb-1">
 City / Location
 </label>
 <input
 type="text"
 name="city"
 placeholder="e.g. Mumbai"
 className="w-full text-xs bg-brand-cream/50 border border-brand-charcoal/10 rounded-lg px-3 py-2 text-brand-charcoal focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold font-medium transition-colors"
 />
 </div>

 <div className="pt-3 flex justify-end gap-2 border-t border-brand-charcoal/5 mt-4 transition-colors">
 <button
 type="button"
 onClick={() => setIsCustomerModalOpen(false)}
 className="px-3 py-1.5 text-xs font-bold text-brand-charcoal/70 hover:bg-brand-cream :bg-brand-charcoal/90 rounded-lg transition-colors"
 >
 Cancel
 </button>
 <button
 type="submit"
 disabled={customerPending}
 className="px-4 py-1.5 text-xs font-bold bg-brand-charcoal hover:bg-black disabled:opacity-50 text-brand-cream rounded-lg transition-colors shadow-sm"
 >
 {customerPending ? 'Saving...' : 'Register & Auto-Select'}
 </button>
 </div>
 </form>
 </div>
 </div>
 )}

 <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-7rem)]">
 
 {/* LEFT PANE: Product Grid */}
 <div className="lg:col-span-8 bg-white border border-brand-charcoal/10 rounded-2xl shadow-sm flex flex-col overflow-hidden transition-colors">
 <div className="p-4 border-b border-brand-charcoal/5 space-y-3 transition-colors">
 <input
 ref={searchInputRef}
 type="text"
 placeholder="🔍 Scan barcode or search product name... [F4]"
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 onKeyDown={(e) => {
 if (e.key === 'Enter' && searchTerm.trim() !== '') {
 const exactMatch = products.find(
 (p) => p.barcode === searchTerm.trim() || p.name.toLowerCase() === searchTerm.trim().toLowerCase()
 )
 if (exactMatch) {
 addToCart(exactMatch)
 setSearchTerm('')
 }
 }
 }}
 className="w-full text-sm bg-brand-cream/50 border border-brand-charcoal/10 rounded-xl px-4 py-2.5 text-brand-charcoal focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold font-medium transition-colors"
 />
 
 <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
 {categories.map((cat) => (
 <button
 key={cat}
 onClick={() => setSelectedCategory(cat)}
 className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
 selectedCategory === cat
 ? 'bg-brand-charcoal text-brand-cream shadow-sm'
 : 'bg-brand-cream text-brand-charcoal/70 hover:bg-brand-cream/80 :bg-slate-700'
 }`}
 >
 {cat}
 </button>
 ))}
 </div>
 </div>

 <div className="p-4 flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 content-start">
 {filteredProducts.map((p) => {
 const isOutOfStock = p.stockQty <= 0
 return (
 <button
 key={p.id}
 onClick={() => addToCart(p)}
 disabled={isOutOfStock}
 className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between h-28 relative group ${
 isOutOfStock
 ? 'bg-brand-cream/50 border-brand-charcoal/10 opacity-50 cursor-not-allowed'
 : 'bg-white border-brand-charcoal/10 hover:border-brand-gold :border-brand-gold hover:shadow-md active:scale-[0.98]'
 }`}
 >
 <div>
 <span className="text-[10px] uppercase font-bold text-brand-charcoal/40 block truncate">
 {p.category?.name || 'Item'}
 </span>
 <h4 className="font-bold text-xs text-brand-charcoal line-clamp-2 mt-0.5 group-hover:text-brand-gold :text-brand-gold">
 {p.name}
 </h4>
 </div>
 
 <div className="flex items-end justify-between mt-2">
 <span className="font-mono font-extrabold text-sm text-brand-charcoal ">
 {formatINR(Number(p.sellingRate))}
 </span>
 <span
 className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
 isOutOfStock ? 'bg-rose-100 text-rose-700 ' : 'bg-brand-cream text-brand-charcoal/70 '
 }`}
 >
 {p.stockQty} left
 </span>
 </div>
 </button>
 )
 })}
 </div>
 </div>

 {/* RIGHT PANE: Cart & Checkout Summary */}
 <div className="lg:col-span-4 bg-white border border-brand-charcoal/10 rounded-2xl shadow-sm flex flex-col h-full overflow-hidden transition-colors">
 
 <div className="p-4 border-b border-brand-charcoal/5 bg-brand-charcoal text-brand-cream flex justify-between items-center transition-colors">
 <div className="flex items-center gap-3">
 <h3 className="font-bold text-sm tracking-wide">🛒 Current Basket</h3>
 <span className="text-xs bg-brand-charcoal/90 text-slate-300 font-mono px-2 py-0.5 rounded">
 {cart.reduce((sum, i) => sum + i.quantity, 0)} items
 </span>
 </div>
 <div className="flex gap-3 items-center">
 <label className="flex items-center gap-2 cursor-pointer bg-brand-charcoal/90 px-2 py-1 rounded">
 <span className="text-xs font-bold text-slate-300">B2B</span>
 <input 
 type="checkbox" 
 checked={isWholesaleMode}
 onChange={(e) => setIsWholesaleMode(e.target.checked)}
 className="w-4 h-4 text-brand-gold rounded bg-slate-700 border-slate-600 focus:ring-indigo-600"
 />
 </label>
 {heldBills.length > 0 && (
 <select 
 onChange={(e) => {
 if (e.target.value) handleRestoreBill(e.target.value)
 }}
 value=""
 className="bg-brand-charcoal/90 text-xs px-2 py-1 rounded border border-brand-charcoal/20"
 >
 <option value="" disabled>Restore Bill ({heldBills.length})</option>
 {heldBills.map(b => (
 <option key={b.id} value={b.id}>{b.name}</option>
 ))}
 </select>
 )}
 <button 
 onClick={handleHoldBill}
 disabled={cart.length === 0}
 className="text-xs bg-orange-600 hover:bg-orange-500 disabled:opacity-50 px-2 py-1 rounded font-bold"
 >
 Hold [F8]
 </button>
 </div>
 </div>

 {/* UPGRADED: Customer Assignment with "+ New Shopper" Button! */}
 <div className="p-3 border-b border-brand-charcoal/5 bg-brand-gold/5 transition-colors">
 <div className="flex items-center justify-between mb-1">
 <label className="block text-[10px] font-extrabold uppercase tracking-wider text-brand-charcoal ">
 👤 Link to Customer
 </label>
 <button
 type="button"
 onClick={() => setIsCustomerModalOpen(true)}
 className="text-[10px] bg-brand-charcoal hover:bg-black text-brand-cream font-extrabold px-2 py-0.5 rounded transition-colors shadow-sm flex items-center gap-1 active:scale-95"
 >
 <span>+ New Shopper</span>
 </button>
 </div>
 <select
 value={selectedCustomerId}
 onChange={(e) => {
 setSelectedCustomerId(e.target.value)
 setPointsToRedeem(0)
 }}
 className="w-full text-xs bg-white border border-brand-gold/30 rounded-lg px-2.5 py-1.5 text-brand-charcoal font-medium focus:outline-none focus:ring-2 focus:ring-brand-gold/20 shadow-2xs transition-colors"
 >
 <option value="">Guest Walk-in Shopper</option>
 {customers.map((c) => (
 <option key={c.id} value={c.id}>
 {c.name} {c.phone ? `(${c.phone})` : ''} - ⭐ {c.loyaltyPoints} pts
 </option>
 ))}
 </select>
 </div>

 <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-slate-100 transition-colors">
 {cart.length === 0 ? (
 <div className="h-full flex flex-col items-center justify-center text-center text-brand-charcoal/40 p-6 space-y-2">
 <span className="text-3xl">🛍️</span>
 <p className="text-xs font-medium">Cart is empty. Select products from the left grid to start billing.</p>
 </div>
 ) : (
 cart.map((item) => (
 <div key={item.productId} className="pt-3 first:pt-0 flex items-center justify-between gap-3">
 <div className="flex-1 min-w-0">
 <h5 className="font-bold text-xs text-brand-charcoal truncate">{item.name}</h5>
 <div className="text-[11px] text-brand-charcoal/40 font-mono mt-0.5">
 {formatINR(item.unitRate)} each {(item.gstRate || 0) > 0 && <span className="text-[9px] text-brand-charcoal/40 ml-1">(+{item.gstRate}% GST)</span>}
 </div>
 </div>

 <div className="flex items-center border border-brand-charcoal/10 rounded-lg bg-brand-cream/50 transition-colors">
 <button
 onClick={() => updateQuantity(item.productId, -1)}
 className="w-6 h-6 flex items-center justify-center font-bold text-brand-charcoal/70 hover:bg-brand-cream/80 :bg-slate-700 text-xs transition-colors"
 >
 -
 </button>
 <span className="w-7 text-center font-mono font-bold text-xs text-brand-charcoal ">
 {item.quantity}
 </span>
 <button
 onClick={() => updateQuantity(item.productId, 1)}
 className="w-6 h-6 flex items-center justify-center font-bold text-brand-charcoal/70 hover:bg-brand-cream/80 :bg-slate-700 text-xs transition-colors"
 >
 +
 </button>
 </div>

 <div className="flex flex-col items-end gap-1">
 <div className="font-mono font-extrabold text-xs text-brand-charcoal text-right">
 {formatINR(item.totalPrice)}
 </div>
 <input
 type="number"
 min="0"
 max={item.totalPrice}
 placeholder="Dis."
 value={item.discountAmt || ''}
 onChange={(e) => updateItemDiscount(item.productId, parseFloat(e.target.value) || 0)}
 className="w-14 text-right text-[10px] bg-white border border-brand-charcoal/10 rounded px-1 py-0.5 text-brand-charcoal/70 focus:outline-none focus:border-brand-gold transition-colors"
 title="Item Discount (₹)"
 />
 </div>
 </div>
 ))
 )}
 </div>

 <div className="p-4 border-t border-brand-charcoal/10 bg-brand-cream/50 space-y-3.5 transition-colors">
 <div className="grid grid-cols-5 gap-2">
 {(['CASH', 'CARD', 'UPI', 'CREDIT', 'SPLIT'] as const).map((mode, i) => (
 <button
 key={mode}
 onClick={() => setPaymentMode(mode)}
 className={`py-1.5 rounded-lg text-[10px] font-extrabold tracking-wider uppercase border transition-all flex flex-col items-center ${
 paymentMode === mode
 ? 'bg-brand-charcoal text-brand-cream border-slate-900 shadow-sm'
 : 'bg-white text-brand-charcoal/70 border-brand-charcoal/10 hover:bg-brand-cream :bg-slate-700'
 }`}
 >
 <span>{mode}</span>
 <span className="text-[8px] opacity-70">[F{9 + i}]</span>
 </button>
 ))}
 </div>

 {paymentMode === 'SPLIT' && (
 <div className="flex gap-2 p-2 bg-brand-cream rounded-lg border border-brand-charcoal/10 ">
 <div className="flex-1">
 <label className="block text-[10px] font-bold text-brand-charcoal/50 mb-1">Cash Amt</label>
 <input
 type="number"
 value={paidCash || ''}
 onChange={(e) => setPaidCash(parseFloat(e.target.value) || 0)}
 className="w-full text-xs p-1.5 rounded border border-brand-charcoal/20 bg-white text-brand-charcoal "
 />
 </div>
 <div className="flex-1">
 <label className="block text-[10px] font-bold text-brand-charcoal/50 mb-1">Card Amt</label>
 <input
 type="number"
 value={paidCard || ''}
 onChange={(e) => setPaidCard(parseFloat(e.target.value) || 0)}
 className="w-full text-xs p-1.5 rounded border border-brand-charcoal/20 bg-white text-brand-charcoal "
 />
 </div>
 </div>
 )}

 <div className="space-y-1.5 text-xs">
 <div className="flex justify-between text-brand-charcoal/50 ">
 <span>Gross Total:</span>
 <span className="font-mono font-bold">{formatINR(grossAmount)}</span>
 </div>
 <div className="flex justify-between text-brand-charcoal/50 ">
 <span>Total GST:</span>
 <span className="font-mono font-bold">{formatINR(totalGST)}</span>
 </div>
 
 {selectedCustomerId && (() => {
 const customer = customers.find(c => c.id === selectedCustomerId)
 const availablePoints = customer?.loyaltyPoints || 0
 return (
 <div className="flex flex-col gap-1 py-1.5 border-y border-brand-charcoal/5 transition-colors">
 <div className="flex justify-between items-center text-brand-gold ">
 <span className="font-bold">⭐ Loyalty Points (Max: {availablePoints}):<br/><span className="text-[9px] font-normal text-brand-charcoal/50">(10 pts = ₹1 discount)</span></span>
 <input
 type="number"
 min="0"
 max={availablePoints}
 step="10"
 value={pointsToRedeem || ''}
 onChange={(e) => setPointsToRedeem(Math.min(availablePoints, parseInt(e.target.value) || 0))}
 placeholder="0"
 className="w-16 text-right font-mono font-bold bg-white border border-brand-gold/30 rounded px-1.5 py-0.5 text-xs focus:outline-none focus:border-brand-gold transition-colors"
 />
 </div>
 {pointsDiscount > 0 && (
 <div className="flex justify-end text-[10px] text-emerald-600 font-bold">
 - {formatINR(pointsDiscount)} savings applied!
 </div>
 )}
 </div>
 )
 })()}

 <div className="flex justify-between items-center text-brand-charcoal/50 ">
 <span>Addl Discount (₹):</span>
 <input
 type="number"
 min="0"
 max={grossAmount}
 value={discountAmt || ''}
 onChange={(e) => setDiscountAmt(parseFloat(e.target.value) || 0)}
 placeholder="0.00"
 className="w-16 text-right font-mono font-bold bg-white border border-brand-charcoal/10 rounded px-1.5 py-0.5 text-xs focus:outline-none focus:border-brand-gold transition-colors"
 />
 </div>
 <div className="flex justify-between text-base font-extrabold text-brand-charcoal pt-1 border-t border-brand-charcoal/10 transition-colors">
 <span>Net Payable:</span>
 <span className="font-mono text-brand-gold ">{formatINR(netAmount)}</span>
 </div>
 {selectedCustomerId && (
 <div className="flex justify-between text-[10px] text-emerald-600 font-bold mt-1">
 <span>Points to Earn:</span>
 <span>+{Math.floor(netAmount / 10)} pts</span>
 </div>
 )}
 </div>

 <button
 onClick={handleCheckout}
 disabled={cart.length === 0 || isPending}
 className="w-full bg-brand-charcoal hover:bg-black disabled:opacity-40 text-brand-cream font-extrabold py-3 rounded-xl shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2 text-sm"
 >
 <span>{isPending ? 'Processing Billing...' : '🖨️ Complete & Print Receipt'}</span>
 </button>
 </div>

 </div>
 </div>
 </>
 )
}