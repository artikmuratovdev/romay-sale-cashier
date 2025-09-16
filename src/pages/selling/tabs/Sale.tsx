import { TablePagination } from '@/components/TablePagination'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useGetUser } from '@/hooks/useGetUser'
import { useGetAllSalesQuery } from '@/store/sales/salesApi'
import { format } from 'date-fns'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import DatePicker from '../components/DatePicker'

function money(
  n: number | undefined | null,
  sign: 'neutral' | 'debt' | 'pos' = 'neutral'
) {
  // Handle null, undefined, or invalid number cases
  if (n === null || n === undefined || isNaN(n)) {
    n = 0
  }

  const text = n.toLocaleString('uz-UZ')
  const cls =
    sign === 'debt'
      ? 'text-rose-600'
      : sign === 'pos'
        ? 'text-emerald-600'
        : 'text-[#18181B]'
  return <span className={cls}>{text}</span>
}

const Sale = () => {
  const me = useGetUser()
  const [search, setSearch] = useState('')

  const [dateRange, setDateRange] = useState<{
    from?: string
    to?: string
  }>({ from: undefined, to: undefined })

  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const { data } = useGetAllSalesQuery({
    branch_id: me?.branch_id._id as string,
    page,
    limit,
    search,
    date_from: dateRange.from,
    date_to: dateRange.to,
  })

  const getAllData = data?.pagination

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  const handleItemsPerPageChange = (itemsPerPage: number) => {
    setLimit(itemsPerPage)
    setPage(1)
  }

  return (
    <div className="py-4">
      <div className="mb-4 grid grid-cols-6 items-center gap-4">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="col-span-4"
          placeholder="Qidiruv..."
        />
        <DatePicker
          onDateRangeChange={(range) => {
            if (!range) {
              setDateRange({ from: undefined, to: undefined })
              return
            }
            setDateRange({
              from: range.from ? format(range.from, 'yyyy-MM-dd') : undefined,
              to: range.to ? format(range.to, 'yyyy-MM-dd') : undefined,
            })
          }}
          className="col-span-2"
        />
        <Button className="col-span-1 bg-blue-600 text-lg py-5">
          <Link to={'create-sale'}>Buyurtma yaratish</Link>
        </Button>
      </div>
      <div>
        <table className="w-full">
          <thead className="bg-[#F9F9F9] text-[#71717A] text-sm">
            <tr>
              <th className="px-6 py-3 text-center font-medium">
                Buyurtma sanasi
              </th>
              <th className="px-6 py-3 text-center font-medium">
                Buyurtma raqami
              </th>
              <th className="px-6 py-3 text-center font-medium">Mijoz</th>
              <th className="px-6 py-3 text-center font-medium">
                Umumiy to'lov summasi
              </th>
              <th className="px-6 py-3 text-center font-medium">
                To'lov qilingan summa
              </th>
              <th className="px-6 py-3 text-center font-medium">Qarzdorlik</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E4E4E7]">
            {data?.data?.length ? (
              data?.data.map((o) => (
                <tr key={o._id} className="hover:bg-[#F9F9F9]">
                  <td className="px-6 py-4 text-center whitespace-nowrap">
                    <div className="text-sm text-[#18181B]">
                      {o?.created_at
                        ? format(new Date(o.created_at), 'dd.MM.yyyy')
                        : 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center whitespace-nowrap">
                    <div className="text-sm text-[#18181B]">
                      {o?.payments?._id || 'N/A'}
                    </div>
                  </td>

                  <td className="px-6 py-4 text-center whitespace-nowrap">
                    <div className="text-sm text-[#18181B]">
                      {o?.client_id?.username || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center whitespace-nowrap">
                    <div className="text-sm text-[#18181B]">
                      {money(o?.payments?.total_amount)} so'm
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center whitespace-nowrap">
                    <div className="text-sm text-[#18181B]">
                      {money(o?.payments?.paid_amount)} so'm
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center whitespace-nowrap">
                    <div className="text-sm">
                      {money(o?.payments?.debt_amount, 'debt')} so'm
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
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
            itemsPerPage={getAllData.limit || 10} // Set the number of items per page
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
          />
        )}
      </div>
    </div>
  )
}

export default Sale
