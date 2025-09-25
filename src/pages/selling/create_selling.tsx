import { useEffect, useState } from 'react'
import { Input } from '../../components/ui/input'
import { Check, X } from 'lucide-react'
import { Card, CardContent } from '../../components/ui/card'
import { Label } from '../../components/ui/label'
import { Button } from '../../components/ui/button'
import { useDispatch, useSelector } from 'react-redux'
import { resetSaleData, triggerRefetch } from '@/store/slice/Sale.slice'
import { useCreateSaleMutation } from '@/store/sales/salesApi'
import { toast } from 'sonner'
import { useHandleRequest } from '@/hooks/use-handle-request'
import Sale_Table from './Table'
import SearchInput from './SearchInput'
import type { RootState } from '@/store/store'
import { ClientCombobox } from './ClientCombobox'
import { useGetUser } from '@/hooks/useGetUser'
import { AssistantCombobox } from './AssistentCombobox'
import { useNavigate } from 'react-router-dom'
import type { CreateSale } from '@/store/sales/types'

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

  // Validation errors state
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({
    products: false,
    client: false,
    assistant: false,
    payment: false,
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
    (sum, p) => sum + p.product.price * p.qty,
    0
  )

  useEffect(() => {
    if (filteredProducts) {
      const productsInfo = filteredProducts.map((p) => ({
        id: p._id,
        name: p.product.name,
        price: p.product.price,
        qty: 1,
        img: p.product.images[0],
        stock: p.product_count,
        barcode: p.product_barcode,
      }))
      setProducts(productsInfo)
    }
  }, [filteredProducts])

  const resetSaleDataLocal = () => {
    setPayment(0)
    setProducts([])
    setValidationErrors({
      products: false,
      client: false,
      assistant: false,
      payment: false,
    })
    dispatch(resetSaleData())
  }

  const validateSale = (): ValidationErrors => {
    const errors: ValidationErrors = {
      products: !filteredProducts || filteredProducts.length === 0,
      client: false,
      assistant: !AssistantId,
      payment: payment <= 0,
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

  const sendItems = async () => {
    const errors = validateSale()

    const hasErrors = Object.values(errors).some((error) => error)

    if (hasErrors) {
      setValidationErrors(errors)
      return
    }

    if (filteredProducts) {
      const data: CreateSale = {
        branch_id: me?.branch_id._id as string,
        cashier_id: me?._id as string,
        sales_assistant_id: AssistantId as string,
        items: filteredProducts.map((p) => ({
          product_id: p._id,
          quantity: p.qty,
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
    <div>
      <div className="flex items-center gap-4 mb-4">
        <SearchInput />
      </div>

      {products.length > 0 ? (
        <div
          className={`border rounded-lg overflow-hidden ${
            validationErrors.products ? 'border-red-500' : 'border-[#E4E4E7]'
          }`}
        >
          <Sale_Table />
        </div>
      ) : (
        <Card className={validationErrors.products ? 'border-red-500' : ''}>
          <div className="py-7 flex items-center justify-center flex-col">
            <div className="mb-4">
              <img src="/empty.svg" alt="" />
            </div>
            <h2 className="text-[20px] font-semibold text-slate-800">
              Hozircha mahsulotlar yo'q
            </h2>
            <p className="text-[14px] text-slate-600">
              Mahsulotlar kiritilishi bilan bu yerda ko'rinadi
            </p>
            {validationErrors.products && (
              <p className="text-red-500 text-sm mt-2">
                Kamida bitta mahsulot qo'shing
              </p>
            )}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-8 mt-8">
        <Card>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label>Mijoz (ixtiyoriy)</Label>
              <div className="flex items-center gap-2">
              <div className="flex-1">
                <ClientCombobox />
              </div>
              {ClientId && (
                <Button
                variant="outline"
                size="sm"
                onClick={() => dispatch(resetSaleData())}
                >
                <X className='text-red-500' />
                </Button>
              )}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label
              className={validationErrors.assistant ? 'text-red-500' : ''}
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
                >
                <X className='text-red-500' />
                </Button>
              )}
              </div>
              {validationErrors.assistant && (
                <p className="text-red-500 text-[14px]">Assistentni tanlang</p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label className={validationErrors.payment ? 'text-red-500' : ''}>
                Naqd {validationErrors.payment && '*'}
              </Label>
              <div className="relative">
                <Input
                  className={`py-2 px-3 pr-10 ${
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
                <span className="absolute right-2 top-[10px] text-[14px] text-[#71717A]">
                  UZS
                </span>
              </div>
              {validationErrors.payment && (
                <p className="text-red-500 text-[14px]">
                  To'lov miqdorini kiriting
                </p>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span>Sana: </span>
                <span>
                  {date.toLocaleDateString()} {date.toLocaleTimeString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Naqd: </span>
                <span>{payment.toLocaleString()} UZS</span>
              </div>
            </div>
            <div>
              <div className="text-[20px] font-semibold flex items-center justify-between">
                <span>Jami:</span>
                <span>{total.toLocaleString()} UZS</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <span></span>
              <Button className="bg-green-700 text-white" onClick={sendItems}>
                <Check size={16} className="mr-2" /> {"To'lov qilish"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
