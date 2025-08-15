import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { supabase, TABLES } from "../../lib/supabase";
import { Link } from "wouter";
import { ArrowLeft, Shield, UserPlus } from "lucide-react";

export default function AdminSignup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const signupMutation = useMutation({
    mutationFn: async (userData: { 
      email: string; 
      password: string; 
      fullName: string; 
    }) => {
      console.log('🔐 Attempting admin signup for:', userData.email);
      
      // Step 1: Create user account with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            full_name: userData.fullName,
            role: 'admin'
          }
        }
      });

      if (authError) {
        console.error('❌ Auth signup failed:', authError);
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error("User creation failed");
      }

      console.log('✅ User account created, ID:', authData.user.id);

      // Step 2: Add to admin_users table
      const { data: adminData, error: adminError } = await supabase
        .from(TABLES.ADMIN_USERS)
        .insert({
          user_id: authData.user.id,
          role: 'admin',
          permissions: {
            can_manage_products: true,
            can_manage_orders: true,
            can_manage_users: true,
            can_manage_categories: true,
            can_view_analytics: true
          }
        })
        .select()
        .single();

      if (adminError) {
        console.error('❌ Admin record creation failed:', adminError);
        // Clean up the created user if admin creation fails
        await supabase.auth.admin.deleteUser(authData.user.id);
        throw new Error(`Failed to create admin record: ${adminError.message}`);
      }

      console.log('✅ Admin record created successfully');

      return {
        user: authData.user,
        admin: adminData
      };
    },
    onSuccess: (data) => {
      console.log("Admin Account Created! Please check your email to verify your account before logging in.");
      
      // Redirect to login page
      setTimeout(() => {
        window.location.href = "/admin/login";
      }, 2000);
    },
    onError: (error: any) => {
      console.error(`Signup Failed: ${error.message || "Failed to create admin account"}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!email || !password || !confirmPassword || !fullName) {
      console.error("Missing Information: Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      console.error("Password Mismatch: Passwords do not match");
      return;
    }

    if (password.length < 8) {
      console.error("Weak Password: Password must be at least 8 characters long");
      return;
    }

    setIsLoading(true);
    
    signupMutation.mutate({ 
      email, 
      password, 
      fullName 
    }, {
      onSettled: () => {
        setIsLoading(false);
      }
    });
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
              <UserPlus className="w-8 h-8 text-secondary" />
            </div>
            <CardTitle className="text-2xl">Admin Signup</CardTitle>
            <p className="text-gray-600">Create a new admin account for Kamkunji Ndogo</p>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  required
                />
              </div>

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
                  placeholder="Minimum 8 characters"
                  required
                />
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  required
                />
              </div>
              
              <Button
                type="submit"
                className="bg-primary hover:bg-primary/90 w-full"
                disabled={isLoading || signupMutation.isPending}
              >
                {isLoading || signupMutation.isPending ? "Creating Account..." : "Create Admin Account"}
              </Button>
            </form>
            
            <div className="mt-6 text-center space-y-4">
              <div className="border-t pt-4">
                <p className="text-sm text-gray-600 mb-3">
                  Already have an admin account?
                </p>
                <Link href="/admin/login">
                  <Button variant="outline" size="sm">
                    Go to Login
                  </Button>
                </Link>
              </div>
              
              <p className="text-xs text-gray-500">
                This will create a new admin account with full marketplace management privileges.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
