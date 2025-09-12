export interface CreateSale {
  branch_id: string
  cashier_id: string
  client_id?: string
  search?: string
}
interface CreateSaleRes {
  success: boolean
  msg: string
  data?: {
    id: string
  }
  error: {
    statusCode: number
    statusMsg: string
    msg: string
  }
}

interface ClientsRes {
  success: boolean
  data: {
    debt: {
      amount: number
      currency: string
    }
    _id: string
    username: string
    description: string
    phone: string
    profession: string
    birth_date: Date
    branch_id: {
      _id: string
      name: string
      address: string
    }
    address: string
    customer_tier: string
    created_at: Date
    updated_at: Date
  }[]

  pagination: {
    total: number
    total_pages: number
    page: number
    limit: number
    next_page: boolean
    prev_page: boolean
  }
}
interface GetAllSalesReq {
  cashier_id?: string
  branch_id?: string
  client_id?: string
  status?: string
  date_from?: string
  date_to?: string
  page?: number
  limit?: number
}

interface GetAllSalesRes {
  success: boolean
  data: Sale[]
  pagination: {
    total: number
    total_pages: number
    page: number
    limit: number
    next_page: boolean
    prev_page: boolean
  }
}

interface Sale {
  _id: string
  branch_id: {
    _id: string
    name: string
    address: string
  }
  cashier_id: {
    _id: string
    username: string
    phone: string
  }
  client_id: {
    _id: string
    username: string
    phone: string
  }
  items: SaleItem[]
  status: string
  payments: {
    total_amount: number
    paid_amount: number
    debt_amount: number
    type: string
    currency: string
    _id: string
  }
  created_at: Date
  updated_at: Date
}

interface SaleItem {
  product_id: {
    _id: string
    product: {
      _id: string
      name: string
      category_id: {
        _id: string
        name: string
        description: string
      }
      images: string[]
    }
  }
  quantity: number
  price: number
  _id: string
}
