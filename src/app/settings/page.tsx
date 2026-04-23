import { prisma } from '@/lib/db'
import { CategoryManager } from '@/components/CategoryManager'
import { MerchantColorManager } from '@/components/MerchantColorManager'

export default async function SettingsPage() {
  const [rawCategories, merchantColors] = await Promise.all([
    prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { lineItems: true },
        },
      },
    }),
    prisma.merchantColor.findMany({
      orderBy: { name: 'asc' },
    }),
  ])

  const categories = rawCategories.map((c) => ({
    id: c.id,
    name: c.name,
    color: c.color,
    usageCount: c._count.lineItems,
  }))

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
      <MerchantColorManager initialMerchants={merchantColors} />
      <CategoryManager initialCategories={categories} />
    </div>
  )
}
