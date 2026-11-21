import { useMemo, useState, type FormEvent } from "react";
import { Plus, Search, Trash2, X } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import {
  useAdminProductCategories,
  useAdminProducts,
  useAdminPurchases,
  useCreateAdminProduct,
  useDeleteAdminProduct,
} from "@/hooks/useAdmin";

const naira = (n: number) => `₦${n.toLocaleString()}`;
const card =
  "rounded-2xl border border-[#F1F3FB] bg-white shadow-sm dark:border-white/10 dark:bg-[#111327]";
const field =
  "mt-1.5 w-full rounded-xl bg-[#F1F3FB] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#3730A3] dark:bg-white/5";

type Tab = "products" | "purchases";

function QueryNotice({
  isLoading,
  isError,
  error,
  empty,
  label,
  onRetry,
}: {
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  empty: boolean;
  label: string;
  onRetry: () => void;
}) {
  if (isLoading) {
    return <p className="p-10 text-center text-sm text-[#9CA3AF]">Loading {label}...</p>;
  }
  if (isError) {
    return (
      <div role="alert" className="p-10 text-center text-sm text-red-600">
        {error?.message}
        <button onClick={onRetry} className="ml-2 font-semibold">
          Retry
        </button>
      </div>
    );
  }
  if (empty) {
    return <p className="p-10 text-center text-sm text-[#9CA3AF]">No {label} found.</p>;
  }
  return null;
}

