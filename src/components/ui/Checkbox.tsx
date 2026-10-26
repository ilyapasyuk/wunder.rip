interface CheckboxProps {
  checked: boolean
  onChange: (value: boolean) => void
}

const Checkbox = ({ checked, onChange }: CheckboxProps) => {
  return (
    <label className="relative inline-flex size-10 shrink-0 items-center justify-center cursor-pointer -m-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={({ target }) => onChange(target.checked)}
        className="sr-only peer"
        aria-label={checked ? 'Mark as not done' : 'Mark as done'}
      />
      <span
        className={`flex items-center justify-center size-6 rounded-[7px] border-2 transition-all duration-150 ease-out peer-focus-visible:ring-2 peer-focus-visible:ring-accent/40 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-muted active:scale-90 ${
          checked
            ? 'bg-accent border-accent text-white'
            : 'border-text-tertiary hover:border-text-primary'
        }`}
      >
        <svg
          className={`size-4 transition-all duration-150 ease-out ${
            checked ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
          }`}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="3"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      </span>
    </label>
  )
}

export { Checkbox }
