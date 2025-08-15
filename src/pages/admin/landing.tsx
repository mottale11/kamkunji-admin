import { Link } from "wouter";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Shield, UserPlus, LogIn, ArrowLeft } from "lucide-react";

export default function AdminLanding() {
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
            <CardTitle className="text-2xl">Admin Portal</CardTitle>
            <p className="text-gray-600">Access the Kamkunji Ndogo admin system</p>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Link href="/admin/login">
                <Button className="w-full" size="lg">
                  <LogIn className="w-4 h-4 mr-2" />
                  Login to Admin
                </Button>
              </Link>
              
              <Link href="/admin/signup">
                <Button variant="outline" className="w-full" size="lg">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Create Admin Account
                </Button>
              </Link>
            </div>
            
            <div className="text-center space-y-4">
              <div className="border-t pt-4">
                <p className="text-sm text-gray-600 mb-3">
                  Need help?
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    alert("Please contact support: info@kamkunjindogo.com");
                  }}
                >
                  Contact Support
                </Button>
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
