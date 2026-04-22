import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  // Get recent unique merchants with their last transaction
  const recentTransactions = await prisma.transaction.findMany({
    orderBy: { date: 'desc' },
    take: 100,
    include: {
      lineItems: {
        include: { category: true },
      },
    },
  })

  // Group by merchant, keeping only the most recent for each
  const merchantMap: Record<string, {
    merchant: string
    lastDate: string
    lineItems: { description: string; amount: number; categoryId: string; categoryName: string }[]
  }> = {}

  for (const tx of recentTransactions) {
    if (!merchantMap[tx.merchant.toLowerCase()]) {
      merchantMap[tx.merchant.toLowerCase()] = {
        merchant: tx.merchant,
        lastDate: tx.date.toISOString(),
        lineItems: tx.lineItems.map((li) => ({
          description: li.description,
          amount: li.amount,
          categoryId: li.categoryId,
          categoryName: li.category.name,
        })),
      }
    }
  }

  const merchants = Object.values(merchantMap).slice(0, 20)

  return NextResponse.json(merchants)
}
