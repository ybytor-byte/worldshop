import { gql } from '@apollo/client';

export const GET_PRODUCTS = gql`
  query GetProducts($search: String!) {
    products(search: $search) {
      id
      brand
      model
      specs
      offers {
        shop
        price
        currency
        url
        variant
        affiliateUrl
      }
    }
  }
`;

export const GET_PRODUCT_DETAILS = gql`
  query GetProductDetails($id: ID!) {
    product(id: $id) {
      id
      brand
      model
      specs
      offers {
        shop
        price
        currency
        url
        variant
        affiliateUrl
      }
    }
  }
`;
