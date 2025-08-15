import { supabase } from './supabase';
import { TABLES } from './supabase';

// Types
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock_quantity: number;
  status: string;
  images: string[];
  specifications: any;
  created_at: string;
  updated_at: string;
  created_by: string;
  is_approved: boolean;
  seller_id: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  total_amount: number;
  status: string;
  payment_status: string;
  shipping_address: string;
  pickup_location: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface ItemSubmission {
  id: string;
  title: string;
  description: string;
  condition: string;
  category: string;
  price: number;
  seller_id: string;
  seller_name: string;
  seller_email: string;
  seller_phone: string;
  images: string[];
  location: string;
  specifications: any;
  status: string;
  admin_notes: string;
  submitted_at: string;
  reviewed_at: string;
  reviewed_by: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  is_seller: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  order_id: string;
  amount: number;
  payment_method: string;
  transaction_id: string;
  status: string;
  created_at: string;
}

export interface ShippingRate {
  id: string;
  location: string;
  rate: number;
  delivery_time: string;
  is_active: boolean;
  created_at: string;
}

export interface PickupPoint {
  id: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  hours: string;
  is_active: boolean;
  created_at: string;
}

// Product Management
export const productService = {
  // Get all products
  async getAllProducts(): Promise<Product[]> {
    const { data, error } = await supabase
      .from(TABLES.PRODUCTS)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get product by ID
  async getProductById(id: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from(TABLES.PRODUCTS)
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Create new product
  async createProduct(product: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product> {
    const { data, error } = await supabase
      .from(TABLES.PRODUCTS)
      .insert([product])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update product
  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    const { data, error } = await supabase
      .from(TABLES.PRODUCTS)
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete product
  async deleteProduct(id: string): Promise<void> {
    const { error } = await supabase
      .from(TABLES.PRODUCTS)
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Search products
  async searchProducts(query: string): Promise<Product[]> {
    const { data, error } = await supabase
      .from(TABLES.PRODUCTS)
      .select('*')
      .or(`name.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
};

// Order Management
export const orderService = {
  // Get all orders
  async getAllOrders(): Promise<Order[]> {
    const { data, error } = await supabase
      .from(TABLES.ORDERS)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get order by ID with items
  async getOrderById(id: string): Promise<{ order: Order; items: OrderItem[] } | null> {
    const { data: order, error: orderError } = await supabase
      .from(TABLES.ORDERS)
      .select('*')
      .eq('id', id)
      .single();

    if (orderError) throw orderError;

    const { data: items, error: itemsError } = await supabase
      .from(TABLES.ORDER_ITEMS)
      .select('*')
      .eq('order_id', id);

    if (itemsError) throw itemsError;

    return { order, items: items || [] };
  },

  // Update order status
  async updateOrderStatus(id: string, status: string): Promise<Order> {
    const { data, error } = await supabase
      .from(TABLES.ORDERS)
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get orders by status
  async getOrdersByStatus(status: string): Promise<Order[]> {
    const { data, error } = await supabase
      .from(TABLES.ORDERS)
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
};

// Item Submissions Management
export const submissionService = {
  // Get all submissions
  async getAllSubmissions(): Promise<ItemSubmission[]> {
    const { data, error } = await supabase
      .from(TABLES.ITEM_SUBMISSIONS)
      .select('*')
      .order('submitted_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get submissions by status
  async getSubmissionsByStatus(status: string): Promise<ItemSubmission[]> {
    const { data, error } = await supabase
      .from(TABLES.ITEM_SUBMISSIONS)
      .select('*')
      .eq('status', status)
      .order('submitted_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Approve submission
  async approveSubmission(id: string, adminId: string, notes?: string): Promise<ItemSubmission> {
    const { data, error } = await supabase
      .from(TABLES.ITEM_SUBMISSIONS)
      .update({ 
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewed_by: adminId,
        admin_notes: notes
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Reject submission
  async rejectSubmission(id: string, adminId: string, notes: string): Promise<ItemSubmission> {
    const { data, error } = await supabase
      .from(TABLES.ITEM_SUBMISSIONS)
      .update({ 
        status: 'rejected',
        reviewed_at: new Date().toISOString(),
        reviewed_by: adminId,
        admin_notes: notes
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

// User Management
export const userService = {
  // Get all users
  async getAllUsers(): Promise<UserProfile[]> {
    const { data, error } = await supabase
      .from(TABLES.USER_PROFILES)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get user by ID
  async getUserById(id: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from(TABLES.USER_PROFILES)
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Update user profile
  async updateUserProfile(id: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    const { data, error } = await supabase
      .from(TABLES.USER_PROFILES)
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Verify user
  async verifyUser(id: string): Promise<UserProfile> {
    const { data, error } = await supabase
      .from(TABLES.USER_PROFILES)
      .update({ is_verified: true })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

// Analytics and Statistics
export const analyticsService = {
  // Get dashboard stats
  async getDashboardStats() {
    const [
      productsCount,
      ordersCount,
      usersCount,
      submissionsCount,
      revenueData
    ] = await Promise.all([
      supabase.from(TABLES.PRODUCTS).select('id', { count: 'exact' }),
      supabase.from(TABLES.ORDERS).select('id', { count: 'exact' }),
      supabase.from(TABLES.USER_PROFILES).select('id', { count: 'exact' }),
      supabase.from(TABLES.ITEM_SUBMISSIONS).select('id', { count: 'exact' }).eq('status', 'pending_review'),
      supabase.from(TABLES.ORDERS).select('total_amount').eq('status', 'completed')
    ]);

    const totalRevenue = revenueData.data?.reduce((sum, order) => sum + order.total_amount, 0) || 0;

    return {
      totalProducts: productsCount.count || 0,
      totalOrders: ordersCount.count || 0,
      totalUsers: usersCount.count || 0,
      pendingSubmissions: submissionsCount.count || 0,
      totalRevenue
    };
  },

  // Get recent orders
  async getRecentOrders(limit: number = 5) {
    const { data, error } = await supabase
      .from(TABLES.ORDERS)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  // Get low stock products
  async getLowStockProducts(threshold: number = 10) {
    const { data, error } = await supabase
      .from(TABLES.PRODUCTS)
      .select('*')
      .lte('stock_quantity', threshold)
      .order('stock_quantity', { ascending: true });

    if (error) throw error;
    return data || [];
  }
};

// Real-time subscriptions
export const subscriptionService = {
  // Subscribe to orders
  subscribeToOrders(callback: (payload: any) => void) {
    return supabase
      .channel('orders')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: TABLES.ORDERS 
      }, callback)
      .subscribe();
  },

  // Subscribe to submissions
  subscribeToSubmissions(callback: (payload: any) => void) {
    return supabase
      .channel('submissions')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: TABLES.ITEM_SUBMISSIONS 
      }, callback)
      .subscribe();
  },

  // Subscribe to products
  subscribeToProducts(callback: (payload: any) => void) {
    return supabase
      .channel('products')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: TABLES.PRODUCTS 
      }, callback)
      .subscribe();
  }
};

// Admin activity logging
export const adminLogService = {
  async logActivity(adminId: string, action: string, tableName: string, recordId: string, details?: any) {
    const { error } = await supabase
      .from('admin_activity_log')
      .insert([{
        admin_id: adminId,
        action,
        table_name: tableName,
        record_id: recordId,
        details
      }]);

    if (error) console.error('Failed to log admin activity:', error);
  }
};
