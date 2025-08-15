import { apiClient } from '@/lib/api';

export const productService = {
  // Get all products
  getProducts: async () => {
    try {
      const response = await apiClient.get('/api/admin/products');
      return response.data;
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  },

  // Get a single product by ID
  getProductById: async (id: string) => {
    try {
      const response = await apiClient.get(`/api/admin/products/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching product ${id}:`, error);
      throw error;
    }
  },

  // Create a new product
  createProduct: async (productData: any) => {
    try {
      const response = await apiClient.post('/api/admin/products', productData);
      return response.data;
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  },

  // Update an existing product
  updateProduct: async (id: string, productData: any) => {
    try {
      const response = await apiClient.put(`/api/admin/products/${id}`, productData);
      return response.data;
    } catch (error) {
      console.error(`Error updating product ${id}:`, error);
      throw error;
    }
  },

  // Delete a product
  deleteProduct: async (id: string) => {
    try {
      const response = await apiClient.delete(`/api/admin/products/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting product ${id}:`, error);
      throw error;
    }
  },

  // Get product statistics
  getProductStats: async () => {
    try {
      const response = await apiClient.get('/api/admin/products/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching product stats:', error);
      throw error;
    }
  },

  // Update product status
  updateProductStatus: async (id: string, status: string) => {
    try {
      const response = await apiClient.patch(`/api/admin/products/${id}/status`, { status });
      return response.data;
    } catch (error) {
      console.error(`Error updating status for product ${id}:`, error);
      throw error;
    }
  },

  // Upload product image
  uploadProductImage: async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await apiClient.post('/api/admin/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } catch (error) {
      console.error('Error uploading product image:', error);
      throw error;
    }
  },

  // Search products
  searchProducts: async (query: string) => {
    try {
      const response = await apiClient.get('/api/admin/products/search', {
        params: { query },
      });
      return response.data;
    } catch (error) {
      console.error('Error searching products:', error);
      throw error;
    }
  },

  // Get products by category
  getProductsByCategory: async (categoryId: string) => {
    try {
      const response = await apiClient.get(`/api/admin/products/category/${categoryId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching products for category ${categoryId}:`, error);
      throw error;
    }
  },

  // Bulk update products
  bulkUpdateProducts: async (productIds: string[], updateData: any) => {
    try {
      const response = await apiClient.patch('/api/admin/products/bulk-update', {
        ids: productIds,
        ...updateData,
      });
      return response.data;
    } catch (error) {
      console.error('Error bulk updating products:', error);
      throw error;
    }
  },

  // Get product variants
  getProductVariants: async (productId: string) => {
    try {
      const response = await apiClient.get(`/api/admin/products/${productId}/variants`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching variants for product ${productId}:`, error);
      throw error;
    }
  },

  // Add product variant
  addProductVariant: async (productId: string, variantData: any) => {
    try {
      const response = await apiClient.post(
        `/api/admin/products/${productId}/variants`,
        variantData
      );
      return response.data;
    } catch (error) {
      console.error(`Error adding variant to product ${productId}:`, error);
      throw error;
    }
  },
};
