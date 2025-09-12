import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useGetClientsQuery } from '@/store/clients/clients.api'
import { CheckRole } from '@/utils/checkRole'
import { useGetRole } from '@/hooks/use-get-role'
import { AlertCircle } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { TableSkeleton } from '../../components/ui/table-skeleton'
import AddClientDialog from './AddClientDialog'
import { useGetUser } from '@/hooks/useGetUser'
import { SetLocation } from '@/hooks/setLocation'

function BalanceCell({ value }: { value: number }) {
  const isZero = value === 0
  const isNegative = value < 0
  const formatted =
    (isNegative ? '-' : '') + Math.abs(value).toLocaleString('uz-UZ') + " so'm"
  return (
    <span
      className={
        isZero
          ? 'text-emerald-600'
          : isNegative
            ? 'text-rose-600'
            : 'text-emerald-600'
      }
    >
      {isZero ? "0 so'm" : formatted}
    </span>
  )
}

function Clients() {
  const me = useGetUser()
  const {
    data: { data: clientsData = [] } = {},
    isLoading,
    isError,
  } = useGetClientsQuery({ branch_id: me?.branch_id._id })
  // const {data:branches} = useGetBranchesQuery({});

  const navigate = useNavigate()

  SetLocation('Mijozlar')

  const role = useGetRole()
  const [open, setOpen] = useState(false)
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-[30px] font-semibold text-[#09090B]">Mijozlar</h1>
        <div className="flex gap-3">
          <Select>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Barcha filiallar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barchasi</SelectItem>
              <SelectItem value="termiz">Termiz</SelectItem>
              <SelectItem value="shahrisabz">Shahrisabz</SelectItem>
            </SelectContent>
          </Select>
          {CheckRole(role, ['manager', 'sale_cashier']) && (
            <Button onClick={() => setOpen(true)} variant="default">
              Mijoz qo'shish
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <TableSkeleton rows={5} columns={6} />
      ) : isError ? (
        <div className="border border-red-200 rounded-lg p-6 flex flex-col items-center justify-center space-y-4">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <p className="text-red-600 text-lg">Xatolik yuz berdi</p>
          <p className="text-gray-600">
            Mijozlarni yuklashda xatolik yuz berdi. Iltimos, qaytadan urinib
            ko'ring.
          </p>
        </div>
      ) : clientsData.length === 0 ? (
        <div className="border border-[#E4E4E7] rounded-lg p-8 flex flex-col items-center justify-center space-y-4">
          <AlertCircle className="h-12 w-12 text-gray-400" />
          <p className="text-lg text-gray-600">Mijozlar topilmadi</p>
          <p className="text-gray-500">
            Hozircha hech qanday mijoz mavjud emas
          </p>
        </div>
      ) : (
        <div className="border border-[#E4E4E7] rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#F9F9F9] text-[#71717A] text-sm">
              <tr>
                <th className="px-6 py-3 text-left font-medium">Ismi</th>
                <th className="px-6 py-3 text-left font-medium">
                  Telefon raqami
                </th>
                <th className="px-6 py-3 text-left font-medium">Segment</th>
                <th className="px-6 py-3 text-left font-medium">Balans</th>
                <th className="px-6 py-3 text-center font-medium">
                  Buyurtmalar soni
                </th>
                <th className="px-6 py-3 text-center font-medium">Filial</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E4E7]">
              {clientsData?.map((c) => (
                <tr
                  key={c._id}
                  className="hover:bg-[#F9F9F9] cursor-pointer"
                  onClick={() => navigate(`client/${c._id}`)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-[#18181B]">
                      <Link
                        to={`/manager/clients/${c.id}`}
                        className="hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {c.username}
                      </Link>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-[#18181B]">
                      {c.phone || 'Mavjud emas'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-[#18181B]">
                      {c.profession || 'Mavjud emas'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <BalanceCell value={c.balance || 0} />
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="text-sm text-[#18181B]">
                      {c.orders || 0}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="text-sm text-[#18181B]">
                      {c.branch?.name || "Noma'lum"}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <AddClientDialog open={open} setOpen={setOpen} />
    </div>
  )
}

export default Clients
