import { create } from 'zustand';

interface StoreState {
  accessToken: string | null;
  userEmail: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  setAuth: (token: string, email: string) => void;
  logout: () => void;
  setError: (err: string | null) => void;
  checkAuth: () => Promise<void>;
}

export const useStore = create<StoreState>((set) => ({
  accessToken: null,
  userEmail: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  setAuth: (token, email) => {
    chrome.storage.local.set({ accessToken: token, userEmail: email }, () => {
      set({ accessToken: token, userEmail: email, isAuthenticated: true, error: null });
    });
  },

  logout: () => {
    chrome.storage.local.remove(['accessToken', 'userEmail'], () => {
      set({ accessToken: null, userEmail: null, isAuthenticated: false, error: null });
    });
  },

  setError: (err) => set({ error: err }),

  checkAuth: async () => {
    set({ isLoading: true });
    return new Promise<void>((resolve) => {
      chrome.storage.local.get(['accessToken', 'userEmail'], (result) => {
        if (result.accessToken && result.userEmail) {
          set({
            accessToken: result.accessToken,
            userEmail: result.userEmail,
            isAuthenticated: true,
            isLoading: false,
          });
        } else {
          set({
            accessToken: null,
            userEmail: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
        resolve();
      });
    });
  },
}));
