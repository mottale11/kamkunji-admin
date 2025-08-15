import { api } from '@/lib/api';

// Define types for order data
export interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  product_image?: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface OrderAddress {
  full_name: string;
  email: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'refunded' | 'failed' | 'partially_refunded';
  payment_method: string;
  subtotal: number;
  shipping_fee: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  currency: string;
  notes?: string;
  tracking_number?: string;
  tracking_url?: string;
  items: OrderItem[];
  shipping_address: OrderAddress;
  billing_address?: OrderAddress;
  created_at: string;
  updated_at: string;
}

export interface OrderStats {
  total_orders: number;
  total_revenue: number;
  pending_orders: number;
  processing_orders: number;
  shipped_orders: number;
  delivered_orders: number;
  cancelled_orders: number;
  revenue_by_status: {
    pending: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
  };
  revenue_by_month: Array<{
    month: string;
    revenue: number;
    orders: number;
  }>;
  top_products: Array<{
    product_id: string;
    product_name: string;
    quantity: number;
    revenue: number;
  }>;
}

export interface OrderListParams {
  page?: number;
  limit?: number;
  status?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  search?: string;
  start_date?: string;
  end_date?: string;
}

export interface OrderListResponse {
  data: Order[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

export const orderService = {
  /**
   * Get a list of orders with optional filtering and pagination
   */
  getOrders: async (params?: OrderListParams): Promise<OrderListResponse> => {
    return api.get<OrderListResponse>('/admin/orders', { params });
  },

  /**
   * Get a single order by ID
   */
  getOrderById: async (orderId: string): Promise<Order> => {
    return api.get<Order>(`/admin/orders/${orderId}`);
  },

  /**
   * Update order status
   */
  updateOrderStatus: async (orderId: string, status: string, notes?: string): Promise<Order> => {
    return api.patch<Order>(`/admin/orders/${orderId}/status`, { status, notes });
  },

  /**
   * Update order shipping information
   */
  updateShippingInfo: async (
    orderId: string, 
    trackingNumber: string, 
    trackingUrl?: string
  ): Promise<Order> => {
    return api.patch<Order>(`/admin/orders/${orderId}/shipping`, {
      tracking_number: trackingNumber,
      tracking_url: trackingUrl,
    });
  },

  /**
   * Add a note to an order
   */
  addOrderNote: async (orderId: string, note: string, isCustomerNotified: boolean = false): Promise<Order> => {
    return api.post<Order>(`/admin/orders/${orderId}/notes`, {
      note,
      is_customer_notified: isCustomerNotified,
    });
  },

  /**
   * Get order statistics
   */
  getOrderStats: async (startDate?: string, endDate?: string): Promise<OrderStats> => {
    const params: any = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    
    return api.get<OrderStats>('/admin/orders/stats', { params });
  },

  /**
   * Export orders to CSV
   */
  exportOrders: async (params?: OrderListParams): Promise<Blob> => {
    const response = await api.get('/admin/orders/export', {
      params,
      responseType: 'blob',
    });
    return response as unknown as Blob;
  },

  /**
   * Get recent orders
   */
  getRecentOrders: async (limit: number = 5): Promise<Order[]> => {
    const response = await api.get<OrderListResponse>('/admin/orders/recent', {
      params: { limit },
    });
    return response.data;
  },

  /**
   * Get orders by status
   */
  getOrdersByStatus: async (status: string, limit: number = 10): Promise<Order[]> => {
    const response = await api.get<OrderListResponse>('/admin/orders', {
      params: { status, limit },
    });
    return response.data;
  },

  /**
   * Search orders
   */
  searchOrders: async (query: string, limit: number = 10): Promise<Order[]> => {
    const response = await api.get<OrderListResponse>('/admin/orders/search', {
      params: { query, limit },
    });
    return response.data;
  },

  /**
   * Get orders by customer ID
   */
  getOrdersByCustomer: async (customerId: string, limit: number = 10): Promise<Order[]> => {
    const response = await api.get<OrderListResponse>(`/admin/customers/${customerId}/orders`, {
      params: { limit },
    });
    return response.data;
  },

  /**
   * Cancel an order
   */
  cancelOrder: async (orderId: string, reason?: string): Promise<Order> => {
    return api.post<Order>(`/admin/orders/${orderId}/cancel`, { reason });
  },

  /**
   * Refund an order
   */
  refundOrder: async (orderId: string, amount: number, reason?: string): Promise<Order> => {
    return api.post<Order>(`/admin/orders/${orderId}/refund`, { amount, reason });
  },

  /**
   * Resend order confirmation email
   */
  resendConfirmation: async (orderId: string): Promise<{ success: boolean }> => {
    return api.post<{ success: boolean }>(`/admin/orders/${orderId}/resend-confirmation`);
  },

  /**
   * Get order timeline/activity
   */
  getOrderTimeline: async (orderId: string) => {
    return api.get(`/admin/orders/${orderId}/timeline`);
  },

  /**
   * Get order by order number
   */
  getOrderByNumber: async (orderNumber: string): Promise<Order> => {
    return api.get<Order>(`/admin/orders/number/${orderNumber}`);
  },

  /**
   * Update order billing/shipping address
   */
  updateOrderAddress: async (
    orderId: string, 
    addressType: 'shipping' | 'billing', 
    addressData: Partial<OrderAddress>
  ): Promise<Order> => {
    return api.put<Order>(`/admin/orders/${orderId}/address/${addressType}`, addressData);
  },

  /**
   * Get order count by status
   */
  getOrderCounts: async () => {
    return api.get<Record<string, number>>('/admin/orders/counts');
  },

  /**
   * Get revenue statistics
   */
  getRevenueStats: async (period: 'day' | 'week' | 'month' | 'year' = 'month') => {
    return api.get(`/admin/orders/revenue-stats?period=${period}`);
  },
};
