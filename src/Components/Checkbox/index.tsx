import React from 'react'

interface CheckboxProps {
  checked: boolean
  onChange: (value: boolean) => void
}

const Checkbox = ({ checked, onChange }: CheckboxProps) => {
  return (
    <input
      type="checkbox"
      className="h-4 w-4 rounded border-[#c3c6d4] text-[#0073ea] focus:ring-[#0073ea] focus:ring-2 focus:ring-offset-0 cursor-pointer"
      checked={checked}
      onChange={({ target }) => onChange(target.checked)}
    />
  )
}

export { Checkbox }
