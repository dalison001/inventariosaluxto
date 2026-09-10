import { Link } from 'react-router-dom'
import {
  Clock, FileText, Activity, Building2, Users,
  Settings, ChevronRight, Shield
} from 'lucide-react'

const adminLinks = [
  { to: '/admin/pendentes',     icon: Clock,     label: 'Pendentes',     desc: 'Equipamentos aguardando validação' },
  { to: '/admin/auditoria',     icon: FileText,  label: 'Auditoria',     desc: 'Histórico de ações do sistema' },
  { to: '/admin/atividade',     icon: Activity,  label: 'Atividade',     desc: 'Resumo de atividade dos usuários' },
  { to: '/admin/hospitais',     icon: Building2, label: 'Hospitais',     desc: 'Gerenciar rede hospitalar' },
  { to: '/admin/usuarios',      icon: Users,     label: 'Usuários',      desc: 'Vincular hospital e função' },
  { to: '/admin/configuracoes', icon: Settings,  label: 'Configurações', desc: 'Integração Microsoft Excel' },
]

export default function AdminPage() {
  return (
    <div>
      <div className="page-header">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          <h1 className="page-title">Administração</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {adminLinks.map(({ to, icon: Icon, label, desc }) => (
          <Link key={to} to={to} className="card-hover group">
            <div className="flex items-center gap-4 p-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20
                              flex items-center justify-center flex-shrink-0
                              group-hover:bg-primary/20 transition-colors">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text">{label}</p>
                <p className="text-xs text-text-muted">{desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-text-subtle group-hover:text-primary transition-colors" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
