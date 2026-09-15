import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  X,
  Camera,
  Upload,
  ChevronDown,
  Check,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { Product } from "./AdminApp";

interface ShopProductFormProps {
  onAddProduct: (product: Product) => void;
  onClose: () => void;
  onSwitchToClassic: () => void;
}

const CATEGORIES = [
  "Electronics",
  "Fashion",
  "Home",
  "Kitchen",
  "Phones & Tablets",
  "Computing",
  "Vehicles",
  "Groceries",
  "Health & Beauty",
];

const DEFAULT_FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1593359677879-a4bb92f4834d?w=800&auto=format&fit=crop&q=80";

export const ShopProductForm: React.FC<ShopProductFormProps> = ({
  onAddProduct,
  onClose,
  onSwitchToClassic,
}) => {
  const [productName, setProductName] = useState("");
  const [targetPrice, setTargetPrice] = useState("");
  const [category, setCategory] = useState("Electronics");
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // File and Camera inputs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("Please select a valid image file");
        return;
      }
      setError(null);
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setImagePreview(result);
        setImageUrl("");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setImageUrl(val);
    if (val.trim()) {
      setImagePreview(val.trim());
    } else {
      setImagePreview(null);
    }
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    if (!raw) {
      setTargetPrice("");
      return;
    }
    const num = parseInt(raw, 10);
    setTargetPrice(num.toLocaleString());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim()) {
      setError("Please enter a product name");
      return;
    }

    const cleanPrice = Number(targetPrice.replace(/[^0-9]/g, ""));
    if (!cleanPrice || cleanPrice <= 0) {
      setError("Please enter a valid target price");
      return;
    }

    setIsSubmitting(true);
    const finalImage =
      imagePreview || imageUrl.trim() || DEFAULT_FALLBACK_IMAGE;

    const newProduct: Product = {
      id: "prod-" + Date.now(),
      name: productName.trim(),
      category,
      price: cleanPrice,
      stock: 12,
      sales: 0,
      image: finalImage,
      status: "active",
      description:
        description.trim() ||
        "Cooperative purchase listing posted for group order.",
      specs: [
        "Verified Cooperative Group Buy",
        "Official 1-Year Warranty",
        "Inspected and Dispatched via Pave Logistics Hub",
      ],
    };

    setTimeout(() => {
      onAddProduct(newProduct);
      setIsSubmitting(false);
      onClose();
    }, 200);
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: -15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="bg-white dark:bg-[#111327] rounded-2xl p-6 sm:p-7 border border-[#F1F3FB] dark:border-white/10 mb-5 shadow-md"
    >
      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Header */}
      <div className="flex items-start justify-between pb-4 border-b border-[#F1F3FB] dark:border-white/10 mb-5">
        <div>
          <h3
            style={{
              fontFamily: "var(--font-family-display, 'Bricolage Grotesque')",
              fontWeight: 700,
              fontSize: 18,
            }}
            className="text-[#0D0F1C] dark:text-[#F0F2FF]"
          >
            Add Shop Product
          </h3>
          <p className="text-xs sm:text-sm text-[#6B7280] dark:text-[#94A3B8] mt-0.5">
            Post an item for cooperative purchase
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSwitchToClassic}
            className="px-3 py-1.5 bg-[#F1F3FB] dark:bg-white/5 hover:bg-[#EEF2FF] dark:hover:bg-white/10 text-[#3730A3] dark:text-[#818CF8] rounded-xl text-xs font-medium border border-transparent hover:border-[#3730A3]/20 transition-all flex items-center gap-1.5"
            title="Switch back to Classic Form"
          >
            Switch to Classic UI
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F1F3FB] dark:bg-white/5 flex items-center justify-center text-[#9CA3AF] hover:text-[#0D0F1C] dark:hover:text-white transition-colors"
            aria-label="Close form"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
          <AlertCircle size={15} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Fields Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 mb-5">
        {/* PRODUCT NAME */}
        <div className="sm:col-span-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-[#374151] dark:text-gray-300 block mb-1.5">
            Product Name
          </label>
          <input
            type="text"
            value={productName}
            onChange={(e) => {
              setProductName(e.target.value);
              if (error) setError(null);
            }}
            placeholder="e.g. iPad Pro M4"
            required
            className="w-full bg-[#F1F3FB] dark:bg-white/5 rounded-xl px-4 py-3 text-sm outline-none border border-transparent focus:border-[#3730A3] dark:focus:border-[#818CF8] text-[#0D0F1C] dark:text-[#F0F2FF] placeholder-[#9CA3AF] dark:placeholder-gray-500 transition-colors"
          />
        </div>

        {/* TARGET PRICE (₦) */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-[#374151] dark:text-gray-300 block mb-1.5">
            Target Price (₦)
          </label>
          <input
            type="text"
            value={targetPrice}
            onChange={handlePriceChange}
            placeholder="e.g. 1100000"
            required
            className="w-full bg-[#F1F3FB] dark:bg-white/5 rounded-xl px-4 py-3 text-sm outline-none border border-transparent focus:border-[#3730A3] dark:focus:border-[#818CF8] text-[#0D0F1C] dark:text-[#F0F2FF] placeholder-[#9CA3AF] dark:placeholder-gray-500 transition-colors"
          />
        </div>

        {/* CATEGORY */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-[#374151] dark:text-gray-300 block mb-1.5">
            Category
          </label>
          <div className="relative">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-[#F1F3FB] dark:bg-[#1E2140] rounded-xl px-4 py-3 text-sm outline-none border border-transparent focus:border-[#3730A3] dark:focus:border-[#818CF8] text-[#0D0F1C] dark:text-[#F0F2FF] transition-colors cursor-pointer appearance-none pr-10"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#9CA3AF]">
              <ChevronDown size={16} />
            </div>
          </div>
        </div>

        {/* PRODUCT IMAGE SECTION */}
        <div className="sm:col-span-2">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#374151] dark:text-gray-300">
              Product Image
            </label>
            <span className="text-xs text-[#3730A3] dark:text-[#818CF8] font-medium">
              snap photo or paste url
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            {/* Snap Photo */}
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="group flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed border-[#E5E7EB] dark:border-white/15 bg-[#F9FAFB] dark:bg-white/[0.03] hover:bg-[#EEF2FF] dark:hover:bg-white/[0.07] hover:border-[#3730A3] dark:hover:border-[#818CF8] transition-all text-center cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-[#EEF2FF] dark:bg-white/10 flex items-center justify-center text-[#3730A3] dark:text-[#818CF8] group-hover:scale-110 transition-transform">
                <Camera size={20} />
              </div>
              <span className="text-sm font-semibold text-[#0D0F1C] dark:text-[#F0F2FF] mt-2">
                Snap Photo
              </span>
              <span className="text-xs text-[#6B7280] dark:text-[#94A3B8] mt-0.5">
                Use device camera
              </span>
            </button>

            {/* Upload File */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="group flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed border-[#E5E7EB] dark:border-white/15 bg-[#F9FAFB] dark:bg-white/[0.03] hover:bg-[#EEF2FF] dark:hover:bg-white/[0.07] hover:border-[#3730A3] dark:hover:border-[#818CF8] transition-all text-center cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-[#EEF2FF] dark:bg-white/10 flex items-center justify-center text-[#3730A3] dark:text-[#818CF8] group-hover:scale-110 transition-transform">
                <Upload size={20} />
              </div>
              <span className="text-sm font-semibold text-[#0D0F1C] dark:text-[#F0F2FF] mt-2">
                Upload File
              </span>
              <span className="text-xs text-[#6B7280] dark:text-[#94A3B8] mt-0.5">
                Select from library
              </span>
            </button>
          </div>

          {/* Divider: OR PASTE URL */}
          <div className="flex items-center gap-3 my-3">
            <div className="h-px flex-1 bg-[#E5E7EB] dark:bg-white/10" />
            <span className="text-[10px] font-bold text-[#9CA3AF] dark:text-gray-400 uppercase tracking-wider">
              OR PASTE URL
            </span>
            <div className="h-px flex-1 bg-[#E5E7EB] dark:bg-white/10" />
          </div>

          {/* Web link input */}
          <input
            type="url"
            value={imageUrl}
            onChange={handleUrlChange}
            placeholder="Paste product image web link..."
            className="w-full bg-[#F1F3FB] dark:bg-white/5 rounded-xl px-4 py-3 text-sm outline-none border border-transparent focus:border-[#3730A3] dark:focus:border-[#818CF8] text-[#0D0F1C] dark:text-[#F0F2FF] placeholder-[#9CA3AF] dark:placeholder-gray-500 transition-colors"
          />

          {/* Image Preview */}
          {imagePreview && (
            <div className="mt-2.5 p-2.5 rounded-xl bg-[#F9FAFB] dark:bg-white/5 border border-[#E5E7EB] dark:border-white/10 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-10 h-10 rounded-lg object-cover bg-black/10 border border-[#E5E7EB] dark:border-white/10 flex-shrink-0"
                  onError={() => {
                    setError("Could not load image preview. Please check URL or file.");
                  }}
                />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-[#0D0F1C] dark:text-[#F0F2FF] truncate">
                    Selected Image
                  </p>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <Check size={10} /> Ready to post
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setImagePreview(null);
                  setImageUrl("");
                }}
                className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-red-500 hover:bg-red-500/10 transition-colors"
                title="Remove image"
              >
                <X size={14} />
              </button>
            </div>
          )}
        </div>

        {/* DESCRIPTION */}
        <div className="sm:col-span-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-[#374151] dark:text-gray-300 block mb-1.5">
            Description
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter detailed description of specifications, packaging, and shipping rules..."
            className="w-full bg-[#F1F3FB] dark:bg-white/5 rounded-xl px-4 py-3 text-sm outline-none border border-transparent focus:border-[#3730A3] dark:focus:border-[#818CF8] text-[#0D0F1C] dark:text-[#F0F2FF] placeholder-[#9CA3AF] dark:placeholder-gray-500 transition-colors resize-none"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-2.5 sm:py-3 border-2 border-[#E5E7EB] dark:border-white/10 rounded-xl text-sm font-medium text-[#374151] dark:text-gray-300 hover:bg-[#F9FAFB] dark:hover:bg-white/5 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 py-2.5 sm:py-3 bg-[#3730A3] hover:bg-[#312E81] text-white rounded-xl text-sm font-medium transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Posting...
            </>
          ) : (
            "Post Product"
          )}
        </button>
      </div>
    </motion.form>
  );
};
