import { apiSlice } from "./api.service";

export const productsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Sign in as products: POST - /signin/products
    signInproducts: builder.mutation({
      query: (body) => ({
        url: "/products/l",
        method: "POST",
        body,
      }),
    }),

    // Get all productss: GET - /get/products
    getproducts: builder.query({
      query: () => "/products/getAllproductss",
    }),
  }),
});

export const { useSignInproductsMutation, useGetproductsQuery } = productsApi;
