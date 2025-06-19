import { create } from 'zustand';
import { User, Session } from '@supabase/supabase-js';
import { authService } from '../lib/auth';

interface AuthStore {
  user: User | null;
  session: Session | null;
  loading: boolean;
  profile: any | null;
  initialized: boolean;
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  setProfile: (profile: any | null) => void;
  setInitialized: (initialized: boolean) => void;
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, role?: 'pharmacy_admin' | 'pharmacist', pharmacyId?: string) => Promise<{ user: User | null }>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  session: null,
  loading: true,
  profile: null,
  initialized: false,
  
  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setLoading: (loading) => set({ loading }),
  setProfile: (profile) => set({ profile }),
  setInitialized: (initialized) => set({ initialized }),

  initialize: async () => {
    try {
      set({ loading: true });
      
      // 現在のセッションを取得
      const session = await authService.getCurrentSession();
      
      if (session?.user) {
        // セッションが有効な場合、プロフィール情報も取得
        try {
          const profile = await authService.getProfile(session.user.id);
          set({ 
            user: session.user, 
            session: session,
            profile,
            initialized: true
          });
        } catch (profileError) {
          console.error('Failed to load profile:', profileError);
          // プロフィール取得に失敗した場合でも、ユーザー情報は保持
          set({ 
            user: session.user, 
            session: session,
            profile: null,
            initialized: true
          });
        }
      } else {
        set({ 
          user: null, 
          session: null, 
          profile: null,
          initialized: true
        });
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      set({ 
        user: null, 
        session: null, 
        profile: null,
        initialized: true
      });
    } finally {
      set({ loading: false });
    }
  },

  signIn: async (email, password) => {
    try {
      set({ loading: true });
      const { user, session } = await authService.signIn(email, password);
      
      if (user && session) {
        try {
          const profile = await authService.getProfile(user.id);
          set({ 
            user, 
            session, 
            profile,
            initialized: true
          });
        } catch (profileError) {
          console.error('Failed to load profile after sign in:', profileError);
          set({ 
            user, 
            session, 
            profile: null,
            initialized: true
          });
        }
      }
    } catch (error) {
      console.error('Sign in failed:', error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  signUp: async (email, password, role = 'pharmacist', pharmacyId) => {
    try {
      set({ loading: true });
      const { user, session } = await authService.signUp(email, password, role, pharmacyId);
      
      // 新規登録時はセッションが作成される場合があるので、それを保存
      if (user && session) {
        try {
          const profile = await authService.getProfile(user.id);
          set({ 
            user, 
            session, 
            profile,
            initialized: true
          });
        } catch (profileError) {
          console.error('Failed to load profile after sign up:', profileError);
          set({ 
            user, 
            session, 
            profile: null,
            initialized: true
          });
        }
      } else {
        // セッションが作成されなかった場合（メール確認待ちなど）
        set({ 
          user: null, 
          session: null, 
          profile: null,
          initialized: true
        });
      }

      return { user };
    } catch (error) {
      console.error('Sign up failed:', error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  signOut: async () => {
    try {
      set({ loading: true });
      await authService.signOut();
      set({ 
        user: null, 
        session: null, 
        profile: null,
        initialized: true
      });
    } catch (error) {
      console.error('Sign out failed:', error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },
}));

// Initialize auth listener - セッション変更を監視
authService.onAuthStateChange((event, session) => {
  const store = useAuthStore.getState();
  
  console.log('Auth state changed:', event, session?.user?.email);
  
  if (event === 'SIGNED_IN' && session?.user) {
    store.setUser(session.user);
    store.setSession(session);
    store.setInitialized(true);
    
    // プロフィール情報を取得
    authService.getProfile(session.user.id)
      .then(profile => {
        store.setProfile(profile);
      })
      .catch(error => {
        console.error('Failed to load profile on auth change:', error);
        store.setProfile(null);
      });
      
  } else if (event === 'SIGNED_OUT') {
    store.setUser(null);
    store.setSession(null);
    store.setProfile(null);
    store.setInitialized(true);
    
  } else if (event === 'TOKEN_REFRESHED' && session) {
    store.setSession(session);
    // トークンリフレッシュ時はユーザー情報は変わらないので、セッションのみ更新
    
  } else if (event === 'INITIAL_SESSION') {
    // 初期セッション読み込み時の処理
    if (session?.user) {
      store.setUser(session.user);
      store.setSession(session);
      store.setInitialized(true);
      
      authService.getProfile(session.user.id)
        .then(profile => store.setProfile(profile))
        .catch(error => {
          console.error('Failed to load profile on initial session:', error);
          store.setProfile(null);
        });
    } else {
      store.setUser(null);
      store.setSession(null);
      store.setProfile(null);
      store.setInitialized(true);
    }
  }
});