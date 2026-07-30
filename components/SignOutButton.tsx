import { handleSignOut } from '@/app/actions/auth'

export default function SignOutButton() {
 return (
 <form action={handleSignOut}>
 <button
 type="submit"
 className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors duration-150 border border-red-200"
 >
 Sign Out
 </button>
 </form>
 )
}