import type { Metadata } from 'next'
import { Playfair_Display, DM_Sans } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AuthSessionProvider } from '@/components/session-provider'
import './globals.css'

const _playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

const _dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'UTHH - Sistema Web para Cuerpos Académicos',
  description: 'Sistema de Información para el Control de los Cuerpos Académicos de la Universidad Tecnológica de la Huasteca Hidalguense',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body
        className={`${_playfair.variable} ${_dmSans.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <AuthSessionProvider>
          {children}
        </AuthSessionProvider>
        <Analytics />
      </body>
    </html>
  )
}
