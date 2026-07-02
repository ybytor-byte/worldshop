import { ApolloClient, InMemoryCache, ApolloLink, createHttpLink } from '@apollo/client';

const API_BASE = 'https://worldshopbackend-production.up.railway.app';

const httpLink = createHttpLink({
  uri: `${API_BASE}/graphql`,
});

const authLink = new ApolloLink((operation, forward) => {
  let token = null;
  if (typeof window !== 'undefined') {
    token = localStorage.getItem('accessToken');
  }
  operation.setContext(({ headers = {} }) => ({
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  }));
  return forward(operation);
});

export const apolloClient = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});
