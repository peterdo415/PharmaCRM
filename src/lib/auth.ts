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

    // Create user role record
    if (data.user) {
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: data.user.id,
          role,
          pharmacy_id: pharmacyId || null,
        });

      if (roleError) throw roleError;

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
    try {
      // まずuser_rolesテーブルから役割を取得を試み、失敗した場合はprofilesテーブルから取得
      let role: string | null = null;
      
      try {
        const { data: userRole, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .maybeSingle();

        if (!roleError && userRole) {
          role = userRole.role;
        }
      } catch (roleError) {
        console.warn('Failed to get role from user_roles table:', roleError);
      }

      // user_rolesテーブルから取得できない場合はエラー
      if (!role) {
        throw new Error('ユーザーの役割が見つかりません');
      }

      // 基本プロフィール情報を作成
      const profile = {
        id: userId,
        email: null, // 必要に応じてauth.usersから取得可能
        pharmacy_id: null // 役割に応じて後で設定
      };

      // 役割に応じて適切なテーブルからデータを取得
      if (role === 'pharmacist') {
        // 薬剤師の場合は pharmacists テーブルから詳細情報を取得
        const { data: pharmacistData, error: pharmacistError } = await supabase
          .from('pharmacists')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (pharmacistError) {
          console.error('薬剤師データ取得エラー:', pharmacistError);
        }

        // 薬局情報を取得（薬剤師が薬局に所属している場合）
        let pharmacyData = null;
        if (pharmacistData?.pharmacy_id) {
          const { data: pharmacy, error: pharmacyError } = await supabase
            .from('pharmacies')
            .select('*')
            .eq('id', pharmacistData.pharmacy_id)
            .maybeSingle();

          if (!pharmacyError && pharmacy) {
            pharmacyData = pharmacy;
          }
        }

        return {
          id: userId,
          email: profile.email,
          pharmacy_id: pharmacistData?.pharmacy_id || null,
          role: role, // user_roles テーブルから取得した役割を使用
          pharmacist: pharmacistData,
          pharmacy: pharmacyData,
        };
      } else if (role === 'pharmacy_admin') {
        // 薬局管理者の場合は user_roles テーブルから pharmacy_id を取得
        const { data: userRoleData, error: userRoleError } = await supabase
          .from('user_roles')
          .select('pharmacy_id')
          .eq('user_id', userId)
          .maybeSingle();

        let pharmacyData = null;
        if (!userRoleError && userRoleData?.pharmacy_id) {
          const { data: pharmacy, error: pharmacyError } = await supabase
            .from('pharmacies')
            .select('*')
            .eq('id', userRoleData.pharmacy_id)
            .maybeSingle();

          if (!pharmacyError && pharmacy) {
            pharmacyData = pharmacy;
          }
        }

        return {
          id: userId,
          email: profile.email,
          pharmacy_id: userRoleData?.pharmacy_id || null,
          role: role, // user_roles テーブルから取得した役割を使用
          pharmacy: pharmacyData,
          pharmacist: null, // 管理者は薬剤師データなし
        };
      }

      // 未知の役割の場合（フォールバック）
      return {
        id: userId,
        email: profile.email,
        pharmacy_id: null,
        role: role,
        pharmacy: null,
        pharmacist: null,
      };
    } catch (error) {
      console.error('プロフィール取得エラー:', error);
      throw error;
    }
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