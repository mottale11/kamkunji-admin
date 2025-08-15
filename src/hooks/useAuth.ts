import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

interface Admin {
  id: string;
  email: string;
  role: string;
  permissions: any;
}

export function useAuth() {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Simple session check
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Session check result:', !!session, session?.user?.email);
        
        if (mounted && session?.user) {
          // Check admin status
          const { data: adminData, error: adminError } = await supabase
            .from('admin_users')
            .select('*')
            .eq('user_id', session.user.id)
            .single();
          
          console.log('Admin check result:', !!adminData, adminError?.message);
          
          if (adminData && !adminError) {
            setAdmin({
              id: session.user.id,
              email: session.user.email || '',
              role: adminData.role,
              permissions: adminData.permissions
            });
          }
        }
      } catch (error) {
        console.error('Session check error:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.email);
        
        if (!mounted) return;
        
        if (event === 'SIGNED_IN' && session?.user) {
          try {
            const { data: adminData, error: adminError } = await supabase
              .from('admin_users')
              .select('*')
              .eq('user_id', session.user.id)
              .single();
            
            if (adminData && !adminError) {
              setAdmin({
                id: session.user.id,
                email: session.user.email || '',
                role: adminData.role,
                permissions: adminData.permissions
              });
            }
          } catch (error) {
            console.error('Admin check error:', error);
          }
        } else if (event === 'SIGNED_OUT') {
          setAdmin(null);
        }
        
        setIsLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    setAdmin(null);
  };

  // Check if we have a valid session in localStorage as fallback
  const hasValidSession = () => {
    const token = localStorage.getItem('adminToken');
    const user = localStorage.getItem('adminUser');
    return !!(token && user);
  };

  console.log('useAuth state:', { 
    admin: !!admin, 
    isLoading, 
    isAuthenticated: !!admin || hasValidSession() 
  });

  return {
    admin,
    isLoading,
    isAuthenticated: !!admin || hasValidSession(),
    logout,
  };
}
