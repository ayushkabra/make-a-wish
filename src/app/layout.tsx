import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'makeawish — birthday wishes from strangers',
  description: 'Add your birthday and let strangers wish you well. Wish someone today — it takes 10 seconds and can make their whole day.',
  keywords: 'birthday, wishes, strangers, social, makeawish',
  openGraph: {
    title: 'makeawish',
    description: 'Birthday wishes from strangers. A wish takes 10 seconds. It can make someone\'s whole day.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  )
}
