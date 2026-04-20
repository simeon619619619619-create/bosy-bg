import { NextResponse } from 'next/server'
import { getSpeedyClient } from '@/lib/speedy/client'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const parcelId = searchParams.get('parcelId')

    if (!parcelId) {
      return NextResponse.json({ error: 'parcelId is required' }, { status: 400 })
    }

    const speedy = getSpeedyClient()
    const pdfBuffer = await speedy.printLabel(parcelId)

    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="label-${parcelId}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Label error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    )
  }
}
