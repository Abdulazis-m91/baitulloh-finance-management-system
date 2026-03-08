export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      cicilan: {
        Row: {
          bulan: string
          created_at: string
          id: string
          nominal: number
          petugas: string
          siswa_id: string
          tanggal: string
        }
        Insert: {
          bulan: string
          created_at?: string
          id?: string
          nominal: number
          petugas: string
          siswa_id: string
          tanggal?: string
        }
        Update: {
          bulan?: string
          created_at?: string
          id?: string
          nominal?: number
          petugas?: string
          siswa_id?: string
          tanggal?: string
        }
        Relationships: [
          {
            foreignKeyName: "cicilan_siswa_id_fkey"
            columns: ["siswa_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      cicilan_pesantren: {
        Row: {
          bulan: string
          created_at: string
          id: string
          nominal: number
          petugas: string
          siswa_id: string
          tanggal: string
        }
        Insert: {
          bulan: string
          created_at?: string
          id?: string
          nominal: number
          petugas: string
          siswa_id: string
          tanggal?: string
        }
        Update: {
          bulan?: string
          created_at?: string
          id?: string
          nominal?: number
          petugas?: string
          siswa_id?: string
          tanggal?: string
        }
        Relationships: [
          {
            foreignKeyName: "cicilan_pesantren_siswa_id_fkey"
            columns: ["siswa_id"]
            isOneToOne: false
            referencedRelation: "santri"
            referencedColumns: ["id"]
          },
        ]
      }
      konsumsi_pesantren: {
        Row: {
          bulan: string
          created_at: string
          id: string
          kategori: string
          nama_siswa: string
          nominal: number
          pembayaran_id: string | null
          petugas: string
          siswa_id: string | null
          tanggal: string
        }
        Insert: {
          bulan: string
          created_at?: string
          id?: string
          kategori: string
          nama_siswa: string
          nominal: number
          pembayaran_id?: string | null
          petugas: string
          siswa_id?: string | null
          tanggal?: string
        }
        Update: {
          bulan?: string
          created_at?: string
          id?: string
          kategori?: string
          nama_siswa?: string
          nominal?: number
          pembayaran_id?: string | null
          petugas?: string
          siswa_id?: string | null
          tanggal?: string
        }
        Relationships: [
          {
            foreignKeyName: "konsumsi_pesantren_pembayaran_id_fkey"
            columns: ["pembayaran_id"]
            isOneToOne: false
            referencedRelation: "pembayaran_pesantren"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "konsumsi_pesantren_siswa_id_fkey"
            columns: ["siswa_id"]
            isOneToOne: false
            referencedRelation: "santri"
            referencedColumns: ["id"]
          },
        ]
      }
      operasional_pesantren: {
        Row: {
          bulan: string
          created_at: string
          id: string
          kategori: string
          nama_siswa: string
          nominal: number
          pembayaran_id: string | null
          petugas: string
          siswa_id: string | null
          tanggal: string
        }
        Insert: {
          bulan: string
          created_at?: string
          id?: string
          kategori: string
          nama_siswa: string
          nominal: number
          pembayaran_id?: string | null
          petugas: string
          siswa_id?: string | null
          tanggal?: string
        }
        Update: {
          bulan?: string
          created_at?: string
          id?: string
          kategori?: string
          nama_siswa?: string
          nominal?: number
          pembayaran_id?: string | null
          petugas?: string
          siswa_id?: string | null
          tanggal?: string
        }
        Relationships: [
          {
            foreignKeyName: "operasional_pesantren_pembayaran_id_fkey"
            columns: ["pembayaran_id"]
            isOneToOne: false
            referencedRelation: "pembayaran_pesantren"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operasional_pesantren_siswa_id_fkey"
            columns: ["siswa_id"]
            isOneToOne: false
            referencedRelation: "santri"
            referencedColumns: ["id"]
          },
        ]
      }
      pembangunan_pesantren: {
        Row: {
          bulan: string
          created_at: string
          id: string
          kategori: string
          nama_siswa: string
          nominal: number
          pembayaran_id: string | null
          petugas: string
          siswa_id: string | null
          tanggal: string
        }
        Insert: {
          bulan: string
          created_at?: string
          id?: string
          kategori: string
          nama_siswa: string
          nominal: number
          pembayaran_id?: string | null
          petugas: string
          siswa_id?: string | null
          tanggal?: string
        }
        Update: {
          bulan?: string
          created_at?: string
          id?: string
          kategori?: string
          nama_siswa?: string
          nominal?: number
          pembayaran_id?: string | null
          petugas?: string
          siswa_id?: string | null
          tanggal?: string
        }
        Relationships: [
          {
            foreignKeyName: "pembangunan_pesantren_pembayaran_id_fkey"
            columns: ["pembayaran_id"]
            isOneToOne: false
            referencedRelation: "pembayaran_pesantren"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pembangunan_pesantren_siswa_id_fkey"
            columns: ["siswa_id"]
            isOneToOne: false
            referencedRelation: "santri"
            referencedColumns: ["id"]
          },
        ]
      }
      pembayaran: {
        Row: {
          bulan: string
          created_at: string
          id: string
          jenjang: Database["public"]["Enums"]["jenjang_type"]
          kelas: string
          metode: Database["public"]["Enums"]["metode_bayar"]
          nama_siswa: string
          nisn: string
          nominal: number
          petugas: string
          siswa_id: string | null
          tanggal: string
        }
        Insert: {
          bulan: string
          created_at?: string
          id?: string
          jenjang: Database["public"]["Enums"]["jenjang_type"]
          kelas: string
          metode: Database["public"]["Enums"]["metode_bayar"]
          nama_siswa: string
          nisn: string
          nominal: number
          petugas: string
          siswa_id?: string | null
          tanggal?: string
        }
        Update: {
          bulan?: string
          created_at?: string
          id?: string
          jenjang?: Database["public"]["Enums"]["jenjang_type"]
          kelas?: string
          metode?: Database["public"]["Enums"]["metode_bayar"]
          nama_siswa?: string
          nisn?: string
          nominal?: number
          petugas?: string
          siswa_id?: string | null
          tanggal?: string
        }
        Relationships: [
          {
            foreignKeyName: "pembayaran_siswa_id_fkey"
            columns: ["siswa_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      pembayaran_pesantren: {
        Row: {
          bulan: string
          created_at: string
          id: string
          jenjang: Database["public"]["Enums"]["jenjang_type"]
          kategori: string
          kelas: string
          metode: Database["public"]["Enums"]["metode_bayar"]
          nama_siswa: string
          nisn: string
          nominal: number
          petugas: string
          siswa_id: string | null
          tanggal: string
        }
        Insert: {
          bulan: string
          created_at?: string
          id?: string
          jenjang: Database["public"]["Enums"]["jenjang_type"]
          kategori: string
          kelas: string
          metode: Database["public"]["Enums"]["metode_bayar"]
          nama_siswa: string
          nisn: string
          nominal: number
          petugas: string
          siswa_id?: string | null
          tanggal?: string
        }
        Update: {
          bulan?: string
          created_at?: string
          id?: string
          jenjang?: Database["public"]["Enums"]["jenjang_type"]
          kategori?: string
          kelas?: string
          metode?: Database["public"]["Enums"]["metode_bayar"]
          nama_siswa?: string
          nisn?: string
          nominal?: number
          petugas?: string
          siswa_id?: string | null
          tanggal?: string
        }
        Relationships: [
          {
            foreignKeyName: "pembayaran_pesantren_siswa_id_fkey"
            columns: ["siswa_id"]
            isOneToOne: false
            referencedRelation: "santri"
            referencedColumns: ["id"]
          },
        ]
      }
      pendapatan_lain_pesantren: {
        Row: {
          created_at: string
          id: string
          nama: string
          nominal: number
          petugas: string
          tanggal: string
        }
        Insert: {
          created_at?: string
          id?: string
          nama: string
          nominal: number
          petugas: string
          tanggal?: string
        }
        Update: {
          created_at?: string
          id?: string
          nama?: string
          nominal?: number
          petugas?: string
          tanggal?: string
        }
        Relationships: []
      }
      pengeluaran: {
        Row: {
          created_at: string
          id: string
          jenis_keperluan: string
          keterangan: string
          nominal: number
          petugas: string
          sumber_dana: Database["public"]["Enums"]["jenjang_type"]
          tanggal: string
        }
        Insert: {
          created_at?: string
          id?: string
          jenis_keperluan: string
          keterangan: string
          nominal: number
          petugas: string
          sumber_dana: Database["public"]["Enums"]["jenjang_type"]
          tanggal?: string
        }
        Update: {
          created_at?: string
          id?: string
          jenis_keperluan?: string
          keterangan?: string
          nominal?: number
          petugas?: string
          sumber_dana?: Database["public"]["Enums"]["jenjang_type"]
          tanggal?: string
        }
        Relationships: []
      }
      pengeluaran_pesantren: {
        Row: {
          created_at: string
          id: string
          jenis_keperluan: string
          keterangan: string
          nominal: number
          petugas: string
          tanggal: string
        }
        Insert: {
          created_at?: string
          id?: string
          jenis_keperluan: string
          keterangan: string
          nominal: number
          petugas: string
          tanggal?: string
        }
        Update: {
          created_at?: string
          id?: string
          jenis_keperluan?: string
          keterangan?: string
          nominal?: number
          petugas?: string
          tanggal?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string
          id: string
          phone: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string
          id?: string
          phone?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          phone?: string | null
          user_id?: string
        }
        Relationships: []
      }
      santri: {
        Row: {
          barcode: string
          biaya_per_bulan: number
          created_at: string
          deposit: number
          foto: string | null
          id: string
          jenjang: Database["public"]["Enums"]["jenjang_type"]
          kategori: string | null
          kelas: string
          nama_lengkap: string
          nama_orang_tua: string
          nisn: string
          nomor_whatsapp: string
          tunggakan_pesantren: string[]
          updated_at: string
        }
        Insert: {
          barcode?: string
          biaya_per_bulan?: number
          created_at?: string
          deposit?: number
          foto?: string | null
          id?: string
          jenjang: Database["public"]["Enums"]["jenjang_type"]
          kategori?: string | null
          kelas: string
          nama_lengkap: string
          nama_orang_tua: string
          nisn: string
          nomor_whatsapp: string
          tunggakan_pesantren?: string[]
          updated_at?: string
        }
        Update: {
          barcode?: string
          biaya_per_bulan?: number
          created_at?: string
          deposit?: number
          foto?: string | null
          id?: string
          jenjang?: Database["public"]["Enums"]["jenjang_type"]
          kategori?: string | null
          kelas?: string
          nama_lengkap?: string
          nama_orang_tua?: string
          nisn?: string
          nomor_whatsapp?: string
          tunggakan_pesantren?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      students: {
        Row: {
          barcode: string
          biaya_per_bulan: number
          created_at: string
          deposit: number
          foto: string | null
          id: string
          jenjang: Database["public"]["Enums"]["jenjang_type"]
          kategori: string | null
          kelas: string
          nama_lengkap: string
          nama_orang_tua: string
          nisn: string
          nomor_whatsapp: string
          tunggakan_pesantren: string[]
          tunggakan_sekolah: string[]
          updated_at: string
        }
        Insert: {
          barcode?: string
          biaya_per_bulan?: number
          created_at?: string
          deposit?: number
          foto?: string | null
          id?: string
          jenjang: Database["public"]["Enums"]["jenjang_type"]
          kategori?: string | null
          kelas: string
          nama_lengkap: string
          nama_orang_tua: string
          nisn: string
          nomor_whatsapp: string
          tunggakan_pesantren?: string[]
          tunggakan_sekolah?: string[]
          updated_at?: string
        }
        Update: {
          barcode?: string
          biaya_per_bulan?: number
          created_at?: string
          deposit?: number
          foto?: string | null
          id?: string
          jenjang?: Database["public"]["Enums"]["jenjang_type"]
          kategori?: string | null
          kelas?: string
          nama_lengkap?: string
          nama_orang_tua?: string
          nisn?: string
          nomor_whatsapp?: string
          tunggakan_pesantren?: string[]
          tunggakan_sekolah?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "petugas_sekolah" | "petugas_pesantren"
      jenjang_type: "SMP" | "SMA" | "Reguler"
      metode_bayar: "Lunas" | "Cicil" | "Deposit"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "petugas_sekolah", "petugas_pesantren"],
      jenjang_type: ["SMP", "SMA", "Reguler"],
      metode_bayar: ["Lunas", "Cicil", "Deposit"],
    },
  },
} as const
