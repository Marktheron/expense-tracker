import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'

const adapter = new PrismaLibSql({
  url: 'file:dev.db',
})

const prisma = new PrismaClient({ adapter })

const categories = [
  { name: 'Groceries', color: '#22C55E' },      // green-500
  { name: 'Fuel', color: '#F97316' },           // orange-500
  { name: 'Medical', color: '#EF4444' },        // red-500
  { name: 'Household', color: '#8B5CF6' },      // violet-500
  { name: 'Toiletries', color: '#EC4899' },     // pink-500
  { name: 'Transport', color: '#3B82F6' },      // blue-500
  { name: 'Utilities', color: '#F59E0B' },      // amber-500
  { name: 'Entertainment', color: '#06B6D4' },  // cyan-500
  { name: 'Clothing', color: '#A855F7' },       // purple-500
  { name: 'Dining Out', color: '#84CC16' },     // lime-500
  { name: 'Subscriptions', color: '#6366F1' },  // indigo-500
  { name: 'Other', color: '#6B7280' },          // gray-500
]

async function main() {
  console.log('Seeding categories...')

  for (const category of categories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: { color: category.color },
      create: category,
    })
  }

  console.log('Seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
