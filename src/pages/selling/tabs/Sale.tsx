import { TablePagination } from '@/components/TablePagination'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useGetUser } from '@/hooks/useGetUser'
import { useGetAllSalesQuery } from '@/store/sales/salesApi'
import { addDays, format } from 'date-fns'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import DatePicker from '../components/DatePicker'
import money from '../components/money'

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
      <div className="mb-6 space-y-4">
        {/* Title and Create Button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl sm:text-[26px] max-sm:mx-auto lg:text-[30px] font-semibold text-[#09090B]">
            Buyurtmalar
          </h1>
          <Link to={'create-sale'} className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto hover:bg-white hover:text-blue-600 border-2 border-transparent bg-blue-600 text-sm sm:text-base lg:text-lg py-2.5 sm:py-3 px-4">
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
                Buyurtma sanasi
              </th>
              <th className="px-6 py-3 text-center font-medium">
                Buyurtma raqami
              </th>
              <th className="px-6 py-3 text-center font-medium">Mijoz</th>
              <th className="px-6 py-3 text-center font-medium">Sotuvchi</th>
              <th className="px-6 py-3 text-center font-medium">Qarzdorlik</th>
              <th className="px-6 py-3 text-center font-medium">
                Umumiy to'lov summasi
              </th>
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
                      {o.sales_assistant_id.username}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center whitespace-nowrap">
                    <div className="text-sm">
                      {money(o?.payments?.debt_amount, 'debt')} so'm
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center whitespace-nowrap">
                    <div className="text-sm text-[#18181B]">
                      {money(o?.payments?.total_amount)} so'm
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
            itemsPerPage={getAllData.limit || 10}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
          />
        )}
      </div>
    </div>
  )
}

export default Sale
