import { Button } from '@/components/ui/button'
import {
  decreaseQty,
  increaseQty,
  removeProduct,
} from '@/store/slice/Sale.slice'
import type { RootState } from '@/store/store'
import { Minus, Plus, Trash2 } from 'lucide-react'
import { useCallback, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

function Sale_Table() {
  const dispatch = useDispatch()
  const products = useSelector(
    (state: RootState) => state.sale.filteredProducts
  )
  const [imageErrors, setImageErrors] = useState<{ [key: string]: boolean }>({})

  const handleImageError = useCallback((productId: string) => {
    setImageErrors((prev) => ({ ...prev, [productId]: true }))
  }, [])

  // Helper function to truncate product name intelligently
  const truncateProductName = useCallback((name: string) => {
    if (!name) return ''

    const truncated = name.split(' ').slice(0, 6).join(' ')
    return truncated
  }, [])

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
    <div className="w-full">
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full min-w-[700px] table-fixed">
          <colgroup>
            <col className="w-[35%] min-w-[200px]" />
            <col className="w-[16%] min-w-[90px]" />
            <col className="w-[16%] min-w-[100px]" />
            <col className="w-[16%] min-w-[80px]" />
            <col className="w-[17%] min-w-[130px]" />
          </colgroup>
          <thead className="text-[#71717A] text-sm border-b">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Mahsulot</th>
              <th className="px-4 py-3 text-center font-medium">Narx</th>
              <th className="px-4 py-3 text-center font-medium">Summa</th>
              <th className="px-4 py-3 text-center font-medium">Qoldiq</th>
              <th className="px-4 py-3 text-center font-medium">Soni</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {products.map((p) => (
              <tr key={p._id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm">
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12 flex-shrink-0">
                      <img
                        src={
                          imageErrors[p._id] || !p.product?.images?.[0]
                            ? '/package.svg'
                            : p.product.images[0]
                        }
                        alt={p.product.name}
                        className="w-full h-full rounded-md object-cover border border-gray-200"
                        onError={() => handleImageError(p._id)}
                        loading="lazy"
                      />
                    </div>
                    <div className="flex-1 min-w-0 overflow-hidden max-w-[180px]">
                      <div
                        className="font-medium text-gray-900 text-sm leading-tight"
                        style={{
                          wordBreak: 'break-word',
                          overflowWrap: 'anywhere',
                          lineHeight: '1.25',
                          maxHeight: '2.5rem',
                          overflow: 'hidden',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}
                        title={p.product.name}
                      >
                        {truncateProductName(p.product.name)}
                      </div>
                      <div
                        className="text-xs text-gray-500 truncate mt-1"
                        title={p.product?.barcode || "Barcode yo'q"}
                      >
                        {p.product?.barcode
                          ? p.product.barcode.length > 15
                            ? p.product.barcode.substring(0, 15) + '...'
                            : p.product.barcode
                          : "Barcode yo'q"}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-center">
                  <span className="font-medium whitespace-nowrap">
                    {p.product.price.toLocaleString()}{' '}
                    <span className="text-xs text-gray-500">UZS</span>
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-center">
                  <span className="font-semibold text-green-600 whitespace-nowrap">
                    {(p.product.price * p.qty).toLocaleString()}{' '}
                    <span className="text-xs">UZS</span>
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-center">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                      p.product_count > 10
                        ? 'bg-green-100 text-green-800'
                        : p.product_count > 0
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {p.product_count}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">
                  <div className="flex items-center justify-center">
                    <div className="flex items-center gap-2 rounded-md bg-gray-100 px-2 py-1">
                      {p.qty === 1 ? (
                        <Button
                          size="sm"
                          className="bg-red-100 text-red-700 hover:bg-red-200 h-8 w-8 p-0"
                          variant="outline"
                          onClick={() => handleRemoveProduct(p._id)}
                        >
                          <Trash2 size={12} />
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          className="bg-red-100 text-red-700 hover:bg-red-200 h-8 w-8 p-0"
                          variant="outline"
                          onClick={() => handleDecreaseQty(p._id)}
                        >
                          <Minus size={12} />
                        </Button>
                      )}
                      <span className="text-center font-medium min-w-[24px] px-2">
                        {p.qty}
                      </span>
                      <Button
                        disabled={p.product_count === p.qty}
                        size="sm"
                        className="bg-green-100 text-green-700 hover:bg-green-200 disabled:bg-gray-200 disabled:text-gray-500 h-8 w-8 p-0"
                        variant="outline"
                        onClick={() => handleIncreaseQty(p._id)}
                      >
                        <Plus size={12} />
                      </Button>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Mobile Card Layout */}
      <div className="md:hidden space-y-4">
        {products.map((p) => (
          <div key={p._id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-start gap-3 mb-3">
              <div className="relative w-16 h-16 flex-shrink-0">
                <img
                  src={
                    imageErrors[p._id] || !p.product?.images?.[0]
                      ? '/package.svg'
                      : p.product.images[0]
                  }
                  alt={p.product.name}
                  className="w-full h-full rounded-md object-cover border border-gray-200"
                  onError={() => handleImageError(p._id)}
                  loading="lazy"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 text-sm mb-1 line-clamp-2">
                  {p.product.name}
                </h3>
                <p className="text-xs text-gray-500 mb-2">
                  {p.product?.barcode || "Barcode yo'q"}
                </p>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                      p.product_count > 10
                        ? 'bg-green-100 text-green-800'
                        : p.product_count > 0
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                    }`}
                  >
                    Qoldiq: {p.product_count}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Price and Total */}
            <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">Narx</p>
                <p className="font-medium text-sm">
                  {p.product.price.toLocaleString()}{' '}
                  <span className="text-xs text-gray-500">UZS</span>
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">Summa</p>
                <p className="font-semibold text-green-600 text-sm">
                  {(p.product.price * p.qty).toLocaleString()}{' '}
                  <span className="text-xs">UZS</span>
                </p>
              </div>
            </div>
            
            {/* Quantity Controls */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Miqdor:</span>
              <div className="flex items-center gap-2 rounded-md bg-gray-100 px-3 py-2">
                {p.qty === 1 ? (
                  <Button
                    size="sm"
                    className="bg-red-100 text-red-700 hover:bg-red-200 h-8 w-8 p-0"
                    variant="outline"
                    onClick={() => handleRemoveProduct(p._id)}
                  >
                    <Trash2 size={14} />
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="bg-red-100 text-red-700 hover:bg-red-200 h-8 w-8 p-0"
                    variant="outline"
                    onClick={() => handleDecreaseQty(p._id)}
                  >
                    <Minus size={14} />
                  </Button>
                )}
                <span className="text-center font-medium min-w-[32px] px-2 text-lg">
                  {p.qty}
                </span>
                <Button
                  disabled={p.product_count === p.qty}
                  size="sm"
                  className="bg-green-100 text-green-700 hover:bg-green-200 disabled:bg-gray-200 disabled:text-gray-500 h-8 w-8 p-0"
                  variant="outline"
                  onClick={() => handleIncreaseQty(p._id)}
                >
                  <Plus size={14} />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Sale_Table
