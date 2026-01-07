import { toast } from 'sonner'

const cloudinaryAppName = import.meta.env.VITE_CLOUDINARY_ORG_ID

const uploadImage = async (
  file: File | Blob | string,
  preset: string,
): Promise<{ cloudinaryId: string | null }> => {
  if (!cloudinaryAppName) {
    const message = 'Cloudinary configuration is missing. Please set VITE_CLOUDINARY_ORG_ID environment variable.'
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

const getCloudinaryImage = (
  id: string,
  width?: number,
  height?: number,
  fit = false,
  fill = false,
  isDetectFaces = false,
  quality = 100,
): string => {
  const qualityParam = quality ? `q_${quality}` : 'q_auto:best'
  const fitParam = fit ? ',c_fit' : ''
  const fillParam = fill ? ',c_fill' : ''
  const detectFacesParam = isDetectFaces ? ',g_faces' : ''
  const widthParam = width ? `,w_${width}` : ''
  const heightParam = height ? `,h_${height}` : ''

  return `https://res.cloudinary.com/${cloudinaryAppName}/image/upload/${qualityParam}${widthParam}${heightParam}${fitParam}${fillParam}${detectFacesParam}/${id}`
}

export { uploadImage, getCloudinaryImage }
