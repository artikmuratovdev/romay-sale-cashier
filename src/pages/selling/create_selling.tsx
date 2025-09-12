import { useEffect, useState } from 'react'
import { Input } from '../../components/ui/input'
import { Check, Printer } from 'lucide-react'
import { Card, CardContent } from '../../components/ui/card'
import { Label } from '../../components/ui/label'
import { Button } from '../../components/ui/button'
import { Calendar22 } from '../../components/calendar'
import { useDispatch, useSelector } from 'react-redux'
import { setClientId, setLocation } from '@/store/slice/Location.slice'
import {
  useAddItemsMutation,
  useCreateSaleMutation,
} from '@/store/sales/salesApi'
import { useGetUser } from '@/hooks/useGetUser'
import { toast } from 'sonner'
import { useHandleRequest } from '@/hooks/use-handle-request'
import Sale_Table from './Table'
import SearchInput from './SearchInput'
import type { RootState } from '@/store/store'
import { Combobox } from './Combobox'
import { clearProducts } from '@/store/slice/Sale.slice'

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
  const me = useGetUser()
  const [enabled, setEnabled] = useState({
    search: false,
  })
  const [products, setProducts] = useState<Product[]>([])
  const dispatch = useDispatch()
  const handleRequest = useHandleRequest()
  const [createSale] = useCreateSaleMutation()
  const [addItems] = useAddItemsMutation()

  const ClientId = useSelector((state: RootState) => state.location.clientId)

  const [payment, setPayment] = useState(0)

  const createSaleFn = async () => {
    await handleRequest({
      request: () =>
        createSale({
          branch_id: me?.branch_id._id as string,
          cashier_id: me?._id as string,
        }).unwrap(),
      onSuccess: (res) => {
        setEnabled((prev) => ({ ...prev, search: true }))
        toast.success(res.msg)
        dispatch(setClientId(res.data.id))
      },
      onError: (err) => {
        toast.error(err.msg)
      },
    })
    setEnabled((prev) => ({ ...prev, search: true }))
  }

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

  const sendItems = async () => {
    if (filteredProducts) {
      filteredProducts.forEach((p) => {
        handleRequest({
          request: async () => {
            const res = await addItems({
              product_id: p._id,
              quantity: p.qty,
              clientId: ClientId as string,
            }).unwrap()
            return res
          },
          onSuccess: () => {
            toast.success('Mahsulotlar muvaffaqiyatli qo`shildi')
            dispatch(clearProducts())
          },
          onError: () => {
            toast.error('Xatolik yuz berdi')
          },
        })
      })
    }
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-4">
        <SearchInput enabled={enabled} />
        <Button
          className="w-28 shadow-lg"
          variant={'outline'}
          onClick={createSaleFn}
          disabled={enabled.search}
        >
          Sotuv qo'shish
        </Button>
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
              Mahsulotlar kiritilishi bilan bu yerda ko’rinadi
            </p>
          </div>
        </Card>
      )}

      {/* Bottom section same as your old one */}
      <div className="grid grid-cols-2 gap-8 mt-8">
        <Card>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label>Mijoz</Label>
              <Combobox disabled={!enabled.search} />
              <p className="text-[14px] text-[#71717A]">
                Qarz bo'lmasa majburiy emas
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Naqd</Label>
              <div className="relative">
                <Input
                  className="py-2 px-3 pr-10"
                  placeholder="0"
                  value={payment}
                  onChange={(e) => setPayment(Number(e.target.value))}
                />
                <span className="absolute right-2 top-[10px] text-[14px] text-[#71717A]">
                  UZS
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Qarzni berish sanasi</Label>
              <Calendar22 className="w-full" />
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
                <span>{payment} UZS</span>
              </div>
            </div>
            <div>
              <div className="text-[20px] font-semibold flex items-center justify-between">
                <span>Jami:</span>
                <span>{total.toLocaleString()} UZS</span>
              </div>
              <div className="text-[20px] font-semibold flex items-center justify-between">
                <span>Berildi:</span>
                <span className="text-green-600">8 250 000 UZS</span>
              </div>
              <div className="text-[20px] font-semibold flex items-center justify-between">
                <span>Qarz:</span>
                <span className="text-[#DC3E42]">200 000 UZS</span>
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
