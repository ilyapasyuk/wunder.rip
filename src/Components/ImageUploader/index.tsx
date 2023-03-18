import React, { useState } from 'react'

import { uploadImage } from 'service/image'

interface ImageUploaderProps {
  onFileUploaded: (cloudinaryId: string) => void
}

const ImageUploader = ({ onFileUploaded }: ImageUploaderProps) => {
  const [isLoading, setLoading] = useState<boolean>(false)

  const uploadFile = async (file: File | undefined): Promise<void> => {
    if (!file) {
      return
    }

    try {
      setLoading(true)
      const { cloudinaryId } = await uploadImage(file, 'wunderrip_task')
      if (cloudinaryId) {
        onFileUploaded(cloudinaryId)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {isLoading && 'Loading'}

      {!isLoading && (
        <input
          type="file"
          id="img"
          name="img"
          accept="image/*"
          title="Upload"
          onChange={({ target }) => uploadFile(target?.files?.[0])}
        />
      )}
    </>
  )
}

export { ImageUploader }
