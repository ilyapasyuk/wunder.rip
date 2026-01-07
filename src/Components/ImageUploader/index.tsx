import React, { useRef, useState } from 'react'

import { uploadImage } from 'Service/image'

interface IImageUploaderProps {
  onFileUploaded: (cloudinaryId: string) => void
}

const ImageUploader = ({ onFileUploaded }: IImageUploaderProps) => {
  const [isLoading, setLoading] = useState<boolean>(false)
  const [isDragOver, setIsDragOver] = useState<boolean>(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUploadFile = async (file: File | undefined): Promise<void> => {
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

  const handleAreaClick = () => {
    if (!isLoading && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isLoading) {
      setIsDragOver(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    if (isLoading) {
      return
    }

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      const file = files[0]
      if (file.type.startsWith('image/')) {
        handleUploadFile(file)
      }
    }
  }

  return (
    <>
      <div
        onClick={handleAreaClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`mt-2 flex justify-center rounded-lg border border-dashed px-6 py-10 cursor-pointer transition-colors ${
          isDragOver
            ? 'border-primary bg-primary/5 dark:bg-primary/10'
            : 'border-border dark:border-border-dark hover:bg-overlay-hover'
        }`}
      >
        <div className="text-center">
          <svg
            className="mx-auto size-12 shrink-0 text-text-secondary dark:text-text-dark-secondary"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M1.5 6a2.25 2.25 0 012.25-2.25h16.5A2.25 2.25 0 0122.5 6v12a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 18V6zM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0021 18v-1.94l-2.69-2.689a1.5 1.5 0 00-2.12 0l-.88.879.97.97a.75.75 0 11-1.06 1.06l-5.16-5.159a1.5 1.5 0 00-2.12 0L3 16.061zm10.125-7.81a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0z"
              clipRule="evenodd"
            />
          </svg>
          {
            <div className="mt-4 flex text-sm leading-6 text-text-secondary dark:text-text-dark-secondary">
              <label
                aria-disabled={isLoading}
                htmlFor="img"
                className="relative cursor-pointer rounded-md bg-surface dark:bg-surface-dark font-semibold text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 hover:text-primary-hover"
              >
                <span>Upload a file</span>
                <input
                  ref={fileInputRef}
                  disabled={isLoading}
                  type="file"
                  id="img"
                  name="img"
                  accept="image/*"
                  title="Upload"
                  onChange={({ target }) => handleUploadFile(target?.files?.[0])}
                  className="sr-only"
                />
              </label>
              <p className="pl-1">or drag and drop</p>
            </div>
          }
          <p className="text-xs leading-5 text-text-secondary dark:text-text-dark-secondary">
            {isLoading ? 'Uploading...' : 'PNG, JPG, GIF up to 10MB'}
          </p>
        </div>
      </div>
    </>
  )
}

export { ImageUploader }
