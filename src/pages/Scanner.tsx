import { useNavigate } from 'react-router-dom'
import { BarcodeScanner } from '@/components/scanner/BarcodeScanner'

export default function ScannerPage() {
  const navigate = useNavigate()

  function handleDetected(code: string) {
    // Ao detectar o código, navega diretamente para a tela de cadastro com o patrimônio preenchido
    navigate(`/cadastro?patrimonio=${encodeURIComponent(code)}`, { replace: true })
  }

  function handleClose() {
    navigate('/inventario', { replace: true })
  }

  return (
    <BarcodeScanner
      onDetected={handleDetected}
      onClose={handleClose}
    />
  )
}
