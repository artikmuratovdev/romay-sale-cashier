import { useEffect, useState } from 'react'
import { Input } from '../../components/ui/input'
import { Check, Printer } from 'lucide-react'
import { Card, CardContent } from '../../components/ui/card'
import { Label } from '../../components/ui/label'
import { Button } from '../../components/ui/button'
import { useDispatch, useSelector } from 'react-redux'
import { setLocation } from '@/store/slice/Location.slice'
import { useCreateSaleMutation } from '@/store/sales/salesApi'
import { toast } from 'sonner'
import { useHandleRequest } from '@/hooks/use-handle-request'
import Sale_Table from './Table'
import SearchInput from './SearchInput'
import type { RootState } from '@/store/store'
import { ClientCombobox } from './ClientCombobox'
import { useGetUser } from '@/hooks/useGetUser'
import { AssistantCombobox } from './AssistentCombobox'

export type Product = {
  id: string
  name: string
  price: number
  qty: number
  img: string
  stock: number
  barcode: string
}

export default function Create_selling() {
  const [products, setProducts] = useState<Product[]>([])
  const dispatch = useDispatch()
  const handleRequest = useHandleRequest()
  const [createSale] = useCreateSaleMutation()
  const me = useGetUser()

  const ClientId = useSelector((state: RootState) => state.sale.client)
  const AssistantId = useSelector((state: RootState) => state.sale.assistant)

  const [payment, setPayment] = useState(0)

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

  useEffect(() => {
    dispatch(setLocation('Sotuv Yaratish'))
  }, [dispatch])

  const validateSale = () => {
    const errors = []

    // Check if there are items
    if (!filteredProducts || filteredProducts.length === 0) {
      errors.push('Mahsulotlar')
    }

    // Check if client is selected
    if (!ClientId) {
      errors.push('Mijoz')
    }

    // Check if assistant is selected
    if (!AssistantId) {
      errors.push('Assistent')
    }

    // Check if payment amount is provided
    if (payment <= 0) {
      errors.push("To'lov miqdori")
    }

    return errors
  }

  const sendItems = async () => {
    const validationErrors = validateSale()

    if (validationErrors.length > 0) {
      const errorMessage = `Quyidagi maydonlarni to'ldiring: ${validationErrors.join(', ')}`
      toast.error(errorMessage)
      return
    }

    if (filteredProducts) {
      const data = {
        branch_id: me?.branch_id._id as string,
        client_id: ClientId as string,
        sales_assistant_id: AssistantId as string,
        cashier_id: me?._id as string,
        items: filteredProducts.map((p) => ({
          product_id: p._id,
          quantity: p.qty,
        })),
        paid_amount: payment,
      }
      console.log(data)

      await handleRequest({
        request: () => createSale(data).unwrap(),
        onSuccess: (data) => {
          toast.success(
            data.msg || data.message || 'Sotuv muvaffaqiyatli yaratildi!'
          )
        },
        onError: (err) => {
          toast.error(err.error.msg)
        },
      })

      // If all validations pass, you can proceed with the API call
      try {
        // Your API call logic here
        toast.success('Sotuv muvaffaqiyatli yaratildi!')
      } catch (error) {
        toast.error((error as string) || 'Xatolik yuz berdi')
      }
    }
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-4">
        <SearchInput />
      </div>

      {/* If products exist */}
      {products.length > 0 ? (
        <div className="border border-[#E4E4E7] rounded-lg overflow-hidden">
          <Sale_Table />
        </div>
      ) : (
        // Your empty state here
        <Card>
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
          </div>
        </Card>
      )}

      {/* Bottom section with updated comboboxes */}
      <div className="grid grid-cols-2 gap-8 mt-8">
        <Card>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label>Mijoz</Label>
              <ClientCombobox />
              <p className="text-[14px] text-[#71717A]">
                Qarz bo'lmasa majburiy emas
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Assistent</Label>
              <AssistantCombobox />
              <p className="text-[14px] text-[#71717A]">
                Assistent tanlang (ixtiyoriy)
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Naqd</Label>
              <div className="relative">
                <Input
                  className="py-2 px-3 pr-10"
                  placeholder="0"
                  type="number"
                  value={payment === 0 ? '' : payment}
                  onChange={(e) =>
                    setPayment(e.target.value ? Number(e.target.value) : 0)
                  }
                />
                <span className="absolute right-2 top-[10px] text-[14px] text-[#71717A]">
                  UZS
                </span>
              </div>
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
              <Button variant={'secondary'}>
                <Printer size={16} className="mr-2" /> Print
              </Button>
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
