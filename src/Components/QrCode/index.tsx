import QRCodeLib from 'qrcode'
import React, { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface QrCodeProps {
  text: string
  fileName: string
}

const QRCode = ({ text, fileName }: QrCodeProps) => {
  const [qrCode, setQrCode] = useState<string>('')

  useEffect(() => {
    QRCodeLib.toDataURL(text, { width: 300 }, (err, dataUrl) => {
      if (err) {
        console.error(err)
        toast.error(err.message)
        return
      }
      setQrCode(dataUrl)
    })
  }, [text])

  return (
    <div>
      <a href={qrCode} download={fileName}>
        <img alt={'ad'} src={qrCode} width={300} height={300} />
      </a>
    </div>
  )
}

export { QRCode }
