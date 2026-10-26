interface SkeletonProps {
  className?: string
}

/** A pulsing placeholder block; size and shape come from `className`. */
const Skeleton = ({ className = '' }: SkeletonProps) => (
  <div aria-hidden="true" className={`bg-muted-strong motion-safe:animate-pulse ${className}`} />
)

export { Skeleton }
