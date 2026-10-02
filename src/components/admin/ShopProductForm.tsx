import { X } from "lucide-react";

interface ShopProductFormProps {
  onClose: () => void;
  onSwitchToClassic: () => void;
}

export function ShopProductForm({
  onClose,
  onSwitchToClassic,
}: ShopProductFormProps) {
  return (
    <section className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold">Product management unavailable</h2>
        <button onClick={onClose} aria-label="Close product form">
          <X size={18} />
        </button>
      </div>
      <p className="mb-4 text-sm">
        The documented API collection does not provide marketplace product
        endpoints, so products cannot be created or changed from this screen.
      </p>
      <button
        onClick={onSwitchToClassic}
        className="rounded-lg border border-amber-700 px-3 py-2 text-sm font-medium"
      >
        Return to marketplace
      </button>
    </section>
  );
}
