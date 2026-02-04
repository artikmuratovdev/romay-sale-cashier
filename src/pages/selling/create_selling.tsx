import { useHandleRequest } from '@/hooks/use-handle-request'
import { useGetUser } from '@/hooks/useGetUser'
import { useCreateSaleMutation } from '@/store/sales/salesApi'
import type { CreateSale } from '@/store/sales/types'
import { resetSaleData, triggerRefetch } from '@/store/slice/Sale.slice'
import type { RootState } from '@/store/store'
import { Check, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { AssistantCombobox } from './AssistentCombobox'
import { ClientCombobox } from './ClientCombobox'
import SearchInput from './SearchInput'
import Sale_Table from './Table'

export type Product = {
  id: string
  name: string
  price: number
  qty: number
  img: string
  stock: number
  barcode: string
}

// Validation errors state type
type ValidationErrors = {
  products: boolean
  client: boolean
  assistant: boolean
  payment: boolean
  comment: boolean
}

export default function Create_selling() {
  const [products, setProducts] = useState<Product[]>([])
  const dispatch = useDispatch()
  const handleRequest = useHandleRequest()
  const [createSale] = useCreateSaleMutation()
  const me = useGetUser()
  const navigate = useNavigate()

  const ClientId = useSelector((state: RootState) => state.sale.client)
  const AssistantId = useSelector((state: RootState) => state.sale.assistant)

  const [payment, setPayment] = useState(0)
  const [comment, setComment] = useState('')

  // Validation errors state
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({
    products: false,
    client: false,
    assistant: false,
    payment: false,
    comment: false,
  })

  const [date, setDate] = useState(new Date())

  useEffect(() => {
    const intervalId = setInterval(() => {
      setDate(new Date())
    }, 1000)

    return () => clearInterval(intervalId)
  }, [])

  const { filteredProducts } = useSelector((state: RootState) => state.sale)
  const total = filteredProducts.reduce(
    (sum, p) => sum + (p.customPrice || p.product.price) * p.qty,
    0
  )

  // Check if any product price has been changed
  const hasPriceChanged = filteredProducts.some(
    (p) => p.customPrice && p.customPrice !== p.product.price
  )

  useEffect(() => {
    if (filteredProducts) {
      const productsInfo = filteredProducts.map((p) => ({
        id: p._id,
        name: p.product.name,
        price: p.product.price,
        qty: 1,
        img: p.product.images?.[0] || '/package.svg',
        stock: p.product_count,
        barcode: p.product_barcode,
      }))
      setProducts(productsInfo)
    }
  }, [filteredProducts])

  const resetSaleDataLocal = () => {
    setPayment(0)
    setComment('')
    setProducts([])
    setValidationErrors({
      products: false,
      client: false,
      assistant: false,
      payment: false,
      comment: false,
    })
    dispatch(resetSaleData())
  }

  const validateSale = (): ValidationErrors => {
    const isPriceChanged = filteredProducts.some(
      (p) => p.customPrice && p.customPrice !== p.product.price
    )

    const errors: ValidationErrors = {
      products: !filteredProducts || filteredProducts.length === 0,
      client: false,
      assistant: !AssistantId,
      payment: payment <= 0,
      comment: isPriceChanged && !comment.trim(),
    }

    return errors
  }

  // Clear specific validation error when user starts fixing it
  useEffect(() => {
    if (filteredProducts && filteredProducts.length > 0) {
      setValidationErrors((prev) => ({ ...prev, products: false }))
    }
  }, [filteredProducts])

  useEffect(() => {
    if (ClientId) {
      setValidationErrors((prev) => ({ ...prev, client: false }))
    }
  }, [ClientId])

  useEffect(() => {
    if (AssistantId) {
      setValidationErrors((prev) => ({ ...prev, assistant: false }))
    }
  }, [AssistantId])

  useEffect(() => {
    if (payment > 0) {
      setValidationErrors((prev) => ({ ...prev, payment: false }))
    }
  }, [payment])

  useEffect(() => {
    if (comment.trim()) {
      setValidationErrors((prev) => ({ ...prev, comment: false }))
    }
  }, [comment])

  const sendItems = async () => {
    const errors = validateSale()

    const hasErrors = Object.values(errors).some((error) => error)

    if (hasErrors) {
      setValidationErrors(errors)
      return
    }

    if (filteredProducts) {
      const data: CreateSale = {
        branch_id: me?.branch_id?._id as string,
        cashier_id: me?._id as string,
        sales_assistant_id: AssistantId as string,
        comment: comment || undefined,
        items: filteredProducts.map((p) => ({
          product_id: p._id,
          quantity: p.qty,
          price: p.customPrice || p.product.price,
        })),
        paid_amount: payment,
      }
      if (ClientId) {
        data.client_id = ClientId as string
      }
      console.log(data)

      await handleRequest({
        request: () => createSale(data).unwrap(),
        onSuccess: (data) => {
          toast.success(
            data.msg || data.message || 'Sotuv muvaffaqiyatli yaratildi!'
          )
          resetSaleDataLocal()
          dispatch(triggerRefetch())
          navigate('/selling')
        },
        onError: (err) => {
          toast.error(err.data.error.msg)
        },
      })
    }
  }

  return (
    <div className="px-2 sm:px-4 md:px-0">
      <div className="flex items-center gap-2 sm:gap-4 mb-4">
        <SearchInput />
      </div>

      {products.length > 0 ? (
        <div
          className={`border rounded-lg overflow-x-auto bg-white shadow-sm ${
            validationErrors.products ? 'border-red-500' : 'border-[#E4E4E7]'
          }`}
        >
          <Sale_Table />
        </div>
      ) : (
        <Card
          className={`${validationErrors.products ? 'border-red-500' : ''} bg-white`}
        >
          <div className=" px-4 flex items-center justify-center flex-col">
            <div className="mb-2 w-20 h-20 sm:w-30 sm:h-30 bg-gray-100 rounded-full flex items-center justify-center">
              <img
                src="/empty.svg"
                alt="Empty state"
                className="w-16 h-16 sm:w-24 sm:h-24"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                  e.currentTarget.parentElement!.innerHTML = `
                    <svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l-1 10H6L5 9z"></path>
                    </svg>
                  `
                }}
              />
            </div>
            <h2 className="text-lg sm:text-xl font-semibold text-slate-800 mb-2 text-center">
              Hozircha mahsulotlar yo'q
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 text-center max-w-sm px-4">
              Yuqoridagi qidiruv orqali mahsulotlarni qo'shing va ular bu yerda
              ko'rinadi
            </p>
            {validationErrors.products && (
              <p className="text-red-500 text-xs sm:text-sm mt-4 bg-red-50 px-4 py-2 rounded-md text-center">
                ⚠️ Kamida bitta mahsulot qo'shing
              </p>
            )}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mt-4 sm:mt-6 lg:mt-8">
        <Card className="py-6 md:py-0">
          <CardContent className="flex flex-col gap-3 sm:gap-4 sm:p-6">
            <div className="flex flex-col gap-2">
              <Label className="text-sm sm:text-base">Mijoz (ixtiyoriy)</Label>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <ClientCombobox />
                </div>
                {ClientId && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => dispatch(resetSaleData())}
                    className="shrink-0"
                  >
                    <X className="text-red-500 w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label
                className={`text-sm sm:text-base ${validationErrors.assistant ? 'text-red-500' : ''}`}
              >
                Assistent {validationErrors.assistant && '*'}
              </Label>
              <div className="flex items-center gap-2">
                <div
                  className={`flex-1 ${
                    validationErrors.assistant
                      ? 'border-red-500 rounded-md border'
                      : ''
                  }`}
                >
                  <AssistantCombobox />
                </div>
                {AssistantId && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => dispatch(resetSaleData())}
                    className="shrink-0"
                  >
                    <X className="text-red-500 w-4 h-4" />
                  </Button>
                )}
              </div>
              {validationErrors.assistant && (
                <p className="text-red-500 text-xs sm:text-[14px]">
                  Assistentni tanlang
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label
                className={`text-sm sm:text-base ${validationErrors.payment ? 'text-red-500' : ''}`}
              >
                Naqd {validationErrors.payment && '*'}
              </Label>
              <div className="relative">
                <Input
                  className={`py-2 px-3 pr-12 sm:pr-10 text-sm sm:text-base ${
                    validationErrors.payment
                      ? 'border-red-500 focus-visible:ring-red-500'
                      : ''
                  }`}
                  placeholder="0"
                  type="text"
                  value={payment === 0 ? '' : payment.toLocaleString()}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^\d]/g, '')
                    setPayment(value ? Number(value) : 0)
                  }}
                />
                <span className="absolute right-2 top-[10px] text-xs sm:text-[14px] text-[#71717A]">
                  UZS
                </span>
              </div>
              {validationErrors.payment && (
                <p className="text-red-500 text-xs sm:text-[14px]">
                  To'lov miqdorini kiriting
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label
                className={`text-sm sm:text-base ${
                  hasPriceChanged && validationErrors.comment
                    ? 'text-red-500'
                    : ''
                }`}
              >
                Izoh{' '}
                {hasPriceChanged ? (
                  <span className="text-red-500">*</span>
                ) : (
                  '(ixtiyoriy)'
                )}
              </Label>
              <Input
                className={`py-2 px-3 text-sm sm:text-base ${
                  hasPriceChanged && validationErrors.comment
                    ? 'border-red-500 focus-visible:ring-red-500 shadow-[0_0_0_3px_rgba(239,68,68,0.1)]'
                    : ''
                }`}
                placeholder="Sotuv haqida qo'shimcha izoh..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
              {hasPriceChanged && validationErrors.comment && (
                <p className="text-red-500 text-xs sm:text-[14px]">
                  Narx o'zgarganda izoh kiritish majburiy
                </p>
              )}
            </div>
          </CardContent>
        </Card>
        <Card className="py-6 md:py-0">
          <CardContent className="flex flex-col gap-4 sm:gap-6 p-4 sm:p-6">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-sm sm:text-base">
                <span>Sana: </span>
                <span className="text-xs sm:text-sm">
                  {date.toLocaleDateString()} {date.toLocaleTimeString()}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm sm:text-base">
                <span>Naqd: </span>
                <span className="text-xs sm:text-sm">
                  {payment.toLocaleString()} UZS
                </span>
              </div>
            </div>
            <div>
              <div className="text-lg sm:text-[20px] font-semibold flex items-center justify-between">
                <span>Jami:</span>
                <span className="text-base sm:text-[20px]">
                  {total.toLocaleString()} UZS
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <span className="hidden sm:block"></span>
              <Button
                className="bg-green-700 text-white w-full text-sm sm:text-base"
                onClick={sendItems}
              >
                <Check size={16} className="mr-2" /> {"To'lov qilish"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
