import EditSaleModal from '@/components/EditSaleModal'
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
import { useHandleRequest } from '@/hooks/use-handle-request'
import {
  useCloseDebtMutation,
  useGetOneClientQuery,
} from '@/store/clients/clients.api'
import {
  useDeleteSaleMutation,
  useGetAllSalesQuery,
  useUpdateSaleMutation,
} from '@/store/sales/salesApi'
import type { Sale } from '@/store/sales/types'
import { formatPhone } from '@/utils/formatPhone'
import { format } from 'date-fns'
import { AlertTriangle, Edit, MoreHorizontal, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'
import money from '../selling/components/money'
import OrderDetailsDialog from './components/OrderDetailsDialog'

export default function ClientDetails() {
  const id = useParams<{ id: string }>().id
  const { data, refetch: refetchClient } = useGetOneClientQuery(id as string, {
    skip: !id,
  })
  const { data: client_items, refetch: refetchSales } = useGetAllSalesQuery(
    { client_id: id as string },
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
  const [selectedSaleForEdit, setSelectedSaleForEdit] = useState<Sale | null>(
    null
  )
  const [saleToDelete, setSaleToDelete] = useState<{
    id: string
    orderNumber: string
  } | null>(null)
  const [isOrderDetailsOpen, setIsOrderDetailsOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Sale | null>(null)

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
        refetchClient()
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
        refetchClient()
        refetchSales()
      },
      onError: (err) => {
        toast.error(err?.msg || err?.data?.error?.msg || 'Xatolik yuz berdi')
      },
      onFinally: closeDeleteModal,
    })
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

      {/* EditSaleModal */}
      <EditSaleModal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        sale={selectedSaleForEdit}
        onSave={handleSaveChanges}
        isUpdating={isUpdating}
        branch={data?.data?.branch_id?._id || ''}
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
