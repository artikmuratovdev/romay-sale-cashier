import { Button } from '@/components/ui/button'
import { SetLocation } from '@/hooks/setLocation'
import { useGetOneClientQuery } from '@/store/clients/clients.api'
import { useGetAllSalesQuery } from '@/store/sales/salesApi'
import { format } from 'date-fns'
import { Download } from 'lucide-react'
import { useParams } from 'react-router-dom'

function money(n: number, sign: 'neutral' | 'debt' | 'pos' = 'neutral') {
  const text = n.toLocaleString('uz-UZ')
  const cls =
    sign === 'debt'
      ? 'text-rose-600'
      : sign === 'pos'
        ? 'text-emerald-600'
        : 'text-[#18181B]'
  return <span className={cls}>{text}</span>
}

export default function ClientDetails() {
  const id = useParams<{ id: string }>().id
  const { data } = useGetOneClientQuery(id as string, { skip: !id })
  const { data: client_items } = useGetAllSalesQuery(
    { client_id: id as string },
    { skip: !id }
  )

  const items = client_items?.data
    .map((item) => item.items.map((item) => item))
    .flat()

  console.log(items)
  SetLocation('Mijozlar > Mijoz haqida')
  return (
    <div className="space-y-6">
      {/* Header */}
      <h1 className="text-[30px] font-semibold text-[#09090B] mb-4">
        Mijoz haqida
      </h1>
      <div className="border border-[#E4E4E7] rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
          <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Info title="Ismi" value={data?.data.username || ''} />
            <Info title="segmenti" value={data?.data.customer_tier || ''} />
            <Info title="Filial" value={data?.data.branch_id.name || ''} />
            <Info title="Phone Number" value={data?.data.phone || ''} />
            <Info title="Kasbi" value={data?.data.profession || ''} />
            <Info title="Mijoz Manzili" value={data?.data.address || ''} />
          </div>
          <div className="md:col-span-1">
            <div className="rounded-md border border-[#E4E4E7] p-5">
              <div className="text-sm text-[#71717A]">Balans</div>
              <div className="text-[28px] font-semibold text-rose-600">
                {money(data?.data.debt.amount || 0, 'debt')} so'm
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Orders table */}
      <div className="border border-[#E4E4E7] rounded-lg overflow-hidden">
        <div className="px-6 py-3 font-medium text-[#18181B] border-b">
          Buyurtmalari
        </div>
        <table className="w-full">
          <thead className="bg-[#F9F9F9] text-[#71717A] text-sm">
            <tr>
              <th className="px-6 py-3 text-left font-medium">
                Buyurtma sanasi
              </th>
              <th className="px-6 py-3 text-left font-medium">
                Buyurtma raqami
              </th>
              <th className="px-6 py-3 text-left font-medium">
                Umumiy to'lov summasi
              </th>
              <th className="px-6 py-3 text-left font-medium">
                To'lov qilingan summa
              </th>
              <th className="px-6 py-3 text-left font-medium">Qarzdorlik</th>
              <th className="px-6 py-3 text-center font-medium">
                Yuklab olish
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E4E4E7]">
            {client_items?.data.map((o) => (
              <tr key={o._id} className="hover:bg-[#F9F9F9]">
                <td className="px-6 py-4 text-center whitespace-nowrap">
                  <div className="text-sm text-[#18181B]">
                    {format(o.created_at, 'dd.MM.yyyy')}
                  </div>
                </td>
                <td className="px-6 py-4 text-center whitespace-nowrap">
                  <div className="text-sm text-[#18181B]">{o.payments._id}</div>
                </td>
                <td className="px-6 py-4 text-center whitespace-nowrap">
                  <div className="text-sm text-[#18181B]">
                    {money(o.payments.total_amount)}
                  </div>
                </td>
                <td className="px-6 py-4 text-center whitespace-nowrap">
                  <div className="text-sm text-[#18181B]">
                    {money(o.payments.paid_amount)}
                  </div>
                </td>
                <td className="px-6 py-4 text-center whitespace-nowrap">
                  <div className="text-sm">
                    {money(o.payments.debt_amount, 'debt')}
                  </div>
                </td>
                <td className="px-6 py-4 text-center whitespace-nowrap">
                  <Button disabled={true} variant="outline">
                    <Download className="mr-2 h-4 w-4" /> To'lov cheki
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Info({ title, value }: { title: string; value: string }) {
  return (
    <div className="p-0">
      <div className="text-sm text-[#71717A]">{title}</div>
      <div className="text-[16px] font-semibold text-[#18181B]">{value}</div>
    </div>
  )
}
