import React, { useState, useEffect } from 'react'
import {
  FormControl,
  FormLabel,
  FormMessage,
  FormItem,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Info } from 'lucide-react'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'

interface NumberFieldProps {
  label: string
  description: string
  placeholder: string
  field: {
    value: number
    onChange: (value: any) => void
  }
}

const NumberField: React.FC<NumberFieldProps> = ({
  label,
  description,
  placeholder,
  field,
}) => {
  const parseValue = (value: any): number =>
    value === undefined || value === '' ? 0 : Number(value)

  const [inputValue, setInputValue] = useState<number>(parseValue(field.value))

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value)
    if (!isNaN(value)) {
      setInputValue(value)
      field.onChange(value) // Update the form value
    }
  }

  return (
    <FormItem>
      <FormLabel>
        {label}
        {description && (
          <HoverCard openDelay={100} closeDelay={50}>
            <HoverCardTrigger>
              <span className="ml-2 text-gray-500">
                <Info className="inline-block h-4 w-4" />
              </span>
            </HoverCardTrigger>
            <HoverCardContent>{description}</HoverCardContent>
          </HoverCard>
        )}
      </FormLabel>
      <FormControl>
        <Input
          type="number"
          placeholder={placeholder}
          value={inputValue}
          onChange={handleChange}
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  )
}

export default NumberField