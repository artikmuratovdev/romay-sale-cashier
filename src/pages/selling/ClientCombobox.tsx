'use client'

import { Check, ChevronsUpDown } from 'lucide-react'
import * as React from 'react'

import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useGetUser } from '@/hooks/useGetUser'
import { cn } from '@/lib/utils'
import { useGetClientsQuery, useGetOneClientQuery } from '@/store/clients/clients.api'
import { setClient } from '@/store/slice/Sale.slice'
import type { RootState } from '@/store/store'
import { useDispatch, useSelector } from 'react-redux'

export function ClientCombobox() {
  const [open, setOpen] = React.useState(false)
  const client = useSelector((state: RootState) => state.sale.client)
  const me = useGetUser()
  const dispatch = useDispatch()

  const { data: clients } = useGetClientsQuery({ branch_id: me?.branch_id?._id, limit: 100 })
  const { data: selectedClient } = useGetOneClientQuery(client ?? '', {
    skip: !client,
  })

  // Merge selected client if not in the list (e.g. strict pagination)
  const displayClients = React.useMemo(() => {
    const list = [...(clients?.data || [])]
    if (selectedClient?.data && !list.find((c) => c._id === selectedClient.data._id)) {
      list.unshift(selectedClient.data)
    }
    return list
  }, [clients?.data, selectedClient?.data])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
          {client
            ? displayClients.find((c) => c._id === client)?.username ||
              selectedClient?.data?.username ||
              'Yuklanmoqda...'
            : 'Mijozni tanlang...'}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Mijozni qidiring..." className="h-9" />
          <CommandList>
            <CommandEmpty>Mijoz topilmadi.</CommandEmpty>
            <CommandGroup>
              {displayClients.map((clientItem) => {
                return(
                <CommandItem
                  key={clientItem._id}
                  value={clientItem.username}
                  onSelect={() => {
                    dispatch(setClient(clientItem._id))
                    setOpen(false)
                  }}
                >
                  {clientItem.username}
                  <Check className={cn('ml-auto', client === clientItem._id ? 'opacity-100' : 'opacity-0')} />
                </CommandItem>
              )})}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
