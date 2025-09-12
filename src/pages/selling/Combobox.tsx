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
import { useSelector } from 'react-redux'
import { useUpdateClientIDMutation } from '@/store/sales/salesApi'
import type { RootState } from '@/store/store'

export function Combobox({ disabled }: { disabled: boolean }) {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState('')
  const me = useGetUser()
  const [updateClient] = useUpdateClientIDMutation()

  const { data: clients } = useGetClientsQuery({ branch_id: me?.branch_id._id })
  const ClientId = useSelector((state: RootState) => state.location.clientId)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger disabled={disabled} asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value
            ? clients?.data.find((c) => c._id === value)?.username
            : 'Select client...'}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          {/* This input will filter by CommandItem children */}
          <CommandInput placeholder="Search client..." className="h-9" />
          <CommandList>
            <CommandEmpty>No clients found.</CommandEmpty>
            <CommandGroup>
              {clients?.data.map((client) => (
                <CommandItem
                  key={client._id}
                  value={client.username} // important for search
                  onSelect={() => {
                    setValue(client._id)
                    setOpen(false)
                    updateClient({
                      id: ClientId,
                      client_id: client._id as string,
                    })
                  }}
                >
                  {client.username}
                  <Check
                    className={cn(
                      'ml-auto',
                      value === client._id ? 'opacity-100' : 'opacity-0'
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
