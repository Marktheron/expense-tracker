import { prisma } from '@/lib/db'
import { TransactionForm } from '@/components/TransactionForm'
import { notFound } from 'next/navigation'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditTransactionPage({ params }: Props) {
  const { id } = await params

  const [transaction, rawCategories] = await Promise.all([
    prisma.transaction.findUnique({
      where: { id },
      include: {
        lineItems: {
          include: { category: true },
        },
      },
    }),
    prisma.category.findMany({
      orderBy: { name: 'asc' },
    }),
  ])

  if (!transaction) {
    notFound()
  }

  const categories = rawCategories.map((c) => ({
    id: c.id,
    name: c.name,
    color: c.color,
  }))

  const formattedTransaction = {
    id: transaction.id,
    date: transaction.date.toISOString(),
    merchant: transaction.merchant,
    notes: transaction.notes,
    lineItems: transaction.lineItems.map((li) => ({
      id: li.id,
      description: li.description,
      amount: li.amount,
      categoryId: li.categoryId,
      vitalityQualifying: li.vitalityQualifying,
    })),
  }

  return (
    <div className="max-w-3xl mx-auto">
      <TransactionForm categories={categories} transaction={formattedTransaction} />
    </div>
  )
}
