'use client'

import * as React from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useGetClientsQuery } from '@/store/clients/clients.api'
import { useGetUser } from '@/hooks/useGetUser'
import { useDispatch, useSelector } from 'react-redux'
import type { RootState } from '@/store/store'
import { setClient } from '@/store/slice/Sale.slice'

export function ClientCombobox() {
  const [open, setOpen] = React.useState(false)
  const client = useSelector((state: RootState) => state.sale.client)
  const me = useGetUser()
  const dispatch = useDispatch()

  const { data: clients } = useGetClientsQuery({ branch_id: me?.branch_id._id })

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {client
            ? clients?.data.find((c) => c._id === client)?.username
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
              {clients?.data.map((clientItem) => (
                <CommandItem
                  key={clientItem._id}
                  value={clientItem.username}
                  onSelect={() => {
                    dispatch(setClient(clientItem._id))
                    setOpen(false)
                  }}
                >
                  {clientItem.username}
                  <Check
                    className={cn(
                      'ml-auto',
                      client === clientItem._id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
