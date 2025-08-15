import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Edit, Trash2, Eye, Search, Filter, Upload, X, Image as ImageIcon, Package, Globe } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { productImageService } from "@/lib/imageUploadService";
import { productService, adminLogService } from "@/lib/supabaseService";
import { ecommerceIntegration } from "@/lib/ecommerceIntegration";
import React from "react";

export default function ProductManagement() {
  const queryClient = useQueryClient();
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState({ isConnected: false, subscriptionsCount: 0 });

  // Load products from Supabase
  const loadProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await productService.getAllProducts();
      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive",
      });
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Load products on component mount
  React.useEffect(() => {
    loadProducts();
    
    // Setup ecommerce integration
    ecommerceIntegration.setupRealTimeSync();
    
    // Update sync status periodically
    const statusInterval = setInterval(() => {
      setSyncStatus(ecommerceIntegration.getStatus());
    }, 2000);
    
    return () => {
      clearInterval(statusInterval);
      ecommerceIntegration.cleanupRealTimeSync();
    };
  }, []);

  const deleteProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      try {
        const { error } = await productService.deleteProduct(productId);
        if (error) throw error;
        
        // Sync product removal with ecommerce site
        await ecommerceIntegration.removeProductFromEcommerce(productId);
        
        // Log admin activity
        await adminLogService.logActivity({
          admin_id: localStorage.getItem('adminUserId') || '',
          action: 'DELETE_PRODUCT',
          table_name: 'products',
          record_id: productId,
          details: { action: 'Product deleted' }
        });
        
        return { success: true };
      } catch (error) {
        console.error('Delete error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Product Deleted",
        description: "Product has been successfully deleted from the ecommerce site",
      });
      loadProducts(); // Reload products
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to delete product: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    },
  });

  const filteredProducts = products.filter((product: any) => {
    const matchesSearch = product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !categoryFilter || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { text: "Out of Stock", variant: "destructive" as const };
    if (stock <= 5) return { text: "Low Stock", variant: "secondary" as const };
    return { text: "In Stock", variant: "default" as const };
  };

  const handleDeleteProduct = (productId: string, productName: string) => {
    if (window.confirm(`Are you sure you want to delete "${productName}"? This will remove it from the public ecommerce site.`)) {
      deleteProductMutation.mutate(productId);
    }
  };

  // Get unique categories from products
  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));

  if (showAddProduct || editingProduct) {
    return (
      <ProductForm
        product={editingProduct}
        onClose={() => {
          setShowAddProduct(false);
          setEditingProduct(null);
        }}
        onSuccess={() => {
          setShowAddProduct(false);
          setEditingProduct(null);
          loadProducts(); // Reload products after success
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products Management</h1>
          <p className="text-gray-600">Manage your product inventory</p>
        </div>
        <div className="flex items-center space-x-4">
          {/* Ecommerce Sync Status */}
          <div className="flex items-center space-x-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${syncStatus.isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className={syncStatus.isConnected ? 'text-green-600' : 'text-red-600'}>
              {syncStatus.isConnected ? 'Live Sync' : 'Offline'}
            </span>
            <Globe className="w-4 h-4 text-gray-400" />
          </div>
          
          <Button onClick={() => setShowAddProduct(true)} className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Search Products</Label>
              <Input
                id="search"
                placeholder="Search by title or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="category">Category Filter</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category: any) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setCategoryFilter("all");
                }}
                className="mt-1"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Products ({filteredProducts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="animate-pulse flex items-center space-x-4 p-4">
                  <div className="w-16 h-16 bg-gray-200 rounded"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No products found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProducts.map((product: any) => {
                    const stockStatus = getStockStatus(product.stock_quantity);
                    const category = categories.find(c => c === product.category);
                    
                    return (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {product.images?.[0] && (
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                className="h-10 w-10 rounded-lg object-cover mr-4"
                              />
                            )}
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {product.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {product.condition?.replace("_", " ")}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {category || "Unknown"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          KSh {parseFloat(product.price).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {product.stock_quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={stockStatus.variant}>
                            {stockStatus.text}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingProduct(product)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteProduct(product.id, product.name)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ProductForm({ product, onClose, onSuccess }: { 
  product?: any; 
  onClose: () => void; 
  onSuccess: () => void; 
}) {
  const [formData, setFormData] = useState({
    title: product?.name || "",
    description: product?.description || "",
    price: product?.price || "",
    originalPrice: product?.originalPrice || "",
    condition: product?.condition || "",
    stock: product?.stock_quantity || 1,
    categoryId: product?.category || "",
    images: product?.images || [],
    isFeatured: product?.isFeatured || false,
  });

  const [uploadedImages, setUploadedImages] = useState<string[]>(product?.images || []);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  // Get unique categories from existing products or use default ones
  const categories = [
    "Electronics",
    "Fashion",
    "Home & Garden", 
    "Sports",
    "Books",
    "Automotive",
    "Health & Beauty",
    "Toys & Games",
    "Jewelry",
    "Art & Collectibles"
  ];

  const saveMutation = useMutation({
    mutationFn: async (productData: any) => {
      try {
        // Upload new images to Supabase Storage first
        let imageUrls: string[] = [...uploadedImages]; // Keep existing images
        
        if (selectedFiles.length > 0) {
          setIsUploading(true);
          const uploadResults = await Promise.all(
            selectedFiles.map(file => productImageService.uploadImage(file))
          );
          imageUrls = [...imageUrls, ...uploadResults.map(result => result.url)];
        }

        // Create or update product in Supabase
        if (product) {
          // Update existing product
          const { data, error } = await productService.updateProduct(product.id, {
            name: productData.title,
            description: productData.description,
            price: parseFloat(productData.price),
            category: productData.categoryId,
            stock_quantity: parseInt(productData.stock),
            status: 'active',
            images: imageUrls,
            specifications: {
              condition: productData.condition,
              originalPrice: productData.originalPrice,
              isFeatured: productData.isFeatured
            },
            updated_at: new Date().toISOString()
          });
          
          if (error) throw error;
          
          // Sync update to ecommerce site
          await ecommerceIntegration.syncProductUpdateToEcommerce(product.id);
          
          // Log admin activity
          await adminLogService.logActivity({
            admin_id: localStorage.getItem('adminUserId') || '',
            action: 'UPDATE_PRODUCT',
            table_name: 'products',
            record_id: product.id,
            details: { product_title: productData.title }
          });
          
          return data;
        } else {
          // Create new product
          const { data, error } = await productService.createProduct({
            name: productData.title,
            description: productData.description,
            price: parseFloat(productData.price),
            category: productData.categoryId,
            stock_quantity: parseInt(productData.stock),
            status: 'active',
            images: imageUrls,
            specifications: {
              condition: productData.condition,
              originalPrice: productData.originalPrice,
              isFeatured: productData.isFeatured
            },
            is_approved: true,
            created_by: localStorage.getItem('adminUserId') || null
          });
          
          if (error) throw error;
          
          // Sync new product to ecommerce site
          if (data?.id) {
            await ecommerceIntegration.syncProductToEcommerce(data.id);
          }
          
          // Log admin activity
          await adminLogService.logActivity({
            admin_id: localStorage.getItem('adminUserId') || '',
            action: 'CREATE_PRODUCT',
            table_name: 'products',
            details: { product_title: productData.title }
          });
          
          return data;
        }
      } catch (error) {
        console.error('Error saving product:', error);
        throw error;
      } finally {
        setIsUploading(false);
      }
    },
    onSuccess: () => {
      console.log(`Product has been successfully ${product ? "updated" : "created"} and is now live on the ecommerce site!`);
      onSuccess();
    },
    onError: (error: any) => {
      console.error('Save error:', error);
      console.error(`Failed to ${product ? "update" : "create"} product: ${error.message || 'Unknown error'}`);
    },
  });

  const handleImageUpload = async (files: FileList) => {
    setIsUploading(true);
    try {
      const newFiles: File[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
          console.error("Invalid File: Please upload only image files");
          continue;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          console.error("File Too Large: Image must be less than 5MB");
          continue;
        }

        newFiles.push(file);
      }
      
      setSelectedFiles(prev => [...prev, ...newFiles]);
      
      // Create preview URLs for immediate display
      const previewUrls = newFiles.map(file => URL.createObjectURL(file));
      setUploadedImages(prev => [...prev, ...previewUrls]);
      
      console.log(`${newFiles.length} image(s) selected for upload`);
    } catch (error) {
      console.error("Upload Failed: Failed to process images");
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
    // Also remove from selectedFiles if it's a new file
    if (index >= uploadedImages.length - selectedFiles.length) {
      setSelectedFiles(prev => prev.filter((_, i) => i !== (index - (uploadedImages.length - selectedFiles.length))));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleImageUpload(files);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.price || !formData.categoryId) {
      console.error("Missing Information: Please fill in all required fields");
      return;
    }

    if (uploadedImages.length === 0) {
      console.error("Images Required: Please upload at least one product image");
      return;
    }

    saveMutation.mutate({
      ...formData,
      price: parseFloat(formData.price),
      originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : null,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">
          {product ? "Edit Product" : "Add New Product"}
        </h1>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <Label htmlFor="title">Product Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  required
                />
              </div>

              <div>
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category: any) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="condition">Condition *</Label>
                <Select
                  value={formData.condition}
                  onValueChange={(value) => setFormData({ ...formData, condition: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="like_new">Like New</SelectItem>
                    <SelectItem value="excellent">Excellent</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="price">Price (KSh) *</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div>
                <Label htmlFor="originalPrice">Original Price (KSh)</Label>
                <Input
                  id="originalPrice"
                  type="number"
                  value={formData.originalPrice}
                  onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <Label htmlFor="stock">Stock Quantity *</Label>
                <Input
                  id="stock"
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                  min="0"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <Label>Product Images *</Label>
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors"
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
                    className="hidden"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload" className="cursor-pointer">
                    <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-sm text-gray-600 mb-2">
                      <span className="font-medium text-primary hover:text-primary/80">
                        Click to upload
                      </span>{" "}
                      or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, GIF up to 5MB each
                    </p>
                  </label>
                </div>
              </div>

              {/* Image Preview */}
              {uploadedImages.length > 0 && (
                <div className="md:col-span-2">
                  <Label>Uploaded Images ({uploadedImages.length})</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-2">
                    {uploadedImages.map((imageUrl, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={imageUrl}
                          alt={`Product ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Remove image"
                          aria-label="Remove image"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="md:col-span-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isFeatured"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                    className="rounded"
                    title="Mark as featured product"
                  />
                  <Label htmlFor="isFeatured">Featured Product</Label>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saveMutation.isPending || isUploading}
                className="bg-primary hover:bg-primary/90"
              >
                {saveMutation.isPending
                  ? "Saving..."
                  : isUploading
                  ? "Uploading..."
                  : product
                  ? "Update Product"
                  : "Create Product"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
