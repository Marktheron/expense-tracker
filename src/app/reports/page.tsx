import { prisma } from '@/lib/db'
import { Reports } from '@/components/Reports'

export default async function ReportsPage() {
  const rawCategories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
  })

  const categories = rawCategories.map((c) => ({
    id: c.id,
    name: c.name,
    color: c.color,
  }))

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Reports</h1>
      <Reports categories={categories} />
    </div>
  )
}
