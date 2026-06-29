import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  email: string | null;
  isAuthenticated: boolean;
}

const getInitialState = (): AuthState => {
  if (typeof window === 'undefined') {
    return {
      accessToken: null,
      refreshToken: null,
      email: null,
      isAuthenticated: false,
    };
  }

  const accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');
  const email = localStorage.getItem('email');

  return {
    accessToken,
    refreshToken,
    email,
    isAuthenticated: !!accessToken,
  };
};

const authSlice = createSlice({
  name: 'auth',
  initialState: getInitialState(),
  reducers: {
    setCredentials(
      state,
      action: PayloadAction<{ accessToken: string; refreshToken: string; email: string }>
    ) {
      const { accessToken, refreshToken, email } = action.payload;
      state.accessToken = accessToken;
      state.refreshToken = refreshToken;
      state.email = email;
      state.isAuthenticated = true;

      if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('email', email);
      }
    },
    clearCredentials(state) {
      state.accessToken = null;
      state.refreshToken = null;
      state.email = null;
      state.isAuthenticated = false;

      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('email');
      }
    },
  },
});

export const { setCredentials, clearCredentials } = authSlice.actions;
export default authSlice.reducer;