function ProductForm({ onClose }: { onClose: () => void }) {
  const categories = useAdminProductCategories();
  const createProduct = useCreateAdminProduct();
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const data = new FormData(event.currentTarget);
    const price = Number(data.get("price"));
    const quantity = Number(data.get("quantity"));
    const ratingRaw = String(data.get("productRating") ?? "").trim();
    const categoryId = String(data.get("categoryId") ?? "");
    const image = data.get("image");

    if (!categoryId) return setError("Choose a category.");
    if (!Number.isFinite(price) || price <= 0) return setError("Enter a price greater than zero.");
    if (!Number.isInteger(quantity) || quantity < 0) {
      return setError("Quantity must be a whole number, zero or more.");
    }
    const rating = ratingRaw === "" ? undefined : Number(ratingRaw);
    if (rating !== undefined && (!Number.isFinite(rating) || rating < 0 || rating > 5)) {
      return setError("Rating must be between 0 and 5.");
    }

    try {
      await createProduct.mutateAsync({
        categoryId,
        productName: String(data.get("productName") ?? "").trim(),
        description: String(data.get("description") ?? "").trim(),
        price,
        quantity,
        productRating: rating,
        image: image instanceof File && image.size > 0 ? image : undefined,
      });
      toast.success("Product created");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create product");
    }
  };

  return (
    <section className={`${card} mb-5 p-5`}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold">Add product</h2>
        <button onClick={onClose} aria-label="Close product form">
          <X size={18} />
        </button>
      </div>
      {categories.isError ? (
        <div role="alert" className="text-sm text-red-600">
          {categories.error.message}
          <button onClick={() => void categories.refetch()} className="ml-2 font-semibold">
            Retry
          </button>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="text-xs font-medium">
            Category
            <select name="categoryId" required defaultValue="" className={field}>
              <option value="" disabled>
                {categories.isLoading ? "Loading categories..." : "Select a category"}
              </option>
              {categories.data?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-medium">
            Product name
            <input name="productName" required maxLength={120} className={field} />
          </label>
          <label className="text-xs font-medium sm:col-span-2">
            Description
            <textarea name="description" required rows={3} maxLength={500} className={field} />
          </label>
          <label className="text-xs font-medium">
            Price (₦)
            <input name="price" type="number" min="1" step="0.01" required className={field} />
          </label>
          <label className="text-xs font-medium">
            Quantity
            <input name="quantity" type="number" min="0" step="1" required className={field} />
          </label>
          <label className="text-xs font-medium">
            Rating (0-5, optional)
            <input name="productRating" type="number" min="0" max="5" step="1" className={field} />
          </label>
          <label className="text-xs font-medium">
            Image (optional)
            <input name="image" type="file" accept="image/*" className={field} />
          </label>
          {error && (
            <p role="alert" className="text-sm text-red-600 sm:col-span-2">
              {error}
            </p>
          )}
          <div className="flex gap-3 sm:col-span-2">
            <button
              type="submit"
              disabled={createProduct.isPending}
              className="rounded-xl bg-[#3730A3] px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {createProduct.isPending ? "Creating..." : "Create product"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border-2 border-[#E5E7EB] px-5 py-2.5 text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

export function MarketplaceSection() {
  const [tab, setTab] = useState<Tab>("products");
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const products = useAdminProducts();
  const purchases = useAdminPurchases(tab === "purchases");
  const categories = useAdminProductCategories();
  const deleteProduct = useDeleteAdminProduct();

  const categoryName = useMemo(
    () => new Map((categories.data ?? []).map((c) => [c.id, c.name])),
    [categories.data],
  );

  const q = search.trim().toLowerCase();
  const productRows = (products.data ?? []).filter(
    (p) =>
      !q ||
      p.name.toLowerCase().includes(q) ||
      (categoryName.get(p.categoryId) ?? "").toLowerCase().includes(q),
  );
  const purchaseRows = (purchases.data ?? []).filter(
    (p) =>
      !q ||
      p.productName.toLowerCase().includes(q) ||
      p.buyerName.toLowerCase().includes(q) ||
      p.buyerEmail.toLowerCase().includes(q),
  );

  const onDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await deleteProduct.mutateAsync(id);
      toast.success("Product deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to delete product");
    }
  };

  const th = "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#9CA3AF]";
  const td = "px-4 py-3 text-sm";

  return (
    <div>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#0D0F1C] dark:text-[#F0F2FF]">Marketplace</h1>
          <p className="mt-1 text-sm text-[#6B7280] dark:text-[#94A3B8]">
            Manage products and view installment purchases
          </p>
        </div>
        <button
          onClick={() => {
            setTab("products");
            setShowForm(true);
          }}
          className="flex items-center gap-2 rounded-xl bg-[#3730A3] px-4 py-2 text-sm font-medium text-white"
        >
          <Plus size={16} />
          Add Product
        </button>
      </div>

      {showForm && <ProductForm onClose={() => setShowForm(false)} />}

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          {(["products", "purchases"] as const).map((item) => (
            <button
              key={item}
              onClick={() => setTab(item)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold capitalize ${
                tab === item
                  ? "bg-[#3730A3] text-white"
                  : "bg-white text-[#6B7280] ring-1 ring-[#E5E7EB] dark:bg-[#111327] dark:ring-white/10"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="relative w-full max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tab === "products" ? "Search product or category" : "Search product or buyer"}
            className="w-full rounded-xl bg-white py-2.5 pl-9 pr-3 text-sm outline-none ring-1 ring-[#E5E7EB] focus:ring-[#3730A3] dark:bg-[#111327] dark:ring-white/10"
          />
        </div>
      </div>

      <div className={`${card} overflow-hidden`}>
        {tab === "products" ? (
          <>
            <QueryNotice
              isLoading={products.isLoading}
              isError={products.isError}
              error={products.error}
              empty={!products.isLoading && !products.isError && productRows.length === 0}
              label="products"
              onRetry={() => void products.refetch()}
            />
            {productRows.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px]">
                  <thead className="bg-[#F9FAFB] dark:bg-white/5">
                    <tr>
                      {["Product", "Category", "Price", "Stock", "Rating", "Status", ""].map((h) => (
                        <th key={h} className={th}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {productRows.map((p) => (
                      <tr key={p.id} className="border-t border-[#F1F3FB] dark:border-white/10">
                        <td className={td}>
                          <div className="font-semibold">{p.name}</div>
                          <div className="max-w-xs truncate text-xs text-[#9CA3AF]">{p.description}</div>
                        </td>
                        <td className={td}>{categoryName.get(p.categoryId) ?? "—"}</td>
                        <td className={td}>{naira(p.price)}</td>
                        <td className={td}>{p.quantity}</td>
                        <td className={td}>{p.rating}/5</td>
                        <td className={`${td} capitalize`}>{p.status}</td>
                        <td className={td}>
                          <button
                            onClick={() => void onDelete(p.id, p.name)}
                            disabled={deleteProduct.isPending}
                            aria-label={`Delete ${p.name}`}
                            className="text-red-600 disabled:opacity-50"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : (
          <>
            <QueryNotice
              isLoading={purchases.isLoading}
              isError={purchases.isError}
              error={purchases.error}
              empty={!purchases.isLoading && !purchases.isError && purchaseRows.length === 0}
              label="purchases"
              onRetry={() => void purchases.refetch()}
            />
            {purchaseRows.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px]">
                  <thead className="bg-[#F9FAFB] dark:bg-white/5">
                    <tr>
                      {["Product", "Buyer", "Qty", "Total", "Paid", "Due", "Progress", "Status"].map((h) => (
                        <th key={h} className={th}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {purchaseRows.map((p) => (
                      <tr key={p.id} className="border-t border-[#F1F3FB] dark:border-white/10">
                        <td className={`${td} font-semibold`}>{p.productName}</td>
                        <td className={td}>
                          <div>{p.buyerName}</div>
                          <div className="text-xs text-[#9CA3AF]">{p.buyerEmail}</div>
                        </td>
                        <td className={td}>{p.quantity}</td>
                        <td className={td}>{naira(p.totalPrice)}</td>
                        <td className={td}>{naira(p.totalAmountPaid)}</td>
                        <td className={td}>{naira(p.totalAmountDue)}</td>
                        <td className={td}>{p.percentage}%</td>
                        <td className={`${td} capitalize`}>{p.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
