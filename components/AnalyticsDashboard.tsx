'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'
import Link from 'next/link'
import { formatINR } from '@/lib/utils'

const COLORS = ['#9B7226', '#1C1C1E', '#64748B', '#94A3B8', '#CBD5E1']

export default function AnalyticsDashboard({ metrics }: { metrics: any }) {
  const { revenueData, topSkus, lowStockProducts, categorySales, b2bVsB2c, profitability } = metrics

  return (
    <div className="space-y-6">
      
      {/* KPI Cards (Profitability & Revenue) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-3xl border border-brand-charcoal/5 shadow-[0_4px_20px_-4px_rgba(28,28,30,0.05)] transition-all hover:shadow-[0_8px_30px_-4px_rgba(28,28,30,0.08)] relative overflow-hidden group">
          <div className="absolute inset-0 bg-brand-gold/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-brand-charcoal/40 relative z-10">Total Revenue (30d)</p>
          <h3 className="text-3xl font-serif text-brand-charcoal mt-2 relative z-10">
            {formatINR(profitability.totalRevenue)}
          </h3>
        </div>
        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-3xl border border-brand-charcoal/5 shadow-[0_4px_20px_-4px_rgba(28,28,30,0.05)] transition-all hover:shadow-[0_8px_30px_-4px_rgba(28,28,30,0.08)] relative overflow-hidden group">
          <div className="absolute inset-0 bg-brand-gold/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-brand-charcoal/40 relative z-10">Estimated COGS (30d)</p>
          <h3 className="text-3xl font-serif text-brand-charcoal/70 mt-2 relative z-10">
            {formatINR(profitability.totalCogs)}
          </h3>
        </div>
        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-3xl border border-emerald-500/10 shadow-[0_4px_20px_-4px_rgba(28,28,30,0.05)] transition-all hover:shadow-[0_8px_30px_-4px_rgba(28,28,30,0.08)] relative overflow-hidden group">
          <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-brand-charcoal/40 relative z-10">Gross Margin</p>
          <h3 className="text-3xl font-serif text-emerald-700 mt-2 relative z-10">
            {profitability.grossMargin.toFixed(1)}%
          </h3>
          <p className="text-xs text-emerald-700/70 font-medium mt-2 relative z-10">
            Profit on sold items
          </p>
        </div>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Revenue Chart */}
        <div className="bg-white/90 backdrop-blur-sm p-6 rounded-3xl border border-brand-charcoal/5 shadow-sm animate-in zoom-in-95 duration-300 transition-colors">
          <h2 className="font-extrabold text-lg text-brand-charcoal mb-6 flex items-center gap-2">
            <span>📈</span> Revenue Trend (30 Days)
          </h2>
          {revenueData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-brand-charcoal/40 font-medium">No sales data yet.</div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{fontSize: 10, fill: '#64748b'}} tickLine={false} axisLine={false} />
                  <YAxis tick={{fontSize: 10, fill: '#64748b'}} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip 
                    contentStyle={{borderRadius: '16px', border: '1px solid rgba(28,28,30,0.05)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.05)'}} 
                    formatter={(value: any) => [formatINR(value), 'Revenue']}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#9B7226" strokeWidth={4} dot={{r: 4, fill: '#9B7226', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 6}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Top SKUs */}
        <div className="bg-white/90 backdrop-blur-sm p-6 rounded-3xl border border-brand-charcoal/5 shadow-sm animate-in zoom-in-95 duration-300 delay-75 transition-colors">
          <h2 className="font-extrabold text-lg text-brand-charcoal mb-6 flex items-center gap-2">
            <span>🏆</span> Top Selling SKUs (Volume)
          </h2>
          {topSkus.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-brand-charcoal/40 font-medium">No sales data yet.</div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topSkus} layout="vertical" margin={{ top: 0, right: 0, left: 30, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" tick={{fontSize: 10, fill: '#64748b'}} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" tick={{fontSize: 10, fill: '#64748b'}} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{fill: 'rgba(28,28,30,0.02)'}}
                    contentStyle={{borderRadius: '16px', border: '1px solid rgba(28,28,30,0.05)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.05)'}} 
                    formatter={(value) => [`${value} units`, 'Sold']}
                  />
                  <Bar dataKey="quantity" fill="#1C1C1E" radius={[0, 6, 6, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

      </div>

      {/* Pie Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Category Sales */}
        <div className="bg-white/90 backdrop-blur-sm p-6 rounded-3xl border border-brand-charcoal/5 shadow-sm animate-in zoom-in-95 duration-300 transition-colors">
          <h2 className="font-extrabold text-lg text-brand-charcoal mb-6 flex items-center gap-2">
            <span>🛍️</span> Sales by Category
          </h2>
          {categorySales.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-brand-charcoal/40 font-medium">No sales data yet.</div>
          ) : (
            <div className="h-64 w-full flex items-center">
              <ResponsiveContainer width="50%" height="100%">
                <PieChart>
                  <Pie data={categorySales} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {categorySales.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{borderRadius: '16px', border: '1px solid rgba(28,28,30,0.05)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.05)'}} 
                    formatter={(value: any) => formatINR(value)}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="w-[50%] flex flex-col justify-center gap-3 pl-4">
                {categorySales.slice(0, 5).map((cat: any, i: number) => (
                  <div key={cat.name} className="flex items-center gap-2 text-sm font-medium text-brand-charcoal">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                    <span className="truncate">{cat.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* B2B vs B2C */}
        <div className="bg-white/90 backdrop-blur-sm p-6 rounded-3xl border border-brand-charcoal/5 shadow-sm animate-in zoom-in-95 duration-300 transition-colors">
          <h2 className="font-extrabold text-lg text-brand-charcoal mb-6 flex items-center gap-2">
            <span>🤝</span> Revenue Split (B2B vs B2C)
          </h2>
          {b2bVsB2c.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-brand-charcoal/40 font-medium">No sales data yet.</div>
          ) : (
            <div className="h-64 w-full flex items-center">
              <ResponsiveContainer width="50%" height="100%">
                <PieChart>
                  <Pie data={b2bVsB2c} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {b2bVsB2c.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#1C1C1E' : '#9B7226'} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{borderRadius: '16px', border: '1px solid rgba(28,28,30,0.05)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.05)'}} 
                    formatter={(value: any) => formatINR(value)}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="w-[50%] flex flex-col justify-center gap-4 pl-4">
                {b2bVsB2c.map((split: any, i: number) => (
                  <div key={split.name} className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand-charcoal/50">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: i === 0 ? '#1C1C1E' : '#9B7226' }}></div>
                      <span>{split.name}</span>
                    </div>
                    <span className="font-serif text-xl">{formatINR(split.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Low Stock Alerts */}
      <div className="bg-rose-50/80 backdrop-blur-sm border border-rose-100 p-6 rounded-3xl shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-300 delay-150 transition-colors">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚠️</span>
            <h2 className="font-extrabold text-lg text-rose-900 ">Low Stock Warnings</h2>
          </div>
          <Link href="/procurement" className="text-xs font-bold text-rose-700 bg-rose-100 hover:bg-rose-200 px-4 py-2 rounded-xl transition-colors shadow-sm">
            Order Stock →
          </Link>
        </div>

        {lowStockProducts.length === 0 ? (
          <div className="text-emerald-700 bg-emerald-100/50 p-5 rounded-2xl text-sm font-bold flex items-center gap-3 border border-emerald-100 ">
            <span className="text-xl">✅</span> All product quantities are healthy!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {lowStockProducts.map((p: any) => (
              <div key={p.id} className="bg-white/80 p-5 rounded-2xl border border-rose-200 shadow-sm flex flex-col justify-between hover:border-rose-300 hover:shadow-md transition-all">
                <span className="font-bold text-brand-charcoal text-sm truncate" title={p.name}>{p.name}</span>
                <div className="mt-4 flex justify-between items-center">
                  <span className="text-[10px] font-bold text-brand-charcoal/50 uppercase tracking-wider">Current Stock</span>
                  <span className="font-mono font-extrabold text-rose-600 bg-rose-100 px-3 py-1.5 rounded-lg text-sm">{p.stockQty}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
