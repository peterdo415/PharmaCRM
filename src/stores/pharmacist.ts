import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface Pharmacist {
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
}

interface PharmacistStore {
  pharmacists: Pharmacist[];
  currentPharmacist: Pharmacist | null;
  loading: boolean;
  error: string | null;
  
  fetchPharmacists: () => Promise<void>;
  fetchPharmacist: (id: string) => Promise<void>;
  createPharmacist: (pharmacist: Omit<Pharmacist, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updatePharmacist: (id: string, updates: Partial<Pharmacist>) => Promise<void>;
  deletePharmacist: (id: string) => Promise<void>;
  setCurrentPharmacist: (pharmacist: Pharmacist | null) => void;
  clearError: () => void;
}

export const usePharmacistStore = create<PharmacistStore>((set, get) => ({
  pharmacists: [],
  currentPharmacist: null,
  loading: false,
  error: null,

  fetchPharmacists: async () => {
    try {
      set({ loading: true, error: null });
      const { data, error } = await supabase
        .from('pharmacists')
.select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ pharmacists: data || [] });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  fetchPharmacist: async (id: string) => {
    try {
      set({ loading: true, error: null });
      const { data, error } = await supabase
        .from('pharmacists')
.select(`
          *,
          pharmacist_specialties (
            *,
            specialties (*)
          ),
          pharmacist_certifications (
            *,
            certification_types (*)
          )
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('薬剤師データが見つかりません');
      set({ currentPharmacist: data });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  createPharmacist: async (pharmacist) => {
    try {
      set({ loading: true, error: null });
      const { data, error } = await supabase
        .from('pharmacists')
        .insert([pharmacist])
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('薬剤師の作成に失敗しました');
      
      const { pharmacists } = get();
      set({ pharmacists: [data, ...pharmacists] });
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updatePharmacist: async (id: string, updates) => {
    try {
      set({ loading: true, error: null });
      const { data, error } = await supabase
        .from('pharmacists')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('更新されたデータが見つかりません');

      const { pharmacists, currentPharmacist } = get();
      const updatedPharmacists = pharmacists.map(p => p.id === id ? data : p);
      
      set({ 
        pharmacists: updatedPharmacists,
        currentPharmacist: currentPharmacist?.id === id ? data : currentPharmacist
      });
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  deletePharmacist: async (id: string) => {
    try {
      set({ loading: true, error: null });
      const { error } = await supabase
        .from('pharmacists')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      const { pharmacists } = get();
      set({ pharmacists: pharmacists.filter(p => p.id !== id) });
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  setCurrentPharmacist: (pharmacist) => set({ currentPharmacist: pharmacist }),
  clearError: () => set({ error: null }),
}));