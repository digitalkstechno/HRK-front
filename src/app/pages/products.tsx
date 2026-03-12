"use client";
import { useEffect, useState, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchAllProducts, createProduct, updateProduct, deleteProduct } from "@/redux/slices/productSlice";
import { fetchAllSizeMasters } from "@/redux/slices/sizeMasterSlice";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Plus, Package } from "lucide-react";
import { toast } from "sonner";
import bwipjs from "bwip-js";
import { CommonDataTable } from "../components/ui/common-data-table";

function BarcodeImage({ barcode }: { barcode: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (barcode && canvasRef.current) {
      try {
        bwipjs.toCanvas(canvasRef.current, {
          bcid: 'code128',
          text: barcode,
          scale: 1,
          height: 6,
          includetext: false,
        });
      } catch (e) {
        console.error('Barcode error:', e);
      }
    }
  }, [barcode]);

  return <canvas ref={canvasRef} />;
}

export function Products() {
  const dispatch = useAppDispatch();
  const { products, loading, pagination } = useAppSelector((state) => state.product);
  const { sizeMasters } = useAppSelector((state) => state.sizeMaster);
  const [isOpen, setIsOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    category: "",
    purchasePrice: 0,
    salePrice: 0,
    barcode: "",
  });
  const [selectedSizes, setSelectedSizes] = useState<any>({});
  const [search, setSearch] = useState("");
  const barcodeCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    dispatch(fetchAllProducts({ page: 1, limit: 10, search }));
    dispatch(fetchAllSizeMasters({ page: 1, limit: 100 })); // Get all sizes for selection
  }, [dispatch, search]);

  useEffect(() => {
    if (formData.barcode && barcodeCanvasRef.current) {
      try {
        bwipjs.toCanvas(barcodeCanvasRef.current, {
          bcid: 'code128',
          text: formData.barcode,
          scale: 2,
          height: 8,
          includetext: false,
        });
      } catch (e) {
        console.error('Barcode generation error:', e);
      }
    }
  }, [formData.barcode]);

  const handlePageChange = (page: number) => {
    dispatch(fetchAllProducts({ page, limit: 10, search }));
  };

  const generateSKU = (name: string) => {
    const prefix = name.substring(0, 3).toUpperCase();
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(100 + Math.random() * 900);
    return `${prefix}${timestamp}${random}`;
  };

  const generateBarcode = () => {
    return Date.now().toString() + Math.floor(1000 + Math.random() * 9000).toString();
  };

  const handleAdd = () => {
    setEditingProduct(null);
    const barcode = generateBarcode();
    setFormData({
      name: "",
      sku: "",
      category: "",
      purchasePrice: 0,
      salePrice: 0,
      barcode: barcode,
    });
    setSelectedSizes({});
    setIsOpen(true);
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku,
      category: product.category,
      purchasePrice: product.purchasePrice,
      salePrice: product.salePrice,
      barcode: product.barcode,
    });
    
    const sizesObj: any = {};
    product.sizes?.forEach((s: any) => {
      sizesObj[s.size?._id || s.size] = { checked: true, quantity: s.quantity };
    });
    setSelectedSizes(sizesObj);
    setIsOpen(true);
  };

  const handleNameChange = (name: string) => {
    const sku = name ? generateSKU(name) : "";
    const barcode = sku ? generateBarcode() : "";
    setFormData({...formData, name, sku, barcode});
  };

  const toggleSize = (sizeId: string) => {
    setSelectedSizes({
      ...selectedSizes,
      [sizeId]: selectedSizes[sizeId]?.checked 
        ? { ...selectedSizes[sizeId], checked: false }
        : { checked: true, quantity: 0 }
    });
  };

  const updateQuantity = (sizeId: string, quantity: number) => {
    setSelectedSizes({
      ...selectedSizes,
      [sizeId]: { ...selectedSizes[sizeId], quantity }
    });
  };

  const handleSave = async () => {
    try {
      const sizes = Object.keys(selectedSizes)
        .filter(sizeId => selectedSizes[sizeId]?.checked)
        .map(sizeId => ({
          size: sizeId,
          quantity: selectedSizes[sizeId].quantity || 0
        }));

      const data = { ...formData, sizes };

      if (editingProduct) {
        await dispatch(updateProduct({ id: editingProduct._id, data })).unwrap();
        toast.success("Product updated!");
      } else {
        await dispatch(createProduct(data)).unwrap();
        toast.success("Product created!");
      }
      setIsOpen(false);
      dispatch(fetchAllProducts({ page: pagination.currentPage, limit: 10, search }));
    } catch (err: any) {
      toast.error(err.message || "Failed to save product");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await dispatch(deleteProduct(id)).unwrap();
        toast.success("Product deleted!");
        dispatch(fetchAllProducts({ page: pagination.currentPage, limit: 10, search }));
      } catch (err: any) {
        toast.error(err.message || "Failed to delete product");
      }
    }
  };

  const columns = [
    { header: "Product Name", accessorKey: "name", cell: (item: any) => (
      <div className="font-semibold">{item.name}</div>
    )},
    { header: "SKU", accessorKey: "sku" },
    { header: "Barcode", accessorKey: "barcode", cell: (item: any) => (
      <div className="flex items-center gap-2">
        <BarcodeImage barcode={item.barcode} />
      </div>
    )},
    { header: "Category", accessorKey: "category" },
    { header: "Purchase Price", accessorKey: "purchasePrice", cell: (item: any) => `₹${item.purchasePrice}` },
    { header: "Sale Price", accessorKey: "salePrice", cell: (item: any) => (
      <span className="font-medium">₹{item.salePrice}</span>
    )},
    { header: "Sizes", accessorKey: "sizes", cell: (item: any) => (
      item.sizes?.length > 0 ? (
        <div className="text-xs">
          {item.sizes.map((s: any, i: number) => (
            <span key={i} className="inline-block bg-gray-100 px-2 py-1 rounded mr-1 mb-1">
              {s.size?.name || s.size}: {s.quantity}
            </span>
          ))}
        </div>
      ) : (
        <span className="text-gray-400 text-xs">No sizes</span>
      )
    )},
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600 mt-1">Manage product inventory</p>
        </div>
        <Button onClick={handleAdd} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>

      <CommonDataTable
        columns={columns}
        data={products}
        pagination={pagination}
        onPageChange={handlePageChange}
        onSearchChange={setSearch}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={loading}
      />

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="w-[90vw] max-w-[1200px] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="pb-4 border-b">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <DialogTitle className="text-2xl">{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
                <p className="text-sm text-gray-500 mt-1">Fill in the product details below</p>
              </div>
            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto py-6 px-1">
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Product Name <span className="text-red-500">*</span></Label>
                    <Input 
                      value={formData.name} 
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="Enter product name"
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">SKU <span className="text-xs text-gray-500">(Auto-generated)</span></Label>
                    <Input value={formData.sku} disabled className="bg-gray-100 h-11 font-mono" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Barcode <span className="text-xs text-gray-500">(Auto-generated)</span></Label>
                    <div className="flex gap-2">
                      <Input value={formData.barcode} disabled className="bg-gray-100 h-11 font-mono flex-1" />
                      <div className="flex items-center justify-center border-2 border-gray-300 rounded-lg px-2 py-1 bg-white">
                        <canvas ref={barcodeCanvasRef} style={{maxWidth: '80px', height: 'auto'}} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Pricing & Category</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Category <span className="text-red-500">*</span></Label>
                    <Input 
                      value={formData.category} 
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      placeholder="e.g., Shirts, Sarees"
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Purchase Price <span className="text-red-500">*</span></Label>
                    <Input 
                      type="number" 
                      value={formData.purchasePrice} 
                      onChange={(e) => setFormData({...formData, purchasePrice: +e.target.value})}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Sale Price <span className="text-red-500">*</span></Label>
                    <Input 
                      type="number" 
                      value={formData.salePrice} 
                      onChange={(e) => setFormData({...formData, salePrice: +e.target.value})}
                      className="h-11"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Size & Stock Management</h3>
                <div className="bg-white border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="py-2 px-4 text-left">Select</th>
                        <th className="py-2 px-4 text-left">Size Name</th>
                        <th className="py-2 px-4 text-left">Stock Quantity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sizeMasters.map((size: any) => (
                        <tr key={size._id} className="border-t">
                          <td className="py-2 px-4">
                            <input
                              type="checkbox"
                              checked={selectedSizes[size._id]?.checked || false}
                              onChange={() => toggleSize(size._id)}
                            />
                          </td>
                          <td className="py-2 px-4">{size.name}</td>
                          <td className="py-2 px-4">
                            <Input
                              type="number"
                              disabled={!selectedSizes[size._id]?.checked}
                              value={selectedSizes[size._id]?.quantity || 0}
                              onChange={(e) => updateQuantity(size._id, +e.target.value)}
                              className="h-8 max-w-[100px]"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
          <div className="pt-4 border-t flex gap-3">
            <Button onClick={() => setIsOpen(false)} variant="outline" className="flex-1">Cancel</Button>
            <Button onClick={handleSave} className="flex-1 bg-indigo-600">
              {editingProduct ? "Update Product" : "Create Product"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
