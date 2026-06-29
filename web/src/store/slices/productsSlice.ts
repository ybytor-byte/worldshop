import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Offer {
  shop: string;
  price: number;
  currency: string;
  url: string;
  affiliateUrl?: string;
  scrapedAt?: string;
}

interface Product {
  id: string;
  brand: string;
  model: string;
  specs: Record<string, unknown>;
  offers: Offer[];
}

interface ProductsState {
  searchResults: Product[];
  selectedProduct: Product | null;
  searchQuery: string;
  isSearching: boolean;
}

const initialState: ProductsState = {
  searchResults: [],
  selectedProduct: null,
  searchQuery: '',
  isSearching: false,
};

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setSearchResults(state, action: PayloadAction<Product[]>) {
      state.searchResults = action.payload;
      state.isSearching = false;
    },
    setSelectedProduct(state, action: PayloadAction<Product | null>) {
      state.selectedProduct = action.payload;
    },
    setSearchQuery(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload;
    },
    setIsSearching(state, action: PayloadAction<boolean>) {
      state.isSearching = action.payload;
    },
    clearSearch(state) {
      state.searchResults = [];
      state.searchQuery = '';
      state.isSearching = false;
    },
  },
});

export const {
  setSearchResults,
  setSelectedProduct,
  setSearchQuery,
  setIsSearching,
  clearSearch,
} = productsSlice.actions;
export default productsSlice.reducer;
