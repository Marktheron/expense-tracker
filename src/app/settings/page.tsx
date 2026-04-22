import { prisma } from '@/lib/db'
import { CategoryManager } from '@/components/CategoryManager'

export default async function SettingsPage() {
  const rawCategories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: { lineItems: true },
      },
    },
  })

  const categories = rawCategories.map((c) => ({
    id: c.id,
    name: c.name,
    color: c.color,
    usageCount: c._count.lineItems,
  }))

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Settings</h1>
      <CategoryManager initialCategories={categories} />
    </div>
  )
}
