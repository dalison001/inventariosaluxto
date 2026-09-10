import { NavLink, useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store/useAppStore'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import {
  QrCode, List, Clock, FileText, Activity,
  Building2, Users, Settings, LogOut, ChevronRight,
  Shield, Server
} from 'lucide-react'

interface NavItem {
  to: string
  icon: React.ElementType
  label: string
  adminOnly?: boolean
}

const navItems: NavItem[] = [
  { to: '/scanner',           icon: QrCode,     label: 'Escanear' },
  { to: '/inventario',        icon: List,        label: 'Inventário' },
  { to: '/admin/pendentes',   icon: Clock,       label: 'Pendentes',  adminOnly: true },
  { to: '/admin/auditoria',   icon: FileText,    label: 'Auditoria',  adminOnly: true },
  { to: '/admin/atividade',   icon: Activity,    label: 'Atividade',  adminOnly: true },
  { to: '/admin/hospitais',   icon: Building2,   label: 'Hospitais',  adminOnly: true },
  { to: '/admin/usuarios',    icon: Users,       label: 'Usuários',   adminOnly: true },
  { to: '/admin/configuracoes', icon: Settings,  label: 'Configurações', adminOnly: true },
]

export function Sidebar() {
  const { profile } = useAppStore()
  const { signOut } = useAuth()
  const isAdmin = profile?.role === 'admin'

  const visibleItems = navItems.filter(item => !item.adminOnly || isAdmin)
  const techItems  = visibleItems.filter(item => !item.adminOnly)
  const adminItems = visibleItems.filter(item => item.adminOnly)

  return (
    <aside className="hidden lg:flex flex-col w-60 min-h-screen bg-surface border-r border-border fixed left-0 top-0 bottom-0 z-30">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
            <Server className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-text leading-none">Inventário TI</p>
            <p className="text-2xs text-text-subtle mt-0.5">Saluxx</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {techItems.map(item => (
          <SidebarLink key={item.to} {...item} />
        ))}

        {isAdmin && adminItems.length > 0 && (
          <>
            <div className="pt-4 pb-1 px-3">
              <div className="flex items-center gap-1.5">
                <Shield className="w-3 h-3 text-text-subtle" />
                <span className="text-2xs font-semibold text-text-subtle uppercase tracking-wider">
                  Administração
                </span>
              </div>
            </div>
            {adminItems.map(item => (
              <SidebarLink key={item.to} {...item} />
            ))}
          </>
        )}
      </nav>

      {/* User info + logout */}
      <div className="px-3 py-4 border-t border-border">
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-semibold text-primary">
              {profile?.nome?.charAt(0)?.toUpperCase() ?? '?'}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-text truncate">{profile?.nome ?? '—'}</p>
            <p className="text-2xs text-text-subtle truncate">{profile?.email ?? '—'}</p>
          </div>
        </div>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm
                     text-text-muted hover:text-status-danger hover:bg-status-dangerBg
                     transition-colors duration-200"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </button>
      </div>
    </aside>
  )
}

function SidebarLink({ to, icon: Icon, label }: NavItem) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(isActive ? 'sidebar-item-active' : 'sidebar-item')
      }
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span className="flex-1">{label}</span>
      <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
    </NavLink>
  )
}
