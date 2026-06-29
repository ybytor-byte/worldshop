'use client';

import React from 'react';
import { Provider } from 'react-redux';
import { ApolloProvider } from '@apollo/client/react';
import { store } from '../store/store';
import { apolloClient } from '../graphql/client';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <ApolloProvider client={apolloClient}>
        {children}
      </ApolloProvider>
    </Provider>
  );
}
