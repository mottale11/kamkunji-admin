import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import AdminLayout from "../../components/admin/admin-layout";
import { 
  productService, 
  orderService, 
  submissionService, 
  userService, 
  analyticsService,
  subscriptionService,
  adminLogService
} from "../../lib/supabaseService";
import { emailService } from "../../lib/emailService";
import { productImageService, submissionImageService } from "../../lib/imageUploadService";

export default function AdminDashboard() {
  const [admin, setAdmin] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalRevenue: 0,
    pendingSubmissions: 0,
    lowStockItems: 0
  });

  useEffect(() => {
    console.log('Dashboard component mounted');
    
    const checkAuth = async () => {
      try {
        console.log('Checking authentication...');
        
        // Check localStorage first
        const token = localStorage.getItem('adminToken');
        const userData = localStorage.getItem('adminUser');
        
        console.log('LocalStorage check:', { hasToken: !!token, hasUser: !!userData });
        
        if (token && userData) {
          console.log('Found localStorage data');
          setAdmin(JSON.parse(userData));
          setIsLoading(false);
          return;
        }

        // Check Supabase session
        console.log('Checking Supabase session...');
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Supabase session:', !!session, session?.user?.email);
        
        if (session?.user) {
          console.log('Session found, checking admin status...');
          const { data: adminData, error: adminError } = await supabase
            .from('admin_users')
            .select('*')
            .eq('user_id', session.user.id)
            .single();
          
          console.log('Admin data check:', { hasData: !!adminData, error: adminError?.message });
          
          if (adminData && !adminError) {
            const adminInfo = {
              id: session.user.id,
              email: session.user.email || '',
              role: adminData.role,
              permissions: adminData.permissions
            };
            
            console.log('Setting admin data:', adminInfo);
            localStorage.setItem('adminToken', session.access_token || '');
            localStorage.setItem('adminUser', JSON.stringify(adminInfo));
            setAdmin(adminInfo);
          } else {
            console.log('No admin data found');
            setError('Admin privileges not found');
          }
        } else {
          console.log('No session found');
          setError('No active session');
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setError('Authentication failed');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Load real data from Supabase
  useEffect(() => {
    if (admin) {
      loadDashboardData();
      setupRealTimeSubscriptions();
    }
  }, [admin]);

  const loadDashboardData = async () => {
    try {
      const [statsData, recentOrdersData] = await Promise.all([
        analyticsService.getDashboardStats(),
        analyticsService.getRecentOrders(5)
      ]);

      setStats({
        totalProducts: statsData.totalProducts,
        totalOrders: statsData.totalOrders,
        totalUsers: statsData.totalUsers,
        totalRevenue: statsData.totalRevenue,
        pendingSubmissions: statsData.pendingSubmissions,
        lowStockItems: 0 // Will be loaded separately
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  };

  const setupRealTimeSubscriptions = () => {
    // Subscribe to real-time updates
    const ordersSubscription = subscriptionService.subscribeToOrders((payload) => {
      console.log('Real-time order update:', payload);
      loadDashboardData(); // Refresh data
    });

    const submissionsSubscription = subscriptionService.subscribeToSubmissions((payload) => {
      console.log('Real-time submission update:', payload);
      loadDashboardData(); // Refresh data
    });

    const productsSubscription = subscriptionService.subscribeToProducts((payload) => {
      console.log('Real-time product update:', payload);
      loadDashboardData(); // Refresh data
    });

    // Cleanup subscriptions on unmount
    return () => {
      ordersSubscription?.unsubscribe();
      submissionsSubscription?.unsubscribe();
      productsSubscription?.unsubscribe();
    };
  };

  console.log('Dashboard render state:', { isLoading, admin: !!admin, error });

  // Show loading
  if (isLoading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>Loading Dashboard...</h1>
        <p>Please wait while we check your authentication...</p>
      </div>
    );
  }

  // Show error
  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>Authentication Error</h1>
        <p style={{ color: 'red' }}>{error}</p>
        <button 
          onClick={() => window.location.href = '/admin/login'}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Go to Login
        </button>
      </div>
    );
  }

  // Show dashboard with layout
  if (admin) {
    return (
      <AdminLayout activeSection={activeSection} onSectionChange={setActiveSection}>
        {activeSection === 'dashboard' && (
          <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Dashboard</h1>
                <p className="text-muted-foreground">Welcome back, Admin</p>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="text-sm font-medium">
                    Total Revenue
                  </div>
                  <div className="h-4 w-4 text-muted-foreground">
                    $
                  </div>
                </div>
                <div className="text-2xl font-bold">{stats.totalRevenue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  +20.1% from last month
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="text-sm font-medium">
                    Total Orders
                  </div>
                  <div className="h-4 w-4 text-muted-foreground">
                    &#128722;
                  </div>
                </div>
                <div className="text-2xl font-bold">{stats.totalOrders}</div>
                <p className="text-xs text-muted-foreground">
                  +12.5% from last month
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="text-sm font-medium">
                    Pending Orders
                  </div>
                  <div className="h-4 w-4 text-muted-foreground">
                    &#128722;
                  </div>
                </div>
                <div className="text-2xl font-bold">{stats.pendingSubmissions}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.pendingSubmissions > 0 ? 'Needs attention' : 'All caught up!'}
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="text-sm font-medium">
                    Total Products
                  </div>
                  <div className="h-4 w-4 text-muted-foreground">
                    &#128722;
                  </div>
                </div>
                <div className="text-2xl font-bold">{stats.totalProducts}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.totalProducts > 0 ? 'Active products' : 'No products yet'}
                </p>
              </div>
            </div>

            {/* Recent Orders */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <div className="bg-white p-6 rounded-lg shadow-sm border col-span-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">
                      Recent Orders
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Latest transactions and orders
                    </div>
                  </div>
                  <button 
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    View All
                  </button>
                </div>
                <div className="space-y-4">
                  {/* Recent orders will be loaded here */}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="col-span-3 space-y-4">
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="text-sm font-medium">
                    Quick Actions
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Common tasks and shortcuts
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    >
                      Add Product
                    </button>
                    
                    <button 
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    >
                      View Orders
                    </button>
                    
                    <button 
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    >
                      Manage Inventory
                    </button>
                    
                    <button 
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    >
                      View Analytics
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {activeSection === 'products' && <ProductManagement />}
        {activeSection === 'orders' && <OrderManagement />}
        {activeSection === 'analytics' && <AnalyticsDashboard />}
        {activeSection === 'submissions' && <SubmissionsManagement />}
        {activeSection === 'inventory' && <InventoryManagement />}
        {activeSection === 'payments' && <PaymentsManagement />}
        {activeSection === 'shipping' && <ShippingManagement />}
        {activeSection === 'users' && <UserManagement />}
        {activeSection === 'settings' && <SettingsManagement />}
      </AdminLayout>
    );
  }

  // Fallback
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Dashboard Error</h1>
      <p>Something went wrong. Please try logging in again.</p>
      <button 
        onClick={() => window.location.href = '/admin/login'}
        style={{ 
          padding: '10px 20px', 
          backgroundColor: '#007bff', 
          color: 'white', 
          border: 'none', 
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        Go to Login
      </button>
    </div>
  );
}

// Product Management Component
function ProductManagement() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Form state for new product
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock_quantity: '',
    status: 'active',
    specifications: {}
  });
  
  // Image upload state
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);

  // Load products from Supabase
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await productService.getAllProducts();
      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
      // Fallback to mock data if Supabase fails
      setProducts([
        {
          id: 1,
          name: "iPhone 13",
          category: "Electronics",
          price: 120000,
          stock_quantity: 15,
          status: "active",
          description: "Latest iPhone with A15 Bionic chip",
          images: ["iphone13.jpg"]
        },
        {
          id: 2,
          name: "Samsung Galaxy S21",
          category: "Electronics",
          price: 95000,
          stock_quantity: 8,
          status: "active",
          description: "Android flagship smartphone",
          images: ["galaxy-s21.jpg"]
        },
        {
          id: 3,
          name: "MacBook Pro M1",
          category: "Electronics",
          price: 250000,
          stock_quantity: 5,
          status: "low_stock",
          description: "Apple Silicon MacBook Pro",
          images: ["macbook-pro.jpg"]
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddProduct = () => {
    setShowAddModal(true);
    setNewProduct({
      name: '',
      description: '',
      price: '',
      category: '',
      stock_quantity: '',
      status: 'active',
      specifications: {}
    });
    setSelectedImages([]);
    setImagePreviewUrls([]);
  };

  const handleEditProduct = (product: any) => {
    setSelectedProduct(product);
    setShowEditModal(true);
  };

  const handleDeleteProduct = async (productId: string) => {
    if (confirm(`Are you sure you want to delete this product?`)) {
      try {
        await productService.deleteProduct(productId);
        await loadProducts(); // Reload products
        alert('Product deleted successfully!');
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Failed to delete product');
      }
    }
  };

  // Handle image selection
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedImages(files);
    
    // Create preview URLs
    const urls = files.map(file => URL.createObjectURL(file));
    setImagePreviewUrls(urls);
  };

  // Remove image
  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  // Handle form submission
  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newProduct.name || !newProduct.price || !newProduct.category) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setUploading(true);
      
      // Upload images first
      let imageUrls: string[] = [];
      if (selectedImages.length > 0) {
        const uploadResults = await Promise.all(
          selectedImages.map(file => productImageService.uploadImage(file))
        );
        imageUrls = uploadResults.map(result => result.url);
      }

      // Create product in database
      const productData = {
        name: newProduct.name,
        description: newProduct.description,
        price: parseFloat(newProduct.price),
        category: newProduct.category,
        stock_quantity: parseInt(newProduct.stock_quantity) || 0,
        status: newProduct.status,
        images: imageUrls,
        specifications: newProduct.specifications,
        is_approved: true, // Admin products are auto-approved
        created_by: localStorage.getItem('adminUserId') || null
      };

      await productService.createProduct(productData);
      
      // Log admin activity
      await adminLogService.logActivity({
        admin_id: localStorage.getItem('adminUserId') || '',
        action: 'CREATE_PRODUCT',
        table_name: 'products',
        details: { product_name: newProduct.name }
      });

      // Reload products and close modal
      await loadProducts();
      setShowAddModal(false);
      alert('Product added successfully!');
      
      // Clear form
      setNewProduct({
        name: '',
        description: '',
        price: '',
        category: '',
        stock_quantity: '',
        status: 'active',
        specifications: {}
      });
      setSelectedImages([]);
      setImagePreviewUrls([]);
      
    } catch (error) {
      console.error('Error adding product:', error);
      alert('Failed to add product. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Product Management</h1>
        <button 
          onClick={handleAddProduct}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
        >
          + Add New Product
        </button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">All Products</h2>
          <input 
            type="text" 
            placeholder="Search products..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Search products"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map((product) => (
                <tr key={product.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gray-200 rounded-lg mr-3"></div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        <div className="text-sm text-gray-500">{product.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.category}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">KSh {product.price.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.stock}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      product.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {product.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                      onClick={() => handleEditProduct(product)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteProduct(product.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Add New Product</h2>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <form className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter product name"
                    aria-label="Product name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Product category">
                    <option value="">Select category</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Fashion">Fashion</option>
                    <option value="Home">Home & Garden</option>
                    <option value="Sports">Sports</option>
                    <option value="Books">Books</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (KSh)</label>
                  <input 
                    type="number" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                    aria-label="Product price"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
                  <input 
                    type="number" 
                    className="w-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                    aria-label="Stock quantity"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Enter product description"
                  aria-label="Product description"
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Images</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <span className="text-4xl">📷</span>
                  <p className="mt-2 text-gray-600">Click to upload images</p>
                  <p className="text-sm text-gray-500">PNG, JPG up to 10MB</p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                >
                  Add Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Edit Product</h2>
              <button 
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <form className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                  <input 
                    type="text" 
                    defaultValue={selectedProduct.name}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Product name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select 
                    defaultValue={selectedProduct.category}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Product category"
                  >
                    <option value="Electronics">Electronics</option>
                    <option value="Fashion">Fashion</option>
                    <option value="Home">Home & Garden</option>
                    <option value="Sports">Sports</option>
                    <option value="Books">Books</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (KSh)</label>
                  <input 
                    type="number" 
                    defaultValue={selectedProduct.price}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Product price"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
                  <input 
                    type="number" 
                    defaultValue={selectedProduct.stock}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Stock quantity"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea 
                  defaultValue={selectedProduct.description}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  aria-label="Product description"
                ></textarea>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button 
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Update Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Order Management Component
function OrderManagement() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      let ordersData;
      
      if (statusFilter === 'all') {
        ordersData = await orderService.getAllOrders();
      } else {
        ordersData = await orderService.getOrdersByStatus(statusFilter);
      }
      
      setOrders(ordersData);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewOrder = async (orderId: string) => {
    try {
      const orderData = await orderService.getOrderById(orderId);
      if (orderData) {
        setSelectedOrder(orderData);
        setShowOrderModal(true);
      }
    } catch (error) {
      console.error('Failed to load order details:', error);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      setUpdatingStatus(orderId);
      await orderService.updateOrderStatus(orderId, newStatus);
      
      // Send email notification to customer
      const order = orders.find(o => o.id === orderId);
      if (order) {
        await emailService.sendOrderStatusEmail(
          order.customer_email,
          order.customer_name,
          order.order_number,
          newStatus
        );
      }
      
      // Log admin activity
      await adminLogService.logActivity(
        localStorage.getItem('adminUser') ? JSON.parse(localStorage.getItem('adminUser')!).id : '',
        'order_status_updated',
        'orders',
        orderId,
        { oldStatus: order?.status, newStatus }
      );
      
      // Refresh orders
      await loadOrders();
    } catch (error) {
      console.error('Failed to update order status:', error);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'processing': 'bg-blue-100 text-blue-800',
      'shipped': 'bg-purple-100 text-purple-800',
      'delivered': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
        <div className="flex space-x-2">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Filter orders by status"
          >
            <option value="all">All Orders</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading orders...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {order.order_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{order.customer_name}</div>
                        <div className="text-sm text-gray-500">{order.customer_email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      KSh {order.total_amount?.toLocaleString() || '0'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                        {order.status?.charAt(0).toUpperCase() + order.status?.slice(1) || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button 
                        onClick={() => handleViewOrder(order.id)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        View Details
                      </button>
                      <select
                        value={order.status}
                        onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                        disabled={updatingStatus === order.id}
                        className="text-sm border border-gray-300 rounded px-2 py-1"
                        aria-label={`Update status for order ${order.order_number}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-gray-900">
                Order #{selectedOrder.order.order_number}
              </h2>
              <button 
                onClick={() => setShowOrderModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Order Information */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Order Information</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Order Number:</strong> {selectedOrder.order.order_number}</p>
                  <p><strong>Status:</strong> {selectedOrder.order.status}</p>
                  <p><strong>Payment Status:</strong> {selectedOrder.order.payment_status}</p>
                  <p><strong>Total Amount:</strong> KSh {selectedOrder.order.total_amount?.toLocaleString()}</p>
                  <p><strong>Order Date:</strong> {new Date(selectedOrder.order.created_at).toLocaleDateString()}</p>
                </div>

                <h3 className="font-semibold text-gray-900 mb-3 mt-6">Customer Information</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Name:</strong> {selectedOrder.order.customer_name}</p>
                  <p><strong>Email:</strong> {selectedOrder.order.customer_email}</p>
                  <p><strong>Phone:</strong> {selectedOrder.order.customer_phone || 'Not provided'}</p>
                  <p><strong>Shipping Address:</strong> {selectedOrder.order.shipping_address || 'Not provided'}</p>
                  <p><strong>Pickup Location:</strong> {selectedOrder.order.pickup_location || 'Not specified'}</p>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Order Items</h3>
                <div className="space-y-3">
                  {selectedOrder.items.map((item: any) => (
                    <div key={item.id} className="bg-gray-50 p-3 rounded">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">{item.product_name}</p>
                          <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">KSh {item.unit_price?.toLocaleString()}</p>
                          <p className="text-sm text-gray-600">Total: KSh {item.total_price?.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded">
                  <h4 className="font-semibold text-blue-900 mb-2">Quick Actions</h4>
                  <div className="space-y-2">
                    <select
                      value={selectedOrder.order.status}
                      onChange={(e) => handleUpdateStatus(selectedOrder.order.id, e.target.value)}
                      className="w-full px-3 py-2 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      aria-label="Update order status"
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
              <button 
                onClick={() => setShowOrderModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Analytics Dashboard Component
function AnalyticsDashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Sales Overview</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Today's Sales</span>
              <span className="font-semibold">KSh 45,000</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">This Week</span>
              <span className="font-semibold">KSh 320,000</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">This Month</span>
              <span className="font-semibold">KSh 1,250,000</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Products</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">iPhone 13</span>
              <span className="font-semibold">45 units sold</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Samsung Galaxy</span>
              <span className="font-semibold">32 units sold</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">MacBook Pro</span>
              <span className="font-semibold">28 units sold</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Submissions Management Component
function SubmissionsManagement() {
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  const mockSubmissions = [
    {
      id: 1,
      title: "Gaming Laptop",
      description: "High-performance gaming laptop with RTX 3060, 16GB RAM, 512GB SSD. Used for 1 year, excellent condition.",
      condition: "Used - Excellent",
      category: "Electronics",
      price: 85000,
      seller: {
        name: "Jane Smith",
        email: "jane@example.com",
        phone: "+254700123456"
      },
      images: ["laptop1.jpg", "laptop2.jpg"],
      location: "Westlands, Nairobi",
      submittedDate: "2024-01-15",
      specifications: {
        brand: "ASUS",
        model: "ROG Strix G15",
        processor: "AMD Ryzen 7 5800H",
        graphics: "NVIDIA RTX 3060",
        ram: "16GB DDR4",
        storage: "512GB NVMe SSD"
      }
    },
    {
      id: 2,
      title: "iPhone 13 Pro",
      description: "iPhone 13 Pro 128GB, Sierra Blue. Perfect condition, comes with original box and accessories.",
      condition: "Used - Like New",
      category: "Electronics",
      price: 95000,
      seller: {
        name: "John Doe",
        email: "john@example.com",
        phone: "+254700654321"
      },
      images: ["iphone1.jpg", "iphone2.jpg"],
      location: "Kilimani, Nairobi",
      submittedDate: "2024-01-14",
      specifications: {
        brand: "Apple",
        model: "iPhone 13 Pro",
        storage: "128GB",
        color: "Sierra Blue",
        condition: "Like New"
      }
    }
  ];

  const handleViewDetails = (item: any) => {
    setSelectedItem(item);
    setShowModal(true);
  };

  const handleApprove = (itemId: number) => {
    // Here you would implement the approval logic
    alert(`Item ${itemId} approved and posted to public site!`);
  };

  const handleReject = (itemId: number) => {
    // Here you would implement the rejection logic
    alert(`Item ${itemId} rejected. Seller will be notified.`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Sell Item Requests</h1>
        <div className="text-sm text-gray-600">
          {mockSubmissions.length} pending submissions
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seller</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mockSubmissions.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gray-200 rounded-lg mr-3"></div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{item.title}</div>
                        <div className="text-sm text-gray-500">{item.condition}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{item.seller.name}</div>
                      <div className="text-sm text-gray-500">{item.seller.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.category}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">KSh {item.price.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      Pending Review
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                      onClick={() => handleViewDetails(item)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      View Details
                    </button>
                    <button 
                      onClick={() => handleApprove(item.id)}
                      className="text-green-600 hover:text-green-900 mr-3"
                    >
                      Approve
                    </button>
                    <button 
                      onClick={() => handleReject(item.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Item Details Modal */}
      {showModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-gray-900">{selectedItem.title}</h2>
              <button 
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Images and Basic Info */}
              <div>
                <div className="bg-gray-100 rounded-lg p-4 mb-4">
                  <div className="text-center text-gray-500">
                    <span className="text-4xl">📷</span>
                    <p className="mt-2">Product Images</p>
                    <p className="text-sm">({selectedItem.images.length} images)</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <span className="font-medium text-gray-700">Price:</span>
                    <span className="ml-2 text-lg font-bold text-green-600">KSh {selectedItem.price.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Category:</span>
                    <span className="ml-2">{selectedItem.category}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Condition:</span>
                    <span className="ml-2">{selectedItem.condition}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Location:</span>
                    <span className="ml-2">{selectedItem.location}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Submitted:</span>
                    <span className="ml-2">{selectedItem.submittedDate}</span>
                  </div>
                </div>
              </div>

              {/* Right Column - Description and Specifications */}
              <div>
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-700">{selectedItem.description}</p>
                </div>

                <div className="mb-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Seller Information</h3>
                  <div className="bg-gray-50 p-3 rounded">
                    <p><strong>Name:</strong> {selectedItem.seller.name}</p>
                    <p><strong>Email:</strong> {selectedItem.seller.email}</p>
                    <p><strong>Phone:</strong> {selectedItem.seller.phone}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Specifications</h3>
                  <div className="bg-gray-50 p-3 rounded">
                    {Object.entries(selectedItem.specifications).map(([key, value]) => (
                      <p key={key}><strong>{key.charAt(0).toUpperCase() + key.slice(1)}:</strong> {value}</p>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
              <button 
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
              <button 
                onClick={() => handleReject(selectedItem.id)}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Reject Item
              </button>
              <button 
                onClick={() => handleApprove(selectedItem.id)}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                Approve & Post to Site
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Inventory Management Component
function InventoryManagement() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Low Stock Alert</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">iPhone 13</span>
              <span className="font-semibold text-red-600">5 left</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">AirPods Pro</span>
              <span className="font-semibold text-red-600">3 left</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Stock Movements</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Today</span>
              <span className="font-semibold text-green-600">+15 items</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">This Week</span>
              <span className="font-semibold text-blue-600">+45 items</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Categories</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Electronics</span>
              <span className="font-semibold">89 items</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Fashion</span>
              <span className="font-semibold">67 items</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Payments Management Component
function PaymentsManagement() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Payments & Payouts</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Summary</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Revenue</span>
              <span className="font-semibold text-green-600">KSh 1,250,000</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Pending Payouts</span>
              <span className="font-semibold text-yellow-600">KSh 45,000</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Processing Fees</span>
              <span className="font-semibold text-red-600">KSh 12,500</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Order #1234</span>
              <span className="font-semibold text-green-600">+KSh 135,000</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Payout to Seller</span>
              <span className="font-semibold text-red-600">-KSh 85,000</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Shipping Management Component
function ShippingManagement() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Shipping & Pickup Management</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Shipping Rates</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Nairobi</span>
              <span className="font-semibold">KSh 500</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Mombasa</span>
              <span className="font-semibold">KSh 800</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Kisumu</span>
              <span className="font-semibold">KSh 600</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Pickup Points</h2>
          <div className="space-y-3">
            <div className="text-sm">
              <div className="font-medium text-gray-900">Westlands Mall</div>
              <div className="text-gray-500">Westlands, Nairobi</div>
            </div>
            <div className="text-sm">
              <div className="font-medium text-gray-900">Two Rivers Mall</div>
              <div className="text-gray-500">Ruiru, Nairobi</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// User Management Component
function UserManagement() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
          + Add New User
        </button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">All Users</h2>
          <input 
            type="text" 
            placeholder="Search users..." 
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gray-200 rounded-full mr-3"></div>
                    <div className="text-sm font-medium text-gray-900">John Doe</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">john@example.com</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Customer</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    Active
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button className="text-blue-600 hover:text-blue-900 mr-3">Edit</button>
                  <button className="text-red-600 hover:text-red-900">Suspend</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Settings Management Component
function SettingsManagement() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">General Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Site Name</label>
              <input 
                type="text" 
                defaultValue="Kamkunji Ndogo" 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Contact Email</label>
              <input 
                type="email" 
                defaultValue="admin@kamkunji.com" 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
              Save Changes
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Security Settings</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Two-Factor Authentication</span>
              <button className="px-3 py-1 bg-green-500 text-white text-sm rounded-md">Enabled</button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Session Timeout</span>
              <select className="px-3 py-1 border border-gray-300 rounded-md">
                <option>30 minutes</option>
                <option>1 hour</option>
                <option>2 hours</option>
              </select>
            </div>
            <button className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
              Update Security
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
