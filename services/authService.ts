import { supabase } from './supabaseClient';
import { User, AdminActionType } from '../types';
import { getUserRole, checkAndPromoteAdmin, getUserBalance, logAdminAction } from './adminService';

export interface AuthError {
  message: string;
}

/**
 * Translate Supabase auth errors to Russian
 */
const translateAuthError = (errorMessage: string): string => {
  const errorMap: Record<string, string> = {
    'Invalid login credentials': 'Неверный email или пароль',
    'Email not confirmed': 'Email не подтверждён. Проверьте почту и перейдите по ссылке подтверждения.',
    'User already registered': 'Пользователь с таким email уже зарегистрирован',
    'Password should be at least 6 characters': 'Пароль должен содержать минимум 6 символов',
    'Unable to validate email address: invalid format': 'Неверный формат email адреса',
    'Signup requires a valid password': 'Введите корректный пароль',
    'User not found': 'Пользователь не найден',
    'Email rate limit exceeded': 'Превышен лимит отправки писем. Попробуйте позже.',
    'Invalid email or password': 'Неверный email или пароль',
    'Email link is invalid or has expired': 'Ссылка недействительна или устарела',
    'Token has expired or is invalid': 'Токен истёк или недействителен',
    'New password should be different from the old password': 'Новый пароль должен отличаться от старого',
  };

  // Check for exact match
  if (errorMap[errorMessage]) {
    return errorMap[errorMessage];
  }

  // Check for partial matches
  for (const [englishError, russianError] of Object.entries(errorMap)) {
    if (errorMessage.includes(englishError)) {
      return russianError;
    }
  }

  // Return original message if no translation found
  return errorMessage;
};

export interface AuthResponse {
  user: User | null;
  error: AuthError | null;
}

/**
 * Sign up a new user with email and password
 */
export const signUp = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      return { user: null, error: { message: translateAuthError(error.message) } };
    }

    if (data.user) {
      return {
        user: {
          id: data.user.id,
          email: data.user.email || '',
          created_at: data.user.created_at || new Date().toISOString(),
          name: data.user.user_metadata?.name,
          avatar_url: data.user.user_metadata?.avatar_url,
          gender: data.user.user_metadata?.gender,
          date_of_birth: data.user.user_metadata?.date_of_birth,
          privacy_hide_dreams: data.user.user_metadata?.privacy_hide_dreams || false,
        },
        error: null,
      };
    }

    return { user: null, error: { message: 'Не удалось создать пользователя' } };
  } catch (err) {
    return { user: null, error: { message: 'Ошибка регистрации' } };
  }
};

/**
 * Sign in an existing user with email and password
 */
export const signIn = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { user: null, error: { message: translateAuthError(error.message) } };
    }

    if (data.user) {
      // Check and promote to admin if email is in admin list
      await checkAndPromoteAdmin(email);

      // Get user role
      const role = await getUserRole(data.user.id);

      // Get user balance
      const balanceData = await getUserBalance(data.user.id);

      // Log admin login
      if (role === 'admin') {
        await logAdminAction(AdminActionType.LOGIN, {
          email: data.user.email,
          timestamp: new Date().toISOString()
        });
      }

      return {
        user: {
          id: data.user.id,
          email: data.user.email || '',
          created_at: data.user.created_at || new Date().toISOString(),
          name: data.user.user_metadata?.name,
          avatar_url: data.user.user_metadata?.avatar_url,
          gender: data.user.user_metadata?.gender,
          date_of_birth: data.user.user_metadata?.date_of_birth,
          privacy_hide_dreams: data.user.user_metadata?.privacy_hide_dreams || false,
          role,
          balance: balanceData?.balance,
        },
        error: null,
      };
    }

    return { user: null, error: { message: 'Не удалось войти' } };
  } catch (err) {
    return { user: null, error: { message: 'Ошибка входа' } };
  }
};

/**
 * Sign out the current user
 */
export const signOut = async (): Promise<{ error: AuthError | null }> => {
  try {
    // Get current user before logout to log admin logout
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const role = await getUserRole(user.id);

      // Log admin logout
      if (role === 'admin') {
        await logAdminAction(AdminActionType.LOGOUT, {
          email: user.email,
          timestamp: new Date().toISOString()
        });
      }
    }

    const { error } = await supabase.auth.signOut();
    if (error) {
      return { error: { message: translateAuthError(error.message) } };
    }
    return { error: null };
  } catch (err) {
    return { error: { message: 'Ошибка выхода' } };
  }
};

