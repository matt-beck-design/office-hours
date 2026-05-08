import { JSDOM } from 'jsdom'
import { Readability } from '@mozilla/readability'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')
  if (!url) return Response.json({ error: 'Missing url' }, { status: 400 })

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)',
        Accept: 'text/html',
      },
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return Response.json({ error: `Fetch failed: ${res.status}` }, { status: 502 })

    const html = await res.text()
    const dom = new JSDOM(html, { url })
    const article = new Readability(dom.window.document).parse()

    if (!article) return Response.json({ error: 'Could not parse article' }, { status: 422 })

    return Response.json({
      title: article.title,
      byline: article.byline,
      siteName: article.siteName,
      content: article.content,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return Response.json({ error: msg }, { status: 502 })
  }
}
