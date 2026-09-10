import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Perfil, Hospital } from '@/types/database.types'

interface AppState {
  // Auth
  user: { id: string; email: string } | null
  profile: Perfil | null
  isLoadingAuth: boolean

  // Hospital context (admin pode alternar)
  currentHospitalId: string | null
  currentHospital: Hospital | null

  // Setters
  setUser: (user: { id: string; email: string } | null) => void
  setProfile: (profile: Perfil | null) => void
  setLoadingAuth: (loading: boolean) => void
  setCurrentHospital: (hospital: Hospital | null) => void

  // Helpers
  isAdmin: () => boolean
  hasHospital: () => boolean
  hasSelectedHospital: () => boolean
  clear: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      isLoadingAuth: true,
      currentHospitalId: null,
      currentHospital: null,

      setUser: (user) => set({ user }),

      setProfile: (profile) => {
        set({
          profile,
          // Admin: mantém o currentHospitalId que pode ser qualquer hospital
          // Técnico: força o próprio hospital
          currentHospitalId: profile?.role === 'admin'
            ? (get().currentHospitalId ?? profile?.hospital_id)
            : profile?.hospital_id ?? null,
        })
      },

      setLoadingAuth: (isLoadingAuth) => set({ isLoadingAuth }),

      setCurrentHospital: (hospital) =>
        set({ currentHospital: hospital, currentHospitalId: hospital?.id ?? null }),

      isAdmin: () => get().profile?.role === 'admin',

      hasHospital: () => !!get().profile?.hospital_id,

      // Retorna true se o usuário já selecionou um hospital (campo preenchido)
      hasSelectedHospital: () => !!get().profile?.hospital_selecionado_em,

      clear: () =>
        set({
          user: null,
          profile: null,
          isLoadingAuth: false,
          currentHospitalId: null,
          currentHospital: null,
        }),
    }),
    {
      name: 'inventario-saluxx',
      storage: createJSONStorage(() => localStorage),
      // Não persistir dados sensíveis
      partialize: (state) => ({
        currentHospitalId: state.currentHospitalId,
      }),
    }
  )
)
