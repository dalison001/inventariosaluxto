import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useAppStore } from '@/store/useAppStore'
import { AppLayout } from '@/components/layout/AppLayout'
import { Loader2 } from 'lucide-react'
import { lazy, Suspense } from 'react'

// Lazy loading para performance
const Login           = lazy(() => import('@/pages/Login'))
const Register        = lazy(() => import('@/pages/Register'))
const SelectHospital  = lazy(() => import('@/pages/SelectHospital'))
const Scanner         = lazy(() => import('@/pages/Scanner'))
const Cadastro        = lazy(() => import('@/pages/Cadastro'))
const Inventario      = lazy(() => import('@/pages/Inventario'))
const AdminHub        = lazy(() => import('@/pages/admin/Admin'))
const Pendentes       = lazy(() => import('@/pages/admin/Pendentes'))
const Auditoria       = lazy(() => import('@/pages/admin/Auditoria'))
const Atividade       = lazy(() => import('@/pages/admin/Atividade'))
const Hospitais       = lazy(() => import('@/pages/admin/Hospitais'))
const Usuarios        = lazy(() => import('@/pages/admin/Usuarios'))
const Configuracoes   = lazy(() => import('@/pages/admin/Configuracoes'))

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Loader2 className="w-6 h-6 text-primary animate-spin" />
    </div>
  )
}

/** Guard: deve estar autenticado */
function AuthBootstrap() {
  useAuth()
  return null
}


  if (isLoadingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
          <p className="text-sm text-text-muted">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  return <Outlet />
}

/** Guard: deve ter hospital selecionado */
function RequireHospital() {
  const { profile, isLoadingAuth } = useAppStore()
  const isAdmin = profile?.role === 'admin'

  if (isLoadingAuth) return <LoadingFallback />

  // Admin sem hospital pode acessar tudo
  if (isAdmin) return <Outlet />

  // Técnico sem hospital → selecionar
  if (!profile?.hospital_id) return <Navigate to="/selecionar-hospital" replace />

  return <Outlet />
}

/** Guard: somente admin */
function RequireAdmin() {
  const { profile } = useAppStore()
  if (profile?.role !== 'admin') return <Navigate to="/inventario" replace />
  return <Outlet />
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Rotas públicas */}
          <Route path="/login"    element={<Login />} />
          <Route path="/registro" element={<Register />} />

          {/* Rotas autenticadas */}
          <Route element={<RequireAuth />}>
            <Route path="/selecionar-hospital" element={<SelectHospital />} />

            {/* Rotas com hospital */}
            <Route element={<RequireHospital />}>
              <Route element={<AppLayout />}>
                <Route path="/scanner"    element={<Scanner />} />
                <Route path="/cadastro"   element={<Cadastro />} />
                <Route path="/inventario" element={<Inventario />} />

                {/* Rotas admin */}
                <Route element={<RequireAdmin />}>
                  <Route path="/admin"               element={<AdminHub />} />
                  <Route path="/admin/pendentes"     element={<Pendentes />} />
                  <Route path="/admin/auditoria"     element={<Auditoria />} />
                  <Route path="/admin/atividade"     element={<Atividade />} />
                  <Route path="/admin/hospitais"     element={<Hospitais />} />
                  <Route path="/admin/usuarios"      element={<Usuarios />} />
                  <Route path="/admin/configuracoes" element={<Configuracoes />} />
                </Route>
              </Route>
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/inventario" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
