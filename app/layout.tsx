import type { Metadata, Viewport } from 'next'
import './globals.css'
import ServiceWorkerRegistrar from '@/components/ServiceWorkerRegistrar'

export const metadata: Metadata = {
  title: 'Office Hours',
  description: 'Your personal news digest',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Office Hours',
  },
}

export const viewport: Viewport = {
  themeColor: '#faf9f7',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      </head>
      <body className="h-full">
        <ServiceWorkerRegistrar />
        {children}
      </body>
    </html>
  )
}
