import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarcodeScanner } from '@/components/scanner/BarcodeScanner'
import { QrCode, Keyboard, Camera } from 'lucide-react'

export default function ScannerPage() {
  const navigate = useNavigate()
  const [scanning, setScanning] = useState(false)

  function handleDetected(code: string) {
    setScanning(false)
    // Pequeno delay para animação de confirmação aparecer
    setTimeout(() => {
      navigate(`/cadastro?patrimonio=${encodeURIComponent(code)}`)
    }, 600)
  }

  return (
    <>
      {scanning && (
        <BarcodeScanner
          onDetected={handleDetected}
          onClose={() => setScanning(false)}
        />
      )}

      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
        <div className="w-20 h-20 rounded-3xl bg-primary/10 border border-primary/30
                        flex items-center justify-center mb-6 shadow-glow-blue">
          <QrCode className="w-10 h-10 text-primary" />
        </div>

        <h1 className="text-2xl font-semibold text-text mb-2">Escanear Patrimônio</h1>
        <p className="text-text-muted text-sm max-w-xs mb-8">
          Aponte a câmera para o código de barras da etiqueta de patrimônio do equipamento.
        </p>

        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button
            onClick={() => setScanning(true)}
            className="btn-primary btn-lg w-full"
          >
            <Camera className="w-5 h-5" />
            Abrir câmera
          </button>

          <button
            onClick={() => navigate('/cadastro')}
            className="btn-secondary w-full"
          >
            <Keyboard className="w-5 h-5" />
            Digitar manualmente
          </button>
        </div>

        <div className="mt-8 p-4 bg-surface border border-border rounded-2xl max-w-xs w-full text-left">
          <p className="text-xs text-text-muted font-medium mb-2">Formatos suportados:</p>
          <div className="flex flex-wrap gap-1.5">
            {['Code 128', 'Code 39', 'EAN-13', 'QR Code', 'ITF', 'UPC'].map(f => (
              <span key={f} className="badge badge-info">{f}</span>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
