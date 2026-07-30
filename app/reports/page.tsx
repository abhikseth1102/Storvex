'use client'

import { useState } from 'react'
import Link from 'next/link'
import SignOutButton from '@/components/SignOutButton'

export default function ReportsPage() {
 const [startDate, setStartDate] = useState('')
 const [endDate, setEndDate] = useState('')

 const handleDownload = () => {
 if (!startDate || !endDate) return alert('Please select both start and end dates')
 
 // Trigger download via the API route
 window.location.href = `/api/export/sales?start=${startDate}&end=${endDate}`
 }

 return (
 <div 
 className="min-h-screen font-sans pb-12 bg-brand-cream selection:bg-brand-gold/30 relative overflow-hidden z-0"
 style={{
 backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Cpath d='M0 10 Q 10 5, 20 10 T 40 10 M0 30 Q 10 25, 20 30 T 40 30' fill='none' stroke='rgba(28,28,30,0.08)' stroke-width='1'/%3E%3Cpath d='M10 0 Q 5 10, 10 20 T 10 40 M30 0 Q 25 10, 30 20 T 30 40' fill='none' stroke='rgba(28,28,30,0.08)' stroke-width='1'/%3E%3C/svg%3E")`,
 backgroundSize: '40px 40px'
 }}
 >
 {/* Artistic Free-form Background */}
 <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
 <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-indigo-200/20 blur-[120px] mix-blend-multiply"></div>
 <div className="absolute top-[20%] -right-[10%] w-[40%] h-[60%] rounded-full bg-violet-200/20 blur-[120px] mix-blend-multiply"></div>
 <div className="absolute -bottom-[10%] left-[20%] w-[60%] h-[50%] rounded-full bg-brand-gold/10 blur-[120px] mix-blend-multiply"></div>
 </div>
 <header className="bg-white/60 backdrop-blur-xl border-b border-brand-charcoal/5 sticky top-0 z-20 transition-colors">
 <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
 <div className="flex items-center space-x-4">
 <Link
 href="/"
 className="text-xs font-bold text-brand-charcoal/50 hover:text-brand-gold bg-brand-cream hover:bg-brand-gold/10 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
 >
 ← Back to Dashboard
 </Link>
 <span className="font-bold text-lg text-brand-charcoal ">
 Storvex <span className="text-sm font-sans font-extrabold uppercase tracking-widest text-brand-gold bg-brand-gold/10 px-2 py-0.5 rounded-full ml-1">Reports & Exports</span>
 </span>
 </div>
 <div className="flex items-center space-x-3">
 <SignOutButton />
 </div>
 </div>
 </header>

 <main className="max-w-4xl mx-auto px-6 py-12">
 <div className="bg-white p-8 rounded-3xl border border-brand-charcoal/10 shadow-sm animate-in zoom-in-95 duration-300 transition-colors">
 <div className="flex items-center gap-3 mb-2">
 <span className="text-3xl">🧾</span>
 <h1 className="font-extrabold text-2xl text-brand-charcoal ">Tax & Sales CSV Export</h1>
 </div>
 <p className="text-sm text-brand-charcoal/50 mb-8 pl-11">
 Generate raw CSV reports of your transaction ledger for accounting and tax purposes. 
 The export includes gross amounts, discounts, net payables, and refund statuses.
 <br/><br/>
 Looking for GST summarized data? <Link href="/reports/advanced" className="text-brand-gold font-bold hover:underline">View Advanced Registers →</Link>
 </p>

 <div className="pl-11 grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
 <div>
 <label className="block text-xs font-bold uppercase tracking-wider text-brand-charcoal/50 mb-2">Start Date</label>
 <input 
 type="date" 
 value={startDate}
 onChange={e => setStartDate(e.target.value)}
 className="w-full bg-brand-cream/50 border border-brand-charcoal/10 rounded-xl px-4 py-3 text-sm font-medium text-brand-charcoal focus:outline-none focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 transition-all"
 />
 </div>
 <div>
 <label className="block text-xs font-bold uppercase tracking-wider text-brand-charcoal/50 mb-2">End Date</label>
 <input 
 type="date" 
 value={endDate}
 onChange={e => setEndDate(e.target.value)}
 className="w-full bg-brand-cream/50 border border-brand-charcoal/10 rounded-xl px-4 py-3 text-sm font-medium text-brand-charcoal focus:outline-none focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 transition-all"
 />
 </div>
 </div>

 <div className="pl-11 border-t border-brand-charcoal/5 pt-6">
 <button 
 onClick={handleDownload}
 className="bg-brand-charcoal hover:bg-black text-brand-cream font-bold px-6 py-3 rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-2"
 >
 <span>📥 Download CSV Report</span>
 </button>
 </div>
 </div>
 </main>
 </div>
 )
}
