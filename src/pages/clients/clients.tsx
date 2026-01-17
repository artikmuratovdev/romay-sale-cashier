import { TablePagination } from '@/components/TablePagination'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useGetClientsQuery } from '@/store/clients/clients.api'
import { formatPhone } from '@/utils/formatPhone'
import { AlertCircle } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TableSkeleton } from '../../components/ui/table-skeleton'
import money from '../selling/components/money'
import AddClientDialog from './AddClientDialog'

function Clients() {
  const [currentPage, setCurrentPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [search, setSearch] = useState('')

  const { data, isLoading, isError } = useGetClientsQuery({
    page: currentPage,
    limit: limit,
    search: search,
  })

  const navigate = useNavigate()
  const clientsData = data?.data || []
  const pagination = data?.pagination

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleItemsPerPageChange = (itemsPerPage: number) => {
    setLimit(itemsPerPage)
    setCurrentPage(1)
  }

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setCurrentPage(1)
  }
  const [open, setOpen] = useState(false)

  return (
    <div className="space-y-6">
      <div className="mb-6 space-y-4">
        {/* Title and Add Client Button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl sm:text-[26px] lg:text-[30px] font-semibold text-[#09090B]">
            Mijozlar
          </h1>
          <Button
            onClick={() => setOpen(true)}
            variant="default"
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-sm sm:text-base py-2.5 sm:py-3 px-4"
          >
            Mijoz qo'shish
          </Button>
        </div>

        {/* Search Input */}
        <div className="w-full">
          <Input
            placeholder="Ismi yoki telefon raqami bo'yicha qidiring"
            className="w-full"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
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
          <p className="text-lg text-gray-600">
            {search ? 'Qidiruv natijasi topilmadi' : 'Mijozlar topilmadi'}
          </p>
          <p className="text-gray-500">
            {search
              ? `"${search}" bo'yicha hech qanday mijoz topilmadi`
              : 'Hozircha hech qanday mijoz mavjud emas'}
          </p>
        </div>
      ) : (
        <div className="border border-[#E4E4E7] rounded-lg overflow-x-auto bg-white shadow-sm">
          <table className="w-full min-w-[800px] table-fixed">
            <colgroup>
              <col className="w-[20%]" />
              <col className="w-[18%]" />
              <col className="w-[15%]" />
              <col className="w-[15%]" />
              <col className="w-[15%]" />
              <col className="w-[17%]" />
            </colgroup>
            <thead className="bg-[#F9F9F9] text-[#71717A] text-sm">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Mijoz</th>
                <th className="px-4 py-3 text-center font-medium">Telefon</th>
                <th className="px-4 py-3 text-center font-medium">Kasbi</th>
                <th className="px-4 py-3 text-center font-medium">Qarz</th>
                <th className="px-4 py-3 text-center font-medium">
                  Buyurtmalar
                </th>
                <th className="px-4 py-3 text-center font-medium">Filial</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E4E7]">
              {clientsData?.map((c) => (
                <tr
                  key={c._id}
                  className="hover:bg-[#F9F9F9] cursor-pointer transition-colors"
                  onClick={() => navigate(`client/${c._id}`)}
                >
                  <td className="px-4 py-4">
                    <div className="flex flex-col min-w-0">
                      <div
                        className="text-sm font-medium text-[#18181B] truncate"
                        title={c?.username || "Noma'lum mijoz"}
                      >
                        {c?.username || "Noma'lum mijoz"}
                      </div>
                      {c?.customer_tier && (
                        <div className="text-xs text-gray-500 truncate">
                          {c.customer_tier}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="text-sm text-[#18181B] font-mono">
                      {formatPhone(c?.phone) || '—'}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span
                      className="inline-flex items-center px-2 py-1 text-xs rounded-md bg-blue-50 text-blue-700 border border-blue-200 max-w-full"
                      title={c?.profession || 'Mavjud emas'}
                    >
                      <span className="truncate">
                        {c?.profession?.length > 12
                          ? c.profession.substring(0, 12) + '...'
                          : c?.profession || 'Mavjud emas'}
                      </span>
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="text-sm font-semibold">
                      {money(c?.debt?.total_amount || 0, 'debt', "so'm")}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 font-medium">
                      {c?.sales_count || 0}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span
                      className="text-sm text-[#18181B] truncate block"
                      title={c?.branch_id?.name || "Noma'lum"}
                    >
                      {c?.branch_id?.name?.length > 15
                        ? c.branch_id.name.substring(0, 15) + '...'
                        : c?.branch_id?.name || "Noma'lum"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {pagination && (
        <TablePagination
          currentPage={pagination.page || 1}
          totalPages={pagination.total_pages || 1}
          totalItems={pagination.total || 0}
          itemsPerPage={pagination.limit || 10}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
        />
      )}
      <AddClientDialog open={open} setOpen={setOpen} />
    </div>
  )
}

export default Clients
