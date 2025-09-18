import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  sales_balance: 0,
}

const BranchSalesBalance = createSlice({
  name: 'branchSalesBalance',
  initialState,
  reducers: {
    setSalesBalance: (state, action) => {
      state.sales_balance = action.payload
    },
  },
})

export const { setSalesBalance } = BranchSalesBalance.actions

export default BranchSalesBalance.reducer
