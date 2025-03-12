import { apiSlice } from "./api.service";

// `productApi` xizmatini yaratamiz va endpointlarni qo'shamiz
export const productApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Mahsulot qo'shish: POST - /product/create
    createProduct: builder.mutation({
      query: (body) => ({
        url: "api/products/add",
        method: "POST",
        body,
      }),
    }),

    // Barcha mahsulotlarni olish: GET - /product/getProducts
    getAllProducts: builder.query({
      query: () => "/api/products/",
    }),

    // Mahsulotni o'chirish: DELETE - /product/delete/:id
    deleteProduct: builder.mutation({
      query: (id) => ({
        url: `api/products/${id}`,
        method: "DELETE",
      }),
    }),

    getProductById: builder.mutation({
      query: (id) => ({
        url: `api/product/getById/${id}`,
        method: "GET",
      }),
    }),

    // Mahsulotni tahrirlash: PUT - /product/update/:id
    editProduct: builder.mutation({
      query: ({ id, data }) => ({
        url: `api/products/${id}`,
        method: "PUT",
        body: data,
      }),
    }),
  }),
});

// Yangi hook-larni eksport qilamiz
export const {
  useCreateProductMutation,
  useGetAllProductsQuery,
  useDeleteProductMutation,
  useEditProductMutation,
  useGetProductByIdMutation,
} = productApi;

