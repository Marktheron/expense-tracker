import { prisma } from '@/lib/db'
import { TransactionForm } from '@/components/TransactionForm'

export default async function NewTransactionPage() {
  const rawCategories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
  })

  const categories = rawCategories.map((c) => ({
    id: c.id,
    name: c.name,
    color: c.color,
  }))

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Add Expense</h1>
      <TransactionForm categories={categories} />
    </div>
  )
}
