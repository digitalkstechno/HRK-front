"use client";
import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchAllProducts, createProduct, updateProduct, deleteProduct } from "@/redux/slices/productSlice";
import { fetchSizeDropdown } from "@/redux/slices/sizeMasterSlice";
import { fetchCategoryDropdown } from "@/redux/slices/categoryMasterSlice";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Plus, Package, X, Hash, Layers, Tag, IndianRupee } from "lucide-react";
import { toast } from "sonner";
import { CommonDataTable } from "../components/ui/common-data-table";
import { Badge } from "../components/ui/badge";

export function Products() {
  const dispatch = useAppDispatch();
  const { products, loading, pagination } = useAppSelector((state) => state.product);
  
  const [categories, setCategories] = useState<any[]>([]);
  const [sizes, setSizes] = useState<any[]>([]);
  
  const [isOpen, setIsOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [formData, setFormData] = useState({
    designNo: "",
    sku: "",
    category: "",
    purchasePrice: 0,
    salePrice: 0,
  });
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    dispatch(fetchAllProducts({ page: 1, limit: 10, search }));
    
    // Fetch dropdown data
    dispatch(fetchCategoryDropdown()).unwrap().then(setCategories);
    dispatch(fetchSizeDropdown()).unwrap().then(setSizes);
  }, [dispatch, search]);

  const handlePageChange = (page: number) => {
    dispatch(fetchAllProducts({ page, limit: 10, search }));
  };

  const handleAdd = () => {
    setEditingProduct(null);
    setFormData({
      designNo: "",
      sku: "",
      category: "",
      purchasePrice: 0,
      salePrice: 0,
    });
    setSelectedSizes([]);
    setIsOpen(true);
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setFormData({
      designNo: product.designNo,
      sku: product.sku,
      category: product.category?._id || product.category,
      purchasePrice: product.purchasePrice,
      salePrice: product.salePrice,
    });
    
    setSelectedSizes(product.sizes?.map((s: any) => s._id || s) || []);
    setIsOpen(true);
  };

  const toggleSize = (sizeId: string) => {
    if (selectedSizes.includes(sizeId)) {
      setSelectedSizes(selectedSizes.filter(id => id !== sizeId));
    } else {
      setSelectedSizes([...selectedSizes, sizeId]);
    }
  };

  const handleSave = async () => {
    if (!formData.designNo || !formData.sku || !formData.category) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      const data = { ...formData, sizes: selectedSizes };

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
    { header: "DP CODE / DESIGN", accessorKey: "productCode", cell: (item: any) => (
      <div className="flex flex-col gap-1">
        <Badge variant="outline" className="w-fit font-mono font-bold text-indigo-700 bg-indigo-50/50 border-indigo-100">
          {item.productCode}
        </Badge>
        <div className="text-[10px] text-gray-400 font-medium px-1 uppercase tracking-wider flex items-center gap-1">
          <Hash className="w-2.5 h-2.5" /> {item.designNo}
        </div>
      </div>
    )},
    { header: "CATEGORY", accessorKey: "category", cell: (item: any) => (
      <div className="flex items-center gap-2">
         <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center border border-blue-100">
            <Tag className="w-3.5 h-3.5 text-blue-500" />
         </div>
         <span className="text-sm font-semibold text-gray-700">
            {item.category?.name || "Uncategorized"}
         </span>
      </div>
    )},
    { header: "PRICING", accessorKey: "salePrice", cell: (item: any) => (
      <div className="flex flex-col">
        <div className="flex items-center text-green-700 font-bold">
            <IndianRupee className="w-3 h-3" />
            <span>{item.salePrice}</span>
        </div>
        <div className="text-[10px] text-gray-400 flex items-center">
            <span className="line-through mr-1 opacity-50">₹{item.purchasePrice}</span>
            <span className="font-medium text-orange-600 bg-orange-50 px-1 rounded">Margin: ₹{item.salePrice - item.purchasePrice}</span>
        </div>
      </div>
    )},
    { header: "AVAILABLE SIZES", accessorKey: "sizes", cell: (item: any) => (
      item.sizes?.length > 0 ? (
        <div className="flex flex-wrap gap-1 max-w-[180px]">
          {item.sizes.map((s: any, i: number) => (
            <Badge key={i} variant="secondary" className="text-[10px] px-1.5 py-0 bg-gray-50 text-gray-500 font-bold border border-gray-200">
              {s.name || "N/A"}
            </Badge>
          ))}
        </div>
      ) : (
        <span className="text-gray-300 text-xs italic tracking-tight">No sizes mapped</span>
      )
    )},
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6 bg-gray-50/50 min-h-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-gray-100">
                <Package className="w-7 h-7 text-indigo-600" />
            </div>
            <div>
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Product Master</h1>
                <p className="text-gray-400 text-sm font-medium">Design & SKU Inventory Distribution</p>
            </div>
        </div>
        <Button onClick={handleAdd} className="bg-indigo-600 hover:bg-indigo-700 h-12 px-6 rounded-xl shadow-lg shadow-indigo-100 font-bold transition-all hover:translate-y-[-2px]">
          <Plus className="w-5 h-5 mr-2" />
          Create New Configuration
        </Button>
      </div>

      <div className="bg-transparent">
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
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-hidden rounded-[2rem] p-0 border border-gray-100 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.1)] flex flex-col">
          <DialogHeader className="p-8 pb-6 bg-gradient-to-br from-indigo-50/80 via-white to-white border-b border-gray-100">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-md border border-indigo-100">
                <Layers className="w-8 h-8 text-indigo-600" />
              </div>
              <div>
                <DialogTitle className="text-3xl font-black text-gray-900 tracking-tight">{editingProduct ? "Edit Configuration" : "New Configuration"}</DialogTitle>
                <div className="flex items-center gap-2 mt-1">
                    <p className="text-sm text-gray-400 font-medium tracking-wide">Product Details & Inventory Map</p>
                    <div className="h-1 w-1 rounded-full bg-gray-200"></div>
                     <Badge variant="outline" className="text-[10px] font-bold text-indigo-400 uppercase">Phase 1</Badge>
                </div>
              </div>
            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
            <section className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-black">1</div>
                <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">Identity & SKU</h3>
                <div className="h-px flex-1 bg-gradient-to-r from-gray-100 to-transparent"></div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-2">
                <div className="space-y-3">
                  <Label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Design Reference</Label>
                  <div className="relative group">
                    <Input 
                        value={formData.designNo} 
                        onChange={(e) => setFormData({...formData, designNo: e.target.value})}
                        placeholder="ENTER DESIGN (e.g. DP01)"
                        className="h-14 bg-gray-50/50 border-gray-100 focus:bg-white focus:ring-4 focus:ring-indigo-100 rounded-2xl transition-all font-bold placeholder:text-gray-300 uppercase"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20 group-focus-within:opacity-100 transition-opacity">
                        <Hash className="w-5 h-5 text-indigo-600" />
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Merchant SKU</Label>
                  <Input 
                    value={formData.sku} 
                    onChange={(e) => setFormData({...formData, sku: e.target.value})}
                    placeholder="ENTER SKU NAME"
                    className="h-14 bg-gray-50/50 border-gray-100 focus:bg-white focus:ring-4 focus:ring-indigo-100 rounded-2xl transition-all font-mono font-bold placeholder:text-gray-300 uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-2">
                <div className="space-y-3">
                  <Label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Primary Collection</Label>
                  <select
                    className="w-full h-14 border border-gray-100 rounded-2xl px-4 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-100 transition-all cursor-pointer font-bold text-gray-700 outline-none appearance-none"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                  >
                    <option value="" className="text-gray-300">SELECT CATEGORY</option>
                    {categories.map((cat: any) => (
                      <option key={cat._id} value={cat._id}>{cat.name.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-3">
                   <Label className="text-xs font-black text-indigo-300 uppercase tracking-widest ml-1">Unique Product Handle</Label>
                   <div className="h-14 flex items-center justify-between px-6 bg-indigo-50/30 border border-indigo-100 rounded-2xl text-indigo-600 font-black tracking-tighter text-lg shadow-inner">
                        <span>{formData.designNo || "..."}</span>
                        <span className="text-indigo-200">-</span>
                        <span>{formData.sku || "..."}</span>
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-indigo-100">
                         <Hash className="w-4 h-4" />
                      </div>
                   </div>
                </div>
              </div>
            </section>

            <section className="space-y-6">
               <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-black">2</div>
                <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">Valuation & Pricing</h3>
                <div className="h-px flex-1 bg-gradient-to-r from-gray-100 to-transparent"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-2">
                <div className="space-y-3">
                  <Label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Landing Cost (₹)</Label>
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-black">₹</span>
                    <Input 
                      type="number" 
                      value={formData.purchasePrice} 
                      onChange={(e) => setFormData({...formData, purchasePrice: +e.target.value})}
                      className="h-14 pl-10 bg-gray-50/50 border-gray-100 focus:bg-white rounded-2xl transition-all font-black text-gray-700 placeholder:text-gray-300"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Selling Price (₹)</Label>
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400 font-black">₹</span>
                    <Input 
                      type="number" 
                      value={formData.salePrice} 
                      onChange={(e) => setFormData({...formData, salePrice: +e.target.value})}
                      className="h-14 pl-10 bg-indigo-50/30 border-indigo-100 focus:bg-white rounded-2xl transition-all font-black text-indigo-700 text-xl"
                    />
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-6 pb-4">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white text-xs font-black">3</div>
                <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">Size Distribution</h3>
                <div className="h-px flex-1 bg-gradient-to-r from-gray-100 to-transparent"></div>
              </div>
              <div className="flex flex-wrap gap-4 p-6 border border-gray-100 rounded-[2rem] bg-gray-50/30">
                {sizes.map((size: any) => (
                  <button
                    key={size._id}
                    type="button"
                    onClick={() => toggleSize(size._id)}
                    className={`h-16 px-8 rounded-2xl text-sm font-black transition-all flex items-center gap-3 border shadow-sm ${
                      selectedSizes.includes(size._id)
                        ? "bg-indigo-600 text-white border-indigo-500 shadow-indigo-100 scale-[1.05]"
                        : "bg-white text-gray-500 border-gray-100 hover:border-indigo-200 hover:text-indigo-600 scale-100"
                    }`}
                  >
                    {size.name.toUpperCase()}
                    {selectedSizes.includes(size._id) && <div className="p-1 bg-white/20 rounded-full"><X className="w-3 h-3 text-white" /></div>}
                  </button>
                ))}
                {sizes.length === 0 && (
                    <div className="w-full py-8 text-center text-gray-300 font-bold italic border-2 border-dashed border-gray-100 rounded-3xl">
                        NO SIZES DEFINED IN SYSTEM
                    </div>
                )}
              </div>
            </section>
          </div>

          <div className="p-8 bg-white border-t border-gray-100 flex gap-6 sticky bottom-0 z-10">
            <Button onClick={() => setIsOpen(false)} variant="ghost" className="flex-1 h-14 rounded-2xl text-gray-400 font-black uppercase tracking-widest hover:bg-gray-50 hover:text-gray-900 transition-all">Dismiss</Button>
            <Button onClick={handleSave} className="flex-[2] h-14 bg-indigo-600 hover:bg-indigo-700 shadow-2xl shadow-indigo-200 rounded-2xl font-black uppercase tracking-widest transition-all hover:translate-y-[-4px] active:translate-y-[0px]">
              {editingProduct ? "Sync Changes" : "Commit Configuration"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
