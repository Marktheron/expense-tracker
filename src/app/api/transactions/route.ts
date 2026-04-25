import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || '50')
  const offset = parseInt(searchParams.get('offset') || '0')
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')
  const categoryId = searchParams.get('categoryId')
  const search = searchParams.get('search')

  const where: Record<string, unknown> = {}

  if (startDate || endDate) {
    where.date = {}
    if (startDate) (where.date as Record<string, Date>).gte = new Date(startDate)
    if (endDate) (where.date as Record<string, Date>).lte = new Date(endDate)
  }

  if (categoryId) {
    where.lineItems = {
      some: { categoryId },
    }
  }

  if (search) {
    where.OR = [
      { merchant: { contains: search } },
      { notes: { contains: search } },
      { lineItems: { some: { description: { contains: search } } } },
    ]
  }

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: {
        lineItems: {
          include: { category: true },
        },
      },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      take: limit,
      skip: offset,
    }),
    prisma.transaction.count({ where }),
  ])

  return NextResponse.json({ transactions, total })
}

export async function POST(request: Request) {
  const body = await request.json()

  const transaction = await prisma.transaction.create({
    data: {
      date: new Date(body.date),
      merchant: body.merchant,
      notes: body.notes || null,
      lineItems: {
        create: body.lineItems.map((item: { description: string; amount: number; categoryId: string; vitalityQualifying?: boolean }) => ({
          description: item.description,
          amount: item.amount,
          categoryId: item.categoryId,
          vitalityQualifying: item.vitalityQualifying || false,
        })),
      },
    },
    include: {
      lineItems: {
        include: { category: true },
      },
    },
  })

  return NextResponse.json(transaction)
}
