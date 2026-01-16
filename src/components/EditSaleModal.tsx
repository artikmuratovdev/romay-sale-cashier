import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import money from '@/pages/selling/components/money'
import { useGetProductsInfiniteQuery } from '@/store/product/product.api'
import type { ProductWarehouseItem } from '@/store/product/types'
import type { Sale } from '@/store/sales/types'
import { Minus, Plus, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

interface EditSaleModalProps {
  isOpen: boolean
  onClose: () => void
  sale: Sale | null
  onSave: (data: {
    sales_assistant_id: string
    paid_amount: number
    comment: string
    items: Array<{
      product_id: string
      quantity: number
      price?: number
    }>
  }) => Promise<void>
  isUpdating: boolean
  branch: string
}

type EditData = {
  client_id?: string
  sales_assistant_id: string
  paid_amount: number
  comment: string
  items: Array<{
    product_id: string
    quantity: number
    price?: number
  }>
}

export default function EditSaleModal({
  isOpen,
  onClose,
  sale,
  onSave,
  isUpdating,
  branch,
}: EditSaleModalProps) {
  const [editData, setEditData] = useState<EditData>({
    client_id: undefined,
    sales_assistant_id: '',
    paid_amount: 0,
    comment: '',
    items: [],
  })

  const [displayData, setDisplayData] = useState({
    clientUsername: '',
    salesAssistantUsername: '',
  })

  const [validationErrors, setValidationErrors] = useState({
    comment: false,
  })

  // Infinite scroll states
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [allProducts, setAllProducts] = useState<ProductWarehouseItem[]>([])
  const [hasNextPage, setHasNextPage] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
      setCurrentPage(1)
      setAllProducts([])
      setHasNextPage(true)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Reset when branch changes or modal opens
  useEffect(() => {
    if (isOpen && branch) {
      setCurrentPage(1)
      setAllProducts([])
      setHasNextPage(true)
      setDebouncedSearchTerm('')
      setSearchTerm('')
    }
  }, [branch, isOpen])

  // Initialize data when sale changes
  useEffect(() => {
    if (sale && isOpen) {
      const paidAmount = sale?.payments?.paid_amount || 0

      setEditData({
        client_id: sale?.client_id?._id || '',
        sales_assistant_id: sale?.sales_assistant_id?._id || '',
        paid_amount: paidAmount,
        comment: sale?.comment || '',
        items:
          sale?.items?.map((item) => ({
            product_id: item?.product_id?._id || '',
            quantity: item?.quantity || 1,
            price: item?.price || 0,
          })) || [],
      })

      setDisplayData({
        clientUsername: sale?.client_id?.username || 'N/A',
        salesAssistantUsername: sale?.sales_assistant_id?.username || 'N/A',
      })
    }
  }, [sale, isOpen])

  // Infinite query for products
  const {
    data: infiniteProductsData,
    isLoading: isLoadingInfiniteProducts,
    isFetching: isFetchingInfiniteProducts,
  } = useGetProductsInfiniteQuery(
    {
      branch: branch,
      page: currentPage,
      limit: 20,
      search: debouncedSearchTerm || undefined,
    },
    {
      skip: !branch || !isOpen,
      refetchOnMountOrArgChange: true,
    }
  )

  // Update products when new data arrives
  useEffect(() => {
    if (infiniteProductsData?.data) {
      if (currentPage === 1) {
        setAllProducts(infiniteProductsData.data)
      } else {
        setAllProducts((prev) => {
          const existingIds = new Set(prev.map((p) => p._id))
          const newProducts = infiniteProductsData.data.filter(
            (p) => !existingIds.has(p._id)
          )
          return [...prev, ...newProducts]
        })
      }

      setHasNextPage(Boolean(infiniteProductsData.next_page))
      setIsLoadingMore(false)
    }
  }, [infiniteProductsData, currentPage])

  // Load more products
  const loadMoreProducts = useCallback(() => {
    if (hasNextPage && !isFetchingInfiniteProducts && !isLoadingMore) {
      setIsLoadingMore(true)
      setCurrentPage((prev) => prev + 1)
    }
  }, [hasNextPage, isFetchingInfiniteProducts, isLoadingMore])

  // Scroll handler for infinite scroll
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
      const isNearBottom = scrollHeight - scrollTop <= clientHeight + 50

      if (isNearBottom) {
        loadMoreProducts()
      }
    },
    [loadMoreProducts]
  )

  // Helper function to get product by ID
  const getProductById = useCallback(
    (productId: string) => {
      return allProducts.find((p) => p._id === productId)
    },
    [allProducts]
  )

  // Helper function to get available products for selection
  const getAvailableProducts = useCallback(
    (currentItemIndex?: number) => {
      const productsToUse = allProducts || []

      if (!productsToUse.length) return []

      const selectedProductIds = editData.items
        .map((item, index) => {
          if (currentItemIndex !== undefined && index === currentItemIndex) {
            return null
          }
          return item.product_id || null
        })
        .filter((id): id is string => Boolean(id))

      const availableProducts = productsToUse.filter((product) => {
        const hasStock = product.product_count > 0
        const isNotSelected = !selectedProductIds.includes(product._id)
        return hasStock && isNotSelected
      })

      return availableProducts
    },
    [allProducts, editData.items]
  )

  // Handle number input without leading zeros
  const handlePaidAmountChange = (value: string) => {
    let cleanValue = value.replace(/[^\d]/g, '')
    cleanValue = cleanValue.replace(/^0+/, '') || '0'
    const numericValue = parseInt(cleanValue, 10) || 0

    setEditData((prev) => ({
      ...prev,
      paid_amount: numericValue,
    }))
  }

  const updateItemQuantity = (index: number, quantity: number) => {
    if (quantity < 1) return

    setEditData((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, quantity } : item
      ),
    }))
  }

  const updateItemPrice = (index: number, price: number) => {
    if (price < 0) return

    setEditData((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, price } : item
      ),
    }))
  }

  const updateItemProduct = (index: number, productId: string) => {
    const isAlreadySelected = editData.items.some(
      (item, i) => i !== index && item.product_id === productId
    )

    if (isAlreadySelected) {
      toast.error('Bu mahsulot allaqachon tanlangan')
      return
    }

    const product = getProductById(productId)
    const price = product?.product?.price || 0

    setEditData((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, product_id: productId, price } : item
      ),
    }))
  }

  const removeItem = (index: number) => {
    setEditData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }))
  }

  const addNewItem = () => {
    setEditData((prev) => ({
      ...prev,
      items: [...prev.items, { product_id: '', quantity: 1, price: 0 }],
    }))
  }

  const handleSaveChanges = async () => {
    // Reset validation errors
    setValidationErrors({ comment: false })

    if (!editData.comment || editData.comment.trim() === '') {
      setValidationErrors({ comment: true })
      toast.error("Izoh maydoni to'ldirilishi shart")
      return
    }

    if (editData.paid_amount < 0) {
      toast.error("To'langan summa manfiy bo'lishi mumkin emas")
      return
    }

    const hasInvalidItems = editData.items.some(
      (item) => !item.product_id || item.quantity <= 0
    )

    if (hasInvalidItems) {
      toast.error("Barcha mahsulotlar uchun to'g'ri ma'lumot kiriting")
      return
    }

    const productIds = editData.items.map((item) => item.product_id)
    const uniqueProductIds = new Set(productIds)
    if (productIds.length !== uniqueProductIds.size) {
      toast.error("Bir xil mahsulotni ikki marta tanlab bo'lmaydi")
      return
    }

    const updatePayload = {
      sales_assistant_id: editData.sales_assistant_id,
      paid_amount: editData.paid_amount,
      comment: editData.comment,
      items: editData.items,
    }

    await onSave(updatePayload)
  }

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Sotuvni tahrirlash</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client_username">Mijoz</Label>
              <Input
                id="client_username"
                value={displayData.clientUsername}
                placeholder="Mijoz nomi"
                disabled
                className="bg-gray-50 cursor-not-allowed"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sales_assistant_username">Sotuv assistenti</Label>
              <Input
                id="sales_assistant_username"
                value={displayData.salesAssistantUsername}
                placeholder="Sotuv assistenti nomi"
                disabled
                className="bg-gray-50 cursor-not-allowed"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paid_amount">To'langan summa</Label>
              <Input
                id="paid_amount"
                type="text"
                value={editData.paid_amount.toLocaleString('ru-RU')}
                onChange={(e) => handlePaidAmountChange(e.target.value)}
                placeholder="To'langan summa"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="comment">
                Izoh <span className="text-red-500">*</span>
              </Label>
              <Input
                id="comment"
                value={editData.comment || ''}
                onChange={(e) => {
                  setEditData((prev) => ({
                    ...prev,
                    comment: e.target.value,
                  }))
                  if (validationErrors.comment) {
                    setValidationErrors({ comment: false })
                  }
                }}
                placeholder="Sotuv haqida izoh kiriting..."
                required
                className={`${
                  validationErrors.comment
                    ? 'border-red-500 focus:border-red-600 focus:ring-red-500 shadow-red-200 shadow-md'
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                }`}
              />
            </div>
          </div>

          {/* Items Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Mahsulotlar</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addNewItem}
                className="flex items-center gap-2"
                disabled={getAvailableProducts().length === 0}
              >
                <Plus className="h-4 w-4" />
                Mahsulot qo'shish
              </Button>
            </div>

            {getAvailableProducts().length === 0 &&
              editData.items.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">
                    Barcha mavjud mahsulotlar tanlangan. Yangi mahsulot qo'shish
                    uchun biror mahsulotni o'chiring.
                  </p>
                </div>
              )}

            <div className="space-y-3">
              {editData.items.map((item, index) => {
                const product = getProductById(item.product_id)
                const availableProducts = getAvailableProducts(index)

                return (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg"
                  >
                    <div className="flex-1">
                      <Label className="text-sm font-medium">Mahsulot</Label>
                      <Select
                        value={item.product_id}
                        onValueChange={(value) => {
                          const isAlreadySelected = editData.items.some(
                            (otherItem, otherIndex) =>
                              otherIndex !== index &&
                              otherItem.product_id === value
                          )

                          if (isAlreadySelected) {
                            toast.error('Bu mahsulot allaqachon tanlangan')
                            return
                          }

                          updateItemProduct(index, value)
                        }}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Mahsulot tanlang">
                            {product && (
                              <div className="flex items-center gap-2">
                                {product.product?.images?.[0] && (
                                  <img
                                    src={product.product.images[0]}
                                    alt={product.product.name}
                                    className="w-6 h-6 rounded object-cover"
                                    onError={(e) => {
                                      const img = e.target as HTMLImageElement
                                      img.style.display = 'none'
                                    }}
                                  />
                                )}
                                <span className="truncate">
                                  {product.product?.name || 'N/A'}
                                </span>
                              </div>
                            )}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent side="top" align="start">
                          {/* Search Input */}
                          <div className="p-2 border-b">
                            <Input
                              placeholder="Mahsulot qidirish..."
                              value={searchTerm}
                              onChange={(e) => {
                                e.stopPropagation()
                                setSearchTerm(e.target.value)
                              }}
                              className="h-8 text-sm"
                              onKeyDown={(e) => e.stopPropagation()}
                            />
                          </div>

                          {/* Scrollable Product List */}
                          <div
                            ref={scrollContainerRef}
                            className="max-h-60 overflow-y-auto"
                            onScroll={handleScroll}
                          >
                            {/* Currently Selected Product */}
                            {product && (
                              <SelectItem value={product._id}>
                                <div className="flex items-center gap-2">
                                  {product.product?.images?.[0] && (
                                    <img
                                      src={product.product.images[0]}
                                      alt={product.product.name}
                                      className="w-8 h-8 rounded object-cover"
                                      onError={(e) => {
                                        const img = e.target as HTMLImageElement
                                        img.style.display = 'none'
                                      }}
                                    />
                                  )}
                                  <div className="flex flex-col">
                                    <span className="font-medium">
                                      {product.product?.name || 'N/A'}
                                      <span className="text-xs text-green-600 ml-1">
                                        (Hozirgi)
                                      </span>
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {money(product.product?.price)}{' '}
                                      {product.product?.currency || "so'm"}
                                    </span>
                                  </div>
                                </div>
                              </SelectItem>
                            )}

                            {/* Separator */}
                            {product && availableProducts.length > 0 && (
                              <div className="border-t border-gray-200 my-1"></div>
                            )}

                            {/* Available Products */}
                            {availableProducts.map((productItem) => {
                              if (
                                !productItem.product ||
                                productItem._id === product?._id
                              )
                                return null
                              return (
                                <SelectItem
                                  key={`${productItem._id}-${currentPage}`}
                                  value={productItem._id}
                                >
                                  <div className="flex items-center gap-2">
                                    {productItem.product?.images?.[0] && (
                                      <img
                                        src={productItem.product.images[0]}
                                        alt={productItem.product.name}
                                        className="w-8 h-8 rounded object-cover"
                                        onError={(e) => {
                                          const img =
                                            e.target as HTMLImageElement
                                          img.style.display = 'none'
                                        }}
                                      />
                                    )}
                                    <div className="flex flex-col">
                                      <span className="font-medium">
                                        {productItem.product?.name || 'N/A'}
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        {money(productItem.product?.price)}{' '}
                                        {productItem.product?.currency ||
                                          "so'm"}{' '}
                                        • Soni: {productItem.product_count}
                                      </span>
                                    </div>
                                  </div>
                                </SelectItem>
                              )
                            })}

                            {/* Loading State */}
                            {(isLoadingInfiniteProducts || isLoadingMore) && (
                              <div className="px-2 py-3 text-center text-sm text-gray-500">
                                {debouncedSearchTerm
                                  ? 'Qidirilmoqda...'
                                  : "Ko'proq mahsulotlar yuklanmoqda..."}
                              </div>
                            )}

                            {/* No Results */}
                            {!isLoadingInfiniteProducts &&
                              availableProducts.length === 0 &&
                              !product && (
                                <div className="px-2 py-3 text-center text-sm text-gray-500">
                                  {debouncedSearchTerm
                                    ? 'Hech narsa topilmadi'
                                    : "Mavjud mahsulotlar yo'q"}
                                </div>
                              )}
                          </div>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="w-32">
                      <Label className="text-sm font-medium">Miqdor</Label>
                      <div className="flex items-center mt-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            updateItemQuantity(index, item.quantity - 1)
                          }
                          className="h-8 w-8 p-0"
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            updateItemQuantity(
                              index,
                              Number(e.target.value) || 1
                            )
                          }
                          className="h-8 w-16 mx-1 text-center"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            updateItemQuantity(index, item.quantity + 1)
                          }
                          className="h-8 w-8 p-0"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="w-32">
                      <Label className="text-sm font-medium">Narx</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.price || product?.product?.price || 0}
                        onChange={(e) =>
                          updateItemPrice(index, Number(e.target.value) || 0)
                        }
                        className="h-8 mt-1 text-center"
                        placeholder="Narx"
                      />
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeItem(index)}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                      disabled={editData.items.length <= 1}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )
              })}
            </div>

            {editData.items.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>Mahsulotlar yo'q</p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={addNewItem}
                  className="mt-2"
                  disabled={getAvailableProducts().length === 0}
                >
                  Birinchi mahsulotni qo'shing
                </Button>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Bekor qilish
            </Button>
            <Button
              onClick={handleSaveChanges}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={isUpdating}
            >
              {isUpdating ? 'Saqlanmoqda...' : "O'zgarishlarni saqlash"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export { EditSaleModal }
