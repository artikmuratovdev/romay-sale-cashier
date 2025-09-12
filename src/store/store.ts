import { configureStore } from '@reduxjs/toolkit'

import baseApi from './api'
import LocationReducer from './slice/Location.slice'
import SaleSlice from './slice/Sale.slice'

const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
    location: LocationReducer,
    sale: SaleSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware),
  devTools: process.env.NODE_ENV !== 'production',
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export default store
