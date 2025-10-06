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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useHandleRequest } from '@/hooks/use-handle-request'
import {
  useCloseDebtMutation,
  useGetOneClientQuery,
} from '@/store/clients/clients.api'
import {
  useGetAllProductsQuery,
  useGetProductsInfiniteQuery,
} from '@/store/product/product.api'
import {
  useDeleteSaleMutation,
  useGetAllSalesQuery,
  useUpdateSaleMutation,
} from '@/store/sales/salesApi'
import type { Sale } from '@/store/sales/types'
import { formatPhone } from '@/utils/formatPhone'
import { format } from 'date-fns'
import {
  AlertTriangle,
  Edit,
  Minus,
  MoreHorizontal,
  Plus,
  Trash2,
  X,
} from 'lucide-react'
import { useState, useCallback, useRef, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'
import money from '../selling/components/money'
import OrderDetailsDialog from './components/OrderDetailsDialog'

type UpdateSaleSchema = {
  client_id: string
  sales_assistant_id: string
  status: string
  paid_amount: number
  comment: string
  items: Array<{
    product_id: string
    quantity: number
    price?: number
  }>
}

export default function ClientDetails() {
  const id = useParams<{ id: string }>().id
  const { data, refetch: refetchClient } = useGetOneClientQuery(id as string, {
    skip: !id,
  })
  const { data: client_items, refetch: refetchSales } = useGetAllSalesQuery(
    { client_id: id as string },
    { skip: !id }
  )
  const { data: products } = useGetAllProductsQuery(
    { branch: data?.data.branch_id._id as string },
    { skip: !id }
  )

  const [updateSale, { isLoading: isUpdating }] = useUpdateSaleMutation()
  const [deleteSale, { isLoading: isDeleting }] = useDeleteSaleMutation()
  const [closeDebt, { isLoading: isClosingDebt }] = useCloseDebtMutation()
  const handleRequest = useHandleRequest()
  const [openPopover, setOpenPopover] = useState<string | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false)
  const [debtAmount, setDebtAmount] = useState('')
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [saleToDelete, setSaleToDelete] = useState<{
    id: string
    orderNumber: string
  } | null>(null)
  const [isOrderDetailsOpen, setIsOrderDetailsOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Sale | null>(null)
  const [editData, setEditData] = useState<UpdateSaleSchema>({
    client_id: '',
    sales_assistant_id: '',
    status: '',
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
  const [allProducts, setAllProducts] = useState<any[]>([])
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

  // Reset when branch changes
  useEffect(() => {
    if (data?.data.branch_id._id) {
      setCurrentPage(1)
      setAllProducts([])
      setHasNextPage(true)
      setDebouncedSearchTerm('')
      setSearchTerm('')
    }
  }, [data?.data.branch_id._id])

  // Infinite query for products
  const {
    data: infiniteProductsData,
    isLoading: isLoadingInfiniteProducts,
    isFetching: isFetchingInfiniteProducts,
  } = useGetProductsInfiniteQuery(
    {
      branch: data?.data.branch_id._id as string,
      page: currentPage,
      limit: 20,
      search: debouncedSearchTerm || undefined,
    },
    {
      skip: !data?.data.branch_id._id,
      refetchOnMountOrArgChange: true,
    }
  )

  // Update products when new data arrives
  useEffect(() => {
    if (infiniteProductsData?.data) {
      if (currentPage === 1) {
        // First page or new search - replace all products
        setAllProducts(infiniteProductsData.data)
      } else {
        // Subsequent pages - append to existing products
        setAllProducts((prev) => {
          const existingIds = new Set(prev.map((p) => p._id))
          const newProducts = infiniteProductsData.data.filter(
            (p) => !existingIds.has(p._id)
          )
          return [...prev, ...newProducts]
        })
      }

      // Update pagination info
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
  const getProductById = (productId: string) => {
    return products?.data?.find((product) => product._id === productId)
  }

  // Helper function to get available products for selection with infinite scroll
  const getAvailableProducts = useCallback(
    (currentItemIndex?: number) => {
      if (!allProducts.length) return []

      // Get all selected product IDs except for the current item being edited
      const selectedProductIds = editData.items
        .map((item, index) => {
          // Don't include current item index and don't include empty product IDs
          if (currentItemIndex !== undefined && index === currentItemIndex) {
            return null
          }
          return item.product_id || null
        })
        .filter((id): id is string => Boolean(id)) // Type-safe filter for non-empty strings

      // Filter out selected products and products with no stock
      const availableProducts = allProducts.filter((product) => {
        const hasStock = product.product_count > 0
        const isNotSelected = !selectedProductIds.includes(product._id)

        return hasStock && isNotSelected
      })

      return availableProducts
    },
    [allProducts, editData.items]
  )

  // Regex to handle number input without leading zeros
  const handlePaidAmountChange = (value: string) => {
    // Remove any non-digit characters
    let cleanValue = value.replace(/[^\d]/g, '')

    // Remove leading zeros but keep at least one digit
    cleanValue = cleanValue.replace(/^0+/, '') || '0'

    const numericValue = parseInt(cleanValue, 10) || 0

    setEditData((prev) => ({
      ...prev,
      paid_amount: numericValue,
    }))
  }

  const openEditModal = (sale: Sale) => {
    setSelectedSale(sale)
    const paidAmount = sale?.payments?.paid_amount || 0

    setEditData({
      client_id: sale?.client_id?._id || '',
      sales_assistant_id: sale?.sales_assistant_id?._id || '',
      status: sale?.status || '',
      paid_amount: paidAmount,
      comment: '',
      items:
        sale?.items?.map((item) => ({
          product_id: item?.product_id?._id || '',
          quantity: item?.quantity || 1,
          price: item?.price || 0,
        })) || [],
    })

    // Set display data for usernames
    setDisplayData({
      clientUsername: sale?.client_id?.username || 'N/A',
      salesAssistantUsername: sale?.sales_assistant_id?.username || 'N/A',
    })

    setIsEditModalOpen(true)
    setOpenPopover(null)
  }

  const closeEditModal = () => {
    setIsEditModalOpen(false)
    setSelectedSale(null)
    setEditData({
      client_id: '',
      sales_assistant_id: '',
      status: '',
      paid_amount: 0,
      comment: '',
      items: [],
    })
    setDisplayData({
      clientUsername: '',
      salesAssistantUsername: '',
    })
    setValidationErrors({ comment: false })
  }

  const openDeleteModal = (saleId: string, orderNumber: string) => {
    setSaleToDelete({ id: saleId, orderNumber })
    setIsDeleteModalOpen(true)
    setOpenPopover(null)
  }

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false)
    setSaleToDelete(null)
  }

  const closeDebtModal = () => {
    setIsDebtModalOpen(false)
    setDebtAmount('')
  }

  const handleCloseDebt = async () => {
    if (!id || !debtAmount || parseFloat(debtAmount) <= 0) {
      toast.error('Iltimos, to‘lanadigan qarz miqdorini kiriting')
      return
    }

    const amount = parseFloat(debtAmount)
    const currentDebt = data?.data?.debt?.total_amount || 0

    if (amount > currentDebt) {
      toast.error('To‘lanadigan summa qarzdan ko‘p bo‘lmasligi kerak')
      return
    }

    await handleRequest({
      request: () => closeDebt({ id: id as string, amount }).unwrap(),
      onSuccess: () => {
        toast.success('Qarz muvaffaqiyatli to‘landi!')
        refetchClient()
        closeDebtModal()
      },
      onError: (err) => {
        toast.error(
          err?.message || err?.data?.error?.msg || 'Xatolik yuz berdi'
        )
      },
    })
  }

  const openOrderDetails = (order: Sale) => {
    setSelectedOrder(order)
    setIsOrderDetailsOpen(true)
  }

  const handleSaveChanges = async () => {
    if (!selectedSale) return

    // Reset validation errors
    setValidationErrors({ comment: false })

    // Validation
    if (!editData.comment || editData.comment.trim() === '') {
      setValidationErrors({ comment: true })
      toast.error('Izoh maydoni to\'ldirilishi shart')
      return
    }

    if (
      !editData.client_id ||
      !editData.sales_assistant_id ||
      !editData.status
    ) {
      toast.error("Barcha majburiy maydonlarni to'ldiring")
      return
    }

    // Check if all items have valid data
    const hasInvalidItems = editData.items.some(
      (item) => !item.product_id || item.quantity <= 0
    )

    if (hasInvalidItems) {
      toast.error("Barcha mahsulotlar uchun to'g'ri ma'lumot kiriting")
      return
    }

    // Check for duplicate products
    const productIds = editData.items.map((item) => item.product_id)
    const uniqueProductIds = new Set(productIds)
    if (productIds.length !== uniqueProductIds.size) {
      toast.error("Bir xil mahsulotni ikki marta tanlab bo'lmaydi")
      return
    }

    const updatePayload: UpdateSaleSchema = {
      client_id: editData.client_id,
      sales_assistant_id: editData.sales_assistant_id,
      status: editData.status,
      paid_amount: editData.paid_amount,
      comment: editData.comment,
      items: editData.items,
    }

    await handleRequest({
      request: () =>
        updateSale({ id: selectedSale._id, data: updatePayload }).unwrap(),
      onSuccess: () => {
        toast.success('Sotuv muvaffaqiyatli yangilandi!')
        refetchClient()
        closeEditModal()
      },
      onError: (err) => {
        toast.error(err?.message || err?.data.error.msg || 'Xatolik yuz berdi')
      },
    })
  }

  const confirmDeleteSale = async () => {
    if (!saleToDelete) return

    await handleRequest({
      request: () => deleteSale(saleToDelete.id).unwrap(),
      onSuccess: () => {
        toast.success("Sotuv muvaffaqiyatli o'chirildi!")
        refetchClient()
        refetchSales()
      },
      onError: (err) => {
        toast.error(err?.msg || err?.data?.error?.msg || 'Xatolik yuz berdi')
      },
      onFinally: closeDeleteModal,
    })
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
    // Double check that this product isn't already selected
    const isAlreadySelected = editData.items.some(
      (item, i) => i !== index && item.product_id === productId
    )

    if (isAlreadySelected) {
      toast.error('Bu mahsulot allaqachon tanlangan')
      return
    }

    setEditData((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, product_id: productId } : item
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <h1 className="text-[30px] font-semibold text-[#09090B] mb-4">
        Mijoz haqida
      </h1>
      <div className="border border-[#E4E4E7] rounded-lg p-6 bg-white shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Info
              title="Mijoz ismi"
              value={data?.data?.username || "Noma'lum"}
            />
            <Info
              title="Mijoz segmenti"
              value={data?.data?.customer_tier || 'Standart'}
            />
            <Info
              title="Filial"
              value={data?.data?.branch_id?.name || "Noma'lum"}
            />
            <Info
              title="Telefon raqami"
              value={formatPhone(data?.data?.phone) || 'Mavjud emas'}
            />
            <Info
              title="Kasbi"
              value={data?.data?.profession || "Ko'rsatilmagan"}
            />
            <Info
              title="Manzil"
              value={data?.data?.address || "Manzil ko'rsatilmagan"}
            />
          </div>
          <div className="lg:col-span-1 flex flex-col gap-4">
            <div className="rounded-lg border border-[#E4E4E7] p-5 bg-gradient-to-r from-red-50 to-orange-50">
              <div className="text-sm font-medium text-[#71717A] mb-2">
                Umumiy qarz
              </div>
              <div className="text-2xl font-bold text-red-600 mb-1">
                {money(data?.data?.debt?.total_amount || 0, 'debt', "so'm")}
              </div>
              <div className="text-xs text-gray-500">
                Barcha buyurtmalar bo'yicha
              </div>
            </div>
            <Button
              onClick={() => setIsDebtModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-lg font-medium shadow-sm transition-colors"
              disabled={
                !data?.data?.debt?.total_amount ||
                data?.data?.debt?.total_amount <= 0
              }
            >
              💰 Qarzni to'lash
            </Button>
            <div className="text-xs text-gray-500 text-center">
              Qarz miqdori:{' '}
              {data?.data?.debt?.total_amount || 0 > 0 ? 'Mavjud' : "Yo'q"}
            </div>
          </div>
        </div>
      </div>

      {/* Orders table */}
      <div className="border border-[#E4E4E7] rounded-lg overflow-hidden bg-white shadow-sm">
        <div className="px-6 py-4 font-semibold text-[#18181B] border-b bg-gray-50">
          Buyurtmalar tarixi
          <span className="ml-2 text-sm font-normal text-gray-600">
            ({client_items?.data?.length || 0} ta buyurtma)
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] table-fixed">
            <colgroup>
              <col className="w-[16%]" />
              <col className="w-[18%]" />
              <col className="w-[16%]" />
              <col className="w-[16%]" />
              <col className="w-[16%]" />
              <col className="w-[10%]" />
            </colgroup>
            <thead className="bg-[#F9F9F9] text-[#71717A] text-sm">
              <tr>
                <th className="px-4 py-3 text-center font-medium">Sana</th>
                <th className="px-4 py-3 text-center font-medium">
                  Buyurtma №
                </th>
                <th className="px-4 py-3 text-center font-medium">
                  Umumiy summa
                </th>
                <th className="px-4 py-3 text-center font-medium">To'langan</th>
                <th className="px-4 py-3 text-center font-medium">Qarz</th>
                <th className="px-4 py-3 text-center font-medium">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E4E7]">
              {client_items?.data?.map((o) => (
                <tr
                  key={o._id}
                  className="hover:bg-[#F9F9F9] transition-colors"
                >
                  <td className="px-4 py-4 text-center">
                    <div className="text-sm text-[#18181B] font-medium">
                      {o?.created_at
                        ? format(new Date(o.created_at), 'dd.MM.yyyy')
                        : 'N/A'}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {o?.created_at
                        ? format(new Date(o.created_at), 'HH:mm')
                        : ''}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <button
                      onClick={() => openOrderDetails(o)}
                      className="inline-flex items-center px-2 py-1 text-xs font-mono rounded-md bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 transition-colors"
                      title="Buyurtma tafsilotlarini ko'rish"
                    >
                      #{(o?.payments?._id || 'N/A').toString().slice(-8)}
                    </button>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="text-sm font-semibold text-[#18181B]">
                      {money(o?.payments?.total_amount || 0, 'neutral', "so'm")}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="text-sm font-semibold text-green-600">
                      {money(o?.payments?.paid_amount || 0, 'pos', "so'm")}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="text-sm font-semibold">
                      {money(o?.payments?.debt_amount || 0, 'debt', "so'm")}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <Popover
                      open={openPopover === o._id}
                      onOpenChange={(open) =>
                        setOpenPopover(open ? o._id : null)
                      }
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-gray-100 transition-colors"
                        >
                          <MoreHorizontal className="h-4 w-4 text-gray-600" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-56 p-2 shadow-lg"
                        align="end"
                      >
                        <div className="space-y-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            onClick={() => openEditModal(o)}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Yangilash
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() =>
                              openDeleteModal(o._id, o?.payments?._id || '')
                            }
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            O'chirish
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </td>
                </tr>
              )) || (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className="text-lg">📋</div>
                      <div>Buyurtmalar topilmadi</div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog
        open={isEditModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeEditModal()
          }
        }}
      >
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
                <Label htmlFor="sales_assistant_username">
                  Sotuv assistenti
                </Label>
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
                <Label htmlFor="comment">Izoh *</Label>
                <Input
                  id="comment"
                  value={editData.comment || ''}
                  onChange={(e) => {
                    setEditData((prev) => ({
                      ...prev,
                      comment: e.target.value,
                    }))
                    // Clear validation error when user starts typing
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
                      Barcha mavjud mahsulotlar tanlangan. Yangi mahsulot
                      qo'shish uchun biror mahsulotni o'chiring.
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
                                          const img =
                                            e.target as HTMLImageElement
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

                              {/* Load More Indicator */}
                              {hasNextPage &&
                                !isLoadingMore &&
                                !isLoadingInfiniteProducts && (
                                  <div className="px-2 py-2 text-center text-xs text-gray-400">
                                    Pastga aylantiring...
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
              <Button variant="outline" onClick={closeEditModal}>
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

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Sotuvni o'chirish
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="text-center">
              <p className="text-lg font-medium text-gray-900 mb-2">
                Rostan ham o'chirmoqchimisiz?
              </p>
              <p className="text-sm text-gray-600">
                Buyurtma raqami:{' '}
                <span className="font-medium">{saleToDelete?.orderNumber}</span>
              </p>
              <p className="text-sm text-red-600 mt-2">
                Bu amal bekor qilib bo'lmaydi.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={closeDeleteModal}>
                Yo'q, bekor qilish
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeleteSale}
                className="bg-red-600 hover:bg-red-700"
                disabled={isDeleting}
              >
                {isDeleting ? "O'chirilmoqda..." : "Ha, o'chirish"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isDebtModalOpen} onOpenChange={setIsDebtModalOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              💰 Qarzni to'lash
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Current debt display */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="text-sm text-red-700 font-medium mb-1">
                Umumiy qarz miqdori
              </div>
              <div className="text-xl font-bold text-red-800">
                {money(data?.data?.debt?.total_amount || 0, 'debt', "so'm")}
              </div>
            </div>

            {/* Payment input */}
            <div className="space-y-2">
              <Label htmlFor="debtAmount" className="text-sm font-medium">
                To'lanadigan summa
              </Label>
              <Input
                id="debtAmount"
                value={debtAmount}
                onChange={(e) => setDebtAmount(e.target.value)}
                type="number"
                placeholder="To'lanadigan summa kiriting"
                className="text-lg font-semibold"
                min="0"
                max={data?.data?.debt?.total_amount || 0}
              />
              <div className="text-xs text-gray-500">
                Maksimal:{' '}
                {money(data?.data?.debt?.total_amount || 0, 'debt', "so'm")}
              </div>
            </div>

            {/* Quick amount buttons */}
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setDebtAmount(
                    ((data?.data?.debt?.total_amount || 0) / 4).toString()
                  )
                }
                className="text-xs"
              >
                25%
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setDebtAmount(
                    ((data?.data?.debt?.total_amount || 0) / 2).toString()
                  )
                }
                className="text-xs"
              >
                50%
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setDebtAmount(
                    (data?.data?.debt?.total_amount || 0).toString()
                  )
                }
                className="text-xs"
              >
                100%
              </Button>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={closeDebtModal}
                className="flex-1"
              >
                Bekor qilish
              </Button>
              <Button
                onClick={handleCloseDebt}
                disabled={
                  isClosingDebt || !debtAmount || parseFloat(debtAmount) <= 0
                }
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                {isClosingDebt ? "To'lanmoqda..." : "To'lash"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Order Details Modal */}
      <OrderDetailsDialog
        open={isOrderDetailsOpen}
        setOpen={(open) => {
          setIsOrderDetailsOpen(open)
          if (!open) {
            setSelectedOrder(null)
          }
        }}
        orderData={selectedOrder}
      />
    </div>
  )
}

function Info({ title, value }: { title: string; value: string }) {
  return (
    <div className="p-3 border border-gray-200 rounded-lg bg-gray-50/50">
      <div className="text-sm font-medium text-[#71717A] mb-1">{title}</div>
      <div
        className="text-base font-semibold text-[#18181B] break-words"
        title={value}
      >
        {value?.length > 30 ? value.substring(0, 30) + '...' : value}
      </div>
    </div>
  )
}
