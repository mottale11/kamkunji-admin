import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, Eye, Package, Truck, CheckCircle, XCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

interface Order {
  id: string;
  total: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  created_at: string;
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  items: Array<{
    id: string;
    quantity: number;
    price: number;
    products: {
      id: string;
      name: string;
      images?: string[];
    };
  }>;
}

// API integration for orders

const getStatusIcon = (status: Order['status']) => {
  switch (status) {
    case 'pending':
      return <Package className="h-4 w-4" />;
    case 'confirmed':
      return <CheckCircle className="h-4 w-4" />;
    case 'shipped':
      return <Truck className="h-4 w-4" />;
    case 'delivered':
      return <CheckCircle className="h-4 w-4" />;
    case 'cancelled':
      return <XCircle className="h-4 w-4" />;
    default:
      return <Package className="h-4 w-4" />;
  }
};

const getStatusColor = (status: Order['status']) => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'confirmed':
      return 'bg-blue-100 text-blue-800';
    case 'shipped':
      return 'bg-purple-100 text-purple-800';
    case 'delivered':
      return 'bg-green-100 text-green-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default function AdminOrders() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Fetch orders from API
  const { data: orders = [], isLoading, error } = useQuery<Order[]>({
    queryKey: ['admin-orders', { search: searchTerm, status: statusFilter }],
    queryFn: async () => {
      const response = await api.get<{orders: Order[]}>('/orders', {
        params: {
          search: searchTerm || undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined
        }
      });
      return response.orders || [];
    }
  });

  // Filter orders based on search and status
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const updateOrderStatus = useMutation({
    mutationFn: async ({ orderId, newStatus }: { orderId: string; newStatus: Order['status'] }) => {
      const response = await api.patch(`/orders/${orderId}/status`, {
        status: newStatus
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast({
        title: "Success",
        description: "Order status updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    }
  });

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Order Management</h1>
          <p className="text-muted-foreground">Track and manage customer orders</p>
        </div>
      </div>

      {/* Order Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold">{orders.length}</p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{orders.filter(o => o.status === 'pending').length}</p>
              </div>
              <Package className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Shipped</p>
                <p className="text-2xl font-bold">{orders.filter(o => o.status === 'shipped').length}</p>
              </div>
              <Truck className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Delivered</p>
                <p className="text-2xl font-bold">{orders.filter(o => o.status === 'delivered').length}</p>
              </div>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error and Loading States */}
      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-700">
              <XCircle className="h-5 w-5" />
              <span>Error loading orders. Please try again later.</span>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading && (
        <Card className="mb-6">
          <CardContent className="p-8">
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading orders...</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Order List</CardTitle>
              <CardDescription>
                {filteredOrders.length} {filteredOrders.length === 1 ? 'order' : 'orders'} found
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search orders..."
                  className="pl-8 w-full md:w-[200px] lg:w-[300px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                <TableHead className="text-right">Total</TableHead>
                                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
              {filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                    <div>
                      <div className="font-medium">{order.id}</div>
                      <div className="text-sm text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                                          <div>
                        <div className="font-medium">{order.customer.name}</div>
                        <div className="text-sm text-muted-foreground">{order.customer.email}</div>
                        <div className="text-sm text-muted-foreground">{order.customer.phone}</div>
                      </div>
                      </TableCell>
                      <TableCell>
                    <div className="space-y-1">
                      {order.items.map((item) => (
                        <div key={item.id} className="text-sm">
                          {item.products.name} x {item.quantity}
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    KSh {order.total.toLocaleString()}
                      </TableCell>
                      <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(order.status)}
                      <Badge className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                        </div>
                      </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setSelectedOrder(order)}
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Select value={order.status} onValueChange={(value: Order['status']) => updateOrderStatus.mutate({ orderId: order.id, newStatus: value })}>
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                            <SelectItem value="shipped">Shipped</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                    </div>
                      </TableCell>
                </TableRow>
              ))}
              {filteredOrders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No orders found
                      </TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
        </CardContent>
      </Card>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Order Details - {selectedOrder.id}</h2>
              <Button variant="outline" onClick={() => setSelectedOrder(null)}>Close</Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Customer Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Name:</span> {selectedOrder.customer.name}
                  </div>
                  <div>
                    <span className="font-medium">Email:</span> {selectedOrder.customer.email}
                  </div>
                  <div>
                    <span className="font-medium">Phone:</span> {selectedOrder.customer.phone}
                  </div>
                  <div>
                    <span className="font-medium">Order Date:</span> {new Date(selectedOrder.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
              

              
              <div>
                <h3 className="font-semibold mb-2">Order Items</h3>
                <div className="space-y-2">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.products.name} x {item.quantity}</span>
                      <span>KSh {item.price.toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 font-semibold">
                    <div className="flex justify-between">
                      <span>Total:</span>
                      <span>KSh {selectedOrder.total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Status Updates</h3>
                                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">Order placed - {new Date(selectedOrder.created_at).toLocaleDateString()}</span>
                  </div>
                  {selectedOrder.status !== 'pending' && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">Order confirmed</span>
                    </div>
                  )}
                  {selectedOrder.status === 'shipped' && (
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-purple-500" />
                      <span className="text-sm">Order shipped</span>
                    </div>
                  )}
                  {selectedOrder.status === 'delivered' && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Order delivered</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
