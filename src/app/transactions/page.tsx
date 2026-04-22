import { prisma } from '@/lib/db'
import { TransactionList } from '@/components/TransactionList'

export default async function TransactionsPage() {
  const [rawTransactions, rawCategories] = await Promise.all([
    prisma.transaction.findMany({
      include: {
        lineItems: {
          include: { category: true },
        },
      },
      orderBy: { date: 'desc' },
      take: 50,
    }),
    prisma.category.findMany({
      orderBy: { name: 'asc' },
    }),
  ])

  const transactions = rawTransactions.map((tx) => ({
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
      />
    </div>
  )
}