/**
 * Get the current authenticated user
 */
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      // Get user role
      const role = await getUserRole(user.id);

      // Get user balance
      const balanceData = await getUserBalance(user.id);

      return {
        id: user.id,
        email: user.email || '',
        created_at: user.created_at || new Date().toISOString(),
        name: user.user_metadata?.name,
        avatar_url: user.user_metadata?.avatar_url,
        gender: user.user_metadata?.gender,
        date_of_birth: user.user_metadata?.date_of_birth,
        privacy_hide_dreams: user.user_metadata?.privacy_hide_dreams || false,
        role,
        balance: balanceData?.balance,
      };
    }

    return null;
  } catch (err) {
    console.error('Error getting current user:', err);
    return null;
  }
};

/**
 * Subscribe to authentication state changes
 */
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return supabase.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      // Get user role
      const role = await getUserRole(session.user.id);

      // Get user balance
      const balanceData = await getUserBalance(session.user.id);

      callback({
        id: session.user.id,
        email: session.user.email || '',
        created_at: session.user.created_at || new Date().toISOString(),
        name: session.user.user_metadata?.name,
        avatar_url: session.user.user_metadata?.avatar_url,
        gender: session.user.user_metadata?.gender,
        date_of_birth: session.user.user_metadata?.date_of_birth,
        privacy_hide_dreams: session.user.user_metadata?.privacy_hide_dreams || false,
        role,
        balance: balanceData?.balance,
      });
    } else {
      callback(null);
    }
  });
};

/**
 * Send password reset email
 */
export const resetPassword = async (email: string): Promise<{ error: AuthError | null }> => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      return { error: { message: translateAuthError(error.message) } };
    }
    return { error: null };
  } catch (err) {
    return { error: { message: 'Ошибка сброса пароля' } };
  }
};

/**
 * Update user password
 */
export const updatePassword = async (newPassword: string): Promise<{ error: AuthError | null }> => {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    if (error) {
      return { error: { message: translateAuthError(error.message) } };
    }
    return { error: null };
  } catch (err) {
    return { error: { message: 'Ошибка смены пароля' } };
  }
};

/**
 * Update user email (requires confirmation)
 */
export const updateEmail = async (newEmail: string): Promise<{ error: AuthError | null }> => {
  try {
    const { error } = await supabase.auth.updateUser({
      email: newEmail
    });
    if (error) {
      return { error: { message: translateAuthError(error.message) } };
    }
    return { error: null };
  } catch (err) {
    return { error: { message: 'Ошибка смены email' } };
  }
};

/**
 * Update user metadata (name, avatar_url, gender, date_of_birth, privacy_hide_dreams, etc.)
 */
export const updateUserMetadata = async (metadata: {
  name?: string;
  avatar_url?: string;
  gender?: 'male' | 'female';
  date_of_birth?: string;
  privacy_hide_dreams?: boolean;
}): Promise<{ error: AuthError | null }> => {
  try {
    const { error } = await supabase.auth.updateUser({
      data: metadata
    });
    if (error) {
      return { error: { message: translateAuthError(error.message) } };
    }
    return { error: null };
  } catch (err) {
    return { error: { message: 'Ошибка обновления профиля' } };
  }
};

/**
 * Upload avatar to Supabase Storage
 */
export const uploadAvatar = async (file: File, userId: string): Promise<{ url: string | null; error: AuthError | null }> => {
  try {
    // Create unique filename with user folder structure for RLS
    const fileExt = file.name.split('.').pop();
    const fileName = `avatar-${Date.now()}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    // Upload file to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('user-data')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      return { url: null, error: { message: translateAuthError(uploadError.message) } };
    }

    // Get public URL
    const { data } = supabase.storage
      .from('user-data')
      .getPublicUrl(filePath);

    return { url: data.publicUrl, error: null };
  } catch (err) {
    return { url: null, error: { message: 'Ошибка загрузки аватара' } };
  }
};

/**
 * Delete avatar from Supabase Storage
 */
export const deleteAvatar = async (avatarUrl: string): Promise<{ error: AuthError | null }> => {
  try {
    // Extract file path from URL
    const urlParts = avatarUrl.split('/user-data/');
    if (urlParts.length < 2) {
      return { error: { message: 'Неверный URL аватара' } };
    }
    const filePath = urlParts[1];

    const { error } = await supabase.storage
      .from('user-data')
      .remove([filePath]);

    if (error) {
      return { error: { message: translateAuthError(error.message) } };
    }

    return { error: null };
  } catch (err) {
    return { error: { message: 'Ошибка удаления аватара' } };
  }
};
