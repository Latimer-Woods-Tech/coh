import { create } from 'zustand';

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  image: string;
  categoryId: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (product: Product, quantity: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
  total: number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],

  addItem: (product: Product, quantity: number) => {
    set((state) => {
      const existing = state.items.find((item) => item.product.id === product.id);
      if (existing) {
        return {
          items: state.items.map((item) =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + quantity }
              : item
          ),
        };
      }
      return { items: [...state.items, { product, quantity }] };
    });
  },

  removeItem: (productId: string) => {
    set((state) => ({
      items: state.items.filter((item) => item.product.id !== productId),
    }));
  },

  updateQuantity: (productId: string, quantity: number) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      ),
    }));
  },

  clear: () => set({ items: [] }),

  get total() {
    return get().items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  },
}));
