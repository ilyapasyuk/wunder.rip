import React from 'react'

interface CheckboxProps {
  checked: boolean
  onChange: (value: boolean) => void
}

const Checkbox = ({ checked, onChange }: CheckboxProps) => {
  return (
    <input
      type="checkbox"
      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
      checked={checked}
      onChange={({ target }) => onChange(target.checked)}
    />
  )
}

export { Checkbox }
