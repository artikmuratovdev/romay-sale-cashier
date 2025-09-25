import baseApi from '../api'
import type {
  ClientResponse,
  ClientRequest,
  AddClientResponse,
  AddClientRequest,
  UpdateClientRequest,
  UpdateClientResponse,
  ClientRes,
  CloseDebtResponse,
} from './types'

export const ClientsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getClients: build.query<ClientResponse, ClientRequest>({
      query: (params) => ({
        url: '/client/get-all',
        method: 'GET',
        params,
      }),
      providesTags: ['clients', 'sale'],
    }),
    addClient: build.mutation<AddClientResponse, AddClientRequest>({
      query: (body) => ({
        url: '/client/add',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['clients', 'sale'],
    }),
    updateClient: build.mutation<UpdateClientResponse, UpdateClientRequest>({
      query: ({ id, body }) => ({
        url: `/client/update/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['clients', 'sale'],
    }),
    deleteClient: build.mutation<void, string>({
      query: (id) => ({
        url: `/client/delete/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['clients', 'sale'],
    }),
    getOneClient: build.query<ClientRes, string>({
      query: (id) => ({
        url: `/client/get-one/${id}`,
        method: 'GET',
      }),
      providesTags: ['clients', 'sale'],
    }),
    getBranches: build.query<ClientResponse, ClientRequest>({
      query: (params) => ({
        url: `/branch/get-all`,
        method: 'GET',
        params,
      }),
      providesTags: ['clients', 'sale'],
    }),
    closeDebt: build.mutation<CloseDebtResponse,
      { id: string; amount: number }
    >({
      query: ({ id, amount }) => ({
        url: `/client/debt-payments/${id}`,
        method: 'POST',
        body: { amount },
      }),
      invalidatesTags: ['clients', 'sale'],
    }),
  }),
})

export const {
  useGetClientsQuery,
  useAddClientMutation,
  useUpdateClientMutation,
  useDeleteClientMutation,
  useGetOneClientQuery,
  useGetBranchesQuery,
  useCloseDebtMutation,
} = ClientsApi
