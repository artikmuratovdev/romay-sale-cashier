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
  const dispatch = useDispatch()

  const shouldRefetch = useSelector(
    (state: RootState) => state.sale.shouldRefetch
  )

  const {
    data: products,
    refetch,
    isLoading,
    error,
  } = useGetAllProductsQuery(
    {
      branch: me?.branch_id._id,
    },
    {
      skip: !me?.branch_id._id,
    }
  )
  console.log('Products:', inputRef.current?.value)

  useEffect(() => {
    if (products?.data && Array.isArray(products.data)) {
      dispatch(addToAllProduct(products.data as ProductWarehouseItem[]))
    }
  }, [products, dispatch])

  useEffect(() => {
    if (me?.branch_id._id) {
      refetch()
    }
  }, [shouldRefetch, refetch, me?.branch_id._id])

  // Get all products from Redux
  const allProductsFromRedux = useSelector(
    (state: RootState) => state.sale.allProducts
  )

  // Get filtered products from Redux to exclude them from search results
  const filteredProductsFromRedux = useSelector(
    (state: RootState) => state.sale.filteredProducts
  )

  // Filter products based on search term and exclude already selected products
  const allProducts =
    allProductsFromRedux?.filter((p) => {
      // First check if product is already in filtered products (cart)
      const isAlreadySelected = filteredProductsFromRedux.some(
        (filtered) => filtered._id === p._id
      )

      if (isAlreadySelected) {
        return false // Don't show products that are already selected
      }

      const searchTerm = search.toLowerCase().trim()

      // If no search term, show all available products
      if (!searchTerm) return true

      // Search by product name
      const nameMatch = p.product?.name?.toLowerCase().includes(searchTerm)

      // Search by barcode if it exists
      const barcodeMatch = p.product?.barcode
        ? p.product.barcode.toLowerCase().includes(searchTerm)
        : false

      return nameMatch || barcodeMatch
    }) || []

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

  const focusInput = () => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  const handleBarcodeClick = () => {
    focusInput()
  }

  // Show loading state
  if (isLoading || error) {
    return (
      <div className="w-full relative">
        <div className="relative w-full">
          <Input
            placeholder={
              error
                ? "Xatolik yuz berdi. Qayta urinib ko'ring..."
                : isLoading
                  ? 'Mahsulotlar yuklanmoqda...'
                  : undefined
            }
            className="pr-10"
            disabled
          />
          <ScanBarcode
            size={24}
            className="absolute right-2 top-2 cursor-pointer opacity-50"
            color="#71717A"
          />
        </div>
      </div>
    )
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

        <div className="max-h-80 overflow-y-auto">
          <table className="w-full">
            <tbody className="text-[#71717A] text-sm bg-white">
              {allProducts?.length > 0 ? (
                allProducts.map((p) => (
                  <tr
                    key={p._id}
                    className="w-full grid grid-cols-5 cursor-pointer hover:bg-gray-50 border-b border-gray-100"
                    onMouseDown={() => handleProductSelect(p)}
                  >
                    <td className="px-7 py-3 text-left font-medium">
                      <img
                        className="aspect-square w-10 h-10 object-cover rounded"
                        src={p.product?.images?.[0] || '/placeholder-image.png'}
                        alt={p.product?.name || 'Product'}
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder-image.png'
                        }}
                      />
                    </td>
                    <td className="px-7 py-3 text-center font-medium">
                      {p.product?.name || 'N/A'}
                    </td>
                    <td className="px-7 py-3 text-center font-medium">
                      {p.product?.barcode || '-'}
                    </td>
                    <td className="px-7 py-3 text-center font-medium">
                      {p.product?.price || 0}
                    </td>
                    <td
                      className={`px-7 py-3 ${p.product_count === 0 && 'text-red-500'} text-right font-medium`}
                    >
                      {p.product_count || 0}
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="w-full">
                  <td
                    colSpan={5}
                    className="px-7 py-6 text-center text-gray-500"
                  >
                    {search
                      ? 'Hech qanday mahsulot topilmadi'
                      : 'Mahsulotlar mavjud emas'}
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
