import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, X, Eye, MessageSquare, Search, Filter } from "lucide-react";

export default function SubmissionsManagement() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);

  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ["/api/admin/item-submissions"],
    meta: {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
      },
    },
  });

  const updateSubmissionMutation = useMutation({
    mutationFn: async ({ 
      submissionId, 
      status, 
      adminNotes 
    }: { 
      submissionId: string; 
      status: string; 
      adminNotes?: string; 
    }) => {
      const response = await fetch(`/api/admin/item-submissions/${submissionId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
        body: JSON.stringify({ status, adminNotes }),
      });
      
      if (!response.ok) throw new Error("Failed to update submission");
      return response.json();
    },
    onSuccess: () => {
      console.log("Submission Updated: Item submission has been successfully updated");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/item-submissions"] });
      setSelectedSubmission(null);
    },
    onError: () => {
      console.error("Error: Failed to update submission");
    },
  });

  const filteredSubmissions = submissions.filter((submission: any) => {
    const matchesSearch = 
      submission.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      submission.submitterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      submission.submitterEmail.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || submission.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "pending":
        return "secondary";
      case "approved":
        return "default";
      case "rejected":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const handleQuickAction = (submissionId: string, status: string, adminNotes?: string) => {
    updateSubmissionMutation.mutate({ submissionId, status, adminNotes });
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

  if (selectedSubmission) {
    return (
      <SubmissionDetails
        submission={selectedSubmission}
        onBack={() => setSelectedSubmission(null)}
        onUpdate={updateSubmissionMutation.mutate}
        isUpdating={updateSubmissionMutation.isPending}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Item Submissions</h1>
        <p className="text-gray-600">Review and manage customer item submissions</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Search Submissions</Label>
              <Input
                id="search"
                placeholder="Search by title, submitter name, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="status">Status Filter</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                }}
                className="mt-1"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submissions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Submissions ({filteredSubmissions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="animate-pulse flex items-center space-x-4 p-4">
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No submissions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submitter
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSubmissions.map((submission: any) => (
                    <tr key={submission.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {submission.images?.[0] && (
                            <img
                              src={submission.images[0]}
                              alt={submission.title}
                              className="h-10 w-10 rounded-lg object-cover mr-4"
                            />
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {submission.title}
                            </div>
                            <div className="text-sm text-gray-500">
                              {submission.condition?.replace("_", " ")}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {submission.submitterName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {submission.submitterPhone}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {/* Category name would be resolved here */}
                        Category
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        KSh {parseFloat(submission.askingPrice).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={getStatusVariant(submission.status) as any}>
                          {submission.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(submission.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedSubmission(submission)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {submission.status === "pending" && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleQuickAction(submission.id, "approved")}
                              className="text-green-600 hover:text-green-800"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleQuickAction(submission.id, "rejected")}
                              className="text-red-600 hover:text-red-800"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SubmissionDetails({ 
  submission, 
  onBack, 
  onUpdate, 
  isUpdating 
}: { 
  submission: any; 
  onBack: () => void; 
  onUpdate: (data: any) => void;
  isUpdating: boolean;
}) {
  const [adminNotes, setAdminNotes] = useState(submission.adminNotes || "");

  const handleUpdateStatus = (status: string) => {
    onUpdate({
      submissionId: submission.id,
      status,
      adminNotes: adminNotes.trim() || undefined,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Submission Details</h1>
          <p className="text-gray-600">{submission.title}</p>
        </div>
        <Button variant="outline" onClick={onBack}>
          Back to Submissions
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Item Information */}
        <Card>
          <CardHeader>
            <CardTitle>Item Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-500">Title</Label>
              <p className="text-sm text-gray-900">{submission.title}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">Description</Label>
              <p className="text-sm text-gray-900 whitespace-pre-wrap">
                {submission.description}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">Condition</Label>
              <p className="text-sm text-gray-900">
                {submission.condition?.replace("_", " ")}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">Asking Price</Label>
              <p className="text-lg font-bold text-primary">
                KSh {parseFloat(submission.askingPrice).toLocaleString()}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">Status</Label>
              <p className="text-sm text-gray-900">
                <Badge variant={getStatusVariant(submission.status) as any}>
                  {submission.status}
                </Badge>
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">Submitted Date</Label>
              <p className="text-sm text-gray-900">
                {new Date(submission.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Submitter Information */}
        <Card>
          <CardHeader>
            <CardTitle>Submitter Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-500">Name</Label>
              <p className="text-sm text-gray-900">{submission.submitterName}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">Email</Label>
              <p className="text-sm text-gray-900">{submission.submitterEmail}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">Phone</Label>
              <p className="text-sm text-gray-900">{submission.submitterPhone}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Images */}
      {submission.images && submission.images.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Item Images</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {submission.images.map((image: string, index: number) => (
                <img
                  key={index}
                  src={image}
                  alt={`Item image ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg border"
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Admin Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Admin Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="adminNotes">Admin Notes</Label>
            <Textarea
              id="adminNotes"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Add notes about this submission..."
              rows={4}
              className="mt-1"
            />
          </div>

          <div className="flex space-x-4">
            <Button
              onClick={() => handleUpdateStatus("approved")}
              disabled={isUpdating}
              className="bg-green-600 hover:bg-green-700"
            >
              <Check className="w-4 h-4 mr-2" />
              {isUpdating ? "Updating..." : "Approve"}
            </Button>
            <Button
              onClick={() => handleUpdateStatus("rejected")}
              disabled={isUpdating}
              variant="destructive"
            >
              <X className="w-4 h-4 mr-2" />
              {isUpdating ? "Updating..." : "Reject"}
            </Button>
            {submission.status !== "pending" && (
              <Button
                onClick={() => handleUpdateStatus("pending")}
                disabled={isUpdating}
                variant="outline"
              >
                Reset to Pending
              </Button>
            )}
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
    case "approved":
      return "default";
    case "rejected":
      return "destructive";
    default:
      return "secondary";
  }
}
