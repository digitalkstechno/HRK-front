"use client";
import { useEffect, useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Badge } from "../components/ui/badge";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchAllStocks, createStock, updateStock, deleteStock } from "@/redux/slices/stockSlice";
import { CommonDataTable } from "../components/ui/common-data-table";

export function StockEntry() {
  const dispatch = useAppDispatch();
  const { stocks, loading, pagination } = useAppSelector((state) => state.stock);
  const [isOpen, setIsOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [formData, setFormData] = useState({ 
    entryDate: new Date().toISOString().split('T')[0], 
    supplier: "", 
    invoiceNumber: "", 
    items: [], 
    totalAmount: 0, 
    status: "Pending" 
  });
  const [search, setSearch] = useState("");

  useEffect(() => {
    dispatch(fetchAllStocks({ page: 1, limit: 10, search }));
  }, [dispatch, search]);

  const handlePageChange = (page: number) => {
    dispatch(fetchAllStocks({ page, limit: 10, search }));
  };

  const handleAdd = () => {
    setEditingEntry(null);
    setFormData({ 
      entryDate: new Date().toISOString().split('T')[0], 
      supplier: "", 
      invoiceNumber: "", 
      items: [], 
      totalAmount: 0, 
      status: "Pending" 
    });
    setIsOpen(true);
  };

  const handleEdit = (entry: any) => {
    setEditingEntry(entry);
    setFormData({
      entryDate: entry.entryDate?.split('T')[0] || "",
      supplier: entry.supplier,
      invoiceNumber: entry.invoiceNumber,
      items: entry.items,
      totalAmount: entry.totalAmount,
      status: entry.status
    });
    setIsOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingEntry) {
        await dispatch(updateStock({ id: editingEntry._id, data: formData })).unwrap();
        toast.success("Entry updated!");
      } else {
        await dispatch(createStock(formData)).unwrap();
        toast.success("Entry created!");
      }
      setIsOpen(false);
      dispatch(fetchAllStocks({ page: pagination?.currentPage || 1, limit: 10, search }));
    } catch (err: any) {
      toast.error(err.message || "Failed to save entry");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this entry?")) {
      try {
        await dispatch(deleteStock(id)).unwrap();
        toast.success("Entry deleted!");
        dispatch(fetchAllStocks({ page: pagination?.currentPage || 1, limit: 10, search }));
      } catch (err: any) {
        toast.error(err.message || "Failed to delete entry");
      }
    }
  };

  const columns = [
    { header: "Date", accessorKey: "entryDate", cell: (item: any) => item.entryDate?.split('T')[0] },
    { header: "Supplier", accessorKey: "supplier" },
    { header: "Invoice", accessorKey: "invoiceNumber", cell: (item: any) => <span className="font-medium">{item.invoiceNumber}</span> },
    { header: "Total", accessorKey: "totalAmount", cell: (item: any) => <span className="font-medium">₹{item.totalAmount}</span> },
    { header: "Status", accessorKey: "status", cell: (item: any) => (
      <Badge variant={item.status === "Completed" ? "default" : "secondary"}>
        {item.status}
      </Badge>
    )},
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Stock Entry</h1>
          <p className="text-gray-600 mt-1">Add new stock to inventory</p>
        </div>
        <Button onClick={handleAdd} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" />
          New Entry
        </Button>
      </div>

      <CommonDataTable
        columns={columns}
        data={stocks}
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
            <DialogTitle>{editingEntry ? "Edit Stock Entry" : "New Stock Entry"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Entry Date</Label>
              <Input type="date" value={formData.entryDate} onChange={(e) => setFormData({...formData, entryDate: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Supplier</Label>
              <Input value={formData.supplier} onChange={(e) => setFormData({...formData, supplier: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Invoice Number</Label>
              <Input value={formData.invoiceNumber} onChange={(e) => setFormData({...formData, invoiceNumber: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Total Amount</Label>
              <Input type="number" value={formData.totalAmount} onChange={(e) => setFormData({...formData, totalAmount: +e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Input value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} />
            </div>
            <Button onClick={handleSave} className="w-full bg-indigo-600 hover:bg-indigo-700">
              {editingEntry ? "Update" : "Create"} Entry
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
