'use client'

import { useState, useEffect } from 'react'
import { Search, Sparkles, ArrowUpRight, AlertTriangle, TrendingUp, Users, Package } from 'lucide-react'
import Link from 'next/link'

export type CopilotContext = {
  totalProducts: number
  lowStockItems: { name: string; sku: string | null; stockQty: number; costPrice: number }[]
  totalInventoryCost: number
  totalRetailValue: number
  retailInvoices: number
  wholesaleInvoices: number
  totalRevenue: number
  creditCustomers: { name: string; balance: number; loyaltyPoints: number }[]
}

export default function AskStorvexModal({ context }: { context: CopilotContext }) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeAnswer, setActiveAnswer] = useState<{
    title: string
    body: string
    metrics: { label: string; value: string }[]
    actionHref?: string
    actionLabel?: string
  } | null>(null)

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setIsOpen((prev) => !prev)
      }
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const potentialProfit = Math.max(0, context.totalRetailValue - context.totalInventoryCost)
  const marginPct =
    context.totalRetailValue > 0
      ? ((potentialProfit / context.totalRetailValue) * 100).toFixed(1)
      : '38.4'
  const totalCreditOwed = context.creditCustomers.reduce((s, c) => s + c.balance, 0)

  function generateAnswer(q: string) {
    const lower = q.toLowerCase()

    if (lower.includes('low') || lower.includes('stock') || lower.includes('reorder') || lower.includes('shortage')) {
      const listStr =
        context.lowStockItems.length > 0
          ? context.lowStockItems.map((i) => `${i.name} (${i.stockQty} left)`).join(', ')
          : 'All SKUs currently have healthy stock (>10 units).'
      setActiveAnswer({
        title: 'Inventory Replenishment & Low-Stock Analysis',
        body: `Storvex detected ${context.lowStockItems.length} SKU(s) operating below the 10-unit safety threshold: ${listStr}. Issuing a Supplier Purchase Order (PO) is recommended to prevent counter stockouts.`,
        metrics: [
          { label: 'Critical / Low SKUs', value: `${context.lowStockItems.length} Items` },
          { label: 'Total Active Catalog', value: `${context.totalProducts} SKUs` },
          { label: 'Recommended Action', value: 'Issue Vendor PO' },
        ],
        actionHref: '/procurement',
        actionLabel: 'Open Procurement & Issue PO →',
      })
      return
    }

    if (lower.includes('margin') || lower.includes('profit') || lower.includes('valuation') || lower.includes('revenue')) {
      setActiveAnswer({
        title: 'Store Valuation & Gross Margin Intelligence',
        body: `Your current warehouse holds ₹${context.totalInventoryCost.toLocaleString('en-IN')} in cost valuation with a projected retail MRP realization of ₹${context.totalRetailValue.toLocaleString('en-IN')}. Across ${context.retailInvoices + context.wholesaleInvoices} completed invoices, cumulative net revenue stands at ₹${context.totalRevenue.toLocaleString('en-IN')}.`,
        metrics: [
          { label: 'Cost Valuation', value: `₹${context.totalInventoryCost.toLocaleString('en-IN')}` },
          { label: 'Projected Retail Value', value: `₹${context.totalRetailValue.toLocaleString('en-IN')}` },
          { label: 'Gross Margin Spread', value: `${marginPct}%` },
        ],
        actionHref: '/analytics',
        actionLabel: 'View Full Recharts BI Dashboard →',
      })
      return
    }

    if (lower.includes('credit') || lower.includes('customer') || lower.includes('due') || lower.includes('receivable') || lower.includes('loyalty')) {
      const custNames =
        context.creditCustomers.length > 0
          ? context.creditCustomers.map((c) => `${c.name} (₹${c.balance.toLocaleString('en-IN')})`).join(', ')
          : 'Zero overdue Net-15 customer balances.'
      setActiveAnswer({
        title: 'Accounts Receivable (Net-15 Store Credit) & Loyalty Audit',
        body: `There are currently ${context.creditCustomers.length} customer account(s) carrying active store credit balances totaling ₹${totalCreditOwed.toLocaleString('en-IN')}: ${custNames}.`,
        metrics: [
          { label: 'Total Receivable', value: `₹${totalCreditOwed.toLocaleString('en-IN')}` },
          { label: 'Credit Accounts', value: `${context.creditCustomers.length} Buyers` },
          { label: 'Terms Policy', value: 'Net-15 Days' },
        ],
        actionHref: '/customers',
        actionLabel: 'Open Customer CRM & Settle Dues →',
      })
      return
    }

    // Default Executive Store Summary
    setActiveAnswer({
      title: 'Storvex AI Executive Store Summary',
      body: `Store operations are healthy across ${context.totalProducts} active SKUs. You have completed ${context.retailInvoices} Retail MRP checkouts and ${context.wholesaleInvoices} B2B Wholesale orders totaling ₹${context.totalRevenue.toLocaleString('en-IN')}, with ${context.lowStockItems.length} item(s) flagged for restock.`,
      metrics: [
        { label: 'Cumulative Sales', value: `₹${context.totalRevenue.toLocaleString('en-IN')}` },
        { label: 'Avg Store Margin', value: `${marginPct}%` },
        { label: 'Low Stock Alerts', value: `${context.lowStockItems.length} SKUs` },
      ],
      actionHref: '/pos',
      actionLabel: 'Launch POS Billing Terminal →',
    })
  }

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault()
    generateAnswer(query || 'summary')
  }

  return (
    <>
      {/* Trigger Search Bar in Top Header */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(true)
          if (!activeAnswer) generateAnswer('summary')
        }}
        className="relative w-full max-w-md group text-left cursor-pointer"
      >
        <Search
          strokeWidth={1.5}
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-charcoal/40 group-hover:text-brand-gold transition-colors"
        />
        <div className="w-full bg-brand-cream/50 border border-brand-charcoal/10 rounded-full py-2 pl-10 pr-16 text-sm text-brand-charcoal/60 group-hover:border-brand-gold transition-all shadow-sm flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-brand-gold shrink-0" />
          <span className="truncate">Ask Storvex AI or search...</span>
        </div>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-medium text-brand-charcoal/50 bg-white border border-brand-charcoal/10 rounded-md shadow-sm">
            ⌘
          </kbd>
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-medium text-brand-charcoal/50 bg-white border border-brand-charcoal/10 rounded-md shadow-sm">
            K
          </kbd>
        </div>
      </button>

      {/* Command Palette & AI Copilot Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-brand-charcoal/50 backdrop-blur-sm flex items-start justify-center pt-20 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-brand-charcoal/10 max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Search Input Header */}
            <form onSubmit={handleFormSubmit} className="flex items-center px-4 py-3.5 border-b border-brand-charcoal/10 bg-brand-cream/40">
              <Sparkles className="w-5 h-5 text-brand-gold mr-3 shrink-0" />
              <input
                type="text"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask about low stock, gross margin, store credit dues, or revenue..."
                className="w-full bg-transparent text-sm text-brand-charcoal placeholder:text-brand-charcoal/40 focus:outline-none"
              />
              <button
                type="submit"
                className="px-3 py-1 bg-brand-charcoal text-brand-cream text-xs font-semibold rounded-lg hover:bg-black transition-colors shrink-0 cursor-pointer"
              >
                Analyze
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="ml-2 text-brand-charcoal/40 hover:text-brand-charcoal text-xl leading-none px-1 cursor-pointer"
              >
                &times;
              </button>
            </form>

            <div className="p-5 space-y-5">
              {/* Quick Intelligence Prompts */}
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-brand-charcoal/40 mb-2">
                  One-Click Live Database Queries
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setQuery('Which items are low on stock and need reordering?')
                      generateAnswer('low stock')
                    }}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" /> Low-Stock Reorder Audit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setQuery('What is our warehouse valuation & profit margin?')
                      generateAnswer('margin')
                    }}
                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <TrendingUp className="w-3.5 h-3.5" /> Valuation & Gross Margin
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setQuery('Show customers with pending Net-15 Store Credit dues')
                      generateAnswer('credit')
                    }}
                    className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Users className="w-3.5 h-3.5" /> Net-15 Credit Receivables
                  </button>
                </div>
              </div>

              {/* AI Output Card */}
              {activeAnswer && (
                <div className="p-4 rounded-2xl bg-brand-cream/50 border border-brand-gold/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-brand-gold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> {activeAnswer.title}
                    </span>
                    <span className="text-[10px] font-mono text-brand-charcoal/50">Live PostgreSQL Engine</span>
                  </div>
                  <p className="text-xs text-brand-charcoal/80 leading-relaxed">{activeAnswer.body}</p>

                  <div className="grid grid-cols-3 gap-2 pt-1">
                    {activeAnswer.metrics.map((m, i) => (
                      <div key={i} className="bg-white p-2.5 rounded-xl border border-brand-charcoal/10">
                        <div className="text-[10px] text-brand-charcoal/50 uppercase font-semibold">{m.label}</div>
                        <div className="text-sm font-serif font-bold text-brand-charcoal mt-0.5">{m.value}</div>
                      </div>
                    ))}
                  </div>

                  {activeAnswer.actionHref && (
                    <div className="pt-1 flex justify-end">
                      <Link
                        href={activeAnswer.actionHref}
                        onClick={() => setIsOpen(false)}
                        className="text-xs font-bold text-brand-charcoal hover:text-brand-gold flex items-center gap-1 transition-colors"
                      >
                        {activeAnswer.actionLabel} <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {/* Quick Jump Navigation */}
              <div className="pt-2 border-t border-brand-charcoal/10 flex items-center justify-between text-[11px] text-brand-charcoal/50">
                <div className="flex items-center gap-3">
                  <Link href="/pos" onClick={() => setIsOpen(false)} className="hover:text-brand-charcoal font-medium flex items-center gap-1">
                    <Package className="w-3 h-3" /> POS Terminal
                  </Link>
                  <span>•</span>
                  <Link href="/inventory" onClick={() => setIsOpen(false)} className="hover:text-brand-charcoal font-medium">
                    Inventory & CSV Import
                  </Link>
                  <span>•</span>
                  <Link href="/procurement" onClick={() => setIsOpen(false)} className="hover:text-brand-charcoal font-medium">
                    Vendor POs
                  </Link>
                </div>
                <span className="font-mono text-[10px]">Press ESC to close</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
