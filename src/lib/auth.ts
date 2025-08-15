import { supabase } from './supabase';

// Token storage key
const TOKEN_KEY = 'authToken';
const ADMIN_KEY = 'adminUser';

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  const token = getToken();
  return !!token;
};

// Get stored token
export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

// Set token in storage
export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

// Remove token from storage
export const removeToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

// Get admin user data
export const getAdminUser = (): any => {
  const user = localStorage.getItem(ADMIN_KEY);
  return user ? JSON.parse(user) : null;
};

// Set admin user data
const setAdminUser = (user: any): void => {
  localStorage.setItem(ADMIN_KEY, JSON.stringify(user));
};

// Clear all auth data
export const clearAuth = (): void => {
  removeToken();
  localStorage.removeItem(ADMIN_KEY);
};

// Login with email and password
export const login = async (email: string, password: string): Promise<{ user: any; session: any }> => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (data.session?.access_token) {
    setToken(data.session.access_token);
    
    // Get admin user data
    const { data: adminData, error: adminError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('user_id', data.user?.id)
      .single();

    if (adminError || !adminData) {
      await supabase.auth.signOut();
      clearAuth();
      throw new Error('Admin privileges not found');
    }

    setAdminUser({
      id: data.user?.id,
      email: data.user?.email,
      role: adminData.role,
      permissions: adminData.permissions,
    });
  }

  return data;
};

// Logout
export const logout = async (): Promise<void> => {
  try {
    await supabase.auth.signOut();
  } finally {
    clearAuth();
  }
};

// Get current session
export const getSession = async () => {
  const { data, error } = await supabase.auth.getSession();
  
  if (error) {
    clearAuth();
    throw error;
  }
  
  if (data.session) {
    setToken(data.session.access_token);
  } else {
    clearAuth();
  }
  
  return data.session;
};

// Check if current user has required role
export const hasRole = (requiredRole: string): boolean => {
  const user = getAdminUser();
  return user?.role === requiredRole;
};

// Check if current user has required permission
export const hasPermission = (requiredPermission: string): boolean => {
  const user = getAdminUser();
  return user?.permissions?.includes(requiredPermission) || false;
};
