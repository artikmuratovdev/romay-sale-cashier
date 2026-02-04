import { EditSaleModal } from '@/components/EditSaleModal'
import { TablePagination } from '@/components/TablePagination'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { useHandleRequest } from '@/hooks/use-handle-request'
import { useGetUser } from '@/hooks/useGetUser'
import {
    useDeleteSaleMutation,
    useGetAllSalesQuery,
    useUpdateSaleMutation,
} from '@/store/sales/salesApi'
import type { Sale } from '@/store/sales/types'
import { addDays, format } from 'date-fns'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { AlertTriangle, Edit, MoreHorizontal, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import DatePicker from '../components/DatePicker'
import money from '../components/money'
import SaleDetailsDialog from './SaleDetailDialog'

dayjs.extend(utc)

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
      branch_id: me?.branch_id?._id as string,
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

  const [updateSale, { isLoading: isUpdating }] = useUpdateSaleMutation()
  const [deleteSale, { isLoading: isDeleting }] = useDeleteSaleMutation()
  const handleRequest = useHandleRequest()
  const [openPopover, setOpenPopover] = useState<string | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedSaleForEdit, setSelectedSaleForEdit] = useState<Sale | null>(
    null
  )
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [saleToDelete, setSaleToDelete] = useState<{
    id: string
    orderNumber: string
  } | null>(null)

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

  const openEditModal = (sale: Sale) => {
    setSelectedSaleForEdit(sale)
    setIsEditModalOpen(true)
    setOpenPopover(null)
  }

  const closeEditModal = () => {
    setIsEditModalOpen(false)
    setSelectedSaleForEdit(null)
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

  const handleSaveChanges = async (data: {
    sales_assistant_id: string
    paid_amount: number
    comment: string
    items: Array<{
      product_id: string
      quantity: number
      price?: number
    }>
  }) => {
    if (!selectedSaleForEdit) return

    await handleRequest({
      request: () =>
        updateSale({
          id: selectedSaleForEdit._id,
          data,
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
                <tr
                  key={o._id}
                  onClick={() => {
                    setSelectedSale(o)
                    setOpen(true)
                  }}
                  className="hover:bg-[#F9F9F9]"
                >
                  <td className="px-6 py-4 text-center whitespace-nowrap">
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
                  <td
                    onClick={(e) => e.stopPropagation()}
                    className="px-6 py-4 text-center whitespace-nowrap"
                  >
                    <Popover
                      open={openPopover === o._id}
                      onOpenChange={(open) => {
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

      {/* EditSaleModal */}
      <EditSaleModal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        sale={selectedSaleForEdit}
        onSave={handleSaveChanges}
        isUpdating={isUpdating}
        branch={me?.branch_id?._id || ''}
      />

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
