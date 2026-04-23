import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  // Get unique product descriptions that have been marked as vitality-qualifying
  const vitalityItems = await prisma.lineItem.findMany({
    where: {
      vitalityQualifying: true,
    },
    select: {
      description: true,
    },
    distinct: ['description'],
  })

  // Return lowercase normalized names for easier matching
  const products = [...new Set(
    vitalityItems.map((item) => item.description.toLowerCase().trim())
  )]

  return NextResponse.json(products)
}
