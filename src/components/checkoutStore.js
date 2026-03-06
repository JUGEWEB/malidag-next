import { create } from "zustand";

export const useCheckoutStore = create((set) => ({
  // Checkout state
  checkoutData: null,
  setCheckoutData: (data) => set({ checkoutData: data }),

  // Review item state
  itemData: null,
  setItemData: (data) => set({ itemData: data }),

   selectedBrandName: null,
  setSelectedBrandName: (brand) => set({ selectedBrandName: brand }),

   ratingFilter: null,
  setRatingFilter: (rating) => set({ ratingFilter: rating }),

  authState: null,
  setAuthState: (auth) => set({ authState: auth }),
}));
