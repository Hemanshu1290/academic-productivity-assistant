import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Sora, Manrope } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const sora = Sora({ subsets: ['latin'], variable: '--font-sans' })
const manrope = Manrope({ subsets: ['latin'], variable: '--font-mono' })

export const metadata: Metadata = {
  title: 'StartNow AI — Stop planning. Start now.',
  description:
    'An AI task manager that turns "I will do it later" into done. Speak, type, or snap a photo of any task and StartNow breaks it down, finds the real deadline, and tells you exactly what to do right now.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#0a0a0a',
  userScalable: true,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`dark bg-background ${sora.variable} ${manrope.variable}`}>
      <body className="font-sans antialiased">
        {children}
        <Toaster />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
