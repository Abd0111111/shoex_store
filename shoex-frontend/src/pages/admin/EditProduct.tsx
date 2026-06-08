// src/pages/admin/EditProduct.tsx
import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Plus, X, Upload, Wand2,
  ChevronRight, ChevronLeft, Check, Star, GripVertical, AlertTriangle,
} from "lucide-react";
import { useAdminStore } from "@/store/adminStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import api from "@/services/api";

// ── Constants (same as AddProduct) ───────────────────
const STEPS = ["Basic Info", "Media", "Pricing", "Inventory & Sizes", "Colors & Summary"];
const CATEGORIES = ["Lifestyle", "Running", "Basketball", "Casual", "Training"];
const ALL_SIZES = [36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47];
const MAX_IMAGES = 10;
const PRESET_COLORS = [
  { name: "White",  hex: "#ffffff" },
  { name: "Black",  hex: "#000000" },
  { name: "Red",    hex: "#dc143c" },
  { name: "Navy",   hex: "#1e3a5f" },
  { name: "Gray",   hex: "#6b7280" },
  { name: "Beige",  hex: "#d4b896" },
  { name: "Green",  hex: "#16a34a" },
  { name: "Blue",   hex: "#2563eb" },
];

// ── Types ─────────────────────────────────────────────
interface SizeStock { size: number; stock: number; }
interface ImageItem  { id: string; url: string; file?: File; isObjectUrl?: boolean; }

// ── Helpers ───────────────────────────────────────────
const generateSKU = (name: string, category: string) => {
  const n = name.replace(/\s+/g, "").toUpperCase().slice(0, 4) || "PROD";
  const c = category.toUpperCase().slice(0, 3);
  const r = Math.floor(Math.random() * 9000) + 1000;
  return `${c}-${n}-${r}`;
};

const isValidUrl = (url: string) =>
  url.startsWith("http://") || url.startsWith("https://");

