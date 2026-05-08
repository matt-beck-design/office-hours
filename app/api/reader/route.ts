import { parseHTML } from 'linkedom'
import { Readability } from '@mozilla/readability'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')
  if (!url) return Response.json({ error: 'Missing url' }, { status: 400 })

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return Response.json({ error: `Fetch failed: ${res.status}` }, { status: 502 })

    const html = await res.text()
    const { document } = parseHTML(html)
    // Readability mutates the document — pass the URL so relative links resolve
    ;(document as unknown as Document).baseURI
    const article = new Readability(document as unknown as Document, { url }).parse()

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
