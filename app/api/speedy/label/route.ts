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
    const result = await speedy.printLabel(parcelId)

    console.log('Speedy print response keys:', JSON.stringify(Object.keys(result)))

    const parcelData = result.parcels?.[0]

    if (!parcelData) {
      console.log('Speedy print full response:', JSON.stringify(result).slice(0, 500))
      return NextResponse.json({ error: 'No label data from Speedy', debug: result }, { status: 404 })
    }

    // If Speedy returns a PDF URL, redirect to it
    if (parcelData.pdfURL) {
      return NextResponse.redirect(parcelData.pdfURL)
    }

    // If base64 PDF is returned, serve it directly
    if (parcelData.pdf) {
      const buffer = Buffer.from(parcelData.pdf, 'base64')
      return new Response(buffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename="label-${parcelId}.pdf"`,
        },
      })
    }

    console.log('Speedy parcel data:', JSON.stringify(parcelData).slice(0, 500))
    return NextResponse.json({ error: 'No PDF in response', parcelKeys: Object.keys(parcelData) }, { status: 404 })
  } catch (error) {
    console.error('Label error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    )
  }
}
