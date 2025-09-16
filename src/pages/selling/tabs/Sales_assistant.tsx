import { TablePagination } from '@/components/TablePagination'
import { Input } from '@/components/ui/input'
import { useGetUser } from '@/hooks/useGetUser'
import { useGetAllAssistantQuery } from '@/store/sales/salesApi'
import { format } from 'date-fns'
import { useState } from 'react'

const Sales_assistant = () => {
  const me = useGetUser()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)

  const { data } = useGetAllAssistantQuery({
    branch_id: me?.branch_id._id,
    page,
    limit,
    search,
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
      <div className="mb-4 grid grid-cols-5 items-center gap-4">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="col-span-3"
          placeholder="Qidiruv..."
        />
      </div>
      <div>
        <table className="w-full">
          <thead className="bg-[#F9F9F9] text-[#71717A] text-sm">
            <tr>
              <th className="py-3 text-center font-medium">Ismi</th>
              <th className="py-3 text-center font-medium">Telefon</th>
              <th className="py-3 text-center font-medium">Tavsif</th>
              <th className="py-3 text-center font-medium">Manzil</th>
              <th className="py-3 text-center font-medium">Barcha sotuvlar</th>
              <th className="py-3 text-center font-medium">Qo'shilgan sana</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E4E4E7]">
            {data?.data?.length ? (
              data?.data.map((o) => (
                <tr key={o._id} className="hover:bg-[#F9F9F9]">
                  <td className="px-6 py-4 text-center whitespace-nowrap">
                    <div className="text-sm text-[#18181B]">
                      {o.username || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center whitespace-nowrap">
                    <div className="text-sm text-[#18181B]">
                      {o.phone || 'N/A'}
                    </div>
                  </td>

                  <td className="px-6 py-4 text-center whitespace-nowrap">
                    <div className="text-sm text-[#18181B]">
                      {o.description || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center whitespace-nowrap">
                    <div className="text-sm text-[#18181B]">
                      {o.address || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center whitespace-nowrap">
                    <div className="text-sm text-[#18181B]">
                      {o?.total_sales.amount}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center whitespace-nowrap">
                    <div className="text-sm">
                      {o?.created_at
                        ? format(new Date(o.created_at), 'dd.MM.yyyy HH:mm')
                        : 'N/A'}
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

export default Sales_assistant
