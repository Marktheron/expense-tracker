import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')

  const now = new Date()
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  const dateFilter = {
    gte: startDate ? new Date(startDate) : firstOfMonth,
    lte: endDate ? new Date(endDate) : lastOfMonth,
  }

  // Total spending for period
  const totalSpending = await prisma.lineItem.aggregate({
    where: {
      transaction: {
        date: dateFilter,
      },
    },
    _sum: { amount: true },
  })

  // Spending by category
  const spendingByCategory = await prisma.lineItem.groupBy({
    by: ['categoryId'],
    where: {
      transaction: {
        date: dateFilter,
      },
    },
    _sum: { amount: true },
  })

  // Get category details
  const categories = await prisma.category.findMany()
  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]))

  const categoryBreakdown = spendingByCategory
    .map((item) => ({
      category: categoryMap[item.categoryId],
      total: item._sum.amount || 0,
    }))
    .sort((a, b) => b.total - a.total)

  // Transaction count
  const transactionCount = await prisma.transaction.count({
    where: { date: dateFilter },
  })

  // Daily spending for chart
  const transactions = await prisma.transaction.findMany({
    where: { date: dateFilter },
    include: { lineItems: true },
    orderBy: { date: 'asc' },
  })

  const dailySpending: Record<string, number> = {}
  for (const tx of transactions) {
    const dateKey = tx.date.toISOString().split('T')[0]
    const txTotal = tx.lineItems.reduce((sum, item) => sum + item.amount, 0)
    dailySpending[dateKey] = (dailySpending[dateKey] || 0) + txTotal
  }

  // Recent transactions
  const recentTransactions = await prisma.transaction.findMany({
    include: {
      lineItems: {
        include: { category: true },
      },
    },
    orderBy: { date: 'desc' },
    take: 5,
  })

  return NextResponse.json({
    totalSpending: totalSpending._sum.amount || 0,
    categoryBreakdown,
    transactionCount,
    dailySpending: Object.entries(dailySpending).map(([date, amount]) => ({
      date,
      amount,
    })),
    recentTransactions,
  })
}
