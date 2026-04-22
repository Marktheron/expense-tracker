import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  const transactions = await prisma.transaction.findMany({
    include: {
      lineItems: {
        include: { category: true },
      },
    },
    orderBy: { date: 'desc' },
  })

  // Build CSV
  const headers = ['Date', 'Merchant', 'Notes', 'Category', 'Item', 'Amount']
  const rows: string[][] = []

  for (const tx of transactions) {
    for (const item of tx.lineItems) {
      rows.push([
        tx.date.toISOString().split('T')[0],
        tx.merchant,
        tx.notes || '',
        item.category.name,
        item.description,
        item.amount.toFixed(2),
      ])
    }
  }

  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')
    ),
  ].join('\n')

  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="expenses-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  })
}
