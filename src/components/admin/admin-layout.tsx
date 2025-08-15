import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { Link, useLocation } from "wouter";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [admin, setAdmin] = useState<any>(null);
  const [location] = useLocation();

  // Get admin data from localStorage
  useState(() => {
    const userData = localStorage.getItem('adminUser');
    if (userData) {
      setAdmin(JSON.parse(userData));
    }
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    window.location.href = '/admin/login';
  };

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', color: 'bg-blue-500', path: '/admin/dashboard' },
    { id: 'products', label: 'Product Management', icon: '📦', color: 'bg-green-500', path: '/admin/products' },
    { id: 'orders', label: 'Order Management', icon: '🛒', color: 'bg-purple-500', path: '/admin/orders' },
    { id: 'analytics', label: 'Analytics', icon: '📈', color: 'bg-indigo-500', path: '/admin/analytics' },
    { id: 'submissions', label: 'Sell Requests', icon: '📝', color: 'bg-orange-500', path: '/admin/submissions' },
    { id: 'inventory', label: 'Inventory', icon: '📋', color: 'bg-teal-500', path: '/admin/inventory' },
    { id: 'payments', label: 'Payments & Payouts', icon: '💰', color: 'bg-yellow-500', path: '/admin/payments' },
    { id: 'shipping', label: 'Shipping & Pickup', icon: '🚚', color: 'bg-pink-500', path: '/admin/shipping' },
    { id: 'users', label: 'User Management', icon: '👥', color: 'bg-red-500', path: '/admin/users' },
    { id: 'settings', label: 'Settings', icon: '⚙️', color: 'bg-gray-500', path: '/admin/settings' },
  ];

  const isActive = (path: string) => {
    return location.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <div className="bg-white shadow-sm border-b">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-md hover:bg-gray-100"
              title="Toggle sidebar"
              aria-label="Toggle sidebar"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            <Link href="/admin/dashboard" className="text-xl font-bold text-gray-800">
              Kamkunji Store Admin
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                className="pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="absolute left-3 top-2.5 text-gray-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
            <div className="relative">
              <button className="p-2 text-gray-600 hover:text-gray-900" title="Notifications" aria-label="Notifications">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"></span>
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                {admin?.email?.charAt(0).toUpperCase() || 'A'}
              </div>
              <div className="text-sm">
                <div className="font-medium">{admin?.email || 'Admin'}</div>
                <div className="text-xs text-gray-500">Admin</div>
              </div>
              <button
                onClick={handleLogout}
                className="ml-2 p-2 text-gray-600 hover:text-red-600"
                title="Logout"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div
          className={`${
            isSidebarOpen ? 'w-64' : 'w-16'
          } bg-white border-r h-[calc(100vh-65px)] fixed transition-all duration-300 ease-in-out overflow-y-auto`}
        >
          <div className="p-4">
            <nav className="space-y-1">
              {navigationItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.path}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                    isActive(item.path)
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <span
                    className={`inline-flex items-center justify-center h-8 w-8 rounded-full ${item.color} text-white mr-3`}
                  >
                    {item.icon}
                  </span>
                  {isSidebarOpen && <span>{item.label}</span>}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div
          className={`flex-1 ${
            isSidebarOpen ? 'ml-64' : 'ml-16'
          } transition-all duration-300 ease-in-out p-6`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
