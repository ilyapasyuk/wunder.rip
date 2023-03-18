import React, { useState } from 'react'

import { storageRef } from 'service/firebase'

interface ImageUploaderProps {
  userId: string
  todoId: string
  onFileUploaded: (fileUrl: string) => void
}

const ImageUploader = ({ userId, todoId, onFileUploaded }: ImageUploaderProps) => {
  const [isLoading, setLoading] = useState<boolean>(false)

  const uploadFile = async (
    file: File | undefined,
    userId: string,
    todoId: string,
  ): Promise<void> => {
    if (!file) {
      return
    }

    try {
      setLoading(true)
      const fileName = `${file.name}`
      const storiesRef = storageRef.child(`/files/${userId}/${todoId}/${fileName}`)

      const snapshot = await storiesRef.put(file)
      const fullUrl = await snapshot.ref.getDownloadURL()

      const url = new URL(fullUrl)
      const preparedUrl = `${url.origin}${url.pathname}`
      // ?alt=media postfix for direct route
      console.log('preparedUrl', preparedUrl)
      onFileUploaded(preparedUrl)
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
          onChange={({ target }) => uploadFile(target?.files?.[0], userId, todoId)}
        />
      )}
    </>
  )
}

export { ImageUploader }
