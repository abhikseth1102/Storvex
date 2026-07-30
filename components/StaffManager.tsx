'use client'

import { useState, useTransition } from 'react'
import { createStaff, deleteStaff } from '@/app/actions/staff'

type User = {
 id: string
 fullName: string
 email: string
 role: string
 createdAt: Date
}

export default function StaffManager({
 users,
 currentUserId,
}: {
 users: User[]
 currentUserId: string
}) {
 const [isPending, startTransition] = useTransition()
 const [isModalOpen, setIsModalOpen] = useState(false)

 async function handleDelete(userId: string) {
 if (userId === currentUserId) {
 alert("You cannot delete your own account.")
 return
 }
 if (!confirm("Are you sure you want to revoke access for this employee?")) return

 startTransition(async () => {
 try {
 await deleteStaff(userId)
 } catch (err: any) {
 alert(`Error: ${err.message}`)
 }
 })
 }

 return (
 <div className="bg-white border border-brand-charcoal/10 rounded-2xl shadow-sm overflow-hidden flex flex-col transition-colors">
 <div className="p-4 sm:p-6 border-b border-brand-charcoal/5 flex items-center justify-between bg-brand-cream/50 transition-colors">
 <div>
 <h2 className="font-extrabold text-lg text-brand-charcoal ">Team Directory</h2>
 <p className="text-xs text-brand-charcoal/50 mt-1">Manage employee access and roles.</p>
 </div>
 <button
 onClick={() => setIsModalOpen(true)}
 className="text-xs bg-brand-charcoal hover:bg-black text-brand-cream font-bold px-4 py-2 rounded-lg transition-colors shadow-sm flex items-center gap-1.5"
 >
 <span>+ Add Employee</span>
 </button>
 </div>

 <div className="overflow-x-auto">
 <table className="w-full text-left border-collapse min-w-[600px]">
 <thead>
 <tr className="bg-white border-b border-brand-charcoal/5 transition-colors">
 <th className="px-6 py-4 text-xs font-bold text-brand-charcoal/40 uppercase tracking-wider">Employee Name</th>
 <th className="px-6 py-4 text-xs font-bold text-brand-charcoal/40 uppercase tracking-wider">Email</th>
 <th className="px-6 py-4 text-xs font-bold text-brand-charcoal/40 uppercase tracking-wider">Role</th>
 <th className="px-6 py-4 text-xs font-bold text-brand-charcoal/40 uppercase tracking-wider text-right">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 ">
 {users.map((user) => (
 <tr key={user.id} className="hover:bg-brand-cream/50 transition-colors">
 <td className="px-6 py-4">
 <div className="font-bold text-sm text-brand-charcoal ">{user.fullName}</div>
 <div className="text-[10px] text-brand-charcoal/40 font-mono mt-0.5">Joined {new Date(user.createdAt).toLocaleDateString()}</div>
 </td>
 <td className="px-6 py-4 font-mono text-xs text-brand-charcoal/70 ">
 {user.email}
 </td>
 <td className="px-6 py-4">
 <span
 className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${
 user.role === 'ADMIN'
 ? 'bg-purple-100 text-purple-700 '
 : 'bg-emerald-100 text-emerald-700 '
 }`}
 >
 {user.role}
 </span>
 </td>
 <td className="px-6 py-4 text-right">
 <button
 onClick={() => handleDelete(user.id)}
 disabled={isPending || user.id === currentUserId}
 className="text-xs font-bold px-3 py-1.5 rounded transition-colors text-rose-600 hover:bg-rose-50 disabled:opacity-30"
 >
 {user.id === currentUserId ? 'Current User' : 'Revoke Access'}
 </button>
 </td>
 </tr>
 ))}
 {users.length === 0 && (
 <tr>
 <td colSpan={4} className="px-6 py-12 text-center text-brand-charcoal/40 ">
 <p className="text-sm font-medium">No employees found.</p>
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>

 {isModalOpen && (
 <div className="fixed inset-0 bg-brand-charcoal/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
 <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-brand-charcoal/5 animate-in fade-in zoom-in-95 duration-150 transition-colors">
 <div className="flex justify-between items-center pb-3 border-b border-brand-charcoal/5 ">
 <h3 className="font-bold text-base text-brand-charcoal ">Add New Employee</h3>
 <button
 type="button"
 onClick={() => setIsModalOpen(false)}
 className="text-brand-charcoal/40 hover:text-brand-charcoal/70 text-sm font-bold"
 >
 ✕
 </button>
 </div>

 <form
 action={(formData) => {
 startTransition(async () => {
 try {
 const res = await createStaff(formData)
 if (res?.success) {
 setIsModalOpen(false)
 }
 } catch (err: any) {
 alert(`Error: ${err.message || 'Failed to create employee'}`)
 }
 })
 }}
 className="space-y-4 mt-4 text-left"
 >
 <div>
 <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-charcoal/70 mb-1">
 Full Name *
 </label>
 <input
 type="text"
 name="fullName"
 required
 placeholder="e.g. Alex Cashier"
 className="w-full text-xs bg-brand-cream/50 border border-brand-charcoal/10 rounded-lg px-3 py-2 text-brand-charcoal focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold font-medium transition-all"
 />
 </div>

 <div>
 <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-charcoal/70 mb-1">
 Email *
 </label>
 <input
 type="email"
 name="email"
 required
 placeholder="alex@storvex.com"
 className="w-full text-xs bg-brand-cream/50 border border-brand-charcoal/10 rounded-lg px-3 py-2 text-brand-charcoal focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold font-mono transition-all"
 />
 </div>

 <div>
 <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-charcoal/70 mb-1">
 Password *
 </label>
 <input
 type="password"
 name="password"
 required
 placeholder="••••••••"
 className="w-full text-xs bg-brand-cream/50 border border-brand-charcoal/10 rounded-lg px-3 py-2 text-brand-charcoal focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold transition-all"
 />
 </div>

 <div>
 <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-charcoal/70 mb-1">
 Role *
 </label>
 <select
 name="role"
 required
 className="w-full text-xs bg-white border border-brand-charcoal/10 rounded-lg px-3 py-2 text-brand-charcoal focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold font-medium transition-all"
 >
 <option value="CASHIER">CASHIER (POS Access Only)</option>
 <option value="ADMIN">ADMIN (Full Access)</option>
 </select>
 </div>

 <div className="pt-3 flex justify-end gap-2 border-t border-brand-charcoal/5 mt-4 transition-colors">
 <button
 type="button"
 onClick={() => setIsModalOpen(false)}
 className="px-3 py-1.5 text-xs font-bold text-brand-charcoal/70 hover:bg-brand-cream rounded-lg transition-colors"
 >
 Cancel
 </button>
 <button
 type="submit"
 disabled={isPending}
 className="px-4 py-1.5 text-xs font-bold bg-brand-charcoal hover:bg-black disabled:opacity-50 text-brand-cream rounded-lg transition-colors shadow-sm"
 >
 {isPending ? 'Saving...' : 'Create Employee'}
 </button>
 </div>
 </form>
 </div>
 </div>
 )}
 </div>
 )
}
