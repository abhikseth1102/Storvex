'use client'

export type ReceiptItem = {
 productId?: string
 name: string
 unitRate: number
 quantity: number
 totalPrice: number
 gstRate?: number
 gstAmount?: number
}

export type ReceiptData = {
 invoiceNumber: string
 grossAmount: number
 discountAmt: number
 gstAmount: number
 netAmount: number
 paymentMode: string // Changed from strict union to string to prevent Prisma type clashes
 date: string
 items: ReceiptItem[]
 customerName?: string
 gstin?: string
 pan?: string
 isB2b?: boolean
}

export default function ReceiptModal({
 data,
 onClose,
}: {
 data: ReceiptData | null
 onClose: () => void
}) {
 const formatINR = (amount: number) => {
 return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount)
 }

 if (!data) return null

 function handlePrint() {
 window.print()
 }

 return (
 <div className="fixed inset-0 bg-brand-charcoal/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 print:p-0 print:bg-white">
 <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-brand-charcoal/5 flex flex-col max-h-[90vh] print:shadow-none print:border-none print:max-h-none print:w-full">
 
 {/* Receipt Header */}
 <div className="text-center pb-4 border-b border-dashed border-brand-charcoal/20 space-y-1">
 <h2 className="font-extrabold text-xl tracking-tight text-brand-charcoal">
 Storvex <span className="text-brand-gold">POS</span>
 </h2>
 <p className="text-[11px] text-brand-charcoal/50">Official Sales Tax Invoice</p>
 <div className="pt-2 flex justify-between text-xs font-mono text-brand-charcoal/70">
 <span>{data.invoiceNumber}</span>
 <span>{data.date}</span>
 </div>
 {data.gstin && (
 <div className="text-[10px] font-mono text-brand-charcoal/50 mt-1 uppercase">
 GSTIN: {data.gstin}
 </div>
 )}
 {data.pan && (
 <div className="text-[10px] font-mono text-brand-charcoal/50 uppercase">
 PAN: {data.pan}
 </div>
 )}
 {data.customerName && data.customerName !== 'Walk-in Shopper' && (
 <div className="text-xs font-mono text-brand-charcoal/70 mt-1">
 <span>Customer: {data.customerName}</span>
 </div>
 )}
 </div>

 {/* Itemized List */}
 <div className="py-4 flex-1 overflow-y-auto space-y-2 font-mono text-xs divide-y divide-slate-100">
 <div className="grid grid-cols-12 font-bold text-[10px] uppercase text-brand-charcoal/40 pb-1">
 <span className="col-span-6">Item</span>
 <span className="col-span-2 text-center">Qty</span>
 <span className="col-span-4 text-right">Price</span>
 </div>
 {data.items.map((item, idx) => (
 <div key={idx} className="pt-2 grid grid-cols-12 items-center text-brand-charcoal">
 <span className="col-span-6 truncate font-sans font-semibold text-xs">{item.name}</span>
 <span className="col-span-2 text-center">{item.quantity}</span>
 <span className="col-span-4 text-right">{formatINR(item.totalPrice)}</span>
 </div>
 ))}
 </div>

 {/* Totals & Payment Mode */}
 <div className="py-3 border-t border-dashed border-brand-charcoal/20 space-y-1.5 text-xs font-mono">
 <div className="flex justify-between text-brand-charcoal/50">
 <span>Gross Total:</span>
 <span>{formatINR(data.grossAmount)}</span>
 </div>
 <div className="flex justify-between text-brand-charcoal/50">
 <span>Total GST Amount:</span>
 <span>{formatINR(data.gstAmount || 0)}</span>
 </div>
 {data.discountAmt > 0 && (
 <div className="flex justify-between text-emerald-600">
 <span>Discount Applied:</span>
 <span>-{formatINR(data.discountAmt)}</span>
 </div>
 )}
 <div className="flex justify-between text-sm font-extrabold text-brand-charcoal pt-1 border-t border-brand-charcoal/5">
 <span>Net Paid ({data.paymentMode}):</span>
 <span className="text-brand-gold">{formatINR(data.netAmount)}</span>
 </div>
 </div>

 {/* Footer & Actions */}
 <div className="pt-4 border-t border-brand-charcoal/10 flex items-center gap-2 print:hidden">
 <button
 onClick={handlePrint}
 className="flex-1 bg-brand-charcoal hover:bg-black text-brand-cream font-bold py-2.5 rounded-xl text-xs transition-colors shadow-sm flex items-center justify-center gap-1.5"
 >
 <span>🖨️ Print Receipt</span>
 </button>
 <button
 onClick={onClose}
 className="px-4 py-2.5 bg-brand-cream hover:bg-brand-cream/80 text-slate-700 font-bold rounded-xl text-xs transition-colors"
 >
 Done
 </button>
 </div>

 </div>
 </div>
 )
}