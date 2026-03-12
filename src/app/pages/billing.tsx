"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Plus, Trash2, Save, Printer, Eye, Scan } from "lucide-react";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchAllProducts } from "@/redux/slices/productSlice";
import { fetchAllCustomers } from "@/redux/slices/customerSlice";
import { fetchAllBillings, createBilling } from "@/redux/slices/billingSlice";
import { CommonDataTable } from "../components/ui/common-data-table";

export function Billing() {
  const dispatch = useAppDispatch();
  const { products } = useAppSelector((state) => state.product);
  const { customers } = useAppSelector((state) => state.customer);
  const { billings, loading, pagination } = useAppSelector((state) => state.billing);
  
  const [items, setItems] = useState([{ id: 1, barcode: "", product: "", productId: "", size: "", quantity: 1, price: 0, total: 0 }]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [search, setSearch] = useState("");

  useEffect(() => {
    dispatch(fetchAllProducts({ page: 1, limit: 100 }));
    dispatch(fetchAllCustomers({ page: 1, limit: 100 }));
    dispatch(fetchAllBillings({ page: 1, limit: 10, search }));
  }, [dispatch, search]);

  const handlePageChange = (page: number) => {
    dispatch(fetchAllBillings({ page, limit: 10, search }));
  };

  const addItem = () => {
    setItems([...items, { id: Date.now(), barcode: "", product: "", productId: "", size: "", quantity: 1, price: 0, total: 0 }]);
  };

  const removeItem = (id: number) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const scanBarcode = () => {
    const product = products.find((p: any) => p.barcode === barcodeInput);
    if (product) {
      const newItem = {
        id: Date.now(),
        barcode: product.barcode,
        product: product.name,
        productId: product._id,
        size: product.sizes?.[0]?.size?.name || "",
        quantity: 1,
        price: product.salePrice,
        total: product.salePrice
      };
      setItems([...items, newItem]);
      setBarcodeInput("");
      toast.success(`${product.name} added!`);
    } else {
      toast.error("Product not found!");
    }
  };

  const updateItem = (id: number, field: string, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = {...item, [field]: value};
        if (field === 'quantity' || field === 'price') {
          updated.total = updated.quantity * updated.price;
        }
        return updated;
      }
      return item;
    }));
  };

  const handleSave = async () => {
    if (!selectedCustomer) {
      toast.error("Please select a customer!");
      return;
    }
    
    try {
      const billingData = {
        customer: selectedCustomer._id,
        items: items.filter(i => i.product).map(i => ({
          product: i.productId,
          size: i.size,
          quantity: i.quantity,
          price: i.price
        })),
        scanBarcode: barcodeInput
      };
      
      await dispatch(createBilling(billingData)).unwrap();
      toast.success("Bill saved!");
      setSelectedCustomer(null);
      setItems([{ id: 1, barcode: "", product: "", productId: "", size: "", quantity: 1, price: 0, total: 0 }]);
      setDiscount(0);
      dispatch(fetchAllBillings({ page: 1, limit: 10, search }));
    } catch (err: any) {
      toast.error(err.message || "Failed to save bill");
    }
  };

  const handlePrint = () => {
    window.print();
    toast.success("Printing invoice...");
  };

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const discountAmount = (subtotal * discount) / 100;
  const afterDiscount = subtotal - discountAmount;
  const gst = afterDiscount * 0.18;
  const total = afterDiscount + gst;

  const columns = [
    { header: "Customer", accessorKey: "customer", cell: (item: any) => item.customer?.name || "N/A" },
    { header: "Barcode", accessorKey: "scanBarcode" },
    { header: "Items", accessorKey: "items", cell: (item: any) => item.items?.length || 0 },
    { header: "Date", accessorKey: "createdAt", cell: (item: any) => new Date(item.createdAt).toLocaleDateString() },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Billing</h1>
          <p className="text-gray-600 mt-1">Create new invoice</p>
        </div>
        <Button onClick={() => setShowHistory(!showHistory)} variant="outline">
          <Eye className="w-4 h-4 mr-2" />
          {showHistory ? "Hide" : "Show"} History
        </Button>
      </div>

      {showHistory && (
        <CommonDataTable
          columns={columns}
          data={billings}
          pagination={pagination || { totalRecords: 0, currentPage: 1, totalPages: 0, limit: 10 }}
          onPageChange={handlePageChange}
          onSearchChange={setSearch}
          loading={loading}
          hideActions
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Select Customer</Label>
                <select
                  className="w-full border rounded-md p-2"
                  value={selectedCustomer?._id || ""}
                  onChange={(e) => setSelectedCustomer(customers.find((c: any) => c._id === e.target.value))}
                >
                  <option value="">Select customer</option>
                  {customers.map((c: any) => (
                    <option key={c._id} value={c._id}>{c.name} - {c.phone}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Scan Barcode</Label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Scan or enter barcode" 
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && scanBarcode()}
                  />
                  <Button type="button" onClick={scanBarcode}>
                    <Scan className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="grid grid-cols-12 gap-4 items-end">
                  <div className="col-span-4 space-y-2">
                    <Label>Product</Label>
                    <Input value={item.product} disabled className="bg-gray-50" />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label>Size</Label>
                    <Input value={item.size} onChange={(e) => updateItem(item.id, 'size', e.target.value)} />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label>Qty</Label>
                    <Input type="number" value={item.quantity} onChange={(e) => updateItem(item.id, 'quantity', +e.target.value)} />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label>Price</Label>
                    <Input type="number" value={item.price} onChange={(e) => updateItem(item.id, 'price', +e.target.value)} />
                  </div>
                  <div className="col-span-1 space-y-2">
                    <Label>Total</Label>
                    <Input type="number" value={item.total} disabled />
                  </div>
                  <div className="col-span-1">
                    <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)}>
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button onClick={addItem} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Discount</span>
                <div className="flex items-center gap-2">
                  <Input type="number" value={discount} onChange={(e) => setDiscount(+e.target.value)} className="w-20" />
                  <span>%</span>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">After Discount</span>
                <span className="font-medium">₹{afterDiscount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">GST (18%)</span>
                <span className="font-medium">₹{gst.toFixed(2)}</span>
              </div>
              <div className="border-t pt-4 flex justify-between">
                <span className="text-lg font-bold">Total</span>
                <span className="text-lg font-bold text-indigo-600">₹{total.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <Button onClick={handleSave} className="w-full bg-indigo-600 hover:bg-indigo-700">
              <Save className="w-4 h-4 mr-2" />
              Save Bill
            </Button>
            <Button variant="outline" className="w-full" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
