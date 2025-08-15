import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { X, Upload, Plus } from "lucide-react";

interface SellItemFormProps {
  onClose: () => void;
}

export default function SellItemForm({ onClose }: SellItemFormProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    categoryId: "",
    condition: "",
    askingPrice: "",
    submitterName: "",
    submitterEmail: "",
    submitterPhone: "",
  });

  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
  });

  const submitMutation = useMutation({
    mutationFn: async (submissionData: any) => {
      const response = await apiRequest("POST", "/api/item-submissions", submissionData);
      return response.json();
    },
    onSuccess: () => {
      console.log("Item Submitted Successfully! Thank you! Your item has been submitted for review. We'll contact you soon.");
      onClose();
    },
    onError: (error: any) => {
      console.error(`Submission Failed: ${error.message || "Failed to submit item. Please try again."}`);
    },
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setUploading(true);
    
    // Simulate image upload - in production, this would upload to a service
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImages(prev => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
    
    setTimeout(() => setUploading(false), 1000);
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.categoryId || 
        !formData.condition || !formData.askingPrice || !formData.submitterName || 
        !formData.submitterEmail || !formData.submitterPhone) {
      console.error("Missing Information: Please fill in all required fields");
      return;
    }

    submitMutation.mutate({
      ...formData,
      askingPrice: parseFloat(formData.askingPrice),
      images,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="border-b border-gray-200">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold text-gray-900">Sell Your Item</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="title">Item Title *</Label>
                <Input
                  id="title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  placeholder="e.g. iPhone 12 Pro - 128GB"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.categoryId} onValueChange={(value) => handleInputChange("categoryId", value)} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category: any) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="condition">Condition *</Label>
                <Select value={formData.condition} onValueChange={(value) => handleInputChange("condition", value)} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Condition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="like_new">Like New</SelectItem>
                    <SelectItem value="excellent">Excellent</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="md:col-span-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Describe your item's condition, features, and any included accessories..."
                  rows={4}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="price">Asking Price (KSh) *</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.askingPrice}
                  onChange={(e) => handleInputChange("askingPrice", e.target.value)}
                  placeholder="e.g. 45000"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="phone">Your Phone *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.submitterPhone}
                  onChange={(e) => handleInputChange("submitterPhone", e.target.value)}
                  placeholder="e.g. +254 700 123456"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="name">Your Name *</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.submitterName}
                  onChange={(e) => handleInputChange("submitterName", e.target.value)}
                  placeholder="e.g. John Doe"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="email">Your Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.submitterEmail}
                  onChange={(e) => handleInputChange("submitterEmail", e.target.value)}
                  placeholder="e.g. john@example.com"
                  required
                />
              </div>
              
              <div className="md:col-span-2">
                <Label>Upload Images *</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition">
                  <div className="space-y-2">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                    <p className="text-gray-600">Drag and drop images here or click to browse</p>
                    <p className="text-sm text-gray-500">Supports: JPG, PNG, GIF (Max 5MB each)</p>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById("image-upload")?.click()}
                      disabled={uploading}
                    >
                      {uploading ? "Uploading..." : "Choose Images"}
                    </Button>
                  </div>
                </div>
                
                {/* Image Preview */}
                {images.length > 0 && (
                  <div className="mt-4">
                    <Label>Uploaded Images ({images.length})</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {images.map((image, index) => (
                        <div key={index} className="relative">
                          <img
                            src={image}
                            alt={`Upload ${index + 1}`}
                            className="w-full h-20 object-cover rounded-lg border"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute -top-1 -right-1 h-6 w-6 rounded-full p-0"
                            onClick={() => removeImage(index)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex space-x-4 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-primary hover:bg-primary/90"
                disabled={submitMutation.isPending}
              >
                {submitMutation.isPending ? "Submitting..." : "Submit Item"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
