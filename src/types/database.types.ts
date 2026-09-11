export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      hospitais: {
        Row: {
          id: string
          nome: string
          codigo: string
          cidade: string
          ativo: boolean
          criado_em: string
          atualizado_em: string
        }
        Insert: {
          id?: string
          nome: string
          codigo: string
          cidade?: string
          ativo?: boolean
          criado_em?: string
          atualizado_em?: string
        }
        Update: {
          id?: string
          nome?: string
          codigo?: string
          cidade?: string
          ativo?: boolean
          criado_em?: string
          atualizado_em?: string
        }
      }
      perfis: {
        Row: {
          id: string
          nome: string
          email: string
          hospital_id: string | null
          role: 'tecnico' | 'admin'
          hospital_selecionado_em: string | null
          ultimo_acesso: string | null
          criado_em: string
          atualizado_em: string
        }
        Insert: {
          id: string
          nome?: string
          email?: string
          hospital_id?: string | null
          role?: 'tecnico' | 'admin'
          hospital_selecionado_em?: string | null
          ultimo_acesso?: string | null
          criado_em?: string
          atualizado_em?: string
        }
        Update: {
          id?: string
          nome?: string
          email?: string
          hospital_id?: string | null
          role?: 'tecnico' | 'admin'
          hospital_selecionado_em?: string | null
          ultimo_acesso?: string | null
          criado_em?: string
          atualizado_em?: string
        }
      }
      tipos_equipamento: {
        Row: {
          id: string
          nome: string
          criado_por: string | null
          criado_em: string
        }
        Insert: {
          id?: string
          nome: string
          criado_por?: string | null
          criado_em?: string
        }
        Update: {
          id?: string
          nome?: string
          criado_por?: string | null
          criado_em?: string
        }
      }
      equipamentos: {
        Row: {
          id: string
          nome: string
          tipo_id: string
          numero_serie: string | null
          patrimonio: string
          status: 'pendente' | 'validado'
          hospital_id: string
          criado_por: string | null
          validado_por: string | null
          validado_em: string | null
          criado_em: string
          atualizado_em: string
        }
        Insert: {
          id?: string
          nome: string
          tipo_id: string
          numero_serie?: string | null
          patrimonio: string
          status?: 'pendente' | 'validado'
          hospital_id: string
          criado_por?: string | null
          validado_por?: string | null
          validado_em?: string | null
          criado_em?: string
          atualizado_em?: string
        }
        Update: {
          id?: string
          nome?: string
          tipo_id?: string
          numero_serie?: string | null
          patrimonio?: string
          status?: 'pendente' | 'validado'
          hospital_id?: string
          criado_por?: string | null
          validado_por?: string | null
          validado_em?: string | null
          criado_em?: string
          atualizado_em?: string
        }
      }
      logs_auditoria: {
        Row: {
          id: string
          usuario_id: string | null
          acao: 'criou' | 'editou' | 'excluiu' | 'validou' | 'exportou'
          equipamento_id: string | null
          hospital_id: string | null
          dados_antes: Json | null
          dados_depois: Json | null
          ip_address: string | null
          criado_em: string
        }
        Insert: {
          id?: string
          usuario_id?: string | null
          acao: 'criou' | 'editou' | 'excluiu' | 'validou' | 'exportou'
          equipamento_id?: string | null
          hospital_id?: string | null
          dados_antes?: Json | null
          dados_depois?: Json | null
          ip_address?: string | null
          criado_em?: string
        }
        Update: {
          id?: string
          usuario_id?: string | null
          acao?: 'criou' | 'editou' | 'excluiu' | 'validou' | 'exportou'
          equipamento_id?: string | null
          hospital_id?: string | null
          dados_antes?: Json | null
          dados_depois?: Json | null
          ip_address?: string | null
          criado_em?: string
        }
      }
      configuracoes: {
        Row: {
          id: string
          chave: string
          valor: string | null
          descricao: string | null
          sensivel: boolean
          atualizado_por: string | null
          atualizado_em: string
        }
        Insert: {
          id?: string
          chave: string
          valor?: string | null
          descricao?: string | null
          sensivel?: boolean
          atualizado_por?: string | null
          atualizado_em?: string
        }
        Update: {
          id?: string
          chave?: string
          valor?: string | null
          descricao?: string | null
          sensivel?: boolean
          atualizado_por?: string | null
          atualizado_em?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: {
      get_my_hospital_id: {
        Args: Record<string, never>
        Returns: string | null
      }
      is_admin: {
        Args: Record<string, never>
        Returns: boolean
      }
    }
    Enums: {
      role_enum: 'tecnico' | 'admin'
      status_enum: 'pendente' | 'validado'
      acao_audit_enum: 'criou' | 'editou' | 'excluiu' | 'validou' | 'exportou'
    }
  }
}

// Tipos derivados úteis
export type Hospital = Database['public']['Tables']['hospitais']['Row']
export type Perfil = Database['public']['Tables']['perfis']['Row']
export type TipoEquipamento = Database['public']['Tables']['tipos_equipamento']['Row']
export type Equipamento = Database['public']['Tables']['equipamentos']['Row']
export type LogAuditoria = Database['public']['Tables']['logs_auditoria']['Row']
export type Configuracao = Database['public']['Tables']['configuracoes']['Row']

export type EquipamentoInsert = Database['public']['Tables']['equipamentos']['Insert']
export type EquipamentoUpdate = Database['public']['Tables']['equipamentos']['Update']
export type HospitalInsert = Database['public']['Tables']['hospitais']['Insert']
export type HospitalUpdate = Database['public']['Tables']['hospitais']['Update']

export type Role = 'tecnico' | 'admin'
export type StatusEquipamento = 'pendente' | 'validado'
export type AcaoAudit = 'criou' | 'editou' | 'excluiu' | 'validou' | 'exportou'

// Tipo enriquecido para exibição
export type EquipamentoComRelacoes = Equipamento & {
  tipos_equipamento: TipoEquipamento | null
  hospitais: Hospital | null
  criador: Perfil | null
  validador: Perfil | null
}

export type LogComRelacoes = LogAuditoria & {
  perfis: Pick<Perfil, 'nome' | 'email'> | null
  hospitais: Pick<Hospital, 'nome' | 'codigo'> | null
  equipamentos: { nome: string; patrimonio: string } | null
}
