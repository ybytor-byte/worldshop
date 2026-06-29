import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type SortField = 'price' | 'shop' | 'date';
type SortDirection = 'asc' | 'desc';

interface UiState {
  sortField: SortField;
  sortDirection: SortDirection;
  filterShop: string | null;
  filterCurrency: string | null;
  isMobileMenuOpen: boolean;
}

const initialState: UiState = {
  sortField: 'price',
  sortDirection: 'asc',
  filterShop: null,
  filterCurrency: null,
  isMobileMenuOpen: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setSortField(state, action: PayloadAction<SortField>) {
      state.sortField = action.payload;
    },
    setSortDirection(state, action: PayloadAction<SortDirection>) {
      state.sortDirection = action.payload;
    },
    toggleSortDirection(state) {
      state.sortDirection = state.sortDirection === 'asc' ? 'desc' : 'asc';
    },
    setFilterShop(state, action: PayloadAction<string | null>) {
      state.filterShop = action.payload;
    },
    setFilterCurrency(state, action: PayloadAction<string | null>) {
      state.filterCurrency = action.payload;
    },
    toggleMobileMenu(state) {
      state.isMobileMenuOpen = !state.isMobileMenuOpen;
    },
    resetFilters(state) {
      state.sortField = 'price';
      state.sortDirection = 'asc';
      state.filterShop = null;
      state.filterCurrency = null;
    },
  },
});

export const {
  setSortField,
  setSortDirection,
  toggleSortDirection,
  setFilterShop,
  setFilterCurrency,
  toggleMobileMenu,
  resetFilters,
} = uiSlice.actions;
export default uiSlice.reducer;
