import { supabase } from './supabase';
import { User, Session } from '@supabase/supabase-js';
import { prepareEmailForAuth } from '../utils/emailValidation';

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

export const authService = {
  async signUp(email: string, password: string, role: 'pharmacy_admin' | 'pharmacist' = 'pharmacist', pharmacyId?: string) {
    // メールアドレスをクリーニング
    const cleanedEmail = prepareEmailForAuth(email);
    
    const { data, error } = await supabase.auth.signUp({
      email: cleanedEmail,
      password,
      options: {
        data: {
          role,
        },
      },
    });

    if (error) throw error;

    // Create profile record
    if (data.user) {
      let targetPharmacyId = pharmacyId;
      
      // 薬剤師の場合でpharmacyIdが指定されていない場合はサンプル薬局を使用
      if (role === 'pharmacist' && !pharmacyId) {
        const { data: pharmacy } = await supabase
          .from('pharmacies')
          .select('id')
          .eq('name', 'サンプル薬局')
          .single();
        
        targetPharmacyId = pharmacy?.id;
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          email: cleanedEmail, // クリーニング済みメールアドレスを使用
          role,
          pharmacy_id: targetPharmacyId,
        });

      if (profileError) throw profileError;
    }

    return {
      user: data.user,
      session: data.session,
    };
  },

  async signIn(email: string, password: string) {
    // メールアドレスをクリーニング
    const cleanedEmail = prepareEmailForAuth(email);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanedEmail,
      password,
    });

    if (error) {
      // メール未確認エラーの場合、より詳細なエラーメッセージを提供
      if (error.message.includes('Email not confirmed')) {
        throw new Error('メールアドレスが確認されていません。管理者にお問い合わせください。');
      }
      throw error;
    }

    return {
      user: data.user,
      session: data.session,
    };
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    // セッションが削除されたことを確認
    return { user: null, session: null };
  },

  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  },

  async getCurrentSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  },

  async getProfile(userId: string) {
    // SECURITY DEFINER関数を使用してプロフィールを取得
    const { data, error } = await supabase
      .rpc('get_user_profile', { user_id: userId });

    if (error) throw error;
    
    if (!data || data.length === 0) {
      throw new Error('プロフィールが見つかりません');
    }

    const profile = data[0];

    // 薬局情報も取得
    let pharmacyData = null;
    if (profile.pharmacy_id) {
      const { data: pharmacy, error: pharmacyError } = await supabase
        .from('pharmacies')
        .select('id, name, prefecture, city')
        .eq('id', profile.pharmacy_id)
        .single();

      if (!pharmacyError) {
        pharmacyData = pharmacy;
      }
    }

    return {
      ...profile,
      pharmacies: pharmacyData,
    };
  },

  // メール確認を手動で行う関数（管理者用）
  async confirmEmail(token: string) {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: 'email',
    });

    if (error) throw error;
    return data;
  },

  // パスワードリセット
  async resetPassword(email: string) {
    // メールアドレスをクリーニング
    const cleanedEmail = prepareEmailForAuth(email);
    
    const { data, error } = await supabase.auth.resetPasswordForEmail(cleanedEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) throw error;
    return data;
  },

  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
  },
};