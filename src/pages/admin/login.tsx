import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { supabase, TABLES } from "../../lib/supabase";
import { Link } from "wouter";
import { ArrowLeft, Shield } from "lucide-react";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const loginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      console.log('🔐 Attempting login with:', { email: credentials.email });
      console.log('🌐 Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
      console.log('🔑 Supabase Key (last 4 chars):', import.meta.env.VITE_SUPABASE_ANON_KEY?.slice(-4));
      
      // First, authenticate with Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      console.log('📡 Auth response:', { 
        success: !authError, 
        error: authError?.message,
        userId: authData?.user?.id 
      });

      if (authError) {
        console.error('❌ Authentication error:', authError);
        throw new Error(authError.message);
      }

      if (!authData.user) {
        console.error('❌ No user data returned');
        throw new Error("Authentication failed");
      }

      console.log('✅ User authenticated, checking admin privileges...');

      // Check if the user is an admin by querying the admin_users table
      const { data: adminData, error: adminError } = await supabase
        .from(TABLES.ADMIN_USERS)
        .select('*')
        .eq('user_id', authData.user.id)
        .single();

      console.log('🔍 Admin check result:', { 
        success: !adminError, 
        error: adminError?.message,
        adminData: adminData ? 'Found' : 'Not found'
      });

      if (adminError || !adminData) {
        // Sign out the user if they're not an admin
        await supabase.auth.signOut();
        console.error('❌ Admin check failed:', adminError?.message || 'No admin record found');
        throw new Error("Access denied. Admin privileges required.");
      }

      console.log('✅ Admin privileges verified successfully');

      return {
        token: authData.session?.access_token,
        admin: {
          id: authData.user.id,
          email: authData.user.email,
          ...adminData
        }
      };
    },
    onSuccess: (data) => {
      localStorage.setItem("adminToken", data.token || "");
      localStorage.setItem("adminUser", JSON.stringify(data.admin));
      
      console.log("Login Successful: Welcome to the admin dashboard");
      
      // Add a small delay to ensure session is established
      console.log('✅ Login successful, waiting for session to establish...');
      setTimeout(() => {
        console.log('🔄 Redirecting to dashboard...');
        window.location.href = "/admin/dashboard";
      }, 1000); // Wait 1 second for session to be established
    },
    onError: (error: any) => {
      console.error(`Login Failed: ${error.message || "Invalid credentials"}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      console.error("Missing Information: Please enter both email and password");
      return;
    }
    
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        {/* Back to main site */}
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Main Site
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-secondary" />
            </div>
            <CardTitle className="text-2xl">Admin Login</CardTitle>
            <p className="text-gray-600">Access the Kamkunji Ndogo admin portal</p>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Admin Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@kamkunjindogo.com"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              
              <Button
                type="submit"
                className="bg-primary hover:bg-primary/90"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "Logging in..." : "Login to Admin Portal"}
              </Button>
            </form>
            
            <div className="mt-6 text-center space-y-4">
              <div className="border-t pt-4">
                <p className="text-sm text-gray-600 mb-3">
                  Need admin access?
                </p>
                <div className="space-y-2">
                  <Link href="/admin/signup">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      Create Admin Account
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      alert("Please contact support to request admin access: info@kamkunjindogo.com");
                    }}
                  >
                    Request Admin Access
                  </Button>
                </div>
              </div>
              
              <p className="text-xs text-gray-500">
                This is a secure admin area. Authorized personnel only.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
