import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  serverExternalPackages: ['jsdom', '@mozilla/readability'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'i.ytimg.com' },
    ],
  },
}

export default nextConfig
