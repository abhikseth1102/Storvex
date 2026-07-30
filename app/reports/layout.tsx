import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export default async function ReportsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user?.tenantId || session.user.role !== 'ADMIN') {
    redirect('/pos')
  }
  return <>{children}</>
}
