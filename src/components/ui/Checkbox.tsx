interface CheckboxProps {
  checked: boolean
  onChange: (value: boolean) => void
}

const Checkbox = ({ checked, onChange }: CheckboxProps) => {
  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={({ target }) => onChange(target.checked)}
        className="sr-only peer"
      />
      <span
        className={`
          relative flex items-center justify-center
          w-6 h-6 rounded-full
          border-2 transition-all duration-200 ease-in-out
          peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary peer-focus:ring-offset-1
          ${
            checked
              ? 'bg-primary dark:bg-primary border-primary dark:border-primary shadow-sm'
              : 'bg-transparent border-border dark:border-border-dark hover:border-primary dark:hover:border-primary hover:bg-primary/10 dark:hover:bg-primary/20'
          }
        `}
      >
        <svg
          className={`w-4 h-4 text-white transition-all duration-200 ease-in-out ${
            checked ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
          }`}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.5"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path d="M5 13l4 4L19 7" />
        </svg>
      </span>
    </label>
  )
}

export { Checkbox }
