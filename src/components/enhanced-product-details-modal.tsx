import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Calendar, Package, Hash, Tag, Image as ImageIcon } from 'lucide-react'
import type { ProductWarehouseItem } from '@/store/product/types'

type EnhancedProductDetailsModalProps = {
  isOpen: boolean
  onClose: () => void
  product: ProductWarehouseItem | null
}

const formatDate = (dateString: Date) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const StatusBadge = ({ status }: { status: string }) => {
  const bgColor =
    status === 'active'
      ? 'bg-green-100 text-green-800'
      : 'bg-gray-100 text-gray-800'
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${bgColor}`}
    >
      {status}
    </span>
  )
}

const SimpleBadge = ({
  children,
  variant = 'default',
}: {
  children: React.ReactNode
  variant?: 'default' | 'outline'
}) => {
  const classes =
    variant === 'outline'
      ? 'border border-gray-300 text-gray-700 bg-white'
      : 'bg-blue-100 text-blue-800'

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${classes}`}
    >
      {children}
    </span>
  )
}

const getCategoryName = (
  categoryId: string | { _id: string; name: string }
): string => {
  if (typeof categoryId === 'object' && categoryId?.name) {
    return categoryId.name
  }
  return String(categoryId) || 'Uncategorized'
}

const formatPrice = (price: number): string => {
  return `${price.toFixed(2)} UZS`
}

export function EnhancedProductDetailsModal({
  isOpen,
  onClose,
  product,
}: EnhancedProductDetailsModalProps) {
  if (!product) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Product Details
            </div>
            <button
              onClick={onClose}
              className="rounded-sm opacity-100 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-0 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
            >
              <span className="sr-only">Close</span>
            </button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Product Header */}
          <div className="flex gap-4">
            <div className="w-32 h-32 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
              {product.product.images?.[0] ? (
                <img
                  src={product.product.images[0]}
                  alt={product.product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <ImageIcon className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <div className="flex-1 space-y-2">
              <h3 className="text-xl font-semibold text-gray-900">
                {product.product.name}
              </h3>
              <p className="text-gray-600">
                {product.product.description || 'No description available'}
              </p>
              <div className="flex items-center gap-2">
                <StatusBadge status={product.product.status} />
                <SimpleBadge variant="outline">
                  {getCategoryName(product.product.category_id)}
                </SimpleBadge>
              </div>
            </div>
          </div>

          <Separator />

          {/* Product Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              {/* Price */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-green-600 font-bold text-sm">$</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Price</p>
                  <p className="text-lg font-semibold text-green-600">
                    {formatPrice(product.product.price)}
                  </p>
                </div>
              </div>

              {/* Stock Count */}
              <div className="flex items-center gap-3">
                <Package className="w-4 h-4 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Stock Count
                  </p>
                  <p className="text-lg font-semibold">
                    {product.product_count} units
                  </p>
                </div>
              </div>

              {/* Barcode */}
              <div className="flex items-center gap-3">
                <Hash className="w-4 h-4 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Barcode</p>
                  <p className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                    {product.product_barcode}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {/* Category */}
              <div className="flex items-center gap-3">
                <Tag className="w-4 h-4 text-orange-600" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Category</p>
                  <p className="text-sm">
                    {getCategoryName(product.product.category_id)}
                  </p>
                  {typeof product.product.category_id === 'object' &&
                    product.product.category_id?.description && (
                      <p className="text-xs text-gray-500">
                        {product.product.category_id.description}
                      </p>
                    )}
                </div>
              </div>

              {/* Created Date */}
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-gray-600" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Created</p>
                  <p className="text-sm">{formatDate(product.created_at)}</p>
                </div>
              </div>

              {/* Last Updated */}
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-gray-600" />
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Last Updated
                  </p>
                  <p className="text-sm">{formatDate(product.updated_at)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Images */}
          {product.product.images && product.product.images.length > 1 && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">
                  Additional Images
                </h4>
                <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                  {product.product.images.slice(1).map((image, index) => (
                    <div
                      key={index}
                      className="aspect-square rounded-lg overflow-hidden bg-gray-100"
                    >
                      <img
                        src={image}
                        alt={`${product.product.name} - ${index + 2}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Source Information */}
          <Separator />
          <div className="text-xs text-gray-500 space-y-1">
            <p>Source: {product.product.from_create || 'WAREHOUSE'}</p>
            <p>Product ID: {product.product._id}</p>
            <p>Warehouse Entry ID: {product._id}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
