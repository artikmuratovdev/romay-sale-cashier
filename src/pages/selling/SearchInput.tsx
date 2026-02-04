import { Input } from '@/components/ui/input'
import { useGetUser } from '@/hooks/useGetUser'
import { useGetProductsInfiniteQuery } from '@/store/product/product.api'
import type { ProductWarehouseItem } from '@/store/product/types'
import { addToAllProduct, addToFilteredProduct } from '@/store/slice/Sale.slice'
import type { RootState } from '@/store/store'
import { Loader2, ScanBarcode } from 'lucide-react'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'sonner'

const SearchInput = memo(() => {
  const [focus, setFocus] = useState(true)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [imageErrors, setImageErrors] = useState<{ [key: string]: boolean }>({})
  const [imageLoadingStates, setImageLoadingStates] = useState<{
    [key: string]: boolean
  }>({})
  const [currentPage, setCurrentPage] = useState(1)
  const [allLoadedProducts, setAllLoadedProducts] = useState<
    ProductWarehouseItem[]
  >([])
  const [hasNextPage, setHasNextPage] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const me = useGetUser()
  const dispatch = useDispatch()

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      // Reset page and products when search changes
      setCurrentPage(1)
      setAllLoadedProducts([])
      setHasNextPage(true)
    }, 300)

    return () => clearTimeout(timer)
  }, [search])

  const shouldRefetch = useSelector(
    (state: RootState) => state.sale.shouldRefetch
  )

  const {
    data: products,
    refetch,
    isLoading,
    error,
    isFetching,
  } = useGetProductsInfiniteQuery(
    {
      branch: me?.branch_id?._id || '',
      page: currentPage,
      limit: 20,
      search: debouncedSearch || undefined,
    },
    {
      skip: !me?.branch_id?._id,
      refetchOnMountOrArgChange: false,
      refetchOnFocus: false,
      refetchOnReconnect: true,
    }
  )

  // Handle products data and pagination
  useEffect(() => {
    if (products?.data && Array.isArray(products.data)) {
      if (currentPage === 1) {
        setAllLoadedProducts(products.data as ProductWarehouseItem[])
      } else {
        setAllLoadedProducts((prev) => {
          const newProducts = products.data as ProductWarehouseItem[]
          const uniqueNewProducts = newProducts.filter(
            (newProduct) =>
              !prev.find(
                (existingProduct) => existingProduct._id === newProduct._id
              )
          )

          const updatedProducts = [...prev, ...uniqueNewProducts]

          // Memory management: Keep only last 500 products to prevent memory leak
          if (updatedProducts.length > 500) {
            return updatedProducts.slice(-300) // Keep last 300 products
          }

          return updatedProducts
        })
      }

      // Check if there are more pages with additional validation
      const hasMore =
        products.next_page !== null && products.data && products.data.length > 0

      setHasNextPage(hasMore)

      // Update Redux store with current products only (not accumulated)
      dispatch(addToAllProduct(products.data as ProductWarehouseItem[]))
    }
  }, [products, dispatch, currentPage])

  // Optimize refetch - only refetch when shouldRefetch changes, not on every render
  useEffect(() => {
    if (shouldRefetch && me?.branch_id?._id) {
      setCurrentPage(1)
      setAllLoadedProducts([])
      setHasNextPage(true)
      refetch()
    }
  }, [shouldRefetch, refetch, me?.branch_id?._id])

  // Load more products function with optimized conditions
  const loadMoreProducts = useCallback(() => {
    if (
      !isLoading &&
      !isFetching &&
      hasNextPage &&
      !isLoadingMore &&
      me?.branch_id?._id
    ) {
      setIsLoadingMore(true)

      setCurrentPage((prev) => {
        const nextPage = prev + 1

        if (nextPage > 50) {
          setHasNextPage(false)
          setIsLoadingMore(false)
          return prev
        }
        return nextPage
      })

      setTimeout(() => {
        setIsLoadingMore(false)
      }, 1500)
    }
  }, [isLoading, isFetching, hasNextPage, isLoadingMore, me?.branch_id?._id])

  // Scroll event listener for infinite scrolling with throttling
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current
    if (!scrollContainer) return

    let scrollTimeout: NodeJS.Timeout | null = null

    const handleScroll = () => {
      // Throttle scroll events to prevent excessive calls
      if (scrollTimeout) return

      scrollTimeout = setTimeout(() => {
        const { scrollTop, scrollHeight, clientHeight } = scrollContainer
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 100 // Increased threshold for better detection
        const hasEnoughItems = allLoadedProducts.length >= 5 // Minimum items to start infinite scroll

        if (
          isNearBottom &&
          hasNextPage &&
          hasEnoughItems &&
          !isLoading &&
          !isFetching &&
          !isLoadingMore &&
          me?.branch_id?._id
        ) {
          loadMoreProducts()
        }

        scrollTimeout = null
      }, 50) // Optimized throttle for better responsiveness
    }

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll)
      if (scrollTimeout) clearTimeout(scrollTimeout)
    }
  }, [
    hasNextPage,
    isLoading,
    isFetching,
    isLoadingMore,
    loadMoreProducts,
    allLoadedProducts.length,
    me?.branch_id?._id,
  ])

  // Get all products from Redux
  const allProductsFromRedux = useSelector(
    (state: RootState) => state.sale.allProducts
  )

  // Get filtered products from Redux to exclude them from search results
  const filteredProductsFromRedux = useSelector(
    (state: RootState) => state.sale.filteredProducts
  )

  // Use loaded products from infinite scroll instead of Redux
  const allProducts = useMemo(() => {
    const productsToUse =
      allLoadedProducts.length > 0
        ? allLoadedProducts
        : allProductsFromRedux || []

    return productsToUse.filter((p) => {
      // Filter out products with 0 or less quantity
      if (p.product_count <= 0) {
        return false
      }

      // First check if product is already in filtered products (cart)
      const isAlreadySelected = filteredProductsFromRedux.some(
        (filtered) => filtered._id === p._id
      )

      if (isAlreadySelected) {
        return false
      }
      return true
    })
  }, [allLoadedProducts, allProductsFromRedux, filteredProductsFromRedux])

  const handleProductSelect = (product: ProductWarehouseItem) => {
    if (product.product_count <= 0) {
      toast.error('Mahsulot mavjud emas')
      return
    }
    dispatch(addToFilteredProduct(product))
    setSearch('')
    setFocus(true)
    if (inputRef.current) {
      inputRef.current.blur()
    }
  }

  const focusInput = () => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  const handleBarcodeClick = () => {
    focusInput()
  }

  // Handle image error
  const handleImageError = useCallback((productId: string) => {
    setImageErrors((prev) => ({ ...prev, [productId]: true }))
    setImageLoadingStates((prev) => ({ ...prev, [productId]: false }))
  }, [])

  // Handle image load start
  const handleImageLoadStart = useCallback((productId: string) => {
    setImageLoadingStates((prev) => ({ ...prev, [productId]: true }))
  }, [])

  // Handle image load success
  const handleImageLoadSuccess = useCallback((productId: string) => {
    setImageLoadingStates((prev) => ({ ...prev, [productId]: false }))
    setImageErrors((prev) => ({ ...prev, [productId]: false }))
  }, [])

  // Handle network errors and retry logic
  useEffect(() => {
    if (error && !isLoading) {
      toast.error('Mahsulotlarni yuklashda xatolik yuz berdi')

      const retryTimeout = setTimeout(() => {
        if (me?.branch_id?._id) {
          refetch()
        }
      }, 3000)

      return () => clearTimeout(retryTimeout)
    }
  }, [error, isLoading, refetch, me?.branch_id?._id])

  // Show loading state
  if ((isLoading && currentPage === 1) || error) {
    return (
      <div className="w-full relative">
        <div className="relative w-full">
          <Input
            placeholder={
              error
                ? "Xatolik yuz berdi. Qayta urinib ko'ring..."
                : isLoading
                  ? 'Mahsulotlar yuklanmoqda...'
                  : undefined
            }
            className="pr-10"
            disabled
          />
          <ScanBarcode
            size={24}
            className="absolute right-2 top-2 cursor-pointer opacity-50"
            color="#71717A"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="w-full relative">
      <div className="relative w-full">
        <Input
          ref={inputRef}
          placeholder="Mahsulot nomi yoki barkodini kiriting"
          className="pr-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => setFocus(false)}
          onBlur={() => setTimeout(() => setFocus(true), 150)}
        />
        <ScanBarcode
          size={24}
          className="absolute right-2 top-2 cursor-pointer"
          color="#71717A"
          onClick={handleBarcodeClick}
        />
      </div>
      <div
        className={`absolute bg-white top-12 border-2 w-full rounded-lg z-50 shadow-lg ${focus && 'hidden'}`}
      >
        {/* Desktop table header */}
        <table className="w-full hidden md:table">
          <thead className="text-[#71717A] text-sm border-b w-full flex justify-between sticky top-0 bg-white">
            <tr className="w-full grid grid-cols-5">
              <th className="px-7 py-3 text-left font-medium"></th>
              <th className="px-7 py-3 text-center font-medium">Nomi</th>
              <th className="px-7 py-3 text-center font-medium">Barcode</th>
              <th className="px-7 py-3 text-center font-medium">Narx</th>
              <th className="px-7 py-3 text-right font-medium">Soni</th>
            </tr>
          </thead>
        </table>

        {/* Mobile header */}
        <div className="md:hidden sticky top-0 bg-white border-b px-4 py-3">
          <h3 className="text-sm font-medium text-[#71717A]">Mahsulotlar</h3>
        </div>

        <div ref={scrollContainerRef} className="max-h-80 overflow-y-auto">
          {/* Desktop table */}
          <table className="w-full hidden md:table">
            <tbody className="text-[#71717A] text-sm bg-white">
              {allProducts?.length > 0 ? (
                <>
                  {allProducts.map((p) => (
                    <tr
                      key={p._id}
                      className="w-full grid grid-cols-5 cursor-pointer hover:bg-gray-50 border-b border-gray-100"
                      onMouseDown={() => handleProductSelect(p)}
                    >
                      <td className="px-7 py-3 text-left font-medium">
                        <div className="relative w-12 h-12">
                          {imageLoadingStates[p._id] && (
                            <div className="absolute inset-0 bg-gray-200 animate-pulse rounded"></div>
                          )}
                          <img
                            className="aspect-square w-full h-full object-cover rounded border border-gray-200"
                            src={
                              imageErrors[p._id] || !p.product?.images?.[0]
                                ? '/no_product.jpg'
                                : p.product.images[0]
                            }
                            alt={p.product?.name || 'Product'}
                            onLoadStart={() => handleImageLoadStart(p._id)}
                            onLoad={() => handleImageLoadSuccess(p._id)}
                            onError={() => handleImageError(p._id)}
                            loading="lazy"
                          />
                        </div>
                      </td>
                      <td className="px-7 py-3 text-center font-medium">
                        {p.product?.name || 'N/A'}
                      </td>
                      <td className="px-7 py-3 text-center font-medium">
                        {p.product?.barcode || '-'}
                      </td>
                      <td className="px-7 py-3 text-center font-medium">
                        {p.product?.price || 0}
                      </td>
                      <td
                        className={`px-7 py-3 ${p.product_count === 0 && 'text-red-500'} text-right font-medium`}
                      >
                        {p.product_count || 0}
                      </td>
                    </tr>
                  ))}

                  {/* Loading indicator for infinite scroll */}
                  {(isFetching || isLoadingMore) && hasNextPage && (
                    <tr className="w-full">
                      <td colSpan={5} className="px-7 py-4 text-center">
                        <div className="flex items-center justify-center space-x-2 text-gray-500">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Ko'proq mahsulotlar yuklanmoqda...</span>
                        </div>
                      </td>
                    </tr>
                  )}

                  {/* End of results indicator */}
                  {!hasNextPage && allProducts.length > 0 && (
                    <tr className="w-full">
                      <td
                        colSpan={5}
                        className="px-7 py-4 text-center text-gray-400 text-sm"
                      >
                        Barcha mahsulotlar yuklandi
                      </td>
                    </tr>
                  )}
                </>
              ) : (
                <tr className="w-full">
                  <td
                    colSpan={5}
                    className="px-7 py-6 text-center text-gray-500"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Mahsulotlar yuklanmoqda...</span>
                      </div>
                    ) : debouncedSearch ? (
                      'Hech qanday mahsulot topilmadi'
                    ) : (
                      'Mahsulotlar mavjud emas'
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Mobile card layout */}
          <div className="md:hidden">
            {allProducts?.length > 0 ? (
              <>
                {allProducts.map((p) => (
                  <div
                    key={p._id}
                    className="cursor-pointer hover:bg-gray-50 border-b border-gray-100 p-4"
                    onTouchStart={() => handleProductSelect(p)}
                    onClick={() => handleProductSelect(p)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative w-16 h-16 flex-shrink-0">
                        {imageLoadingStates[p._id] && (
                          <div className="absolute inset-0 bg-gray-200 animate-pulse rounded"></div>
                        )}
                        <img
                          className="aspect-square w-full h-full object-cover rounded border border-gray-200"
                          src={
                            imageErrors[p._id] || !p.product?.images?.[0]
                              ? '/no_product.jpg'
                              : p.product.images[0]
                          }
                          alt={p.product?.name || 'Product'}
                          onLoadStart={() => handleImageLoadStart(p._id)}
                          onLoad={() => handleImageLoadSuccess(p._id)}
                          onError={() => handleImageError(p._id)}
                          loading="lazy"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 text-sm mb-1 line-clamp-2">
                          {p.product?.name || 'N/A'}
                        </h4>
                        <div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-2">
                          <span className="bg-gray-100 px-2 py-1 rounded">
                            {p.product?.barcode || "Barcode yo'q"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-green-600 text-sm">
                            {p.product?.price?.toLocaleString() || 0} UZS
                          </span>
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                              p.product_count > 10
                                ? 'bg-green-100 text-green-800'
                                : p.product_count > 0
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                            }`}
                          >
                            Qoldiq: {p.product_count || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Mobile loading indicator */}
                {(isFetching || isLoadingMore) && hasNextPage && (
                  <div className="px-4 py-4 text-center">
                    <div className="flex items-center justify-center space-x-2 text-gray-500">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Ko'proq mahsulotlar yuklanmoqda...</span>
                    </div>
                  </div>
                )}

                {/* Mobile end of results indicator */}
                {!hasNextPage && allProducts.length > 0 && (
                  <div className="px-4 py-4 text-center text-gray-400 text-sm">
                    Barcha mahsulotlar yuklandi
                  </div>
                )}
              </>
            ) : (
              <div className="px-4 py-6 text-center text-gray-500">
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Mahsulotlar yuklanmoqda...</span>
                  </div>
                ) : debouncedSearch ? (
                  'Hech qanday mahsulot topilmadi'
                ) : (
                  'Mahsulotlar mavjud emas'
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
})

SearchInput.displayName = 'SearchInput'

export default SearchInput
