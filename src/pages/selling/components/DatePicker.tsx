import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { CalendarDays } from 'lucide-react'
import React from 'react'
import { type DateRange } from 'react-day-picker'

interface DatePickerProps {
  className?: string
  disabled?: boolean
  onDateRangeChange?: (dateRange: DateRange | undefined) => void
  placeholder?: string
}

const DatePicker = ({
  className,
  disabled,
  onDateRangeChange,
  placeholder = 'KK/MM/YYYY',
}: DatePickerProps) => {
  const [open, setOpen] = React.useState(false)
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(
    undefined
  )

  const handleDateRangeSelect = (range: DateRange | undefined) => {
    setDateRange(range)
    onDateRangeChange?.(range)

    if (range?.from && range?.to) {
      setOpen(false)
    }
  }

  const formatDateRange = (range: DateRange | undefined) => {
    if (!range?.from) return null
    if (!range.to) return range.from.toLocaleDateString()
    return `${range.from.toLocaleDateString()} - ${range.to.toLocaleDateString()}`
  }

  return (
    <div className="flex gap-3">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger disabled={disabled} asChild>
          <Button
            variant="outline"
            id="date"
            className={cn(
              'flex items-center gap-3 justify-between font-normal',
              className
            )}
          >
            {formatDateRange(dateRange) ? (
              formatDateRange(dateRange)
            ) : (
              <span className="text-[14px] text-[#71717A]">{placeholder}</span>
            )}
            <CalendarDays size={16} />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
          <Calendar
            mode="range"
            defaultMonth={dateRange?.from}
            selected={dateRange}
            onSelect={handleDateRangeSelect}
            className="rounded-lg border shadow-sm"
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

export default DatePicker
