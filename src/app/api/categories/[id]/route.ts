import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // Check if category has line items
  const lineItemCount = await prisma.lineItem.count({
    where: { categoryId: id },
  })

  if (lineItemCount > 0) {
    return NextResponse.json(
      { error: 'Cannot delete category with existing items' },
      { status: 400 }
    )
  }

  await prisma.category.delete({
    where: { id },
  })

  return NextResponse.json({ success: true })
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()

  const category = await prisma.category.update({
    where: { id },
    data: {
      name: body.name,
      color: body.color,
    },
  })

  return NextResponse.json(category)
}
