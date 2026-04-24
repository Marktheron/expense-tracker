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

  // Daily spending with category breakdown
  const dailySpendingMap: Record<string, { amount: number; categories: Record<string, { categoryId: string; categoryName: string; categoryColor: string; amount: number }> }> = {}

  // Get all line items with their transaction dates and categories
  const lineItemsWithDates = await prisma.lineItem.findMany({
    where: {
      transaction: {
        date: dateFilter,
      },
    },
    include: {
      category: true,
      transaction: { select: { date: true } },
    },
  })

  for (const item of lineItemsWithDates) {
    const dateKey = item.transaction.date.toISOString().split('T')[0]
    if (!dailySpendingMap[dateKey]) {
      dailySpendingMap[dateKey] = { amount: 0, categories: {} }
    }
    dailySpendingMap[dateKey].amount += item.amount

    const catId = item.categoryId
    if (!dailySpendingMap[dateKey].categories[catId]) {
      dailySpendingMap[dateKey].categories[catId] = {
        categoryId: catId,
        categoryName: item.category.name,
        categoryColor: item.category.color,
        amount: 0,
      }
    }
    dailySpendingMap[dateKey].categories[catId].amount += item.amount
  }

  const [recentTransactions, merchantColors] = await Promise.all([
    prisma.transaction.findMany({
      include: {
        lineItems: {
          include: { category: true },
        },
      },
      orderBy: { date: 'desc' },
      take: 7,
    }),
    prisma.merchantColor.findMany(),
  ])

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
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  // Top merchants by spending this month
  const merchantTotals: Record<string, number> = {}
  for (const tx of transactions) {
    const txTotal = tx.lineItems.reduce((sum, item) => sum + item.amount, 0)
    merchantTotals[tx.merchant] = (merchantTotals[tx.merchant] || 0) + txTotal
  }
  const topMerchants = Object.entries(merchantTotals)
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10)

  // Line items count this month
  const lineItemsCount = allLineItems.length

  // Vitality cashback (25% of qualifying items at Checkers and Dischem)
  const [checkersItems, dischemItems] = await Promise.all([
    prisma.lineItem.findMany({
      where: {
        vitalityQualifying: true,
        transaction: {
          date: dateFilter,
          merchant: { contains: 'Checkers' },
        },
      },
    }),
    prisma.lineItem.findMany({
      where: {
        vitalityQualifying: true,
        transaction: {
          date: dateFilter,
          merchant: { contains: 'Dischem' },
        },
      },
    }),
  ])
  const checkersTotal = checkersItems.reduce((sum, item) => sum + item.amount, 0)
  const dischemTotal = dischemItems.reduce((sum, item) => sum + item.amount, 0)
  const checkersCashback = checkersTotal * 0.25
  const dischemCashback = dischemTotal * 0.25

  // Last month totals for comparison
  const lastMonthTotal = await prisma.lineItem.aggregate({
    where: {
      transaction: {
        date: lastMonthFilter,
      },
    },
    _sum: { amount: true },
  })

  // Spending pace: last month up to same day
  const dayOfMonth = now.getDate()
  const lastMonthSameDay = new Date(now.getFullYear(), now.getMonth() - 1, dayOfMonth, 23, 59, 59)
  const lastMonthPaceTotal = await prisma.lineItem.aggregate({
    where: {
      transaction: {
        date: {
          gte: firstOfLastMonth,
          lte: lastMonthSameDay,
        },
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
    lineItemsCount,
    spendingPace: {
      thisMonth: totalSpending._sum.amount || 0,
      lastMonthSamePoint: lastMonthPaceTotal._sum.amount || 0,
      dayOfMonth,
    },
    dailySpending: Object.entries(dailySpendingMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => {
        const catEntries = Object.values(data.categories)
        const flatCats: Record<string, number> = {}
        catEntries.forEach(cat => {
          flatCats[`cat_${cat.categoryId}`] = cat.amount
        })
        return {
          date,
          amount: data.amount,
          categories: catEntries,
          ...flatCats,
        }
      }),
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
    topMerchants,
    monthComparison,
    vitality: {
      checkers: { total: checkersTotal, cashback: checkersCashback },
      dischem: { total: dischemTotal, cashback: dischemCashback },
      totalCashback: checkersCashback + dischemCashback,
    },
    merchantColors,
  }
}

export default async function Home() {
  const stats = await getStats()
  return <Dashboard stats={stats} />
}
