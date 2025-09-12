// Common types for the application
export interface User {
  _id: string
  branch_id: {
    _id: string
  }
  username?: string
}

export interface Client {
  _id: string
  username: string
  email?: string
  phone?: string
}

export interface Product {
  _id: string
  name: string
  price: number
  images: string[]
  barcode?: string
  description?: string
}

export interface ProductWarehouseItem {
  _id: string
  product: Product
  product_count: number
  product_barcode: string
  branch_id: string
  created_at: string
  updated_at: string
}

export interface SaleProductItem extends ProductWarehouseItem {
  qty: number
}

export interface Sale {
  _id: string
  branch_id: string
  cashier_id: string
  client_id?: string
  total: number
  status: 'pending' | 'completed' | 'cancelled'
  created_at: string
  updated_at: string
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  msg: string
}

export interface EnabledState {
  search: boolean
}
