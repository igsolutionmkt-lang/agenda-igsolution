import { useRef, useState } from 'react'
import { Upload, Loader2, X } from 'lucide-react'
import { uploadImage } from '../../lib/supabase'

interface Props {
  value?: string
  onChange: (url: string) => void
  folder: string
  shape?: 'circle' | 'square' | 'wide'
  label?: string
}

const MAX_MB = 5

export default function ImageUpload({ value, onChange, folder, shape = 'square', label }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const sizeCls = shape === 'circle' ? 'w-20 h-20 rounded-full' : shape === 'wide' ? 'w-full h-32 rounded-lg' : 'w-20 h-20 rounded-lg'

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > MAX_MB * 1024 * 1024) { setError(`Máx. ${MAX_MB}MB`); return }
    setError(''); setLoading(true)
    try {
      const url = await uploadImage(file, folder)
      onChange(url)
    } catch {
      setError('Erro no upload')
    }
    setLoading(false)
  }

  return (
    <div>
      {label && <label className="text-xs text-gray-500 mb-1 block">{label}</label>}
      <div className="flex items-center gap-3">
        <div className={`${sizeCls} bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center relative shrink-0`}>
          {loading
            ? <Loader2 size={20} className="text-gray-400 animate-spin" />
            : value
              ? <img src={value} alt="" className="w-full h-full object-cover" />
              : <Upload size={18} className="text-gray-300" />
          }
          {value && !loading && (
            <button type="button" onClick={() => onChange('')} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5 hover:bg-black/70">
              <X size={12} />
            </button>
          )}
        </div>
        <div>
          <button type="button" onClick={() => inputRef.current?.click()} disabled={loading} className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50">
            {value ? 'Trocar imagem' : 'Carregar imagem'}
          </button>
          {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
        <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
      </div>
    </div>
  )
}
