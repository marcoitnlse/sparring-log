// Hand-written to match supabase/migrations/0001_init.sql.
// Once a live Supabase project exists, regenerate with:
//   npx supabase gen types typescript --project-id <id> > src/types/database.ts

export type Weapon = 'epee' | 'foil' | 'sabre'
export type BoutFormat = 'free' | 'timed'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          display_name: string | null
          created_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          display_name?: string | null
          created_at?: string
        }
        Relationships: []
      }
      opponents: {
        Row: {
          id: string
          user_id: string
          name: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          notes?: string | null
          created_at?: string
        }
        Relationships: []
      }
      bouts: {
        Row: {
          id: string
          user_id: string
          opponent_id: string
          weapon: Weapon
          bout_format: BoutFormat
          fencer_score: number
          opponent_score: number
          bout_date: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          opponent_id: string
          weapon?: Weapon
          bout_format?: BoutFormat
          fencer_score: number
          opponent_score: number
          bout_date?: string
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          opponent_id?: string
          weapon?: Weapon
          bout_format?: BoutFormat
          fencer_score?: number
          opponent_score?: number
          bout_date?: string
          notes?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'bouts_opponent_id_fkey'
            columns: ['opponent_id']
            referencedRelation: 'opponents'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      bout_stats: {
        Row: {
          user_id: string
          total_bouts: number
          wins: number
          losses: number
          draws: number
          win_rate_pct: number | null
        }
        Relationships: []
      }
    }
    Functions: Record<string, never>
  }
}
