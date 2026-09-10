import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { MobileNav } from './MobileNav'
import { useAppStore } from '@/store/useAppStore'
import { Building2, Wifi, WifiOff } from 'lucide-react'
import { useState, useEffect } from 'react'

export function AppLayout() {
  const { profile, currentHospital } = useAppStore()
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline  = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online',  handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online',  handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return (
    <div className="min-h-screen bg-background bg-grid">
      <Sidebar />

      {/* Main content */}
      <div className="lg:pl-60 flex flex-col min-h-screen">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-surface border-b border-border sticky top-0 z-20 safe-pt">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
              <span className="text-primary text-xs font-bold">IT</span>
            </div>
            <span className="text-sm font-semibold text-text">Inventário TI</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Indicador offline */}
            {!isOnline && (
              <div className="flex items-center gap-1 text-status-pendente bg-status-pendenteBg px-2 py-1 rounded-full">
                <WifiOff className="w-3 h-3" />
                <span className="text-2xs font-medium">Offline</span>
              </div>
            )}

            {/* Hospital atual */}
            {(currentHospital || profile?.hospital_id) && (
              <div className="flex items-center gap-1 text-text-muted">
                <Building2 className="w-3.5 h-3.5" />
                <span className="text-xs truncate max-w-[120px]">
                  {currentHospital?.nome ?? '...'}
                </span>
              </div>
            )}
          </div>
        </header>

        {/* Offline banner */}
        {!isOnline && (
          <div className="bg-status-pendente/10 border-b border-status-pendente/30 px-4 py-2">
            <p className="text-xs text-status-pendente text-center flex items-center justify-center gap-2">
              <WifiOff className="w-3 h-3" />
              Sem conexão. Algumas funções podem não estar disponíveis.
            </p>
          </div>
        )}

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 pb-24 lg:pb-6 animate-fade-in">
          <Outlet />
        </main>
      </div>

      <MobileNav />
    </div>
  )
}
