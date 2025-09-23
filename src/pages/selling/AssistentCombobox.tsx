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
import { useGetUser } from '@/hooks/useGetUser'
import { useDispatch, useSelector } from 'react-redux'
import type { RootState } from '@/store/store'
import { setAssistant } from '@/store/slice/Sale.slice'
import { useGetAllAssistantQuery } from '@/store/sales/salesApi'

export function AssistantCombobox() {
  const [open, setOpen] = React.useState(false)
  const assistant = useSelector((state: RootState) => state.sale.assistant)
  const me = useGetUser()
  const dispatch = useDispatch()

  const { data: assistants } = useGetAllAssistantQuery({
    branch_id: me?.branch_id._id,
  })

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {assistant
            ? assistants?.data.find((a) => a._id === assistant)?.username
            : 'Assistentni tanlang...'}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Assistentni qidiring..." className="h-9" />
          <CommandList>
            <CommandEmpty>Assistent topilmadi.</CommandEmpty>
            <CommandGroup>
              {assistants?.data.map((assistantItem) => (
                <CommandItem
                  key={assistantItem._id}
                  value={assistantItem.username || ''}
                  onSelect={() => {
                    dispatch(setAssistant(assistantItem._id))
                    setOpen(false)
                  }}
                >
                  {assistantItem.username}
                  <Check
                    className={cn(
                      'ml-auto',
                      assistant === assistantItem._id
                        ? 'opacity-100'
                        : 'opacity-0'
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
