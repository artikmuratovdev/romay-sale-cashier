import baseApi from '../api'
import type {
  CreateProductRequest,
  CreateProductResponse,
  GetAllProductsRequest,
  GetAllProductsResponse,
  GetProductsInfiniteRequest,
} from './types'

export const productApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllProducts: builder.query<
      GetAllProductsResponse,
      GetAllProductsRequest
    >({
      query: (params) => ({
        url: '/product/sale-product/get-all',
        method: 'GET',
        params,
      }),
      providesTags: ['products'],
      // Add caching and optimization
      keepUnusedDataFor: 300, // 5 minutes cache
    }),
    // Infinite query endpoint for products
    getProductsInfinite: builder.query<
      GetAllProductsResponse,
      GetProductsInfiniteRequest
    >({
      query: ({ branch, page = 1, limit = 20, search }) => {
        console.log('API Query called with params:', {
          branch,
          page,
          limit,
          search,
        })
        return {
          url: '/product/sale-product/get-all',
          method: 'GET',
          params: {
            branch,
            page,
            limit,
            search: search || undefined,
          },
        }
      },
      providesTags: ['products'],
      keepUnusedDataFor: 60, // Reduced cache time for development
      // Remove merge and serializeQueryArgs to prevent double merging
      transformResponse: (response: GetAllProductsResponse, _meta, arg) => {
        console.log('API Response received:', {
          page: arg.page,
          dataLength: response?.data?.length,
          nextPage: response?.next_page,
          totalCount: response?.after_filtering_count,
        })
        return response
      },
      forceRefetch({ currentArg, previousArg }) {
        // Force refetch if search term, branch, or page changes
        return (
          currentArg?.search !== previousArg?.search ||
          currentArg?.branch !== previousArg?.branch ||
          currentArg?.page !== previousArg?.page
        )
      },
    }),
    // New endpoint for sale products
    getAllSaleProducts: builder.query<
      GetAllProductsResponse,
      { page?: number; limit?: number; search?: string }
    >({
      query: (params) => ({
        url: '/product/sale-product/get-all',
        method: 'GET',
        params,
      }),
      providesTags: ['products'],
    }),
    // New endpoint for rent products
    getAllRentProducts: builder.query<
      GetAllProductsResponse,
      { page?: number; limit?: number; search?: string }
    >({
      query: (params) => ({
        url: '/product/rent-product/get-all',
        method: 'GET',
        params,
      }),
      providesTags: ['products'],
    }),
    createProduct: builder.mutation<
      CreateProductResponse,
      CreateProductRequest
    >({
      query: (body) => ({
        url: '/warehouse/sale-product/add',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['products'],
    }),
  }),
})

export const {
  useGetAllProductsQuery,
  useGetAllSaleProductsQuery,
  useGetAllRentProductsQuery,
  useGetProductsInfiniteQuery,
  useCreateProductMutation,
} = productApi