// ── Main Component ────────────────────────────────────
export default function EditProduct() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { products, updateProduct } = useAdminStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Find product — show 404 state if missing ──────
  const existing = products.find((p) => p.id === id);

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  // ── Form State — pre-filled from existing product ──
  const [name, setName]               = useState("");
  const [brand, setBrand]             = useState("SHOEX");
  const [category, setCategory]       = useState("Lifestyle");
  const [description, setDescription] = useState("");
  const [tags, setTags]               = useState<string[]>([]);
  const [tagInput, setTagInput]       = useState("");
  const [featured, setFeatured]       = useState(false);

  const [images, setImages]             = useState<ImageItem[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [bgImageIndex, setBgImageIndex] = useState(0);
  const [dragOverIdx, setDragOverIdx]   = useState<number | null>(null);

  const [price, setPrice]           = useState("");
  const [hasDiscount, setHasDiscount] = useState(false);
  const [discountPct, setDiscountPct] = useState(10);

  const [sizeStocks, setSizeStocks] = useState<SizeStock[]>([]);
  const [sku, setSku]               = useState("");
  const [weight, setWeight]         = useState("");

  const [selectedColors, setSelectedColors] = useState<{ name: string; hex: string }[]>([]);
  const [previewSku, setPreviewSku]         = useState("");

  // ── Seed form from existing product once on mount ─
  useEffect(() => {
    if (!existing) {
      setNotFound(true);
      return;
    }

    setName(existing.name ?? "");
    setBrand(existing.brand ?? "SHOEX");
    setCategory(existing.category ?? "Lifestyle");
    setDescription(existing.description ?? "");
    setTags(existing.tags ?? []);
    setFeatured(existing.featured ?? false);
    setSku(existing.sku ?? "");
    setWeight(existing.weight ? String(existing.weight) : "");
    setSelectedColors(existing.colors ?? []);

    // Images — treat existing URLs as non-object-urls
    const seededImages: ImageItem[] = (existing.images ?? []).map((url) => ({
      id: crypto.randomUUID(),
      url,
      isObjectUrl: false,
    }));
    setImages(seededImages);
    setBgImageIndex(existing.backgroundImageIndex ?? 0);

    // Price / discount
    if (existing.originalPrice && existing.originalPrice > existing.price) {
      // Has active discount — restore original price and compute pct
      setPrice(String(existing.originalPrice));
      setHasDiscount(true);
      const pct = Math.round((1 - existing.price / existing.originalPrice) * 100);
      setDiscountPct(pct);
    } else {
      setPrice(String(existing.price ?? ""));
      setHasDiscount(false);
    }

    // Sizes & stock
    const seededSizes: SizeStock[] = (existing.sizeStocks ?? []);
    setSizeStocks(seededSizes.length > 0 ? seededSizes : []);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Stable preview SKU ────────────────────────────
  useEffect(() => {
    if (!sku) setPreviewSku(generateSKU(name || "PROD", category));
  }, [name, category, sku]);

  // ── Cleanup object URLs ───────────────────────────
  useEffect(() => {
    return () => {
      images.forEach((img) => {
        if (img.isObjectUrl) URL.revokeObjectURL(img.url);
      });
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived ───────────────────────────────────────
  const basePrice       = parseFloat(price) || 0;
  const discountedPrice = hasDiscount ? basePrice * (1 - discountPct / 100) : basePrice;
  const totalStock      = sizeStocks.reduce((s, x) => s + x.stock, 0);
  const selectedSizes   = sizeStocks.map((s) => s.size);

  // ── Tag helpers ───────────────────────────────────
  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput("");
  };

  // ── Image helpers ─────────────────────────────────
  const addImageUrl = () => {
    const url = imageUrlInput.trim();
    if (!url) return;
    if (!isValidUrl(url)) {
      toast.error("Please enter a valid URL starting with http:// or https://");
      return;
    }
    if (images.length >= MAX_IMAGES) {
      toast.error(`Maximum ${MAX_IMAGES} images allowed`);
      return;
    }
    if (!images.find((i) => i.url === url)) {
      setImages((prev) => [...prev, { id: crypto.randomUUID(), url }]);
    }
    setImageUrlInput("");
  };

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;
    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) { toast.error(`Maximum ${MAX_IMAGES} images allowed`); return; }
    const toAdd = Array.from(files).slice(0, remaining);
    if (Array.from(files).length > remaining) toast.warning(`Only ${remaining} more image(s) can be added`);
    toAdd.forEach((file) => {
      const url = URL.createObjectURL(file);
      setImages((prev) => [...prev, { id: crypto.randomUUID(), url, file, isObjectUrl: true }]);
    });
  };

  const removeImage = (idx: number) => {
    const img = images[idx];
    if (img.isObjectUrl) URL.revokeObjectURL(img.url);
    setImages((prev) => prev.filter((_, i) => i !== idx));
    if (bgImageIndex === idx) setBgImageIndex(0);
    else if (bgImageIndex > idx) setBgImageIndex((b) => b - 1);
  };

  const moveImage = (from: number, to: number) => {
    const updated = [...images];
    const [moved] = updated.splice(from, 1);
    updated.splice(to, 0, moved);
    setImages(updated);
    if (bgImageIndex === from) setBgImageIndex(to);
    else if (bgImageIndex === to) setBgImageIndex(from);
  };

  const handleDragStart = (e: React.DragEvent, idx: number) => e.dataTransfer.setData("text/plain", idx.toString());
  const handleDrop = (e: React.DragEvent, toIdx: number) => {
    e.preventDefault();
    const fromIdx = parseInt(e.dataTransfer.getData("text/plain"));
    if (fromIdx !== toIdx) moveImage(fromIdx, toIdx);
    setDragOverIdx(null);
  };

  // ── Size Stock helpers ────────────────────────────
  const toggleSize = (size: number) => {
    setSizeStocks((prev) => {
      const exists = prev.find((s) => s.size === size);
      if (exists) return prev.filter((s) => s.size !== size);
      return [...prev, { size, stock: 0 }].sort((a, b) => a.size - b.size);
    });
  };

  const updateSizeStock = (size: number, stock: number) =>
    setSizeStocks((prev) => prev.map((s) => s.size === size ? { ...s, stock: Math.max(0, stock) } : s));

  const toggleColor = (c: { name: string; hex: string }) =>
    setSelectedColors((prev) =>
      prev.find((x) => x.hex === c.hex) ? prev.filter((x) => x.hex !== c.hex) : [...prev, c]
    );

  // ── Submit (update, not add) ──────────────────────
  const handleSubmit = async (submitStatus: "Active" | "Draft" = "Active") => {
    if (!name || !price)       { toast.error("Name and price are required"); return; }
    if (basePrice <= 0)        { toast.error("Price must be greater than 0"); return; }
    if (sizeStocks.length === 0) { toast.error("Please add at least one size"); return; }
    if (totalStock === 0)      toast.warning("All sizes have 0 stock — product will be out of stock");
    if (loading) return;

    setLoading(true);
    try {
      // Upload images that are local files
      const imageUrls: string[] = [];
      for (const img of images) {
        if (img.file) {
          const formData = new FormData();
          formData.append("image", img.file);
          const { data: uploadRes } = await api.post("/admin/products/upload-image", formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          });
          if (uploadRes.success && uploadRes.data?.url) {
            imageUrls.push(uploadRes.data.url);
          } else {
            throw new Error("Failed to upload image " + img.file.name);
          }
        } else {
          imageUrls.push(img.url);
        }
      }

      const finalUrls = imageUrls.length
        ? imageUrls
        : ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400"];

      const finalSku = sku || previewSku || generateSKU(name, category);

      // KEY DIFFERENCE from AddProduct: calls updateProduct with the existing id
      await updateProduct(id!, {
        name,
        brand,
        category,
        description,
        tags,
        images: finalUrls,
        backgroundImageIndex: bgImageIndex,
        price: hasDiscount ? discountedPrice : basePrice,
        originalPrice: hasDiscount ? basePrice : undefined,
        stock: totalStock,
        sizeStocks,
        sku: finalSku,
        sizes: selectedSizes,
        colors: selectedColors,
        rating: existing?.rating ?? 0,
        reviewCount: existing?.reviewCount ?? 0,
        inStock: totalStock > 0,
        featured,
        status: submitStatus,
        weight: weight ? parseFloat(weight) : undefined,
      });

      toast.success(submitStatus === "Draft" ? "Saved as draft!" : "Product updated successfully!");
      navigate("/admin/products");
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || err.response?.data?.message || err.message || "Failed to update product");
    } finally {
      setLoading(false);
    }
  };

  // ── Cancel guard ──────────────────────────────────
  const handleCancel = () => {
    const hasChanges =
      name !== (existing?.name ?? "") ||
      price !== String(existing?.originalPrice ?? existing?.price ?? "") ||
      images.length !== (existing?.images?.length ?? 0);

    if (hasChanges) {
      if (!window.confirm("You have unsaved changes. Are you sure you want to leave?")) return;
    }
    navigate("/admin/products");
  };

  // ── Step validation (same logic as AddProduct) ────
  const canNext = () => {
    if (step === 0) return name.trim().length > 0;
    if (step === 2) return price.trim().length > 0 && basePrice > 0;
    if (step === 3) return sizeStocks.length > 0;
    return true;
  };

  // ── 404 State ─────────────────────────────────────
  if (notFound) {
    return (
      <div className="max-w-3xl mx-auto flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
        <div className="p-4 bg-red-500/10 rounded-full">
          <AlertTriangle className="w-12 h-12 text-red-500" />
        </div>
        <div>
          <h2 className="text-2xl font-extrabold text-white mb-2">Product Not Found</h2>
          <p className="text-muted-foreground text-sm">
            No product exists with ID: <code className="text-white font-mono bg-white/5 px-2 py-0.5 rounded">{id}</code>
          </p>
        </div>
        <Button
          className="bg-[#dc143c] hover:bg-[#dc143c]/90 text-white"
          onClick={() => navigate("/admin/products")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Products
        </Button>
      </div>
    );
  }

  // ── UI (identical structure to AddProduct) ────────
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={handleCancel}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          {/* CLEAR visual distinction from AddProduct */}
          <h1 className="text-3xl font-extrabold">Edit Product</h1>
          <p className="text-sm text-muted-foreground">
            Editing: <span className="text-white font-medium">{existing?.name}</span>
          </p>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => i < step && setStep(i)}
              className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
                i === step ? "text-white" : i < step ? "text-[#dc143c] cursor-pointer" : "text-gray-600"
              }`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                i < step   ? "bg-[#dc143c] border-[#dc143c] text-white" :
                i === step ? "border-[#dc143c] text-[#dc143c]" :
                "border-gray-700 text-gray-600"
              }`}>
                {i < step ? <Check className="w-3 h-3" /> : i + 1}
              </div>
              <span className="hidden sm:inline">{s}</span>
            </button>
            {i < STEPS.length - 1 && (
              <div className={`w-6 h-px mx-1 ${i < step ? "bg-[#dc143c]" : "bg-gray-800"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          className="bg-[#111111] border border-white/10 rounded-2xl p-6 space-y-5"
        >
          {/* ── Step 0: Basic Info ── */}
          {step === 0 && (
            <>
              <h2 className="text-xl font-extrabold">Basic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Product Name *</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Air Force Classic White" className="bg-input mt-1" />
                </div>
                <div>
                  <Label>Brand</Label>
                  <Input value={brand} onChange={(e) => setBrand(e.target.value)} className="bg-input mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-input border border-border rounded-md text-sm text-foreground outline-none focus:border-[#dc143c]">
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <Label>Status</Label>
                  <select defaultValue="Active"
                    className="w-full mt-1 px-3 py-2 bg-input border border-border rounded-md text-sm text-foreground outline-none focus:border-[#dc143c]"
                    disabled>
                    <option>Active</option>
                  </select>
                  <p className="text-xs text-muted-foreground mt-1">Set via Publish / Save as Draft buttons</p>
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                  rows={3} placeholder="Describe your product..."
                  className="w-full mt-1 px-3 py-2 bg-input border border-border rounded-md text-sm text-foreground outline-none focus:border-[#dc143c] resize-none" />
              </div>
              <div>
                <Label>Tags</Label>
                <div className="flex gap-2 mt-1">
                  <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                    placeholder="Press Enter to add tag" className="bg-input" />
                  <Button variant="outline" onClick={addTag}><Plus className="w-4 h-4" /></Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tags.map((t) => (
                      <span key={t} className="flex items-center gap-1 px-3 py-1 bg-[#dc143c]/10 text-[#dc143c] rounded-full text-xs font-medium">
                        {t}
                        <button onClick={() => setTags(tags.filter((x) => x !== t))}><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <div onClick={() => setFeatured((f) => !f)}
                  className={`w-10 h-6 rounded-full transition-colors relative ${featured ? "bg-[#dc143c]" : "bg-gray-700"}`}>
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${featured ? "left-5" : "left-1"}`} />
                </div>
                <span className="text-sm font-medium">Featured Product (shown on Home page)</span>
              </label>
            </>
          )}

          {/* ── Step 1: Media ── */}
          {step === 1 && (
            <>
              <h2 className="text-xl font-extrabold">Product Images</h2>
              <p className="text-sm text-muted-foreground">
                Drag to reorder • Click ⭐ to set Home page background
                {images.length > 0 && (
                  <span className="ml-2 text-[#dc143c] font-medium">{images.length}/{MAX_IMAGES} images</span>
                )}
              </p>

              {images.length < MAX_IMAGES && (
                <div onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center cursor-pointer hover:border-[#dc143c]/50 hover:bg-[#dc143c]/5 transition-all"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); handleFileUpload(e.dataTransfer.files); }}>
                  <Upload className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-white mb-1">Click to upload or drag images here</p>
                  <p className="text-xs text-gray-600">PNG, JPG, WEBP — up to {MAX_IMAGES} images total</p>
                  <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
                    onChange={(e) => handleFileUpload(e.target.files)} />
                </div>
              )}

              <div>
                <Label>Or add an image URL</Label>
                <div className="flex gap-2 mt-1">
                  <Input value={imageUrlInput} onChange={(e) => setImageUrlInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addImageUrl())}
                    placeholder="https://example.com/image.jpg" className="bg-input" />
                  <Button variant="outline" onClick={addImageUrl} disabled={images.length >= MAX_IMAGES}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {images.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{images.length} image{images.length !== 1 ? "s" : ""}</span>
                    <span>First image = main product image</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {images.map((img, i) => (
                      <div key={img.id} draggable
                        onDragStart={(e) => handleDragStart(e, i)}
                        onDragOver={(e) => { e.preventDefault(); setDragOverIdx(i); }}
                        onDragLeave={() => setDragOverIdx(null)}
                        onDrop={(e) => handleDrop(e, i)}
                        className={`relative group aspect-square rounded-xl overflow-hidden bg-secondary border-2 transition-all cursor-grab ${
                          dragOverIdx === i ? "border-[#dc143c] scale-105" :
                          i === 0 ? "border-[#dc143c]/50" : "border-transparent"
                        }`}>
                        <img src={img.url} alt="" className="w-full h-full object-cover" />
                        {i === 0 && (
                          <span className="absolute top-2 left-2 px-2 py-0.5 bg-[#dc143c] text-white text-[10px] font-bold rounded-full">Main</span>
                        )}
                        {i === bgImageIndex && (
                          <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-amber-500 text-black text-[10px] font-bold rounded-full flex items-center gap-1">
                            <Star className="w-2.5 h-2.5 fill-black" /> Home BG
                          </span>
                        )}
                        <div className="absolute top-2 right-8 opacity-0 group-hover:opacity-100 transition-opacity">
                          <GripVertical className="w-4 h-4 text-white drop-shadow" />
                        </div>
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                          <button onClick={() => setBgImageIndex(i)} title="Set as Home background"
                            className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center hover:scale-110 transition-transform">
                            <Star className="w-4 h-4 text-black fill-black" />
                          </button>
                          {i !== 0 && (
                            <button onClick={() => moveImage(i, 0)} title="Set as main image"
                              className="w-8 h-8 bg-[#dc143c] rounded-full flex items-center justify-center hover:scale-110 transition-transform text-[10px] font-bold text-white">
                              1st
                            </button>
                          )}
                          <button onClick={() => removeImage(i)} title="Remove"
                            className="w-8 h-8 bg-black/70 rounded-full flex items-center justify-center hover:scale-110 transition-transform">
                            <X className="w-4 h-4 text-white" />
                          </button>
                        </div>
                        <div className="absolute top-2 right-2 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center text-[10px] font-bold text-white">
                          {i + 1}
                        </div>
                      </div>
                    ))}
                    {images.length < MAX_IMAGES && (
                      <div onClick={() => fileInputRef.current?.click()}
                        className="aspect-square rounded-xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#dc143c]/50 hover:bg-[#dc143c]/5 transition-all">
                        <Plus className="w-6 h-6 text-gray-600" />
                        <span className="text-xs text-gray-600">Add more</span>
                      </div>
                    )}
                  </div>
                  <div className="bg-white/5 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
                    <p>🔴 <strong>First image</strong> = main product image in the catalog</p>
                    <p>⭐ <strong>Home BG</strong> = image used as the Home page background</p>
                    <p>🟡 Drag images to reorder them</p>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── Step 2: Pricing ── */}
          {step === 2 && (
            <>
              <h2 className="text-xl font-extrabold">Pricing</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Selling Price ($) *</Label>
                  <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.00" className="bg-input mt-1" min={0.01} step={0.01} />
                  {price && basePrice <= 0 && (
                    <p className="text-xs text-red-500 mt-1">Price must be greater than 0</p>
                  )}
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-4 space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <div onClick={() => setHasDiscount((d) => !d)}
                    className={`w-10 h-6 rounded-full transition-colors relative ${hasDiscount ? "bg-[#dc143c]" : "bg-gray-700"}`}>
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${hasDiscount ? "left-5" : "left-1"}`} />
                  </div>
                  <span className="text-sm font-medium">Apply Percentage Discount</span>
                </label>

                {hasDiscount && basePrice > 0 && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Discount</span>
                        <span className="font-bold text-[#dc143c]">{discountPct}%</span>
                      </div>
                      <input type="range" min={1} max={80} value={discountPct}
                        onChange={(e) => setDiscountPct(Number(e.target.value))}
                        className="w-full accent-[#dc143c]" />
                    </div>
                    <div className="flex justify-between items-center bg-black/30 rounded-lg p-4">
                      <div>
                        <p className="text-xs text-gray-500">Original</p>
                        <p className="font-bold line-through text-gray-500">${basePrice.toFixed(2)}</p>
                      </div>
                      <div className="text-center text-xs text-green-400 font-semibold">
                        Save ${(basePrice - discountedPrice).toFixed(2)}
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">New Price</p>
                        <p className="text-xl font-extrabold text-[#dc143c]">${discountedPrice.toFixed(2)}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </>
          )}

          {/* ── Step 3: Inventory & Sizes ── */}
          {step === 3 && (
            <>
              <h2 className="text-xl font-extrabold">Inventory per Size</h2>
              <p className="text-sm text-muted-foreground">Select available sizes and set the stock quantity for each</p>

              <div>
                <Label className="mb-3 block">Select Sizes</Label>
                <div className="flex flex-wrap gap-2">
                  {ALL_SIZES.map((s) => {
                    const selected = selectedSizes.includes(s);
                    return (
                      <button key={s} onClick={() => toggleSize(s)}
                        className={`w-12 h-10 rounded-lg text-sm font-semibold border-2 transition-all ${
                          selected ? "border-[#dc143c] bg-[#dc143c]/10 text-[#dc143c]"
                                   : "border-white/10 text-gray-400 hover:border-white/30"
                        }`}>
                        {s}
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-3 mt-2">
                  <button onClick={() => setSizeStocks(ALL_SIZES.map((size) => ({ size, stock: 0 })))}
                    className="text-xs text-[#dc143c] hover:underline">Select All</button>
                  <span className="text-gray-600 text-xs">·</span>
                  <button onClick={() => setSizeStocks([])} className="text-xs text-gray-500 hover:underline">Clear</button>
                </div>
              </div>

              {sizeStocks.length > 0 && (
                <div className="space-y-3">
                  <Label>Stock per Size</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {sizeStocks.map(({ size, stock }) => (
                      <div key={size} className="bg-white/5 rounded-xl p-3 border border-white/10">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-bold text-[#dc143c]">Size {size}</span>
                          <span className={`text-xs font-semibold ${stock === 0 ? "text-red-500" : stock <= 3 ? "text-amber-500" : "text-green-500"}`}>
                            {stock === 0 ? "Out of stock" : stock <= 3 ? "Low" : "Available"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => updateSizeStock(size, stock - 1)}
                            className="w-7 h-7 rounded-full bg-secondary hover:bg-secondary/70 text-sm font-bold transition-colors flex items-center justify-center">−</button>
                          <input type="number" value={stock} min={0}
                            onChange={(e) => updateSizeStock(size, parseInt(e.target.value) || 0)}
                            className="flex-1 text-center font-extrabold bg-transparent border-b border-[#dc143c] outline-none text-sm py-0.5" />
                          <button onClick={() => updateSizeStock(size, stock + 1)}
                            className="w-7 h-7 rounded-full bg-secondary hover:bg-secondary/70 text-sm font-bold transition-colors flex items-center justify-center">+</button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between bg-[#dc143c]/10 border border-[#dc143c]/20 rounded-xl p-4">
                    <span className="font-semibold">Total Stock</span>
                    <span className="text-xl font-extrabold text-[#dc143c]">{totalStock} units</span>
                  </div>
                </div>
              )}

              {sizeStocks.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">Select at least one size from above</div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-white/10">
                <div>
                  <Label>SKU</Label>
                  <div className="flex gap-2 mt-1">
                    <Input value={sku} onChange={(e) => setSku(e.target.value)}
                      placeholder="Auto-generated if empty" className="bg-input flex-1" />
                    <Button variant="outline" onClick={() => setSku(generateSKU(name, category))} title="Generate SKU">
                      <Wand2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label>Weight (kg)</Label>
                  <Input type="number" value={weight} onChange={(e) => setWeight(e.target.value)}
                    placeholder="0.0" className="bg-input mt-1" min={0.01} step={0.1} />
                </div>
              </div>
            </>
          )}

          {/* ── Step 4: Colors & Summary ── */}
          {step === 4 && (
            <>
              <h2 className="text-xl font-extrabold">Colors & Summary</h2>
              <div>
                <Label className="mb-2 block">Colors</Label>
                <div className="flex flex-wrap gap-3">
                  {PRESET_COLORS.map((c) => {
                    const selected = !!selectedColors.find((x) => x.hex === c.hex);
                    return (
                      <button key={c.hex} onClick={() => toggleColor(c)} className="flex flex-col items-center gap-1">
                        <div className={`w-9 h-9 rounded-full border-2 transition-all ${selected ? "border-[#dc143c] scale-110" : "border-white/20"}`}
                          style={{ backgroundColor: c.hex }} />
                        <span className={`text-xs ${selected ? "text-[#dc143c]" : "text-gray-600"}`}>{c.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="bg-black/30 rounded-xl p-4 space-y-2 text-sm">
                <h3 className="font-bold mb-3 text-white">Updated Summary</h3>
                <div className="flex justify-between"><span className="text-gray-500">Name</span><span className="font-medium text-white">{name || "—"}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Category</span><span className="text-white">{category}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Price</span><span className="font-bold text-[#dc143c]">${hasDiscount ? discountedPrice.toFixed(2) : basePrice.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Total Stock</span><span className="text-white">{totalStock} units</span></div>
                <div className="flex justify-between"><span className="text-gray-500">SKU</span><span className="font-mono text-xs text-white">{sku || previewSku}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Sizes</span><span className="text-white">{selectedSizes.length ? selectedSizes.join(", ") : "None"}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Colors</span><span className="text-white">{selectedColors.length ? selectedColors.map((c) => c.name).join(", ") : "None"}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Images</span><span className="text-white">{images.length} uploaded</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Featured</span><span className="text-white">{featured ? "Yes" : "No"}</span></div>

                {sizeStocks.length > 0 && (
                  <div className="pt-2 border-t border-white/10">
                    <p className="text-gray-500 mb-2">Stock Breakdown</p>
                    <div className="flex flex-wrap gap-2">
                      {sizeStocks.map(({ size, stock }) => (
                        <span key={size} className="px-2 py-1 bg-white/5 rounded-lg text-xs">
                          <span className="text-[#dc143c] font-bold">{size}</span>
                          <span className="text-gray-400"> × {stock}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => step === 0 ? handleCancel() : setStep((s) => s - 1)}>
          <ChevronLeft className="w-4 h-4 mr-1" />
          {step === 0 ? "Cancel" : "Back"}
        </Button>

        {step < STEPS.length - 1 ? (
          <Button disabled={!canNext()} onClick={() => setStep((s) => s + 1)}
            className="bg-[#dc143c] hover:bg-[#dc143c]/90 text-white disabled:opacity-40">
            Next <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => handleSubmit("Draft")} disabled={loading}>
              {loading ? "Saving..." : "Save as Draft"}
            </Button>
            <Button onClick={() => handleSubmit("Active")} disabled={loading}
              className="bg-[#dc143c] hover:bg-[#dc143c]/90 text-white">
              {loading ? "Updating..." : "Update Product"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}