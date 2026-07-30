'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import {
 ShoppingCart,
 Package,
 Users,
 ReceiptText,
 UserCog,
 Truck,
 TrendingUp,
 Download,
 WalletCards,
 ArrowRight
} from 'lucide-react'

const PRIMARY_ACTIONS = [
 { href: '/pos', title: 'Point of Sale', icon: ShoppingCart },
 { href: '/inventory', title: 'Inventory Center', icon: Package },
 { href: '/procurement', title: 'Procurement', icon: Truck },
]

const SECONDARY_MODULES = [
 { href: '/customers', title: 'Customer CRM', icon: Users },
 { href: '/invoices', title: 'Ledger & Refunds', icon: ReceiptText },
 { href: '/accounts', title: 'General Ledger', icon: WalletCards },
 { href: '/analytics', title: 'Analytics', icon: TrendingUp },
 { href: '/reports', title: 'Export Reports', icon: Download },
 { href: '/staff', title: 'Staff Settings', icon: UserCog },
]

export default function BoutiqueNav() {
 return (
 <div className="space-y-8">
 {/* Primary Actions (Cards) */}
 <div>
 <h2 className="text-xs uppercase tracking-widest text-brand-charcoal/50 font-semibold mb-4">
 Quick Actions
 </h2>
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
 {PRIMARY_ACTIONS.map((action, i) => (
 <motion.div
 key={action.title}
 initial={{ opacity: 0, y: 15 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: i * 0.1, duration: 0.2 }}
 >
 <Link 
 href={action.href}
 className="group relative flex flex-col items-center justify-center p-6 bg-white border border-brand-charcoal/10 rounded-2xl shadow-sm hover:shadow-md hover:border-brand-gold/50 transition-all text-brand-charcoal"
 >
 {action.title === 'Inventory Center' && (
 <div className="absolute -top-2 -right-2 bg-rose-500 text-brand-cream text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm scale-0 group-hover:scale-100 transition-transform origin-bottom-left">
 2 Low
 </div>
 )}
 <action.icon strokeWidth={1.5} className="w-8 h-8 mb-3 text-brand-charcoal group-hover:text-brand-gold transition-colors" />
 <span className="font-semibold text-sm text-center">{action.title}</span>
 </Link>
 </motion.div>
 ))}
 </div>
 </div>

 {/* Secondary Modules (List) */}
 <div>
 <h2 className="text-xs uppercase tracking-widest text-brand-charcoal/50 font-semibold mb-4">
 Management Modules
 </h2>
 <motion.div 
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 transition={{ delay: 0.3, duration: 0.3 }}
 className="bg-white border border-brand-charcoal/10 rounded-2xl divide-y divide-brand-charcoal/5 shadow-sm"
 >
 {SECONDARY_MODULES.map((module) => (
 <Link 
 key={module.title}
 href={module.href}
 className="group flex items-center justify-between p-4 hover:bg-brand-cream/50 transition-colors first:rounded-t-2xl last:rounded-b-2xl relative overflow-hidden"
 >
 <div className="flex items-center gap-4">
 <div className="p-2 bg-brand-cream rounded-lg group-hover:bg-brand-gold/10 transition-colors relative">
 <module.icon strokeWidth={1.5} className="w-5 h-5 text-brand-charcoal group-hover:text-brand-gold transition-colors" />
 {module.title === 'Customer CRM' && (
 <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-emerald-500 rounded-full border border-white"></span>
 )}
 {module.title === 'Ledger & Refunds' && (
 <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-rose-500 rounded-full border border-white"></span>
 )}
 </div>
 <span className="font-medium text-brand-charcoal text-sm">{module.title}</span>
 </div>
 <div className="flex items-center gap-3">
 {module.title === 'Ledger & Refunds' && (
 <span className="text-[10px] font-semibold uppercase tracking-widest text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">
 1 Pending
 </span>
 )}
 <ArrowRight strokeWidth={1.5} className="w-4 h-4 text-brand-charcoal/30 group-hover:text-brand-gold group-hover:translate-x-1 transition-all" />
 </div>
 </Link>
 ))}
 </motion.div>
 </div>
 </div>
 )
}
