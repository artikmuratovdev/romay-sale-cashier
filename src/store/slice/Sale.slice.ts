import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { ProductWarehouseItem } from '../product/types'

type SaleProductItem = ProductWarehouseItem & {
  qty: number
}

type State = {
  allProducts: ProductWarehouseItem[]
  filteredProducts: SaleProductItem[]
}

const initialState: State = {
  allProducts: [],
  filteredProducts: [],
}

const SaleSlice = createSlice({
  name: 'sale',
  initialState,
  reducers: {
    addToFilteredProduct: (
      state,
      action: PayloadAction<ProductWarehouseItem>
    ) => {
      const productWithQty: SaleProductItem = { ...action.payload, qty: 1 }
      state.filteredProducts = [...state.filteredProducts, productWithQty]
      state.allProducts = state.allProducts.filter(
        (p) => p._id !== action.payload._id
      )
    },
    addToAllProduct: (state, action: PayloadAction<ProductWarehouseItem[]>) => {
      state.allProducts = action.payload
    },
    removeProduct: (state, action: PayloadAction<string>) => {
      const removedProduct = state.filteredProducts.find(
        (p) => p._id === action.payload
      )
      state.filteredProducts = state.filteredProducts.filter(
        (p) => p._id !== action.payload
      )
      if (removedProduct) {
        const { ...productWithoutQty } = removedProduct
        state.allProducts = [...state.allProducts, productWithoutQty]
      }
    },
    increaseQty: (state, action: PayloadAction<string>) => {
      state.filteredProducts = state.filteredProducts.map((p) =>
        p._id === action.payload ? { ...p, qty: (p.qty || 1) + 1 } : p
      )
    },
    decreaseQty: (state, action: PayloadAction<string>) => {
      state.filteredProducts = state.filteredProducts.map((p) =>
        p._id === action.payload && (p.qty || 1) > 1
          ? { ...p, qty: (p.qty || 1) - 1 }
          : p
      )
    },
    clearProducts: (state) => {
      state.filteredProducts = []
      state.allProducts = []
    },
  },
})

export const {
  addToFilteredProduct,
  addToAllProduct,
  removeProduct,
  increaseQty,
  decreaseQty,
  clearProducts,
} = SaleSlice.actions

export default SaleSlice.reducer
