import { prisma } from '@/lib/db'
import { notFound, redirect } from 'next/navigation'

interface Props {
  params: Promise<{ id: string }>
}

export default async function TransactionPage({ params }: Props) {
  const { id } = await params

  const transaction = await prisma.transaction.findUnique({
    where: { id },
  })

  if (!transaction) {
    notFound()
  }

  // Redirect to edit page for now - could add a view-only page later
  redirect(`/transactions/${id}/edit`)
}
