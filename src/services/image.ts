import {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_DELIVERY_BASE,
  CLOUDINARY_UPLOAD_ENDPOINT,
} from 'config/cloudinary'
import { notify } from 'services/notify'

const uploadImage = async (
  file: File | Blob | string,
  preset: string,
): Promise<{ cloudinaryId: string | null }> => {
  if (!CLOUDINARY_CLOUD_NAME) {
    const message =
      'Cloudinary configuration is missing. Please set VITE_CLOUDINARY_ORG_ID environment variable.'
    console.error(message)
    notify.error('Image upload configuration error')
    return { cloudinaryId: null }
  }

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', preset)

  try {
    const response = await fetch(CLOUDINARY_UPLOAD_ENDPOINT, {
      method: 'POST',
      body: formData,
    })

    if (response.ok) {
      const imageId = await response.json()
      return { cloudinaryId: imageId?.public_id }
    } else {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      const message = `Failed to upload image: ${errorData.error?.message || response.statusText}`
      console.error(message, errorData)
      notify.error('Failed to upload image')
      return { cloudinaryId: null }
    }
  } catch (error) {
    const message = `Error uploading image: ${error}`
    console.error(message)
    notify.error('Error uploading image')
    return { cloudinaryId: null }
  }
}

type ThumbOptions = {
  width: number
  height: number
  gravity?: 'auto' | 'face' | 'faces' | 'center'
}

const getCloudinaryThumb = (
  id: string,
  { width, height, gravity = 'auto' }: ThumbOptions,
): string => {
  return `${CLOUDINARY_DELIVERY_BASE}/f_auto,q_auto:eco,c_fill,g_${gravity},w_${width},h_${height},dpr_auto/${id}`
}

/**
 * Full-size preview URL (capped to maxWidth so we don't ship 8000px originals).
 */
const getCloudinaryPreview = (id: string, maxWidth = 2000): string => {
  return `${CLOUDINARY_DELIVERY_BASE}/f_auto,q_auto:best,c_limit,w_${maxWidth},dpr_auto/${id}`
}

const getCloudinaryLQIP = (id: string): string => {
  return `${CLOUDINARY_DELIVERY_BASE}/f_auto,q_auto:low,c_limit,w_64,e_blur:1500/${id}`
}

/**
 * Adds Content-Disposition: attachment via Cloudinary's fl_attachment flag —
 * the browser will download the file instead of navigating to it.
 * Cross-origin <a download> is unreliable; this is the reliable path.
 */
const getCloudinaryDownloadUrl = (id: string, filename?: string): string => {
  const flag = filename ? `fl_attachment:${encodeURIComponent(filename)}` : 'fl_attachment'
  return `${CLOUDINARY_DELIVERY_BASE}/${flag}/${id}`
}

/**
 * Plain optimized URL — kept for backward-compat and ad-hoc usage.
 */
const getCloudinaryImage = (id: string): string => {
  return `${CLOUDINARY_DELIVERY_BASE}/f_auto,q_auto/${id}`
}

export {
  getCloudinaryDownloadUrl,
  getCloudinaryImage,
  getCloudinaryLQIP,
  getCloudinaryPreview,
  getCloudinaryThumb,
  uploadImage,
}
