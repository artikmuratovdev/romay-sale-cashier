import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useHandleRequest } from '@/hooks/use-handle-request'
import { useGetUser } from '@/hooks/useGetUser'
import { useAddClientMutation } from '@/store/clients/clients.api'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'

type Props = {
  open: boolean
  setOpen: (open: boolean) => void
  onClientAdded?: (client: string) => void
}

const addClientSchema = z.object({
  username: z.string().min(2, 'Ism kamida 2 ta belgidan iborat bo‘lishi kerak'),
  description: z.string().min(2, 'Tavsifni kiriting'),
  phone: z.string().regex(/^\+998\d{9}$/, 'Telefon raqam +998 bilan 9 ta raqamdan iborat bo‘lishi kerak'),
  profession: z.string().min(2, 'Kasbni kiriting'),
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Sana YYYY-MM-DD formatida bo‘lishi kerak'),
  address: z.string().min(3, 'Manzil kamida 3 ta belgidan iborat bo‘lishi kerak'),
})

type AddClientValues = z.infer<typeof addClientSchema>

export default function AddClientDialog({ open, setOpen, onClientAdded }: Props) {
  const me = useGetUser()
  const form = useForm<AddClientValues>({
    resolver: zodResolver(addClientSchema),
    defaultValues: {
      username: 'Jondoe',
      description: 'Doimiy mijoz',
      phone: '+998901234567',
      profession: 'Tadbirkor',
      birth_date: '1990-01-01',
      address: 'Toshkent sh.',
    },
  })
  const [addClient] = useAddClientMutation()
  const handleRequest = useHandleRequest()

  const onSubmit = async (data: AddClientValues) => {

    if (!me?.branch_id?._id) {
      toast.error('Filial aniqlanmadi. Iltimos, qayta tizimga kiring.')
      console.error('Branch ID missing', me)
      return
    }

    await handleRequest({
      request: () => addClient({ ...data, branch_id: me.branch_id!._id }).unwrap(),
      onSuccess: (data) => {
        toast.success(data.msg)
        const clientData = data?.data?._id;

        if (onClientAdded && clientData) {
          onClientAdded(clientData)
        }
        setOpen(false)
        form.reset()
      },
      onError: (err: any) => {
        console.error('AddClient error:', err)
        const diffMsg = err?.data?.error?.msg || err?.data?.message || err?.message || 'Xatolik yuz berdi'
        toast.error(diffMsg)
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Mijoz qo'shish</DialogTitle>
          <p className="text-sm text-[#71717A]">Mijoz ma'lumotlarini kiriting</p>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ismi</FormLabel>
                  <FormControl>
                    <Input placeholder="Ali Valiyev" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tavsif</FormLabel>
                  <FormControl>
                    <Input placeholder="Doimiy mijoz" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefon</FormLabel>
                  <FormControl>
                    <Input placeholder="+998901234567" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="profession"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kasbi</FormLabel>
                  <FormControl>
                    <Input placeholder="O'qituvchi" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="birth_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tug‘ilgan sana</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Manzil</FormLabel>
                  <FormControl>
                    <Input placeholder="Tashkent, Yunusobod" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full">
              Saqlash
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
