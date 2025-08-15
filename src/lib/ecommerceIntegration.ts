import { supabase } from './supabase';
import { productService, orderService, submissionService } from './supabaseService';

export interface EcommerceIntegration {
  // Product sync
  syncProductToEcommerce: (productId: string) => Promise<void>;
  syncProductUpdateToEcommerce: (productId: string) => Promise<void>;
  removeProductFromEcommerce: (productId: string) => Promise<void>;
  
  // Order sync
  syncOrderToEcommerce: (orderId: string) => Promise<void>;
  updateOrderStatusInEcommerce: (orderId: string, status: string) => Promise<void>;
  
  // Real-time updates
  setupRealTimeSync: () => void;
  cleanupRealTimeSync: () => void;
}

class EcommerceIntegrationService implements EcommerceIntegration {
  private subscriptions: any[] = [];
  private isConnected = false;

  /**
   * Sync a new product to the public ecommerce site
   */
  async syncProductToEcommerce(productId: string): Promise<void> {
    try {
      // Get the product details
      const { data: product, error } = await productService.getProductById(productId);
      if (error) throw error;

      if (!product) {
        throw new Error('Product not found');
      }

      // The product is automatically available on the ecommerce site
      // since both admin and ecommerce sites share the same Supabase database
      console.log(`Product ${product.name} synced to ecommerce site`);
      
      // You can add additional sync logic here if needed
      // For example, sending webhooks to external services
      
    } catch (error) {
      console.error('Error syncing product to ecommerce:', error);
      throw error;
    }
  }

  /**
   * Sync product updates to the public ecommerce site
   */
  async syncProductUpdateToEcommerce(productId: string): Promise<void> {
    try {
      // Get the updated product details
      const { data: product, error } = await productService.getProductById(productId);
      if (error) throw error;

      if (!product) {
        throw new Error('Product not found');
      }

      // The product update is automatically reflected on the ecommerce site
      // since both sites share the same database
      console.log(`Product ${product.name} update synced to ecommerce site`);
      
      // You can add additional sync logic here if needed
      
    } catch (error) {
      console.error('Error syncing product update to ecommerce:', error);
      throw error;
    }
  }

  /**
   * Remove a product from the public ecommerce site
   */
  async removeProductFromEcommerce(productId: string): Promise<void> {
    try {
      // The product removal is automatically reflected on the ecommerce site
      // since both sites share the same database
      console.log(`Product ${productId} removed from ecommerce site`);
      
      // You can add additional cleanup logic here if needed
      
    } catch (error) {
      console.error('Error removing product from ecommerce:', error);
      throw error;
    }
  }

  /**
   * Sync order information to the ecommerce site
   */
  async syncOrderToEcommerce(orderId: string): Promise<void> {
    try {
      // Get the order details
      const { data: order, error } = await orderService.getOrderById(orderId);
      if (error) throw error;

      if (!order) {
        throw new Error('Order not found');
      }

      // The order is automatically available on the ecommerce site
      console.log(`Order ${order.order_number} synced to ecommerce site`);
      
    } catch (error) {
      console.error('Error syncing order to ecommerce:', error);
      throw error;
    }
  }

  /**
   * Update order status in the ecommerce site
   */
  async updateOrderStatusInEcommerce(orderId: string, status: string): Promise<void> {
    try {
      // The order status update is automatically reflected on the ecommerce site
      console.log(`Order ${orderId} status updated to ${status} in ecommerce site`);
      
      // You can add additional notification logic here if needed
      
    } catch (error) {
      console.error('Error updating order status in ecommerce:', error);
      throw error;
    }
  }

  /**
   * Setup real-time synchronization between admin and ecommerce sites
   */
  setupRealTimeSync(): void {
    if (this.isConnected) return;

    try {
      // Subscribe to product changes
      const productsSubscription = supabase
        .channel('admin-ecommerce-sync')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'products'
          },
          (payload) => {
            console.log('Product change detected:', payload);
            this.handleProductChange(payload);
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders'
          },
          (payload) => {
            console.log('Order change detected:', payload);
            this.handleOrderChange(payload);
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'item_submissions'
          },
          (payload) => {
            console.log('Submission change detected:', payload);
            this.handleSubmissionChange(payload);
          }
        )
        .subscribe((status) => {
          console.log('Real-time sync status:', status);
          this.isConnected = status === 'SUBSCRIBED';
        });

      this.subscriptions.push(productsSubscription);
      
    } catch (error) {
      console.error('Error setting up real-time sync:', error);
    }
  }

  /**
   * Clean up real-time subscriptions
   */
  cleanupRealTimeSync(): void {
    this.subscriptions.forEach(subscription => {
      if (subscription && subscription.unsubscribe) {
        subscription.unsubscribe();
      }
    });
    this.subscriptions = [];
    this.isConnected = false;
  }

  /**
   * Handle product changes from real-time subscriptions
   */
  private handleProductChange(payload: any): void {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    switch (eventType) {
      case 'INSERT':
        console.log('New product added:', newRecord);
        // Product is automatically available on ecommerce site
        break;
      case 'UPDATE':
        console.log('Product updated:', newRecord);
        // Product update is automatically reflected on ecommerce site
        break;
      case 'DELETE':
        console.log('Product deleted:', oldRecord);
        // Product removal is automatically reflected on ecommerce site
        break;
    }
  }

  /**
   * Handle order changes from real-time subscriptions
   */
  private handleOrderChange(payload: any): void {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    switch (eventType) {
      case 'INSERT':
        console.log('New order created:', newRecord);
        // Order is automatically available on ecommerce site
        break;
      case 'UPDATE':
        console.log('Order updated:', newRecord);
        // Order update is automatically reflected on ecommerce site
        break;
      case 'DELETE':
        console.log('Order deleted:', oldRecord);
        // Order removal is automatically reflected on ecommerce site
        break;
    }
  }

  /**
   * Handle submission changes from real-time subscriptions
   */
  private handleSubmissionChange(payload: any): void {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    switch (eventType) {
      case 'INSERT':
        console.log('New submission received:', newRecord);
        // Submission is automatically available for admin review
        break;
      case 'UPDATE':
        console.log('Submission updated:', newRecord);
        // If approved, product is automatically available on ecommerce site
        break;
      case 'DELETE':
        console.log('Submission deleted:', oldRecord);
        break;
    }
  }

  /**
   * Get integration status
   */
  getStatus(): { isConnected: boolean; subscriptionsCount: number } {
    return {
      isConnected: this.isConnected,
      subscriptionsCount: this.subscriptions.length
    };
  }
}

// Export singleton instance
export const ecommerceIntegration = new EcommerceIntegrationService();

// Export the class for testing purposes
export { EcommerceIntegrationService };
