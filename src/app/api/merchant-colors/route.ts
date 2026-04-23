import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  const merchantColors = await prisma.merchantColor.findMany({
    orderBy: { name: 'asc' },
  })
  return NextResponse.json(merchantColors)
}

export async function POST(request: Request) {
  const body = await request.json()

  const merchantColor = await prisma.merchantColor.create({
    data: {
      name: body.name,
      color: body.color,
    },
  })

  return NextResponse.json(merchantColor)
}
