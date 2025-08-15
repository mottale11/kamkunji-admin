import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { X, Plus, Minus, Trash2, ShoppingBag } from "lucide-react";
import { Link } from "wouter";
import { isUnauthorizedError } from "@/lib/authUtils";

interface ShoppingCartProps {
  onClose: () => void;
}

export default function ShoppingCart({ onClose }: ShoppingCartProps) {
  const queryClient = useQueryClient();

  const { data: cartItems = [], isLoading } = useQuery({
    queryKey: ["/api/cart"],
  });

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ productId, quantity }: { productId: string; quantity: number }) => {
      const response = await apiRequest("PUT", `/api/cart/${productId}`, { quantity });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        console.error("Unauthorized: You are logged out. Logging in again...");
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      console.error("Error: Failed to update cart item");
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: async (productId: string) => {
      const response = await apiRequest("DELETE", `/api/cart/${productId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      console.log("Item Removed: Item has been removed from your cart");
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        console.error("Unauthorized: You are logged out. Logging in again...");
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      console.error("Error: Failed to remove item from cart");
    },
  });

  const updateQuantity = (productId: string, currentQuantity: number, change: number) => {
    const newQuantity = currentQuantity + change;
    if (newQuantity < 1) return;
    
    updateQuantityMutation.mutate({ productId, quantity: newQuantity });
  };

  const removeItem = (productId: string) => {
    removeItemMutation.mutate(productId);
  };

  const total = cartItems.reduce((sum: number, item: any) => {
    return sum + (parseFloat(item.product?.price || "0") * item.quantity);
  }, 0);

  const totalItems = cartItems.reduce((sum: number, item: any) => sum + item.quantity, 0);

  const handleCheckout = () => {
    onClose();
    window.location.href = "/checkout";
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <CardHeader className="border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              Shopping Cart
              {totalItems > 0 && (
                <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                  {totalItems}
                </span>
              )}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-6 flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : cartItems.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Your cart is empty</h3>
              <p className="text-gray-600 mb-6">
                Add some amazing second-hand items to get started!
              </p>
              <Link href="/products">
                <Button onClick={onClose}>Browse Products</Button>
              </Link>
            </div>
          ) : (
            <>
              {/* Cart Items */}
              <div className="space-y-4 mb-6">
                {cartItems.map((item: any) => (
                  <div key={item.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                    {item.product?.images?.[0] && (
                      <img
                        src={item.product.images[0]}
                        alt={item.product.title}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-1">
                        {item.product?.title || "Unknown Product"}
                      </h4>
                      <p className="text-gray-600 text-sm mb-2">
                        KSh {item.product?.price ? parseFloat(item.product.price).toLocaleString() : "0"}
                      </p>
                      <p className="text-sm text-gray-500">
                        Condition: {item.product?.condition?.replace("_", " ") || "Unknown"}
                      </p>
                    </div>
                    
                    {/* Quantity Controls */}
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.productId, item.quantity, -1)}
                        disabled={updateQuantityMutation.isPending}
                        className="w-8 h-8 p-0"
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.productId, item.quantity, 1)}
                        disabled={updateQuantityMutation.isPending}
                        className="w-8 h-8 p-0"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    {/* Item Total */}
                    <div className="text-right min-w-[80px]">
                      <p className="font-medium text-gray-900">
                        KSh {(parseFloat(item.product?.price || "0") * item.quantity).toLocaleString()}
                      </p>
                    </div>
                    
                    {/* Remove Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(item.productId)}
                      disabled={removeItemMutation.isPending}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
              
              {/* Cart Summary */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <p className="text-sm text-gray-600">
                      {totalItems} item{totalItems !== 1 ? "s" : ""} in cart
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-900">Total:</p>
                    <p className="text-2xl font-bold text-primary">
                      KSh {total.toLocaleString()}
                    </p>
                  </div>
                </div>
                
                <Button
                  onClick={handleCheckout}
                  className="w-full bg-primary hover:bg-primary/90"
                  size="lg"
                >
                  Proceed to Checkout
                </Button>
                
                <p className="text-xs text-gray-500 text-center mt-2">
                  Secure checkout • Free shipping on orders over KSh 10,000
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
