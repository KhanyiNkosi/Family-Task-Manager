// types/database.ts
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          created_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          user_id: string;
          full_name: string;
          role: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          full_name: string;
          role: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          full_name?: string;
          role?: string;
          created_at?: string;
        };
      };
      notifications: {
        Row: {
          id: number;
          user_id: string;
          message: string;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: number;
          user_id: string;
          message: string;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: number;
          user_id?: string;
          message?: string;
          read?: boolean;
          created_at?: string;
        };
      };
      // Add other tables: tasks, rewards, child_profiles, parent_profiles
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
};
