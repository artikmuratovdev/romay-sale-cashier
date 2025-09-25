import baseApi from '../api'
import type {
  ClientsRes,
  CreateSale,
  CreateSaleRes,
  GetAllAssistant,
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
      providesTags: ['sale'],
    }),
    createSale: build.mutation<CreateSaleRes, CreateSale>({
      query: (body) => ({
        url: '/sales/add',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['sale', 'branches', 'clients'],
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
      invalidatesTags: ['sale', 'branches', 'clients'],
    }),
    // Add the missing updateSale mutation
    updateSale: build.mutation<object, { id: string; data: object }>({
      query: ({ id, data }) => ({
        url: `/sales/update/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['sale', 'branches', 'clients'],
    }),
    addItems: build.mutation({
      query: (body) => ({
        url: `/sales/add-item/${body.clientId}`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['sale', 'branches', 'clients'],
    }),
    getAllAssistant: build.query<GetAllAssistant, GetAllSalesReq>({
      query: (params) => ({
        url: '/sales-assistant/get-all',
        method: 'GET',
        params,
      }),
      providesTags: ['sale'],
    }),
    deleteSale: build.mutation<void, string>({
      query: (id) => ({
        url: `/sales/delete/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['sale', 'branches', 'clients'],
    }),
    
  }),
})

export const {
  useGetAllSalesQuery,
  useCreateSaleMutation,
  useGetClientsQuery,
  useUpdateClientIDMutation,
  useUpdateSaleMutation, // Add this export
  useAddItemsMutation,
  useGetAllAssistantQuery,
  useDeleteSaleMutation,
} = salesApi
