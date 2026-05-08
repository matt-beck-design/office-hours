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
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'max-age=0',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
      },
      signal: AbortSignal.timeout(10000),
    })

    if (res.status === 403 || res.status === 401) {
      return Response.json({ error: 'blocked', status: res.status }, { status: 200 })
    }
    if (!res.ok) {
      return Response.json({ error: `fetch_failed`, status: res.status }, { status: 200 })
    }

    const html = await res.text()
    const { document } = parseHTML(html)
    const article = new Readability(document as unknown as Document).parse()

    if (!article) return Response.json({ error: 'parse_failed' }, { status: 200 })

    return Response.json({
      title: article.title,
      byline: article.byline,
      siteName: article.siteName,
      content: article.content,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return Response.json({ error: msg }, { status: 200 })
  }
}
