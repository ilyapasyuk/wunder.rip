import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react'
import {
  ArrowDownTrayIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react'
import { getCloudinaryDownloadUrl, getCloudinaryLQIP, getCloudinaryPreview } from 'services/image'

interface ImageLightboxProps {
  open: boolean
  images: string[]
  initialIndex?: number
  onClose: () => void
}

const ImageLightbox = ({ open, images, initialIndex = 0, onClose }: ImageLightboxProps) => {
  const [index, setIndex] = useState(initialIndex)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (open) setIndex(initialIndex)
  }, [open, initialIndex])

  useEffect(() => {
    setLoaded(false)
  }, [index])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        setIndex(i => Math.min(images.length - 1, i + 1))
      } else if (e.key === 'ArrowLeft') {
        setIndex(i => Math.max(0, i - 1))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, images.length])

  if (!images.length) return null

  const current = images[Math.min(index, images.length - 1)]
  const hasMultiple = images.length > 1

  return (
    <Dialog
      open={open}
      onClose={onClose}
      transition
      className="relative z-[100] transition duration-200 ease-out data-[closed]:opacity-0"
    >
      <DialogBackdrop className="fixed inset-0 bg-black/90 backdrop-blur-sm" />
      <div className="fixed inset-0 flex items-center justify-center p-4 sm:p-8">
        <DialogPanel
          transition
          className="relative w-[92vw] h-[80vh] sm:w-[88vw] sm:h-[82vh] max-w-[1400px] max-h-[900px] rounded-lg shadow-2xl bg-black/40 overflow-hidden transition duration-200 ease-out data-[closed]:scale-95 data-[closed]:opacity-0"
        >
          {/* LQIP — blurred placeholder, fills the panel via object-contain */}
          <img
            key={`lqip-${current}`}
            src={getCloudinaryLQIP(current)}
            alt=""
            aria-hidden="true"
            draggable={false}
            className="absolute inset-0 w-full h-full object-contain select-none"
          />
          {/* Full-resolution preview, fades in over the LQIP */}
          <img
            key={`full-${current}`}
            src={getCloudinaryPreview(current, 2000)}
            alt=""
            draggable={false}
            onLoad={() => setLoaded(true)}
            className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-300 ease-out ${
              loaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
          {/* Subtle progress indicator while the full image is loading */}
          {!loaded && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="size-10 rounded-full border-2 border-white/30 border-t-white/90 animate-spin" />
            </div>
          )}

          {hasMultiple && (
            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur text-xs font-medium text-white/90 select-none">
              {index + 1} / {images.length}
            </div>
          )}

          <div className="absolute top-3 right-3 flex items-center gap-1.5">
            <a
              href={getCloudinaryDownloadUrl(current)}
              download
              className="p-2 rounded-full bg-black/60 backdrop-blur hover:bg-black/80 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white/40"
              aria-label="Download image"
            >
              <ArrowDownTrayIcon className="size-5" />
            </a>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full bg-black/60 backdrop-blur hover:bg-black/80 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white/40"
              aria-label="Close"
            >
              <XMarkIcon className="size-5" />
            </button>
          </div>

          {hasMultiple && (
            <>
              <button
                type="button"
                onClick={() => setIndex(i => Math.max(0, i - 1))}
                disabled={index === 0}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 backdrop-blur hover:bg-black/80 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-white/40"
                aria-label="Previous image"
              >
                <ChevronLeftIcon className="size-6" />
              </button>
              <button
                type="button"
                onClick={() => setIndex(i => Math.min(images.length - 1, i + 1))}
                disabled={index === images.length - 1}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 backdrop-blur hover:bg-black/80 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-white/40"
                aria-label="Next image"
              >
                <ChevronRightIcon className="size-6" />
              </button>
            </>
          )}
        </DialogPanel>
      </div>
    </Dialog>
  )
}

export { ImageLightbox }
