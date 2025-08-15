import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Eye, Package, Search, Filter, Calendar, Truck, MapPin, Phone, Mail, User, CreditCard, Clock } from "lucide-react";

export default function OrderManagement() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["/api/admin/orders"],
    meta: {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
      },
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
        body: JSON.stringify({ status }),
      });
      
      if (!response.ok) throw new Error("Failed to update order status");
      return response.json();
    },
    onSuccess: () => {
      console.log("Order Updated: Order status has been successfully updated");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
    },
    onError: () => {
      console.error("Error: Failed to update order status");
    },
  });

  const updateDeliveryMutation = useMutation({
    mutationFn: async ({ orderId, deliveryDetails }: { orderId: string; deliveryDetails: any }) => {
      const response = await fetch(`/api/admin/orders/${orderId}/delivery`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
        body: JSON.stringify(deliveryDetails),
      });
      
      if (!response.ok) throw new Error("Failed to update delivery details");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Delivery Updated",
        description: "Delivery details have been successfully updated",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update delivery details",
        variant: "destructive",
      });
    },
  });

  const filteredOrders = orders.filter((order: any) => {
    const matchesSearch = 
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerEmail.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "pending":
        return "secondary";
      case "processing":
        return "default";
      case "shipped":
        return "outline";
      case "delivered":
        return "default";
      case "cancelled":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const handleStatusUpdate = (orderId: string, newStatus: string) => {
    updateStatusMutation.mutate({ orderId, status: newStatus });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (selectedOrder) {
    return <OrderDetails order={selectedOrder} onBack={() => setSelectedOrder(null)} onUpdateDelivery={updateDeliveryMutation.mutate} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Management</h1>
        <p className="text-gray-600">Manage customer orders and delivery details</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
              placeholder="Search orders by number, customer name, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              />
            </div>
        </div>
        <div className="sm:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
              <SelectItem value="">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            </div>

      {/* Orders List */}
      <div className="grid gap-4">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600">No orders found</p>
        </CardContent>
      </Card>
        ) : (
          filteredOrders.map((order: any) => (
            <Card key={order.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Order #{order.orderNumber}
                      </h3>
                      <Badge variant={getStatusVariant(order.status) as any}>
                        {order.status}
                      </Badge>
                  </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>{order.customerName}</span>
                </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        <span>{order.customerEmail}</span>
            </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        <span>{order.customerPhone}</span>
            </div>
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        <span>KSh {parseFloat(order.total).toLocaleString()}</span>
                        </div>
                        </div>
                    <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                      <Clock className="h-4 w-4" />
                      <span>{formatDate(order.createdAt)}</span>
                        </div>
                        </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedOrder(order)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                        <Select
                          value={order.status}
                      onValueChange={(newStatus) => handleStatusUpdate(order.id, newStatus)}
                        >
                          <SelectTrigger className="w-32">
                        <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="processing">Processing</SelectItem>
                            <SelectItem value="shipped">Shipped</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                  </div>
            </div>
        </CardContent>
      </Card>
          ))
        )}
      </div>
    </div>
  );
}

function OrderDetails({ order, onBack, onUpdateDelivery }: { 
  order: any; 
  onBack: () => void;
  onUpdateDelivery: (data: { orderId: string; deliveryDetails: any }) => void;
}) {
  const [deliveryDetails, setDeliveryDetails] = useState({
    trackingNumber: order.trackingNumber || "",
    courierName: order.courierName || "",
    estimatedDelivery: order.estimatedDelivery || "",
    deliveryNotes: order.deliveryNotes || "",
  });

  const handleDeliveryUpdate = () => {
    onUpdateDelivery({
      orderId: order.id,
      deliveryDetails,
    });
  };

  // Mock order items data - in real app, this would come from the API
  const orderItems = [
    {
      id: "1",
      productId: "prod1",
      productName: "iPhone 13 Pro",
      quantity: 1,
      pricePerItem: 120000,
      total: 120000,
      productImage: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=100&h=100&fit=crop"
    },
    {
      id: "2", 
      productId: "prod2",
      productName: "MacBook Air M2",
      quantity: 1,
      pricePerItem: 180000,
      total: 180000,
      productImage: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=100&h=100&fit=crop"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Order Details</h1>
          <p className="text-gray-600">Order #{order.orderNumber}</p>
        </div>
        <Button variant="outline" onClick={onBack}>
          Back to Orders
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Order Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-500">Order Number</Label>
              <p className="text-sm text-gray-900 font-mono">{order.orderNumber}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">Status</Label>
              <p className="text-sm text-gray-900">
                <Badge variant={getStatusVariant(order.status) as any}>
                  {order.status}
                </Badge>
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">Payment Method</Label>
              <p className="text-sm text-gray-900">{order.paymentMethod || "N/A"}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">Payment Status</Label>
              <p className="text-sm text-gray-900">{order.paymentStatus}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">Order Date</Label>
              <p className="text-sm text-gray-900">
                {new Date(order.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">Total Amount</Label>
              <p className="text-lg font-bold text-primary">
                KSh {parseFloat(order.total).toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Customer Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-500">Name</Label>
              <p className="text-sm text-gray-900">{order.customerName}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">Email</Label>
              <p className="text-sm text-gray-900">{order.customerEmail}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">Phone</Label>
              <p className="text-sm text-gray-900">{order.customerPhone}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">Shipping Address</Label>
              <p className="text-sm text-gray-900 whitespace-pre-wrap">
                {order.shippingAddress}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delivery/Shipment Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Delivery & Shipment Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="trackingNumber">Tracking Number</Label>
                <Input
                  id="trackingNumber"
                  value={deliveryDetails.trackingNumber}
                  onChange={(e) => setDeliveryDetails({ ...deliveryDetails, trackingNumber: e.target.value })}
                  placeholder="Enter tracking number"
                />
              </div>
              <div>
                <Label htmlFor="courierName">Courier/Shipping Company</Label>
                <Input
                  id="courierName"
                  value={deliveryDetails.courierName}
                  onChange={(e) => setDeliveryDetails({ ...deliveryDetails, courierName: e.target.value })}
                  placeholder="e.g., DHL, FedEx, Local Courier"
                />
              </div>
              <div>
                <Label htmlFor="estimatedDelivery">Estimated Delivery Date</Label>
                <Input
                  id="estimatedDelivery"
                  type="date"
                  value={deliveryDetails.estimatedDelivery}
                  onChange={(e) => setDeliveryDetails({ ...deliveryDetails, estimatedDelivery: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="deliveryNotes">Delivery Notes</Label>
              <Textarea
                id="deliveryNotes"
                value={deliveryDetails.deliveryNotes}
                onChange={(e) => setDeliveryDetails({ ...deliveryDetails, deliveryNotes: e.target.value })}
                placeholder="Add any special delivery instructions or notes..."
                rows={4}
              />
            </div>
          </div>
          <div className="mt-4">
            <Button onClick={handleDeliveryUpdate} className="bg-primary hover:bg-primary/90">
              Update Delivery Details
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Order Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Order Items ({orderItems.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {orderItems.map((item) => (
              <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                <img
                  src={item.productImage}
                  alt={item.productName}
                  className="w-16 h-16 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{item.productName}</h4>
                  <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                  <p className="text-sm text-gray-600">
                    Price: KSh {item.pricePerItem.toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">
                    KSh {item.total.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t">
            <div className="flex justify-between items-center">
              <span className="text-lg font-medium">Total</span>
              <span className="text-xl font-bold text-primary">
                KSh {parseFloat(order.total).toLocaleString()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function getStatusVariant(status: string) {
  switch (status) {
    case "pending":
      return "secondary";
    case "processing":
      return "default";
    case "shipped":
      return "outline";
    case "delivered":
      return "default";
    case "cancelled":
      return "destructive";
    default:
      return "secondary";
  }
}
