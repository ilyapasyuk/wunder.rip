import { ToastCard, type ToastVariant } from 'components/ui/ToastCard'
import { toast } from 'sonner'

type NotifyInput = string | { title: string; description?: string }

const DEFAULT_DURATION = 4000

const show = (variant: ToastVariant, input: NotifyInput, durationMs = DEFAULT_DURATION) => {
  const { title, description } = typeof input === 'string' ? { title: input } : input

  return toast.custom(
    id => (
      <ToastCard
        variant={variant}
        title={title}
        description={description}
        onClose={() => toast.dismiss(id)}
      />
    ),
    { duration: durationMs, unstyled: true },
  )
}

const notify = {
  success: (input: NotifyInput, durationMs?: number) => show('success', input, durationMs),
  error: (input: NotifyInput, durationMs?: number) => show('error', input, durationMs),
  info: (input: NotifyInput, durationMs?: number) => show('info', input, durationMs),
}

export { notify }
