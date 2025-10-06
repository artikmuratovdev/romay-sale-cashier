import { TablePagination } from '@/components/TablePagination'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useGetUser } from '@/hooks/useGetUser'
import {
  useGetAllSalesQuery,
  useUpdateSaleMutation,
  useDeleteSaleMutation,
} from '@/store/sales/salesApi'
import { useGetAllProductsQuery, useGetProductsInfiniteQuery } from '@/store/product/product.api'
import { addDays, format } from 'date-fns'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)
import {
  MoreHorizontal,
  Edit,
  Trash2,
  X,
  Plus,
  Minus,
  AlertTriangle,
} from 'lucide-react'
import { useState, useCallback, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { useHandleRequest } from '@/hooks/use-handle-request'
import DatePicker from '../components/DatePicker'
import money from '../components/money'
import SaleDetailsDialog from './SaleDetailDialog'
import type { Sale } from '@/store/sales/types'

type UpdateSaleSchema = {
  client_id?: string
  sales_assistant_id: string
  paid_amount: number
  comment?: string
  items: Array<{
    product_id: string
    quantity: number
    price?: number
  }>
}

export default function Sale() {
  const me = useGetUser()
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)

  const [dateRange, setDateRange] = useState<{
    from?: string
    to?: string
  }>({ from: undefined, to: undefined })

  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const {
    data,
    isLoading,
    isFetching,
    refetch: refetchSales,
  } = useGetAllSalesQuery(
    {
      branch_id: me?.branch_id._id as string,
      page,
      limit,
      search,
      date_from: dateRange.from,
      date_to: dateRange.to,
    },
    {
      refetchOnMountOrArgChange: 30,
      refetchOnFocus: true,
    }
  )
  const { data: products } = useGetAllProductsQuery(
    { branch: me?.branch_id._id as string },
    { skip: !me?.branch_id._id }
  )

  const [updateSale, { isLoading: isUpdating }] = useUpdateSaleMutation()
  const [deleteSale, { isLoading: isDeleting }] = useDeleteSaleMutation()
  const handleRequest = useHandleRequest()
  const [openPopover, setOpenPopover] = useState<string | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [saleToDelete, setSaleToDelete] = useState<{
    id: string
    orderNumber: string
  } | null>(null)
  const [editData, setEditData] = useState<UpdateSaleSchema>({
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
    if (me?.branch_id._id) {
      setCurrentPage(1)
      setAllProducts([])
      setHasNextPage(true)
      setDebouncedSearchTerm('')
      setSearchTerm('')
    }
  }, [me?.branch_id._id])

  // Infinite query for products
  const {
    data: infiniteProductsData,
    isLoading: isLoadingInfiniteProducts,
    isFetching: isFetchingInfiniteProducts,
  } = useGetProductsInfiniteQuery(
    {
      branch: me?.branch_id._id as string,
      page: currentPage,
      limit: 20,
      search: debouncedSearchTerm || undefined,
    },
    {
      skip: !me?.branch_id._id,
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
        setAllProducts(prev => {
          const existingIds = new Set(prev.map(p => p._id))
          const newProducts = infiniteProductsData.data.filter(p => !existingIds.has(p._id))
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
      setCurrentPage(prev => prev + 1)
    }
  }, [hasNextPage, isFetchingInfiniteProducts, isLoadingMore])

  // Scroll handler for infinite scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    const isNearBottom = scrollHeight - scrollTop <= clientHeight + 50
    
    if (isNearBottom) {
      loadMoreProducts()
    }
  }, [loadMoreProducts])

  const getAllData = data?.pagination

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  const handleItemsPerPageChange = (itemsPerPage: number) => {
    setLimit(itemsPerPage)
    setPage(1)
  }
  const [selectedSale, setSelectedSale] = useState<Sale>({
    _id: 'string',
    branch_id: { _id: 'string', name: 'string', address: 'string' },
    cashier_id: { _id: 'string', username: 'string', phone: 'string' },
    client_id: { _id: 'string', username: 'string', phone: 'string' },
    sales_assistant_id: { _id: 'string', username: 'string', phone: 'string' },
    items: [],
    status: 'PENDING',
    payments: {
      total_amount: 0,
      paid_amount: 0,
      debt_amount: 0,
      type: '',
      currency: '',
      _id: '',
    },
    created_at: '',
    updated_at: '',
  })
  const [selectedSaleForEdit, setSelectedSaleForEdit] = useState<Sale | null>(
    null
  )

  // Helper function to get product by ID
  const getProductById = (productId: string) => {
    return products?.data?.find((product) => product._id === productId)
  }

  // Helper function to get available products for selection with infinite scroll
  const getAvailableProducts = useCallback((currentItemIndex?: number) => {
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
  }, [allProducts, editData.items])

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
    setSelectedSaleForEdit(sale)
    const paidAmount = sale?.payments?.paid_amount || 0

    setEditData({
      client_id: sale?.client_id?._id || '',
      sales_assistant_id: sale?.sales_assistant_id?._id || '',
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
    setSelectedSaleForEdit(null)
    setEditData({
      client_id: undefined,
      sales_assistant_id: '',
      paid_amount: 0,
      comment: '',
      items: [],
    })
    setDisplayData({
      clientUsername: '',
      salesAssistantUsername: '',
    })
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

  const handleSaveChanges = async () => {
    if (!selectedSaleForEdit) return

    if (editData.paid_amount < 0) {
      toast.error("To'langan summa manfiy bo'lmasligi kerak")
      return
    }

    if (editData.items.length === 0) {
      toast.error("Kamida bitta mahsulot bo'lishi kerak")
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
      sales_assistant_id: editData.sales_assistant_id,
      paid_amount: editData.paid_amount,
      comment: editData.comment,
      items: editData.items,
    }

    await handleRequest({
      request: () =>
        updateSale({
          id: selectedSaleForEdit._id,
          data: updatePayload,
        }).unwrap(),
      onSuccess: () => {
        toast.success('Sotuv muvaffaqiyatli yangilandi!')
        refetchSales()
        closeEditModal()
      },
      onError: (err) => {
        console.log(err)
        toast.error(
          err?.message || err?.data?.error?.msg || 'Xatolik yuz berdi'
        )
      },
    })
  }

  const confirmDeleteSale = async () => {
    if (!saleToDelete) return

    await handleRequest({
      request: () => deleteSale(saleToDelete.id).unwrap(),
      onSuccess: () => {
        toast.success("Sotuv muvaffaqiyatli o'chirildi!")
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
    <div className="py-4">
      <div className="mb-6 space-y-4">
        {/* Title and Create Button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl sm:text-[26px] max-sm:mx-auto lg:text-[30px] font-semibold text-[#09090B]">
            Buyurtmalar
          </h1>
          <Link to={'create-sale'} className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto hover:bg-white hover:text-teal-600 border-2 border-teal-600 bg-teal-600 text-sm sm:text-base lg:text-lg py-2.5 sm:py-3 px-4">
              Buyurtma yaratish
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <DatePicker
            className="w-full"
            onDateRangeChange={(range) => {
              if (!range) {
                setDateRange({ from: undefined, to: undefined })
                return
              }
              if (range?.from && range.from === range.to) {
                const nextDay = format(addDays(range.from, 1), 'yyyy-MM-dd')
                setDateRange({
                  from: format(range.from, 'yyyy-MM-dd'),
                  to: nextDay,
                })
                return
              }
              setDateRange({
                from: range.from ? format(range.from, 'yyyy-MM-dd') : undefined,
                to: range.to ? format(range.to, 'yyyy-MM-dd') : undefined,
              })
            }}
          />
          <div className="sm:col-span-1 lg:col-span-2">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full"
              placeholder="Qidiruv..."
            />
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#F9F9F9] text-[#71717A] text-sm">
            <tr>
              <th className="px-6 py-3 text-center font-medium">
                Buyurtma raqami
              </th>
              <th className="px-6 py-3 text-center font-medium">
                Buyurtma sanasi
              </th>
              <th className="px-6 py-3 text-center font-medium">Mijoz</th>
              <th className="px-6 py-3 text-center font-medium">Sotuvchi</th>
              <th className="px-6 py-3 text-center font-medium">Qarzdorlik</th>
              <th className="px-6 py-3 text-center font-medium">
                Umumiy to'lov summasi
              </th>
              <th className="px-6 py-3 text-center font-medium">Amallar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E4E4E7]">
            {isLoading || (isFetching && !data?.data) ? (
              // Loading holati
              Array.from({ length: 5 }).map((_, index) => (
                <tr key={index}>
                  {Array.from({ length: 7 }).map((_, cellIndex) => (
                    <td
                      key={cellIndex}
                      className="px-6 py-4 text-center whitespace-nowrap"
                    >
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    </td>
                  ))}
                </tr>
              ))
            ) : data?.data?.length ? (
              data.data.map((o) => (
                <tr key={o._id}
                   onClick={() => {
                     setSelectedSale(o)
                     setOpen(true)
                   }}
                 className="hover:bg-[#F9F9F9]">
                  <td
                    className="px-6 py-4 text-center whitespace-nowrap"
                  >
                    <div className="text-sm text-[#18181B] cursor-pointer">
                      {o?.payments?._id || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center whitespace-nowrap">
                    <div className="text-sm text-[#18181B]">
                      {o?.created_at
                        ? dayjs.utc(o.created_at).format('DD.MM.YYYY')
                        : 'N/A'}
                    </div>
                  </td>

                  <td className="px-6 py-4 text-center whitespace-nowrap">
                    <div className="text-sm text-[#18181B]">
                      {o?.client_id?.username || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center whitespace-nowrap">
                    <div className="text-sm text-[#18181B]">
                      {o.sales_assistant_id.username}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center whitespace-nowrap">
                    <div className="text-sm">
                      {money(o?.payments?.debt_amount, 'debt', "so'm")}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center whitespace-nowrap">
                    <div className="text-sm text-[#18181B]">
                      {money(o?.payments?.total_amount, 'neutral', "so'm")}
                    </div>
                  </td>
                  <td onClick={(e) => e.stopPropagation()} className="px-6 py-4 text-center whitespace-nowrap">
                    <Popover
                      open={openPopover === o._id}
                      onOpenChange={(open) =>{
                        setOpenPopover(open ? o._id : null)
                      }}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-56 p-2" align="end">
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
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  Buyurtmalar topilmadi
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div>
        {getAllData && (
          <TablePagination
            currentPage={getAllData.page || 1}
            totalPages={getAllData.total_pages || 1}
            totalItems={getAllData.total || 0}
            itemsPerPage={getAllData.limit || 10}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
          />
        )}
      </div>
      <SaleDetailsDialog
        open={open}
        setOpen={setOpen}
        saleData={selectedSale}
      />

      {/* Edit Sale Modal */}
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
            </div>

            {/* Comment Section */}
            <div className="space-y-2">
              <Label htmlFor="comment">Izoh (ixtiyoriy)</Label>
              <Input
                id="comment"
                value={editData.comment || ''}
                onChange={(e) => setEditData(prev => ({ ...prev, comment: e.target.value }))}
                placeholder="Sotuv haqida qo'shimcha izoh..."
              />
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
                            // Check if this product is already selected in another item
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
                                  {debouncedSearchTerm ? 'Qidirilmoqda...' : 'Ko\'proq mahsulotlar yuklanmoqda...'}
                                </div>
                              )}

                              {/* No Results */}
                              {!isLoadingInfiniteProducts && availableProducts.length === 0 && !product && (
                                <div className="px-2 py-3 text-center text-sm text-gray-500">
                                  {debouncedSearchTerm ? 'Hech narsa topilmadi' : 'Mavjud mahsulotlar yo\'q'}
                                </div>
                              )}

                              {/* Load More Indicator */}
                              {hasNextPage && !isLoadingMore && !isLoadingInfiniteProducts && (
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
                          value={item.price || (product?.product?.price || 0)}
                          onChange={(e) =>
                            updateItemPrice(
                              index,
                              Number(e.target.value) || 0
                            )
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
    </div>
  )
}
