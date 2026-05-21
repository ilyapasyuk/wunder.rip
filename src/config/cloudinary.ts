export const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_ORG_ID

export const CLOUDINARY_UPLOAD_PRESET = 'wunderrip_task'

export const CLOUDINARY_DELIVERY_BASE = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload`

export const CLOUDINARY_UPLOAD_ENDPOINT = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`
