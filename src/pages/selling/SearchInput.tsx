import { Input } from '@/components/ui/input'
import { useGetUser } from '@/hooks/useGetUser'
import { useGetAllProductsQuery } from '@/store/product/product.api'
import type { ProductWarehouseItem } from '@/store/product/types'
import { addToAllProduct, addToFilteredProduct } from '@/store/slice/Sale.slice'
import type { RootState } from '@/store/store'
import { ScanBarcode } from 'lucide-react'
import { useEffect, useState, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'sonner'

function SearchInput() {
  const [focus, setFocus] = useState(true)
  const [search, setSearch] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const me = useGetUser()
  const { data: products } = useGetAllProductsQuery({
    branch: me?.branch_id._id,
  })
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(addToAllProduct(products?.data as ProductWarehouseItem[]))
  }, [products, dispatch])

  // Product name va barcode bo'yicha qidirish (bo'sh bo'lsa barcha mahsulotlar)
  const allProducts = useSelector(
    (state: RootState) => state.sale.allProducts
  )?.filter((p) => {
    const searchTerm = search.toLowerCase().trim()

    // Agar qidiruv bo'sh bo'lsa, barcha mahsulotlarni ko'rsatish
    if (!searchTerm) return true

    // Product name bo'yicha qidirish
    const nameMatch = p.product.name.toLowerCase().includes(searchTerm)

    // Barcode bo'yicha qidirish (agar barcode mavjud bo'lsa)
    const barcodeMatch = p.product.barcode
      ? p.product.barcode.toLowerCase().includes(searchTerm)
      : false

    return nameMatch || barcodeMatch
  })

  const handleProductSelect = (product: ProductWarehouseItem) => {
    if (product.product_count <= 0) {
      toast.error('Mahsulot mavjud emas')
      return
    }
    dispatch(addToFilteredProduct(product))
    setSearch('')
    setFocus(true)
    if (inputRef.current) {
      inputRef.current.blur()
    }
  }

  // Input ni focus qilish uchun function
  const focusInput = () => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  const handleBarcodeClick = () => {
    focusInput()
  }

  return (
    <div className="w-full relative">
      <div className="relative w-full">
        <Input
          ref={inputRef}
          placeholder="Mahsulot nomi yoki barkodini kiriting"
          className="pr-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => setFocus(false)}
          onBlur={() => setTimeout(() => setFocus(true), 150)}
        />
        <ScanBarcode
          size={24}
          className="absolute right-2 top-2 cursor-pointer"
          color="#71717A"
          onClick={handleBarcodeClick}
        />
      </div>
      <div
        className={`absolute bg-white top-12 border-2 w-full rounded-lg z-50 shadow-lg ${focus && 'hidden'}`}
      >
        <table className="w-full">
          <thead className="text-[#71717A] text-sm border-b w-full flex justify-between sticky top-0 bg-white">
            <tr className="w-full grid grid-cols-5">
              <th className="px-7 py-3 text-left font-medium"></th>
              <th className="px-7 py-3 text-center font-medium">Nomi</th>
              <th className="px-7 py-3 text-center font-medium">Barcode</th>
              <th className="px-7 py-3 text-center font-medium">Narx</th>
              <th className="px-7 py-3 text-right font-medium">Soni</th>
            </tr>
          </thead>
        </table>

        {/* Scrollable tbody container */}
        <div className="max-h-80 overflow-y-auto">
          <table className="w-full">
            <tbody className="text-[#71717A] text-sm bg-white">
              {allProducts?.map((p) => (
                <tr
                  key={p._id}
                  className="w-full grid grid-cols-5 cursor-pointer hover:bg-gray-50 border-b border-gray-100"
                  onMouseDown={() => handleProductSelect(p)}
                >
                  <td className="px-7 py-3 text-left font-medium">
                    <img
                      className="aspect-square w-10 h-10 object-cover rounded"
                      src={p.product.images[0]}
                      alt={p.product.name}
                    />
                  </td>
                  <td className="px-7 py-3 text-center font-medium">
                    {p.product.name}
                  </td>
                  <td className="px-7 py-3 text-center font-medium">
                    {p.product.barcode || '-'}
                  </td>
                  <td className="px-7 py-3 text-center font-medium">
                    {p.product.price}
                  </td>
                  <td className="px-7 py-3 text-right font-medium">
                    {p.product_count}
                  </td>
                </tr>
              ))}
              {allProducts?.length === 0 && search && (
                <tr className="w-full">
                  <td
                    colSpan={5}
                    className="px-7 py-6 text-center text-gray-500"
                  >
                    Hech qanday mahsulot topilmadi
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default SearchInput
