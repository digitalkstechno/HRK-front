"use client";
import { useEffect, useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Plus, User } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchAllCustomers, createCustomer, updateCustomer, deleteCustomer } from "@/redux/slices/customerSlice";
import { CommonDataTable } from "../components/ui/common-data-table";

export function Customers() {
  const dispatch = useAppDispatch();
  const { customers, loading, pagination } = useAppSelector((state) => state.customer);
  const [isOpen, setIsOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [formData, setFormData] = useState({ name: "", phone: "", email: "" });
  const [search, setSearch] = useState("");

  useEffect(() => {
    dispatch(fetchAllCustomers({ page: 1, limit: 10, search }));
  }, [dispatch, search]);

  const handlePageChange = (page: number) => {
    dispatch(fetchAllCustomers({ page, limit: 10, search }));
  };

  const handleAdd = () => {
    setEditingCustomer(null);
    setFormData({ name: "", phone: "", email: "" });
    setIsOpen(true);
  };

  const handleEdit = (customer: any) => {
    setEditingCustomer(customer);
    setFormData({ name: customer.name, phone: customer.phone, email: customer.email });
    setIsOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingCustomer) {
        await dispatch(updateCustomer({ id: editingCustomer._id, data: formData })).unwrap();
        toast.success("Customer updated!");
      } else {
        await dispatch(createCustomer(formData)).unwrap();
        toast.success("Customer added!");
      }
      setIsOpen(false);
      dispatch(fetchAllCustomers({ page: pagination?.currentPage || 1, limit: 10, search }));
    } catch (err: any) {
      toast.error(err.message || "Failed to save customer");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this customer?")) {
      try {
        await dispatch(deleteCustomer(id)).unwrap();
        toast.success("Customer deleted!");
        dispatch(fetchAllCustomers({ page: pagination?.currentPage || 1, limit: 10, search }));
      } catch (err: any) {
        toast.error(err.message || "Failed to delete customer");
      }
    }
  };

  const columns = [
    { header: "Customer", accessorKey: "name", cell: (item: any) => (
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
          <User className="w-5 h-5 text-indigo-600" />
        </div>
        <span className="font-medium">{item.name}</span>
      </div>
    )},
    { header: "Phone", accessorKey: "phone" },
    { header: "Email", accessorKey: "email" },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600 mt-1">Manage customer database</p>
        </div>
        <Button onClick={handleAdd} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Customer
        </Button>
      </div>

      <CommonDataTable
        columns={columns}
        data={customers}
        pagination={pagination || { totalRecords: 0, currentPage: 1, totalPages: 0, limit: 10 }}
        onPageChange={handlePageChange}
        onSearchChange={setSearch}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={loading}
      />

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCustomer ? "Edit Customer" : "Add Customer"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
            </div>
            <Button onClick={handleSave} className="w-full bg-indigo-600 hover:bg-indigo-700">
              {editingCustomer ? "Update" : "Add"} Customer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
