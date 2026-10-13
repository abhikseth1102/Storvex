'use client'

import { useState } from 'react'
import { bulkImportProducts, BulkProductRow } from '@/app/actions/products'

const SAMPLE_CSV = `name,categoryName,sku,costPrice,sellingRate,wholesaleRate,gstRate,stockQty
Banarasi Silk Festive Kurta,Apparel,ETH-KUR-101,1450,2899,2250,12,35
Handcrafted Kolhapuri Leather Loafers,Footwear,FOOT-KOL-204,850,1799,1399,12,24
Kundan Pearl Bridal Choker Set,Accessories,ACC-KUN-309,620,1499,1100,3,18
Epson 80mm Thermal POS Printer,Electronics,ELEC-EPS-402,4200,6499,5500,18,12`

function parseCsvText(csvText: string): BulkProductRow[] {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)

  if (lines.length === 0) return []

  const startIdx = lines[0].toLowerCase().includes('costprice') || lines[0].toLowerCase().includes('name') ? 1 : 0
  const parsed: BulkProductRow[] = []

  for (let i = startIdx; i < lines.length; i++) {
    const cols = lines[i].split(',').map((c) => c.trim())
    if (cols.length < 5) continue
    const [name, categoryName, sku, costPrice, sellingRate, wholesaleRate, gstRate, stockQty] = cols
    if (!name || isNaN(Number(costPrice)) || isNaN(Number(sellingRate))) continue

    parsed.push({
      name,
      categoryName: categoryName || 'Apparel',
      sku: sku || undefined,
      costPrice: Number(costPrice),
      sellingRate: Number(sellingRate),
      wholesaleRate: wholesaleRate ? Number(wholesaleRate) : Math.round(Number(sellingRate) * 0.8),
      gstRate: gstRate ? Number(gstRate) : 12,
      stockQty: stockQty ? Number(stockQty) : 10,
    })
  }
  return parsed
}

export default function BulkImportModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [csvText, setCsvText] = useState(SAMPLE_CSV)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [resultMsg, setResultMsg] = useState<string | null>(null)

  const previewRows = parseCsvText(csvText)

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (evt) => {
      if (typeof evt.target?.result === 'string') {
        setCsvText(evt.target.result)
        setResultMsg(null)
      }
    }
    reader.readAsText(file)
  }

  function handleDownloadTemplate() {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'storvex_store_migration_template.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  async function handleImport() {
    if (previewRows.length === 0) return
    setIsSubmitting(true)
    setResultMsg(null)
    try {
      const res = await bulkImportProducts(previewRows)
      setResultMsg(`Successfully migrated ${res.importedCount} SKUs into live PostgreSQL catalog!`)
      setTimeout(() => {
        setIsOpen(false)
        setResultMsg(null)
      }, 1400)
    } catch (err) {
      console.error(err)
      alert('Bulk import failed. Please check CSV columns.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-white hover:bg-brand-cream text-brand-charcoal text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-2 border border-brand-charcoal/15 hover:border-brand-gold cursor-pointer"
      >
        <span>📥</span> Bulk CSV Import
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-brand-charcoal/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-brand-charcoal/10 max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-brand-charcoal/10 flex justify-between items-center bg-brand-cream/60">
              <div>
                <h3 className="font-serif text-xl font-bold text-brand-charcoal">
                  Store Catalog Migration & Bulk CSV Import
                </h3>
                <p className="text-xs text-brand-charcoal/60">
                  Batch-import existing retail store inventory into PostgreSQL inside a single ACID transaction
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-brand-charcoal/40 hover:text-brand-charcoal font-bold text-2xl leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="flex flex-wrap items-center justify-between gap-2 bg-brand-cream/40 p-3 rounded-xl border border-brand-charcoal/10">
                <div className="flex items-center gap-2">
                  <label className="px-3 py-1.5 bg-brand-charcoal text-brand-cream text-xs font-semibold rounded-lg cursor-pointer hover:bg-black transition-colors">
                    📂 Upload .CSV File
                    <input type="file" accept=".csv,text/csv" onChange={handleFileUpload} className="hidden" />
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setCsvText(SAMPLE_CSV)
                      setResultMsg(null)
                    }}
                    className="px-3 py-1.5 bg-brand-gold/15 text-brand-charcoal text-xs font-semibold rounded-lg hover:bg-brand-gold/25 transition-colors cursor-pointer"
                  >
                    ⚡ Load Sample Boutique Dataset
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="text-xs font-semibold text-brand-charcoal/70 hover:text-brand-charcoal underline cursor-pointer"
                >
                  ⬇️ Download CSV Template
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-charcoal/70 mb-1">
                  CSV Payload (name, categoryName, sku, costPrice, sellingRate, wholesaleRate, gstRate, stockQty)
                </label>
                <textarea
                  rows={5}
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  className="w-full p-3 font-mono text-xs border border-brand-charcoal/20 rounded-xl bg-brand-cream/20 text-brand-charcoal focus:outline-none focus:border-brand-gold"
                />
              </div>

              {/* Live Parsed Preview */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-charcoal/60">
                    Parsed Migration Preview ({previewRows.length} SKUs Ready)
                  </span>
                  <span className="text-[11px] text-emerald-700 font-semibold">
                    ✓ Auto-upserts Categories & SKUs
                  </span>
                </div>
                <div className="border border-brand-charcoal/10 rounded-xl overflow-hidden max-h-40 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-brand-cream/60 text-brand-charcoal/70 uppercase text-[10px]">
                      <tr>
                        <th className="py-2 px-3">SKU</th>
                        <th className="py-2 px-3">Product Name</th>
                        <th className="py-2 px-3">Category</th>
                        <th className="py-2 px-3">Cost (₹)</th>
                        <th className="py-2 px-3">MRP (₹)</th>
                        <th className="py-2 px-3">Stock</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-charcoal/5">
                      {previewRows.map((r, i) => (
                        <tr key={i} className="hover:bg-brand-cream/30">
                          <td className="py-1.5 px-3 font-mono text-[11px]">{r.sku || 'AUTO'}</td>
                          <td className="py-1.5 px-3 font-medium text-brand-charcoal">{r.name}</td>
                          <td className="py-1.5 px-3">{r.categoryName}</td>
                          <td className="py-1.5 px-3">₹{r.costPrice}</td>
                          <td className="py-1.5 px-3 font-semibold">₹{r.sellingRate}</td>
                          <td className="py-1.5 px-3 font-mono">{r.stockQty}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {resultMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold text-center">
                  🎉 {resultMsg}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2 border-t border-brand-charcoal/10">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-brand-charcoal/70 hover:text-brand-charcoal cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSubmitting || previewRows.length === 0}
                  onClick={handleImport}
                  className="px-5 py-2 bg-brand-charcoal hover:bg-black disabled:opacity-50 text-brand-cream text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  {isSubmitting ? 'Migrating Catalog...' : `🚀 Import ${previewRows.length} Products into Database`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
