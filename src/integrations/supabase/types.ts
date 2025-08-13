export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      afo_arquivos: {
        Row: {
          afo_id: string | null
          caminho_arquivo: string
          created_at: string
          id: string
          nome_arquivo: string
          tamanho_arquivo: number | null
          tipo_arquivo: string | null
        }
        Insert: {
          afo_id?: string | null
          caminho_arquivo: string
          created_at?: string
          id?: string
          nome_arquivo: string
          tamanho_arquivo?: number | null
          tipo_arquivo?: string | null
        }
        Update: {
          afo_id?: string | null
          caminho_arquivo?: string
          created_at?: string
          id?: string
          nome_arquivo?: string
          tamanho_arquivo?: number | null
          tipo_arquivo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "afo_arquivos_afo_id_fkey"
            columns: ["afo_id"]
            isOneToOne: false
            referencedRelation: "afo_controle"
            referencedColumns: ["id"]
          },
        ]
      }
      afo_assinadas: {
        Row: {
          created_at: string
          data_upload: string
          id: string
          nome_arquivo: string
          tamanho_arquivo: number
          updated_at: string
          url_arquivo: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data_upload?: string
          id?: string
          nome_arquivo: string
          tamanho_arquivo: number
          updated_at?: string
          url_arquivo: string
          user_id: string
        }
        Update: {
          created_at?: string
          data_upload?: string
          id?: string
          nome_arquivo?: string
          tamanho_arquivo?: number
          updated_at?: string
          url_arquivo?: string
          user_id?: string
        }
        Relationships: []
      }
      afo_controle: {
        Row: {
          adesao_ata: string | null
          ano: number
          arp_numero: string | null
          arquivo_pdf: string | null
          created_at: string
          data_emissao: string | null
          favorecido: string
          feito_por: string | null
          id: string
          numero_afo: string
          numero_pregao: string | null
          numero_processo: string | null
          tipo_pregao: string | null
          updated_at: string
          valor_total: number | null
        }
        Insert: {
          adesao_ata?: string | null
          ano?: number
          arp_numero?: string | null
          arquivo_pdf?: string | null
          created_at?: string
          data_emissao?: string | null
          favorecido: string
          feito_por?: string | null
          id?: string
          numero_afo: string
          numero_pregao?: string | null
          numero_processo?: string | null
          tipo_pregao?: string | null
          updated_at?: string
          valor_total?: number | null
        }
        Update: {
          adesao_ata?: string | null
          ano?: number
          arp_numero?: string | null
          arquivo_pdf?: string | null
          created_at?: string
          data_emissao?: string | null
          favorecido?: string
          feito_por?: string | null
          id?: string
          numero_afo?: string
          numero_pregao?: string | null
          numero_processo?: string | null
          tipo_pregao?: string | null
          updated_at?: string
          valor_total?: number | null
        }
        Relationships: []
      }
      atas: {
        Row: {
          category: string
          created_at: string
          data_inicio: string | null
          data_validade: string | null
          favorecido: string | null
          id: string
          informacoes: string | null
          n_ata: string
          numero_termo: string | null
          objeto: string
          pregao: string
          processo_adm: string | null
          processo_emp_afo: string | null
          saldo_disponivel: number | null
          updated_at: string
          valor: number | null
          vencimento: string | null
        }
        Insert: {
          category?: string
          created_at?: string
          data_inicio?: string | null
          data_validade?: string | null
          favorecido?: string | null
          id?: string
          informacoes?: string | null
          n_ata: string
          numero_termo?: string | null
          objeto: string
          pregao: string
          processo_adm?: string | null
          processo_emp_afo?: string | null
          saldo_disponivel?: number | null
          updated_at?: string
          valor?: number | null
          vencimento?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          data_inicio?: string | null
          data_validade?: string | null
          favorecido?: string | null
          id?: string
          informacoes?: string | null
          n_ata?: string
          numero_termo?: string | null
          objeto?: string
          pregao?: string
          processo_adm?: string | null
          processo_emp_afo?: string | null
          saldo_disponivel?: number | null
          updated_at?: string
          valor?: number | null
          vencimento?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: string | null
          justification: string | null
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string
          user_agent: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          justification?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          justification?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      pedidos: {
        Row: {
          ata_category: string | null
          ata_id: string
          created_at: string
          data_solicitacao: string | null
          departamento: string
          descricao: string
          id: string
          observacoes: string | null
          status: string | null
          updated_at: string
          valor: number
        }
        Insert: {
          ata_category?: string | null
          ata_id: string
          created_at?: string
          data_solicitacao?: string | null
          departamento: string
          descricao: string
          id?: string
          observacoes?: string | null
          status?: string | null
          updated_at?: string
          valor: number
        }
        Update: {
          ata_category?: string | null
          ata_id?: string
          created_at?: string
          data_solicitacao?: string | null
          departamento?: string
          descricao?: string
          id?: string
          observacoes?: string | null
          status?: string | null
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_ata_id_fkey"
            columns: ["ata_id"]
            isOneToOne: false
            referencedRelation: "atas"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_users: {
        Row: {
          created_at: string
          email: string
          email_confirmado: boolean | null
          id: string
          nome: string
          status: string
          tentativas_solicitacao: number | null
          ultimo_envio: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          email_confirmado?: boolean | null
          id?: string
          nome: string
          status?: string
          tentativas_solicitacao?: number | null
          ultimo_envio?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          email_confirmado?: boolean | null
          id?: string
          nome?: string
          status?: string
          tentativas_solicitacao?: number | null
          ultimo_envio?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      processos_arquivos: {
        Row: {
          created_at: string
          id: string
          nome_arquivo: string
          pasta_id: string
          tamanho_arquivo: number
          updated_at: string
          url_arquivo: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome_arquivo: string
          pasta_id: string
          tamanho_arquivo: number
          updated_at?: string
          url_arquivo: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          nome_arquivo?: string
          pasta_id?: string
          tamanho_arquivo?: number
          updated_at?: string
          url_arquivo?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "processos_arquivos_pasta_id_fkey"
            columns: ["pasta_id"]
            isOneToOne: false
            referencedRelation: "processos_pastas"
            referencedColumns: ["id"]
          },
        ]
      }
      processos_pastas: {
        Row: {
          created_at: string
          id: string
          nome: string
          numero_processo: string | null
          parent_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          numero_processo?: string | null
          parent_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          numero_processo?: string | null
          parent_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "processos_pastas_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "processos_pastas"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          nome: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id: string
          nome?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          nome?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string | null
          email_notifications: boolean | null
          expiration_alert_months: number | null
          id: string
          notification_email: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email_notifications?: boolean | null
          expiration_alert_months?: number | null
          id?: string
          notification_email?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email_notifications?: boolean | null
          expiration_alert_months?: number | null
          id?: string
          notification_email?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_all_users_for_admin: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          email: string
          nome: string
          created_at: string
          updated_at: string
        }[]
      }
      get_atas_stats_by_category: {
        Args: Record<PropertyKey, never>
        Returns: {
          category: string
          total_atas: number
          total_valor: number
          total_saldo_disponivel: number
          atas_sem_saldo: number
        }[]
      }
      get_pedidos_with_ata_info: {
        Args: Record<PropertyKey, never>
        Returns: {
          pedido_id: string
          departamento: string
          descricao: string
          valor: number
          status: string
          data_solicitacao: string
          observacoes: string
          ata_id: string
          ata_numero: string
          ata_category: string
          ata_favorecido: string
          ata_saldo_disponivel: number
          created_at: string
          updated_at: string
        }[]
      }
      send_user_approval_notification: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_user_profile: {
        Args: {
          user_id: string
          user_email: string
          user_name: string
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
