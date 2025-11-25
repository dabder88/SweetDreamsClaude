import { supabase } from './supabaseClient';
import { User } from '../types';

export interface AuthError {
  message: string;
}

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
      return { user: null, error: { message: error.message } };
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
      return { user: null, error: { message: error.message } };
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
    const { error } = await supabase.auth.signOut();
    if (error) {
      return { error: { message: error.message } };
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
      return {
        id: user.id,
        email: user.email || '',
        created_at: user.created_at || new Date().toISOString(),
        name: user.user_metadata?.name,
        avatar_url: user.user_metadata?.avatar_url,
        gender: user.user_metadata?.gender,
        date_of_birth: user.user_metadata?.date_of_birth,
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
  return supabase.auth.onAuthStateChange((event, session) => {
    if (session?.user) {
      callback({
        id: session.user.id,
        email: session.user.email || '',
        created_at: session.user.created_at || new Date().toISOString(),
        name: session.user.user_metadata?.name,
        avatar_url: session.user.user_metadata?.avatar_url,
        gender: session.user.user_metadata?.gender,
        date_of_birth: session.user.user_metadata?.date_of_birth,
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
      return { error: { message: error.message } };
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
      return { error: { message: error.message } };
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
      return { error: { message: error.message } };
    }
    return { error: null };
  } catch (err) {
    return { error: { message: 'Ошибка смены email' } };
  }
};

/**
 * Update user metadata (name, avatar_url, gender, date_of_birth, etc.)
 */
export const updateUserMetadata = async (metadata: {
  name?: string;
  avatar_url?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  date_of_birth?: string;
}): Promise<{ error: AuthError | null }> => {
  try {
    const { error } = await supabase.auth.updateUser({
      data: metadata
    });
    if (error) {
      return { error: { message: error.message } };
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
    // Create unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    // Upload file to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('user-data')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      return { url: null, error: { message: uploadError.message } };
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
      return { error: { message: error.message } };
    }

    return { error: null };
  } catch (err) {
    return { error: { message: 'Ошибка удаления аватара' } };
  }
};
