import { prisma } from '@/lib/db'
import { Dashboard } from '@/components/Dashboard'

async function getStats() {
  const now = new Date()
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  // Last month
  const firstOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)

  const dateFilter = {
    gte: firstOfMonth,
    lte: lastOfMonth,
  }

  const lastMonthFilter = {
    gte: firstOfLastMonth,
    lte: lastOfLastMonth,
  }

  const totalSpending = await prisma.lineItem.aggregate({
    where: {
      transaction: {
        date: dateFilter,
      },
    },
    _sum: { amount: true },
  })

  const spendingByCategory = await prisma.lineItem.groupBy({
    by: ['categoryId'],
    where: {
      transaction: {
        date: dateFilter,
      },
    },
    _sum: { amount: true },
  })

  const categories = await prisma.category.findMany()
  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]))

  const categoryBreakdown = spendingByCategory
    .map((item) => ({
      category: categoryMap[item.categoryId],
      total: item._sum.amount || 0,
    }))
    .sort((a, b) => b.total - a.total)

  const transactionCount = await prisma.transaction.count({
    where: { date: dateFilter },
  })

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

  const recentTransactions = await prisma.transaction.findMany({
    include: {
      lineItems: {
        include: { category: true },
      },
    },
    orderBy: { date: 'desc' },
    take: 5,
  })

  // Top products this month
  const allLineItems = await prisma.lineItem.findMany({
    where: {
      transaction: {
        date: dateFilter,
      },
    },
    include: { category: true },
  })

  const productTotals: Record<string, { description: string; count: number; total: number; category: { id: string; name: string; color: string } }> = {}
  for (const item of allLineItems) {
    const key = item.description.toLowerCase().trim()
    if (!productTotals[key]) {
      productTotals[key] = {
        description: item.description,
        count: 0,
        total: 0,
        category: { id: item.category.id, name: item.category.name, color: item.category.color },
      }
    }
    productTotals[key].count++
    productTotals[key].total += item.amount
  }

  const topProducts = Object.values(productTotals)
    .sort((a, b) => b.total - a.total)
    .slice(0, 10)

  // Last month totals for comparison
  const lastMonthTotal = await prisma.lineItem.aggregate({
    where: {
      transaction: {
        date: lastMonthFilter,
      },
    },
    _sum: { amount: true },
  })

  const lastMonthByCategory = await prisma.lineItem.groupBy({
    by: ['categoryId'],
    where: {
      transaction: {
        date: lastMonthFilter,
      },
    },
    _sum: { amount: true },
  })

  const lastMonthCategoryMap = Object.fromEntries(
    lastMonthByCategory.map((item) => [item.categoryId, item._sum.amount || 0])
  )

  const monthComparison = {
    thisMonth: totalSpending._sum.amount || 0,
    lastMonth: lastMonthTotal._sum.amount || 0,
    lastMonthName: firstOfLastMonth.toLocaleString('default', { month: 'long' }),
    categoryChanges: categoryBreakdown.map((item) => ({
      category: {
        id: item.category.id,
        name: item.category.name,
        color: item.category.color,
      },
      thisMonth: item.total,
      lastMonth: lastMonthCategoryMap[item.category.id] || 0,
    })).filter((item) => item.thisMonth !== item.lastMonth || item.lastMonth > 0),
  }

  return {
    totalSpending: totalSpending._sum.amount || 0,
    categoryBreakdown: categoryBreakdown.map((item) => ({
      category: {
        id: item.category.id,
        name: item.category.name,
        color: item.category.color,
      },
      total: item.total,
    })),
    transactionCount,
    dailySpending: Object.entries(dailySpending).map(([date, amount]) => ({
      date,
      amount,
    })),
    recentTransactions: recentTransactions.map((tx) => ({
      id: tx.id,
      date: tx.date.toISOString(),
      merchant: tx.merchant,
      notes: tx.notes,
      lineItems: tx.lineItems.map((li) => ({
        id: li.id,
        description: li.description,
        amount: li.amount,
        category: {
          id: li.category.id,
          name: li.category.name,
          color: li.category.color,
        },
      })),
    })),
    currentMonth: now.toLocaleString('default', { month: 'long', year: 'numeric' }),
    topProducts,
    monthComparison,
  }
}

export default async function Home() {
  const stats = await getStats()
  return <Dashboard stats={stats} />
}
