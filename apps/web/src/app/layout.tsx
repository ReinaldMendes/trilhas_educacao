import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/lib/auth'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: 'Trilhas da Infância',
  description: 'Plataforma de gestão pedagógica para Educação Infantil',
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#fff',
                color: '#3A3A3A',
                borderRadius: '12px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                fontFamily: 'Nunito, sans-serif',
                fontWeight: '600',
                fontSize: '14px',
              },
              success: { iconTheme: { primary: '#A8C5B5', secondary: '#fff' } },
              error:   { iconTheme: { primary: '#F7BFAE', secondary: '#fff' } },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  )
}
