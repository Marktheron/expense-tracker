import { prisma } from '@/lib/db'
import { TransactionList } from '@/components/TransactionList'

interface Props {
  searchParams: Promise<{ merchant?: string; category?: string; date?: string; search?: string }>
}

export default async function TransactionsPage({ searchParams }: Props) {
  const { merchant: merchantFilter, category: categoryFilter, date: dateFilter, search: searchFilter } = await searchParams
  const [rawTransactions, rawCategories, merchantColors] = await Promise.all([
    prisma.transaction.findMany({
      include: {
        lineItems: {
          include: { category: true },
        },
      },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    }),
    prisma.category.findMany({
      orderBy: { name: 'asc' },
    }),
    prisma.merchantColor.findMany(),
  ])

  const transactions = rawTransactions.map((tx) => ({
    id: tx.id,
    date: tx.date.toISOString(),
    createdAt: tx.createdAt.toISOString(),
    merchant: tx.merchant,
    notes: tx.notes,
    flagged: tx.flagged,
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
  }))

  const categories = rawCategories.map((c) => ({
    id: c.id,
    name: c.name,
    color: c.color,
  }))

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Transactions</h1>
      <TransactionList
        initialTransactions={transactions}
        categories={categories}
        merchantColors={merchantColors}
        initialMerchant={merchantFilter}
        initialCategory={categoryFilter}
        initialDate={dateFilter}
        initialSearch={searchFilter}
      />
    </div>
  )
}
