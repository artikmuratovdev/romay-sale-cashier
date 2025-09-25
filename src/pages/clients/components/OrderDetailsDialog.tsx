import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Sale } from '@/store/sales/types'

type Props = {
  open: boolean
  setOpen: (open: boolean) => void
  orderData: Sale | null
}

const status: Record<string, string> = {
  IN_PROGRESS: 'Bajarilmoqda',
  COMPLETED: 'Bajarildi',
  CANCELLED: 'Bekor qilindi',
}

export default function OrderDetailsDialog({ open, setOpen, orderData }: Props) {
  if (!orderData) return null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Buyurtma tafsilotlari</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 grid grid-cols-2">
          {/* Branch */}
          <div>
            <p className="text-sm text-gray-500">Filial nomi</p>
            <p className="font-medium">
              {typeof orderData.branch_id === 'object'
                ? orderData.branch_id.name
                : "Noma'lum"}
            </p>
          </div>

          {/* Cashier */}
          <div>
            <p className="text-sm text-gray-500">Kassir</p>
            <p className="font-medium">
              {typeof orderData.cashier_id === 'object'
                ? orderData.cashier_id.username
                : "Noma'lum"}
            </p>
          </div>

          {/* Sales Assistant */}
          <div>
            <p className="text-sm text-gray-500">Sotuv assistenti</p>
            <p className="font-medium">
              {orderData.sales_assistant_id && typeof orderData.sales_assistant_id === 'object'
                ? orderData.sales_assistant_id.username
                : "Noma'lum"}
            </p>
          </div>

          {/* Client */}
          <div>
            <p className="text-sm text-gray-500">Mijoz</p>
            <p className="font-medium">
              {orderData.client_id && typeof orderData.client_id === 'object'
                ? orderData.client_id.username
                : "Noma'lum"}
            </p>
          </div>

          {/* Status */}
          <div>
            <p className="text-sm text-gray-500">Status</p>
            <p className="font-medium">{status[orderData.status] || "Noma'lum"}</p>
          </div>

          {/* Order Number */}
          <div>
            <p className="text-sm text-gray-500">Buyurtma raqami</p>
            <p className="font-medium">{orderData.payments._id || "Noma'lum"}</p>
          </div>

          {/* Total Amount */}
          <div>
            <p className="text-sm text-gray-500">Jami summa</p>
            <p className="font-medium">
              {orderData.payments.total_amount || 0}{' '}
              {orderData.payments.currency || "so'm"}
            </p>
          </div>

          {/* Paid Amount */}
          <div>
            <p className="text-sm text-gray-500">To'langan summa</p>
            <p className="font-medium">
              {orderData.payments.paid_amount || 0}{' '}
              {orderData.payments.currency || "so'm"}
            </p>
          </div>

          {/* Debt Amount */}
          <div>
            <p className="text-sm text-gray-500">Qarzdorlik</p>
            <p className={`font-medium ${orderData.payments.debt_amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {orderData.payments.debt_amount || 0}{' '}
              {orderData.payments.currency || "so'm"}
            </p>
          </div>

          {/* Payment Type */}
          <div>
            <p className="text-sm text-gray-500">To'lov turi</p>
            <p className="font-medium">{orderData.payments.type || "Noma'lum"}</p>
          </div>

          {/* Created Date */}
          <div>
            <p className="text-sm text-gray-500">Yaratilgan sana</p>
            <p className="font-medium">
              {orderData.created_at 
                ? new Date(orderData.created_at).toLocaleDateString('uz-UZ')
                : "Noma'lum"}
            </p>
          </div>

          {/* Updated Date */}
          <div>
            <p className="text-sm text-gray-500">Yangilangan sana</p>
            <p className="font-medium">
              {orderData.updated_at 
                ? new Date(orderData.updated_at).toLocaleDateString('uz-UZ')
                : "Noma'lum"}
            </p>
          </div>

          {/* Items Table */}
          <div className="col-span-2">
            <h3 className="text-lg font-medium mb-3">Buyurtma mahsulotlari</h3>
            <div className="overflow-x-auto mb-4">
              <table className="min-w-full border border-gray-200 rounded">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                      Mahsulot Nomi
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                      Kategoriya
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                      Miqdori
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                      Narxi
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                      Jami
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {orderData.items.map((item) => (
                    <tr key={item._id} className="border-t">
                      <td className="px-4 py-2 text-sm">
                        {item.product_id.product?.name || "Noma'lum"}
                      </td>
                      <td className="px-4 py-2 text-sm">
                        {item.product_id.product?.category_id?.name ||
                          "Noma'lum"}
                      </td>
                      <td className="px-4 py-2 text-sm">
                        {item.quantity || 0}
                      </td>
                      <td className="px-4 py-2 text-sm">
                        {item.price || 0} so'm
                      </td>
                      <td className="px-4 py-2 text-sm font-medium">
                        {(item.price * item.quantity) || 0} so'm
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Button
              type="button"
              onClick={() => setOpen(false)}
              className="w-full"
            >
              Yopish
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
