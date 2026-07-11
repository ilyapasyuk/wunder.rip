const UPLOAD_PRESET = 'wunderrip_task'

const getCloudName = (): string => {
  const cloudName = process.env.VITE_CLOUDINARY_ORG_ID
  if (!cloudName) {
    throw new Error('VITE_CLOUDINARY_ORG_ID is not set')
  }
  return cloudName
}

const deliveryBase = (): string => `https://res.cloudinary.com/${getCloudName()}/image/upload`

const uploadBlob = async (blob: Blob): Promise<string> => {
  const formData = new FormData()
  formData.append('file', blob)
  formData.append('upload_preset', UPLOAD_PRESET)

  const response = await fetch(`https://api.cloudinary.com/v1_1/${getCloudName()}/image/upload`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Cloudinary upload failed: ${response.status} ${body}`)
  }

  const data = (await response.json()) as { public_id: string }
  return data.public_id
}

export const uploadImageFromBase64 = async (base64: string, mimeType: string): Promise<string> => {
  const buffer = Buffer.from(base64, 'base64')
  return uploadBlob(new Blob([buffer], { type: mimeType }))
}

export const uploadImageFromUrl = async (url: string): Promise<string> => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch image from ${url}: ${response.status}`)
  }
  return uploadBlob(await response.blob())
}

export const getImageUrls = (id: string) => ({
  thumbUrl: `${deliveryBase()}/f_auto,q_auto:eco,c_fill,g_auto,w_320,h_240,dpr_auto/${id}`,
  previewUrl: `${deliveryBase()}/f_auto,q_auto:best,c_limit,w_2000,dpr_auto/${id}`,
  downloadUrl: `${deliveryBase()}/fl_attachment/${id}`,
})
