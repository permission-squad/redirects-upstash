// eslint-disable-next-line @next/next/no-server-import-in-page
import { NextRequest, NextResponse } from 'next/server'
import { upstashEdge } from './upstash'
import redirectsJson from './redirects.json'

type LocalRedirects = {
  [k: string]:
    | {
        destination: string
        permanent: boolean
      }
    | undefined
}

export default async function redirects(req: NextRequest) {
  const url = req.nextUrl.clone()
  let start = Date.now()

  // Find the redirect from the local JSON file, do note this JSON shouldn't be
  // large, as the space in Edge Functions is quite limited
  const localRedirect = (redirectsJson as LocalRedirects)[url.pathname]
  if (localRedirect) {
    url.pathname = `${localRedirect.destination}?l=${Date.now() - start}`
    return NextResponse.redirect(url)
  }

  start = Date.now()

  const { result } = await upstashEdge([
    'HGET',
    'redirects',
    encodeURIComponent(encodeURIComponent(url.pathname)),
  ])

  if (result) {
    const redirect = JSON.parse(result)
    url.pathname = `${redirect.destination}?l=${Date.now() - start}`
    return NextResponse.redirect(url)
  }
}
