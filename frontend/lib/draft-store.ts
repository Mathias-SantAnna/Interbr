import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CatalogProduct } from "./catalog-api";
import type { ClientCompany } from "./salesman-api";

export type DraftItem = {
  product: CatalogProduct;
  quantity: number;
};

export type OrderDraft = {
  client: ClientCompany | null;
  items: DraftItem[];
  discount_pct: number;
  discount_note: string;
  payment_method: string;
  delivery_cep: string;
  delivery_street: string;
  delivery_number: string;
  delivery_complement: string;
  delivery_neighborhood: string;
  delivery_city: string;
  delivery_state: string;
  savedAt: string | null;
};

type DraftStore = OrderDraft & {
  setClient: (client: ClientCompany | null) => void;
  addItem: (product: CatalogProduct, qty?: number) => void;
  removeItem: (productId: string) => void;
  updateQty: (productId: string, qty: number) => void;
  setDiscount: (pct: number, note: string) => void;
  setDelivery: (fields: Partial<OrderDraft>) => void;
  clearDraft: () => void;
  saveDraft: () => void;
  subtotal: () => number;
  itemCount: () => number;
};

const EMPTY: OrderDraft = {
  client: null,
  items: [],
  discount_pct: 0,
  discount_note: "",
  payment_method: "pix",
  delivery_cep: "",
  delivery_street: "",
  delivery_number: "",
  delivery_complement: "",
  delivery_neighborhood: "",
  delivery_city: "",
  delivery_state: "",
  savedAt: null,
};

export const useDraftStore = create<DraftStore>()(
  persist(
    (set, get) => ({
      ...EMPTY,

      setClient: (client) =>
        set({ client, delivery_city: client?.city ?? "", delivery_state: client?.state ?? "", delivery_cep: client?.cep ?? "" }),

      addItem: (product, qty = 1) =>
        set((state) => {
          const existing = state.items.find((i) => i.product.id === product.id);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.product.id === product.id ? { ...i, quantity: i.quantity + qty } : i
              ),
            };
          }
          return { items: [...state.items, { product, quantity: qty }] };
        }),

      removeItem: (productId) =>
        set((state) => ({ items: state.items.filter((i) => i.product.id !== productId) })),

      updateQty: (productId, qty) => {
        if (qty <= 0) { get().removeItem(productId); return; }
        set((state) => ({
          items: state.items.map((i) =>
            i.product.id === productId ? { ...i, quantity: qty } : i
          ),
        }));
      },

      setDiscount: (pct, note) => set({ discount_pct: pct, discount_note: note }),

      setDelivery: (fields) => set(fields),

      clearDraft: () => set(EMPTY),

      saveDraft: () => set({ savedAt: new Date().toISOString() }),

      subtotal: () =>
        get().items.reduce((s, i) => s + i.product.price * i.quantity, 0),

      itemCount: () =>
        get().items.reduce((s, i) => s + i.quantity, 0),
    }),
    { name: "interbr-salesman-draft" }
  )
);
