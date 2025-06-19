import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types based on the new schema
export interface Database {
  public: {
    Tables: {
      pharmacies: {
        Row: {
          id: string;
          name: string;
          postal_code?: string;
          prefecture: string;
          city: string;
          address: string;
          phone_number?: string;
          fax_number?: string;
          email?: string;
          license_number?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          postal_code?: string;
          prefecture: string;
          city: string;
          address: string;
          phone_number?: string;
          fax_number?: string;
          email?: string;
          license_number?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          postal_code?: string;
          prefecture?: string;
          city?: string;
          address?: string;
          phone_number?: string;
          fax_number?: string;
          email?: string;
          license_number?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          role: 'pharmacy_admin' | 'pharmacist';
          pharmacy_id?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          role: 'pharmacy_admin' | 'pharmacist';
          pharmacy_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          role?: 'pharmacy_admin' | 'pharmacist';
          pharmacy_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      pharmacists: {
        Row: {
          id: string;
          user_id: string;
          pharmacy_id: string;
          first_name: string;
          last_name: string;
          first_name_kana?: string;
          last_name_kana?: string;
          birth_date?: string;
          gender?: 'male' | 'female' | 'other';
          phone_mobile?: string;
          phone_home?: string;
          email?: string;
          postal_code?: string;
          prefecture?: string;
          city?: string;
          address?: string;
          nearest_station?: string;
          transportation?: string;
          emergency_contact_name?: string;
          emergency_contact_phone?: string;
          emergency_contact_relation?: string;
          license_number: string;
          license_date: string;
          total_experience_years: number;
          profile_image_url?: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          pharmacy_id: string;
          first_name: string;
          last_name: string;
          first_name_kana?: string;
          last_name_kana?: string;
          birth_date?: string;
          gender?: 'male' | 'female' | 'other';
          phone_mobile?: string;
          phone_home?: string;
          email?: string;
          postal_code?: string;
          prefecture?: string;
          city?: string;
          address?: string;
          nearest_station?: string;
          transportation?: string;
          emergency_contact_name?: string;
          emergency_contact_phone?: string;
          emergency_contact_relation?: string;
          license_number: string;
          license_date: string;
          total_experience_years?: number;
          profile_image_url?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          pharmacy_id?: string;
          first_name?: string;
          last_name?: string;
          first_name_kana?: string;
          last_name_kana?: string;
          birth_date?: string;
          gender?: 'male' | 'female' | 'other';
          phone_mobile?: string;
          phone_home?: string;
          email?: string;
          postal_code?: string;
          prefecture?: string;
          city?: string;
          address?: string;
          nearest_station?: string;
          transportation?: string;
          emergency_contact_name?: string;
          emergency_contact_phone?: string;
          emergency_contact_relation?: string;
          license_number?: string;
          license_date?: string;
          total_experience_years?: number;
          profile_image_url?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      specialties: {
        Row: {
          id: string;
          name: string;
          category?: string;
          description?: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          category?: string;
          description?: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          category?: string;
          description?: string;
          is_active?: boolean;
          created_at?: string;
        };
      };
      certification_types: {
        Row: {
          id: string;
          name: string;
          category: 'certified_pharmacist' | 'specialist_pharmacist' | 'other';
          issuing_organization?: string;
          validity_period_years?: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          category: 'certified_pharmacist' | 'specialist_pharmacist' | 'other';
          issuing_organization?: string;
          validity_period_years?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          category?: 'certified_pharmacist' | 'specialist_pharmacist' | 'other';
          issuing_organization?: string;
          validity_period_years?: number;
          is_active?: boolean;
          created_at?: string;
        };
      };
      pharmacist_specialties: {
        Row: {
          id: string;
          pharmacist_id: string;
          specialty_id: string;
          experience_level: 'beginner' | 'intermediate' | 'advanced' | 'instructor';
          years_of_experience: number;
          notes?: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          pharmacist_id: string;
          specialty_id: string;
          experience_level: 'beginner' | 'intermediate' | 'advanced' | 'instructor';
          years_of_experience?: number;
          notes?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          pharmacist_id?: string;
          specialty_id?: string;
          experience_level?: 'beginner' | 'intermediate' | 'advanced' | 'instructor';
          years_of_experience?: number;
          notes?: string;
          created_at?: string;
        };
      };
      pharmacist_certifications: {
        Row: {
          id: string;
          pharmacist_id: string;
          certification_type_id: string;
          certification_number?: string;
          acquired_date: string;
          expiry_date?: string;
          is_active: boolean;
          notes?: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          pharmacist_id: string;
          certification_type_id: string;
          certification_number?: string;
          acquired_date: string;
          expiry_date?: string;
          is_active?: boolean;
          notes?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          pharmacist_id?: string;
          certification_type_id?: string;
          certification_number?: string;
          acquired_date?: string;
          expiry_date?: string;
          is_active?: boolean;
          notes?: string;
          created_at?: string;
        };
      };
      work_preferences: {
        Row: {
          id: string;
          pharmacist_id: string;
          monday_available: boolean;
          monday_start_time?: string;
          monday_end_time?: string;
          tuesday_available: boolean;
          tuesday_start_time?: string;
          tuesday_end_time?: string;
          wednesday_available: boolean;
          wednesday_start_time?: string;
          wednesday_end_time?: string;
          thursday_available: boolean;
          thursday_start_time?: string;
          thursday_end_time?: string;
          friday_available: boolean;
          friday_start_time?: string;
          friday_end_time?: string;
          saturday_available: boolean;
          saturday_start_time?: string;
          saturday_end_time?: string;
          sunday_available: boolean;
          sunday_start_time?: string;
          sunday_end_time?: string;
          night_shift_available: boolean;
          holiday_available: boolean;
          employment_type?: 'full_time' | 'part_time' | 'temp' | 'dispatch';
          preferred_hourly_rate?: number;
          preferred_daily_rate?: number;
          transportation_allowance_required: boolean;
          minimum_work_hours?: number;
          maximum_consecutive_days?: number;
          emergency_available: boolean;
          emergency_contact_hours?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          pharmacist_id: string;
          monday_available?: boolean;
          monday_start_time?: string;
          monday_end_time?: string;
          tuesday_available?: boolean;
          tuesday_start_time?: string;
          tuesday_end_time?: string;
          wednesday_available?: boolean;
          wednesday_start_time?: string;
          wednesday_end_time?: string;
          thursday_available?: boolean;
          thursday_start_time?: string;
          thursday_end_time?: string;
          friday_available?: boolean;
          friday_start_time?: string;
          friday_end_time?: string;
          saturday_available?: boolean;
          saturday_start_time?: string;
          saturday_end_time?: string;
          sunday_available?: boolean;
          sunday_start_time?: string;
          sunday_end_time?: string;
          night_shift_available?: boolean;
          holiday_available?: boolean;
          employment_type?: 'full_time' | 'part_time' | 'temp' | 'dispatch';
          preferred_hourly_rate?: number;
          preferred_daily_rate?: number;
          transportation_allowance_required?: boolean;
          minimum_work_hours?: number;
          maximum_consecutive_days?: number;
          emergency_available?: boolean;
          emergency_contact_hours?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          pharmacist_id?: string;
          monday_available?: boolean;
          monday_start_time?: string;
          monday_end_time?: string;
          tuesday_available?: boolean;
          tuesday_start_time?: string;
          tuesday_end_time?: string;
          wednesday_available?: boolean;
          wednesday_start_time?: string;
          wednesday_end_time?: string;
          thursday_available?: boolean;
          thursday_start_time?: string;
          thursday_end_time?: string;
          friday_available?: boolean;
          friday_start_time?: string;
          friday_end_time?: string;
          saturday_available?: boolean;
          saturday_start_time?: string;
          saturday_end_time?: string;
          sunday_available?: boolean;
          sunday_start_time?: string;
          sunday_end_time?: string;
          night_shift_available?: boolean;
          holiday_available?: boolean;
          employment_type?: 'full_time' | 'part_time' | 'temp' | 'dispatch';
          preferred_hourly_rate?: number;
          preferred_daily_rate?: number;
          transportation_allowance_required?: boolean;
          minimum_work_hours?: number;
          maximum_consecutive_days?: number;
          emergency_available?: boolean;
          emergency_contact_hours?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      schedules: {
        Row: {
          id: string;
          pharmacist_id: string;
          pharmacy_id: string;
          work_date: string;
          start_time: string;
          end_time: string;
          break_duration: number;
          work_type: 'regular' | 'home_visit' | 'emergency';
          notes?: string;
          status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
          created_by?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          pharmacist_id: string;
          pharmacy_id: string;
          work_date: string;
          start_time: string;
          end_time: string;
          break_duration?: number;
          work_type?: 'regular' | 'home_visit' | 'emergency';
          notes?: string;
          status?: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          pharmacist_id?: string;
          pharmacy_id?: string;
          work_date?: string;
          start_time?: string;
          end_time?: string;
          break_duration?: number;
          work_type?: 'regular' | 'home_visit' | 'emergency';
          notes?: string;
          status?: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      work_records: {
        Row: {
          id: string;
          schedule_id: string;
          pharmacist_id: string;
          actual_start_time?: string;
          actual_end_time?: string;
          actual_break_duration: number;
          prescription_count: number;
          counseling_count: number;
          home_visit_count: number;
          notes?: string;
          overtime_hours: number;
          is_approved: boolean;
          approved_by?: string;
          approved_at?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          schedule_id: string;
          pharmacist_id: string;
          actual_start_time?: string;
          actual_end_time?: string;
          actual_break_duration?: number;
          prescription_count?: number;
          counseling_count?: number;
          home_visit_count?: number;
          notes?: string;
          overtime_hours?: number;
          is_approved?: boolean;
          approved_by?: string;
          approved_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          schedule_id?: string;
          pharmacist_id?: string;
          actual_start_time?: string;
          actual_end_time?: string;
          actual_break_duration?: number;
          prescription_count?: number;
          counseling_count?: number;
          home_visit_count?: number;
          notes?: string;
          overtime_hours?: number;
          is_approved?: boolean;
          approved_by?: string;
          approved_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}