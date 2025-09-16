import baseApi from '../api'
import { setAuthTokens, getAuthToken } from '@/utils/auth'
import type { LoginRequest, LoginResponse, UserResponse } from './auth'

interface ApiError {
  status: number
  data: {
    message?: string
    msg?: string
    error?: string
  }
}

const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
      async onQueryStarted(_, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled

          // Tokenlar mavjud emasligini tekshiramiz
          const existingToken = getAuthToken()

          if (
            data &&
            'access_token' in data &&
            'refresh_token' in data &&
            !existingToken
          ) {
            setAuthTokens({
              access_token: data.access_token as string,
              refresh_token: data.refresh_token as string,
            })
          }
        } catch (error: unknown) {
          console.error('Login failed:', (error as ApiError)?.data || error)
          // const apiError = error as ApiError
          // if (apiError?.status === 401 || apiError?.status === 403) {
          //   clearAuthTokens()
          // }
        }
      },
      invalidatesTags: ['user'],
    }),
    user: builder.query<UserResponse, void>({
      query: () => ({
        url: '/auth/me',
        method: 'GET',
      }),
      providesTags: ['user'],
      async onQueryStarted(_, { queryFulfilled }) {
        try {
          await queryFulfilled
        } catch (error: unknown) {
          console.error(
            'User fetch failed:',
            (error as ApiError)?.data || error
          )
          // const apiError = error as ApiError
          // if (apiError?.status === 401 || apiError?.status === 403) {
          //   clearAuthTokens()
          // }
        }
      },
    }),
  }),
})

export const { useLoginMutation, useUserQuery, useLazyUserQuery } = authApi
