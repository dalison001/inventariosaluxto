import { NavLink } from 'react-router-dom'
import { useAppStore } from '@/store/useAppStore'
import { cn } from '@/lib/utils'
import { QrCode, List, Clock, LayoutGrid } from 'lucide-react'

interface MobileNavItem {
  to: string
  icon: React.ElementType
  label: string
  adminOnly?: boolean
}

const mobileItems: MobileNavItem[] = [
  { to: '/inventario',      icon: List,       label: 'Inventário' },
  { to: '/scanner',         icon: QrCode,     label: 'Escanear' },
  { to: '/admin/pendentes', icon: Clock,      label: 'Pendentes', adminOnly: true },
  { to: '/admin',           icon: LayoutGrid, label: 'Admin',     adminOnly: true },
]

export function MobileNav() {
  const { profile } = useAppStore()
  const isAdmin = profile?.role === 'admin'

  const visibleItems = mobileItems.filter(item => !item.adminOnly || isAdmin)

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-border safe-pb">
      <div className="flex items-center justify-around px-2 pt-2 pb-1">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-colors min-w-[56px]',
                isActive
                  ? 'text-primary bg-primary/10'
                  : 'text-text-muted hover:text-text'
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn('w-5 h-5', isActive && 'text-primary')} />
                <span className="text-2xs font-medium">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
