const cloudinaryAppName = import.meta.env.VITE_CLOUDINARY_ORG_ID

const uploadImage = async (
  file: File | Blob | string,
  preset: string,
): Promise<{ cloudinaryId: string | null }> => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', preset)
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
  }
  return { cloudinaryId: null }
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
