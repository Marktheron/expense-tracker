import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()

  const merchantColor = await prisma.merchantColor.update({
    where: { id },
    data: {
      name: body.name,
      color: body.color,
    },
  })

  return NextResponse.json(merchantColor)
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  await prisma.merchantColor.delete({
    where: { id },
  })

  return NextResponse.json({ success: true })
}
