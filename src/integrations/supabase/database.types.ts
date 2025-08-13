export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          nome: string | null;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          nome?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          nome?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      tac_attachments: {
        Row: {
          id: string;
          tac_id: number;
          arquivo_url: string;
          nome_arquivo: string;
          tamanho_arquivo: number | null;
          created_at: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          tac_id: number;
          arquivo_url: string;
          nome_arquivo: string;
          tamanho_arquivo?: number | null;
          created_at?: string;
          user_id: string;
        };
        Update: {
          id?: string;
          tac_id?: number;
          arquivo_url?: string;
          nome_arquivo?: string;
          tamanho_arquivo?: number | null;
          created_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tac_attachments_tac_id_fkey";
            columns: ["tac_id"];
            referencedRelation: "tacs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tac_attachments_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      tacs: {
        Row: {
          id: number;
          created_at: string;
          nome_empresa: string;
          numero_processo: string;
          data_entrada: string;
          assunto_objeto: string;
          n_notas: number;
          valor: number;
          unidade_beneficiada: string;
          arquivo_url: string;
          user_id: string;
        };
        Insert: {
          id?: number;
          created_at?: string;
          nome_empresa: string;
          numero_processo: string;
          data_entrada: string;
          assunto_objeto: string;
          n_notas: number;
          valor: number;
          unidade_beneficiada: string;
          arquivo_url: string;
          user_id: string;
        };
        Update: {
          id?: number;
          created_at?: string;
          nome_empresa?: string;
          numero_processo?: string;
          data_entrada?: string;
          assunto_objeto?: string;
          n_notas?: number;
          valor?: number;
          unidade_beneficiada?: string;
          arquivo_url?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tacs_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
}
