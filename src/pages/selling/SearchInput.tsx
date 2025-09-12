import { Input } from '@/components/ui/input'
import { useGetAllProductsQuery } from '@/store/product/product.api'
import type { ProductWarehouseItem } from '@/store/product/types'
import { addToAllProduct, addToFilteredProduct } from '@/store/slice/Sale.slice'
import type { RootState } from '@/store/store'
import { ScanBarcode } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

function SearchInput({ enabled }: { enabled: { search: boolean } }) {
  const [focus, setFocus] = useState(true)
  const [search, setSearch] = useState('')
  const { data: products } = useGetAllProductsQuery({})
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(addToAllProduct(products?.data as ProductWarehouseItem[]))
  }, [products, dispatch])

  const allProducts = useSelector(
    (state: RootState) => state.sale.allProducts
  )?.filter((p) => p.product.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="w-full relative">
      <div className="relative w-full">
        <Input
          placeholder="Mahsulot nomi yoki kodini kiriting"
          className="pr-10"
          disabled={!enabled.search}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => setFocus(false)}
          onBlur={() => setTimeout(() => setFocus(true), 150)}
        />
        <ScanBarcode
          size={24}
          className="absolute right-2 top-2"
          color="#71717A"
        />
      </div>
      <div
        className={`absolute bg-white top-12 border-2 w-full rounded-lg z-50 ${focus && 'hidden'}`}
      >
        <table className="w-full">
          <thead className="text-[#71717A] text-sm border-b w-full flex justify-between">
            <tr className="w-full grid grid-cols-3">
              <th className="px-7 py-3 text-left font-medium">Nomi</th>
              <th className="px-7 py-3 text-center font-medium">Narx</th>
              <th className="px-7 py-3 text-right font-medium">Soni</th>
            </tr>
          </thead>
          <tbody className="text-[#71717A] text-sm border-b w-full bg-white">
            {allProducts?.map((p) => (
              <tr
                key={p._id}
                className="w-full grid grid-cols-3"
                onClick={() => {
                  dispatch(addToFilteredProduct(p))
                  setFocus(true)
                }}
              >
                <td className="px-7 py-3 text-left font-medium">
                  {p.product.name}
                </td>
                <td className="px-7 py-3 text-center font-medium">
                  {p.product.price}
                </td>
                <td className="px-7 py-3 text-right font-medium">
                  {p.product_count}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default SearchInput
