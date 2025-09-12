import { Button } from '@/components/ui/button'
import { useGetRole } from '@/hooks/use-get-role'
import {
  decreaseQty,
  increaseQty,
  removeProduct,
} from '@/store/slice/Sale.slice'
import type { RootState } from '@/store/store'
import { CheckRole } from '@/utils/checkRole'
import { Minus, Plus, Trash2 } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'

function Sale_Table() {
  const role = useGetRole()
  const dispatch = useDispatch()
  const products = useSelector(
    (state: RootState) => state.sale.filteredProducts
  )

  const handleIncreaseQty = (id: string) => {
    dispatch(increaseQty(id))
  }

  const handleDecreaseQty = (id: string) => {
    dispatch(decreaseQty(id))
  }

  const handleRemoveProduct = (id: string) => {
    dispatch(removeProduct(id))
  }

  return (
    <table className="w-full">
      <thead className="text-[#71717A] text-sm border-b">
        <tr>
          <th className="px-6 py-3 text-left font-medium">Nomi</th>
          <th className="px-6 py-3 text-left font-medium">Narx</th>
          <th className="px-6 py-3 text-center font-medium">Summa</th>
          {/* {role !== 'default'  */}
          {CheckRole(role, ['sale_cashier']) && (
            <th className="px-6 py-3 text-right font-medium">
              <span>Minimal qolmadi</span>
            </th>
          )}
          <th className="px-6 py-3 font-medium text-center">
            <span>Soni</span>
          </th>
        </tr>
      </thead>
      <tbody className="divide-y">
        {products.map((p) => (
          <tr key={p._id}>
            <td className="px-6 py-3 text-sm text-left">
              <div className="flex items-center gap-4">
                <img
                  src={p.product.images[0]}
                  alt={p.product.name}
                  className="w-12 h-12 rounded"
                />
                <div>{p.product.name}</div>
              </div>
            </td>
            <td className="px-6 py-3 text-sm text-left ">{p.product.price}</td>
            <td className="px-6 py-3 text-sm text-center">
              {p.product.price * p.qty}
            </td>
            {CheckRole(role, ['sale_cashier']) && (
              <td className="px-6 pl-20 py-3 text-sm text-center">
                {p.product_count}
              </td>
            )}
            <td className="px-6 py-3 text-sm flex justify-center">
              <div className="flex items-center gap-8 rounded-md bg-[#F9F9F9] w-fit justify-end">
                {p.qty === 1 ? (
                  <Button
                    size="sm"
                    className="bg-red-100 text-red-700"
                    variant="outline"
                    onClick={() => handleRemoveProduct(p._id)}
                  >
                    <Trash2 size={14} />
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="bg-red-100 text-red-700"
                    variant="outline"
                    onClick={() => handleDecreaseQty(p._id)}
                  >
                    <Minus size={14} />
                  </Button>
                )}
                <span className="text-center">{p.qty}</span>
                <Button
                  disabled={p.product_count === p.qty}
                  size="sm"
                  className="bg-green-100 text-green-700"
                  variant="outline"
                  onClick={() => handleIncreaseQty(p._id)}
                >
                  <Plus size={14} />
                </Button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default Sale_Table
