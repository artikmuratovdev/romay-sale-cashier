import { EnhancedProductDetailsModal } from '@/components/enhanced-product-details-modal'
import { TablePagination } from '@/components/TablePagination'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useGetUser } from '@/hooks/useGetUser'
import { useGetAllProductsQuery } from '@/store/product/product.api'
import type { ProductWarehouseItem } from '@/store/product/types'
import { LayoutGrid, List, Search } from 'lucide-react'
import { useMemo, useState } from 'react'

function ProductPage() {
  const me = useGetUser()
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [search, setSearch] = useState('')

  const {
    data: getAllProductsData,
    isLoading,
    isFetching,
  } = useGetAllProductsQuery({
    branch: me?.branch_id._id,
    page,
    limit,
    search,
  })

  const formatUsd = (value: string, currency: string = 'USD') => {
    const num = Number(String(value).replace(/[^0-9]/g, '')) || 0
    return num.toLocaleString('ru-RU') + ' ' + currency
  }

  const getCategoryName = (
    categoryId: string | { _id: string; name: string }
  ): string => {
    if (typeof categoryId === 'object' && categoryId?.name) {
      return categoryId.name
    }
    return String(categoryId) || '—'
  }

  const [view, setView] = useState<'list' | 'grid'>('list')
  const [selectedProduct, setSelectedProduct] =
    useState<ProductWarehouseItem | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const productsData = getAllProductsData?.data || []

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  const handleItemsPerPageChange = (itemsPerPage: number) => {
    setLimit(itemsPerPage)
    setPage(1) // Reset to first page when items per page changes
  }

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPage(1) // Reset to first page when searching
  }

  // Filter products based on search input (client-side filtering if API doesn't support search)
  const filteredProducts = useMemo(() => {
    if (!productsData) return []

    if (!search.trim()) {
      return productsData
    }

    const searchTerm = search.toLowerCase().trim()

    return productsData.filter((product) => {
      const productName = (product.product?.name || '').toLowerCase()
      const productDescription = (
        product.product?.description || ''
      ).toLowerCase()
      const productBarcode = (product.product_barcode || '').toLowerCase()
      const categoryName = getCategoryName(
        product.product?.category_id
      ).toLowerCase()
      const productPrice = (product.product?.price || 0).toString()

      return (
        productName.includes(searchTerm) ||
        productDescription.includes(searchTerm) ||
        productBarcode.includes(searchTerm) ||
        categoryName.includes(searchTerm) ||
        productPrice.includes(searchTerm)
      )
    })
  }, [productsData, search])

  const handleProductClick = (product: ProductWarehouseItem) => {
    setSelectedProduct(product)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedProduct(null)
  }

  // Helper function to truncate text intelligently
  const truncateText = (text: string, maxLength: number) => {
    if (!text || text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  // Helper function to truncate product name by words
  const truncateProductName = (name: string) => {
    if (!name) return "Noma'lum mahsulot"
    if (name.length <= 25) {
      return name
    }
    const truncated = name.slice(0, 25)
    return truncated + '...'
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-[30px] font-semibold text-[#09090B]">
            Mahsulotlar
          </h1>
          <div className="flex items-center gap-3">
            <div className="ml-2 flex rounded-md border border-[#E4E4E7] overflow-hidden">
              <Button
                variant={view === 'list' ? 'secondary' : 'ghost'}
                size="icon"
                className="rounded-none"
                onClick={() => setView('list')}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={view === 'grid' ? 'secondary' : 'ghost'}
                size="icon"
                className="rounded-none"
                onClick={() => setView('grid')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9 w-full"
              placeholder="Mahsulot nomi, bar-kod, kategoriya bo'yicha qidirish..."
            />
          </div>
        </div>

        {view === 'list' ? (
          <div className="border border-[#E4E4E7] rounded-lg overflow-x-auto">
            <table className="w-full min-w-[900px] table-fixed">
              <colgroup>
                <col className="w-[30%]" />
                <col className="w-[12%]" />
                <col className="w-[15%]" />
                <col className="w-[15%]" />
                <col className="w-[13%]" />
                <col className="w-[15%]" />
              </colgroup>
              <thead className="bg-[#F9F9F9] text-[#71717A] text-sm">
                <tr>
                  <th className="px-6 py-3 text-left font-medium">Mahsulot</th>
                  <th className="px-6 py-3 text-center font-medium">Status</th>
                  <th className="px-6 py-3 text-center font-medium">
                    Kategoriya
                  </th>
                  <th className="px-6 py-3 text-center font-medium">Bar-kod</th>
                  <th className="px-6 py-3 text-center font-medium">Narxi</th>
                  <th className="px-6 py-3 text-center font-medium">Tasnifi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E4E7]">
                {isLoading || (isFetching && !getAllProductsData?.data) ? (
                  // Loading skeleton
                  Array.from({ length: 5 }).map((_, index) => (
                    <tr key={`loading-${index}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-gray-200 rounded animate-pulse"></div>
                          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="h-4 w-20 mx-auto bg-gray-200 rounded animate-pulse"></div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="h-4 w-24 mx-auto bg-gray-200 rounded animate-pulse"></div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="h-4 w-20 mx-auto bg-gray-200 rounded animate-pulse"></div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="h-4 w-28 mx-auto bg-gray-200 rounded animate-pulse"></div>
                      </td>
                    </tr>
                  ))
                ) : filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => (
                    <tr
                      key={product._id}
                      className="hover:bg-[#F9F9F9] cursor-pointer"
                      onClick={() => handleProductClick(product)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 bg-gray-100 rounded-md border border-gray-200 flex items-center justify-center overflow-hidden">
                            {product.product?.images?.[0] ? (
                              <img
                                src={product.product.images[0]}
                                alt={product.product?.name || 'Product'}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = '/package.svg'
                                }}
                                loading="lazy"
                              />
                            ) : (
                              <img
                                src="/package.svg"
                                alt="Default product"
                                className="w-8 h-8 text-gray-400"
                              />
                            )}
                          </div>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-[#18181B] leading-5 font-sans">
                                  {truncateProductName(product.product?.name)}
                                </div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent
                              side="top"
                              className="max-w-xs p-1.5 text-sm font-sans bg-gray-900 text-white border-gray-700"
                            >
                              <p className="break-words">
                                {product.product?.name || "Noma'lum mahsulot"}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {(product.product_count || 0) > 0 ? (
                          <span className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">
                            mavjud ({product.product_count || 0})
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">
                            qolmagan
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="inline-flex items-center px-2 py-1 text-xs rounded-md bg-[#F4F4F5] text-[#18181B] max-w-full">
                          <span className="truncate">
                            {truncateText(
                              getCategoryName(product.product?.category_id),
                              15
                            )}
                          </span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="inline-flex items-center px-2 py-1 text-xs rounded-md border border-[#E4E4E7] text-[#18181B] max-w-full">
                          <span className="truncate font-mono">
                            {truncateText(product.product_barcode || '—', 12)}
                          </span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm font-semibold text-[#18181B]">
                          {formatUsd(
                            (product.product?.price || 0) + '',
                            product.product?.currency || 'UZS'
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                            <div
                              className="text-xs text-[#71717A] max-w-full px-2"
                            >
                              {truncateText(
                                product.product?.description || '—',
                                30
                              )}
                            </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      {search
                        ? "Qidiruv bo'yicha mahsulot topilmadi"
                        : 'Mahsulotlar mavjud emas'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {isLoading || (isFetching && !getAllProductsData?.data) ? (
                // Grid loading skeleton
                Array.from({ length: 8 }).map((_, index) => (
                  <Card
                    key={`loading-${index}`}
                    className="overflow-hidden border border-[#E4E4E7] rounded-xl"
                  >
                    <CardContent className="p-3">
                      <div className="w-full h-36 bg-gray-200 rounded animate-pulse"></div>
                      <div className="mt-3">
                        <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                      <div className="mt-2">
                        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                      <div className="mt-1">
                        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                      <div className="mt-2">
                        <div className="h-6 w-28 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : filteredProducts.length > 0 ? (
                filteredProducts.map((product, idx) => (
                  <Card
                    key={`${product._id}-${idx}`}
                    className="overflow-hidden border border-[#E4E4E7] rounded-xl cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleProductClick(product)}
                  >
                    <CardContent className="p-3">
                      <div className="w-full h-36 flex items-center justify-center bg-gray-50 rounded-md border border-gray-200 overflow-hidden">
                        <img
                          src={product.product.images?.[0] || '/package.svg'}
                          alt={product.product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = '/package.svg'
                          }}
                          loading="lazy"
                        />
                      </div>
                      <div className="mt-3">
                        <span className="inline-flex items-center px-2.5 py-1 text-xs rounded-md bg-orange-50 text-orange-600 border border-orange-100">
                          {getCategoryName(product.product.category_id)}
                        </span>
                      </div>
                      <div className="mt-2 text-base font-semibold leading-5 text-[#18181B] line-clamp-2">
                        {product.product.name}
                      </div>
                      <div className="text-sm text-[#71717A] mt-1">
                        {product.product.description ||
                          product.product_barcode ||
                          '—'}
                      </div>
                      <div className="mt-2 text-xl font-bold text-[#09090B]">
                        {formatUsd(product.product.price + '')}
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full text-center py-8 text-gray-500">
                  {search
                    ? "Qidiruv bo'yicha mahsulot topilmadi"
                    : 'Mahsulotlar mavjud emas'}
                </div>
              )}
            </div>
          </div>
        )}
        {getAllProductsData && (
          <TablePagination
            currentPage={getAllProductsData.current_page || 1}
            totalPages={getAllProductsData.page_count || 1}
            totalItems={getAllProductsData.after_filtering_count || 0}
            itemsPerPage={getAllProductsData.current_limit || 10}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
          />
        )}

        <EnhancedProductDetailsModal
          isOpen={isModalOpen}
          onClose={closeModal}
          product={selectedProduct}
        />
      </div>
    </TooltipProvider>
  )
}

export default ProductPage
