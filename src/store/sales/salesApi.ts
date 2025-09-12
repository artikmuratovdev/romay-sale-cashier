import baseApi from '../api'
import type {
  ClientsRes,
  CreateSale,
  CreateSaleRes,
  GetAllSalesReq,
  GetAllSalesRes,
} from './types'

export const salesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getAllSales: build.query<GetAllSalesRes, GetAllSalesReq>({
      query: (params) => ({
        url: '/sales/get-all',
        method: 'GET',
        params,
      }),
    }),
    createSale: build.mutation<CreateSaleRes, CreateSale>({
      query: (body) => ({
        url: '/sales/add',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['sale'],
    }),
    getClients: build.query<ClientsRes, CreateSale>({
      query: () => '/client/get-all',
      providesTags: ['clients'],
    }),
    updateClientID: build.mutation<
      CreateSaleRes,
      { id: string; client_id: string }
    >({
      query: (body) => ({
        url: `/sales/update-client/${body.id}`,
        method: 'PATCH',
        body,
      }),
    }),
    addItems: build.mutation({
      query: (body) => ({
        url: `/sales/add-item/${body.clientId}`,
        method: 'POST',
        body,
      }),
    }),
  }),
})

export const {
  useGetAllSalesQuery,
  useCreateSaleMutation,
  useGetClientsQuery,
  useUpdateClientIDMutation,
  useAddItemsMutation,
} = salesApi
