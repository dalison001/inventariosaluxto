import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { Camera, X, SwitchCamera, Flashlight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BarcodeScannerProps {
  onDetected: (code: string) => void
  onClose: () => void
  className?: string
}

export function BarcodeScanner({ onDetected, onClose, className }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const readerRef = useRef<BrowserMultiFormatReader | null>(null)
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([])
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [detected, setDetected] = useState(false)

  useEffect(() => {
    startScanner()
    return () => stopScanner()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCameraIndex])

  async function startScanner() {
    try {
      setIsLoading(true)
      setError(null)

      const reader = new BrowserMultiFormatReader()
      readerRef.current = reader

      const devices = await BrowserMultiFormatReader.listVideoInputDevices()
      setCameras(devices)

      if (devices.length === 0) {
        setError('Nenhuma câmera encontrada.')
        return
      }

      // Priorizar câmera traseira principal (1.0x) evitando ultra-wide (0.5x)
      let selectedIndex = currentCameraIndex
      if (devices.length > 1 && currentCameraIndex === 0) {
        const mainRearIndex = devices.findIndex(d => {
          const label = d.label.toLowerCase()
          const isRear = label.includes('back') || label.includes('rear') || label.includes('traseira') || label.includes('environment') || label.includes('0')
          const isUltraWide = label.includes('ultra') || label.includes('0.5') || label.includes('0,5') || label.includes('wide angle') || label.includes('wideangle')
          return isRear && !isUltraWide
        })
        if (mainRearIndex !== -1) {
          selectedIndex = mainRearIndex
        }
      }

      const deviceId = devices[selectedIndex]?.deviceId

      await reader.decodeFromVideoDevice(
        deviceId,
        videoRef.current!,
        (result, err) => {
          if (result && !detected) {
            setDetected(true)
            // Vibração tátil se disponível
            if ('vibrate' in navigator) navigator.vibrate(100)
            onDetected(result.getText())
          }
          if (err && !(err instanceof Error && err.message.includes('No MultiFormat Readers'))) {
            console.debug('Scanner error:', err)
          }
        }
      )

      setIsLoading(false)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao acessar câmera'
      if (msg.includes('Permission') || msg.includes('NotAllowed')) {
        setError('Permissão de câmera negada. Habilite nas configurações do navegador.')
      } else {
        setError('Não foi possível iniciar a câmera. Verifique as permissões.')
      }
      setIsLoading(false)
    }
  }

  function stopScanner() {
    // Stop all tracks on the video element
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
    readerRef.current = null
  }

  function switchCamera() {
    stopScanner()
    setCurrentCameraIndex((prev) => (prev + 1) % cameras.length)
  }

  return (
    <div className={cn(
      'fixed inset-0 z-50 bg-black flex flex-col',
      className
    )}>
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 safe-pt">
        <button onClick={onClose} className="btn-icon bg-black/50 text-white backdrop-blur-sm">
          <X className="w-5 h-5" />
        </button>
        <div className="text-center">
          <p className="text-white text-sm font-medium">Escanear Patrimônio</p>
          <p className="text-white/60 text-xs">Aponte para o código de barras</p>
        </div>
        {cameras.length > 1 && (
          <button onClick={switchCamera} className="btn-icon bg-black/50 text-white backdrop-blur-sm">
            <SwitchCamera className="w-5 h-5" />
          </button>
        )}
        {cameras.length <= 1 && <div className="w-10" />}
      </div>

      {/* Video */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        playsInline
        muted
      />

      {/* Overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {/* Escurecer bordas */}
        <div className="absolute inset-0 bg-black/50" />

        {/* Frame central */}
        <div className="relative z-10">
          {/* Janela transparente */}
          <div className="w-72 h-48 relative">
            {/* Cantos */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary rounded-tl-lg" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary rounded-tr-lg" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary rounded-bl-lg" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary rounded-br-lg" />

            {/* Linha de scan */}
            {!detected && (
              <div className="scanner-line" />
            )}

            {/* Confirmação de leitura */}
            {detected && (
              <div className="absolute inset-0 flex items-center justify-center bg-status-validado/20 rounded-lg border-2 border-status-validado">
                <div className="text-status-validado text-center">
                  <div className="text-3xl mb-1">✓</div>
                  <p className="text-sm font-medium">Lido!</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="absolute inset-0 bg-black flex items-center justify-center z-20">
          <div className="text-center text-white">
            <Camera className="w-12 h-12 mx-auto mb-3 opacity-50 animate-pulse" />
            <p className="text-sm">Iniciando câmera...</p>
          </div>
        </div>
      )}

      {/* Erro */}
      {error && (
        <div className="absolute inset-0 bg-black flex items-center justify-center z-20 p-6">
          <div className="text-center text-white max-w-xs">
            <Camera className="w-12 h-12 mx-auto mb-3 text-status-danger opacity-70" />
            <p className="text-sm text-white/80 mb-4">{error}</p>
            <button onClick={startScanner} className="btn-primary btn-sm mr-2">
              Tentar novamente
            </button>
            <button onClick={onClose} className="btn-secondary btn-sm">
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 pb-safe-area bg-gradient-to-t from-black/80 to-transparent safe-pb">
        <p className="text-center text-white/50 text-xs">
          Aponte para o código de barras ou QR Code
        </p>
      </div>
    </div>
  )
}
