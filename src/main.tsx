import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import { AppRouter } from '@/routes'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppRouter />
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: '#111827',
          color: '#f1f5f9',
          border: '1px solid #1e3a5f',
          borderRadius: '12px',
          fontSize: '14px',
          padding: '12px 16px',
        },
        success: {
          iconTheme: { primary: '#10b981', secondary: '#111827' },
        },
        error: {
          iconTheme: { primary: '#ef4444', secondary: '#111827' },
        },
      }}
    />
  </StrictMode>
)
