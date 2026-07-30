import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.tenantId || session.user.role !== 'ADMIN') {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const start = searchParams.get('start')
  const end = searchParams.get('end')

  if (!start || !end) {
    return new NextResponse('Missing start or end date', { status: 400 })
  }

  const startDate = new Date(start)
  const endDate = new Date(end)
  // Ensure the end date covers the entire day
  endDate.setHours(23, 59, 59, 999)

  const invoices = await prisma.saleInvoice.findMany({
    where: {
      tenantId: session.user.tenantId,
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    },
    include: {
      customer: { select: { name: true } }
    },
    orderBy: { createdAt: 'desc' }
  })

  // Build CSV
  const header = ['Date', 'Invoice Number', 'Type', 'Customer', 'Payment Mode', 'Gross Amount', 'Discount', 'Net Amount', 'Refunded']
  const rows = invoices.map(inv => [
    inv.createdAt.toISOString(),
    inv.invoiceNumber,
    inv.type,
    inv.customer?.name || 'Walk-in',
    inv.paymentMode,
    inv.grossAmount.toFixed(2),
    inv.discountAmt.toFixed(2),
    inv.netAmount.toFixed(2),
    inv.isRefunded ? 'YES' : 'NO'
  ])

  const csvContent = [
    header.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')

  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="storvex_sales_report_${start}_to_${end}.csv"`
    }
  })
}
