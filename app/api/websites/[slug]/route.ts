import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params

    const result = await query(`
      SELECT * FROM websites 
      WHERE slug = $1 AND status = 'published'
    `, [slug])

    if (result.length === 0) {
      return new NextResponse('Website not found', { status: 404 })
    }

    const website = result[0]

    // Return full HTML page
    const fullHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${website.name}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; }
    ${website.css}
  </style>
</head>
<body>
  ${website.html}
  <script>
    ${website.js}
  </script>
</body>
</html>`

    return new NextResponse(fullHtml, {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'public, max-age=3600'
      }
    })
  } catch (error) {
    console.error('Failed to fetch website:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
