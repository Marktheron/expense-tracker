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
      <TransactionForm categories={categories} />
    </div>
  )
}
