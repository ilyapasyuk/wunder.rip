import { toast } from 'sonner'

const cloudinaryAppName = import.meta.env.VITE_CLOUDINARY_ORG_ID

const uploadImage = async (
  file: File | Blob | string,
  preset: string,
): Promise<{ cloudinaryId: string | null }> => {
  if (!cloudinaryAppName) {
    const message =
      'Cloudinary configuration is missing. Please set VITE_CLOUDINARY_ORG_ID environment variable.'
    console.error(message)
    toast.error('Image upload configuration error')
    return { cloudinaryId: null }
  }

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', preset)

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudinaryAppName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      },
    )

    if (response.ok) {
      const imageId = await response.json()
      return { cloudinaryId: imageId?.public_id }
    } else {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      const message = `Failed to upload image: ${errorData.error?.message || response.statusText}`
      console.error(message, errorData)
      toast.error('Failed to upload image')
      return { cloudinaryId: null }
    }
  } catch (error) {
    const message = `Error uploading image: ${error}`
    console.error(message)
    toast.error('Error uploading image')
    return { cloudinaryId: null }
  }
}

const CLOUDINARY_BASE = `https://res.cloudinary.com/${cloudinaryAppName}/image/upload`

type ThumbOptions = {
  width: number
  height: number
  gravity?: 'auto' | 'face' | 'faces' | 'center'
}

/**
 * Optimized thumbnail URL.
 * Uses f_auto (WebP/AVIF), q_auto (smart quality), c_fill with smart gravity,
 * and dpr_auto so retina devices get a sharper variant when the browser hints DPR.
 */
const getCloudinaryThumb = (
  id: string,
  { width, height, gravity = 'auto' }: ThumbOptions,
): string => {
  return `${CLOUDINARY_BASE}/f_auto,q_auto,c_fill,g_${gravity},w_${width},h_${height},dpr_auto/${id}`
}

/**
 * Full-size preview URL (capped to maxWidth so we don't ship 8000px originals).
 */
const getCloudinaryPreview = (id: string, maxWidth = 2000): string => {
  return `${CLOUDINARY_BASE}/f_auto,q_auto:best,c_limit,w_${maxWidth},dpr_auto/${id}`
}

/**
 * Low-quality image placeholder — a pre-blurred copy used to hold
 * dimensions and provide an instant visual while the full preview loads.
 * Preserves the original aspect ratio (c_limit), heavily blurred so it
 * compresses to ~10–30 KB even at a usable display size.
 */
const getCloudinaryLQIP = (id: string): string => {
  return `${CLOUDINARY_BASE}/f_auto,q_auto:low,c_limit,w_1200,e_blur:1500/${id}`
}

/**
 * Adds Content-Disposition: attachment via Cloudinary's fl_attachment flag —
 * the browser will download the file instead of navigating to it.
 * Cross-origin <a download> is unreliable; this is the reliable path.
 */
const getCloudinaryDownloadUrl = (id: string, filename?: string): string => {
  const flag = filename ? `fl_attachment:${encodeURIComponent(filename)}` : 'fl_attachment'
  return `${CLOUDINARY_BASE}/${flag}/${id}`
}

/**
 * Plain optimized URL — kept for backward-compat and ad-hoc usage.
 */
const getCloudinaryImage = (id: string): string => {
  return `${CLOUDINARY_BASE}/f_auto,q_auto/${id}`
}

export {
  getCloudinaryDownloadUrl,
  getCloudinaryImage,
  getCloudinaryLQIP,
  getCloudinaryPreview,
  getCloudinaryThumb,
  uploadImage,
}
