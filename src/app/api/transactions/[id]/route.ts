import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const transaction = await prisma.transaction.findUnique({
    where: { id },
    include: {
      lineItems: {
        include: { category: true },
      },
    },
  })

  if (!transaction) {
    return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
  }

  return NextResponse.json(transaction)
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()

  // Delete existing line items and recreate
  await prisma.lineItem.deleteMany({
    where: { transactionId: id },
  })

  const transaction = await prisma.transaction.update({
    where: { id },
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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await prisma.transaction.delete({
    where: { id },
  })

  return NextResponse.json({ success: true })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()

  const transaction = await prisma.transaction.update({
    where: { id },
    data: {
      flagged: body.flagged,
    },
  })

  return NextResponse.json(transaction)
}
