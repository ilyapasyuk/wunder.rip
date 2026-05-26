import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from '@heroicons/react/20/solid'

type ToastVariant = 'success' | 'error' | 'info'

type ToastCardProps = {
  variant: ToastVariant
  title: string
  description?: string
  onClose: () => void
}

type VariantStyle = {
  iconBg: string
  icon: typeof CheckCircleIcon
  tint: string
  ring: string
  titleClass: string
}

const VARIANTS: Record<ToastVariant, VariantStyle> = {
  info: {
    iconBg: 'bg-primary',
    icon: InformationCircleIcon,
    tint: 'from-primary/15 dark:from-primary/25',
    ring: 'ring-primary/20 dark:ring-primary/30',
    titleClass: 'text-text-primary dark:text-text-dark-primary',
  },
  success: {
    iconBg: 'bg-emerald-500 dark:bg-emerald-500',
    icon: CheckCircleIcon,
    tint: 'from-emerald-500/15 dark:from-emerald-500/25',
    ring: 'ring-emerald-500/20 dark:ring-emerald-500/30',
    titleClass: 'text-text-primary dark:text-text-dark-primary',
  },
  error: {
    iconBg: 'bg-red-500 dark:bg-red-500',
    icon: ExclamationCircleIcon,
    tint: 'from-red-500/20 dark:from-red-500/30',
    ring: 'ring-red-500/25 dark:ring-red-500/35',
    titleClass: 'text-red-600 dark:text-red-400',
  },
}

const ToastCard = ({ variant, title, description, onClose }: ToastCardProps) => {
  const style = VARIANTS[variant]
  const Icon = style.icon

  return (
    <div
      className={`relative flex items-center gap-3 w-[360px] max-w-[calc(100vw-2rem)] py-3 pl-3 pr-12 rounded-xl shadow-lg overflow-hidden bg-surface dark:bg-surface-dark ring-1 ${style.ring}`}
      role={variant === 'error' ? 'alert' : 'status'}
    >
      {/* Tinted gradient overlay — fades from the variant color near the icon out to transparent. */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 bg-gradient-to-r ${style.tint} via-transparent to-transparent`}
      />

      {/* Icon plate */}
      <div
        className={`relative shrink-0 size-10 rounded-lg ${style.iconBg} flex items-center justify-center text-white shadow-inner`}
      >
        <Icon className="size-5" aria-hidden="true" />
      </div>

      {/* Text */}
      <div className="relative min-w-0 flex-1">
        <div className={`font-semibold text-sm leading-5 ${style.titleClass}`}>{title}</div>
        {description && (
          <div className="mt-0.5 text-xs leading-5 text-text-secondary dark:text-text-dark-secondary">
            {description}
          </div>
        )}
      </div>

      {/* Close */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute top-1/2 -translate-y-1/2 right-2 p-1.5 rounded-md text-text-secondary dark:text-text-dark-secondary hover:text-text-primary dark:hover:text-text-dark-primary hover:bg-overlay-hover transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40"
      >
        <XMarkIcon className="size-4" />
      </button>
    </div>
  )
}

export { ToastCard, type ToastVariant }
