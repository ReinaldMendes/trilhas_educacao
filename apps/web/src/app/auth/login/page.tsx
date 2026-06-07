'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Leaf, Footprints } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '@/lib/auth'
import { cn } from '@/lib/utils'

const schema = z.object({
  email:    z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})
type FormData = z.infer<typeof schema>

const roles = [
  { value: 'professor',   label: 'Professora',   emoji: '👩‍🏫', color: 'bg-brand-green-light border-brand-green text-brand-green-dark' },
  { value: 'coordenador', label: 'Coordenação',  emoji: '👩‍💼', color: 'bg-brand-salmon-light border-brand-salmon text-red-700' },
  { value: 'diretora',    label: 'Diretora',     emoji: '🏫',  color: 'bg-brand-lavender-light border-brand-lavender text-purple-700' },
  { value: 'sme',         label: 'SME',          emoji: '🏛️',  color: 'bg-brand-yellow-light border-brand-yellow text-yellow-700' },
]

export default function LoginPage() {
  const { login } = useAuth()
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    setLoading(true)
    try {
      await login(data.email, data.password)
      toast.success('Bem-vinda de volta! 🌿')
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Credenciais inválidas'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-brand-cream footprint-bg flex">

      {/* ── Left panel (decorative) ──────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-trilhas flex-col items-center justify-center p-12 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-[-80px] left-[-80px] w-72 h-72 bg-white/10 rounded-full" />
        <div className="absolute bottom-[-60px] right-[-60px] w-56 h-56 bg-white/10 rounded-full" />
        <div className="absolute top-1/3 right-[-40px] w-32 h-32 bg-white/10 rounded-full" />

        {/* Logo illustration area */}
        <div className="relative z-10 flex flex-col items-center text-white text-center">
          <div className="w-40 h-40 bg-white/20 rounded-full flex items-center justify-center mb-8 shadow-float animate-float">
            <span className="text-7xl select-none">👣</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight mb-2 drop-shadow">
            Trilhas da Infância
          </h1>
          <p className="text-white/80 text-lg font-medium mb-8">
            Mapeando vivências, valorizando percursos
          </p>
          <div className="grid grid-cols-2 gap-4 max-w-sm">
            {[
              { emoji: '📋', label: 'Planejamento' },
              { emoji: '📸', label: 'Registros' },
              { emoji: '✨', label: 'Pareceres com IA' },
              { emoji: '📊', label: 'Indicadores' },
            ].map((item) => (
              <div key={item.label} className="bg-white/15 rounded-2xl p-4 flex items-center gap-3 backdrop-blur-sm">
                <span className="text-2xl">{item.emoji}</span>
                <span className="text-sm font-semibold text-white">{item.label}</span>
              </div>
            ))}
          </div>
          <p className="mt-10 text-white/60 text-sm font-medium italic">
            "Cada passo, cada registro, cada olhar...<br />
            Juntos, construímos percursos que transformam infâncias."
          </p>
        </div>
      </div>

      {/* ── Right panel (form) ───────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md animate-slide-up">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-trilhas rounded-2xl flex items-center justify-center shadow-soft">
              <Footprints className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-black text-xl text-brand-green-dark">Trilhas da Infância</p>
              <p className="text-xs text-text-muted">Gestão Pedagógica</p>
            </div>
          </div>

          {/* Card */}
          <div className="card">
            <div className="mb-8">
              <h2 className="text-2xl font-black text-text-primary mb-1">Bem-vinda! 🌿</h2>
              <p className="text-sm text-text-secondary">Faça login para acessar sua plataforma</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

              {/* Email */}
              <div>
                <label className="label">E-mail</label>
                <input
                  {...register('email')}
                  type="email"
                  placeholder="seu@email.com"
                  className={cn('input', errors.email && 'input-error')}
                  autoComplete="email"
                />
                {errors.email && (
                  <p className="text-xs text-red-500 mt-1 font-medium">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="label">Senha</label>
                <div className="relative">
                  <input
                    {...register('password')}
                    type={showPw ? 'text' : 'password'}
                    placeholder="••••••••"
                    className={cn('input pr-12', errors.password && 'input-error')}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-500 mt-1 font-medium">{errors.password.message}</p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-base"
              >
                {loading ? (
                  <>
                    <span className="spinner border-white/30 border-t-white" />
                    Entrando...
                  </>
                ) : (
                  <>
                    <Leaf className="w-4 h-4" />
                    Entrar
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-brand-gray-light" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-xs text-text-muted font-medium">PERFIS DE ACESSO</span>
              </div>
            </div>

            {/* Role pills */}
            <div className="grid grid-cols-2 gap-2">
              {roles.map((r) => (
                <div
                  key={r.value}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold',
                    r.color
                  )}
                >
                  <span>{r.emoji}</span>
                  {r.label}
                </div>
              ))}
            </div>

            <p className="text-xs text-text-muted text-center mt-5">
              Problemas de acesso? Fale com seu coordenador ou a SME.
            </p>
          </div>

          {/* Dev hint */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 p-4 bg-brand-yellow-light border border-brand-yellow rounded-xl text-xs text-yellow-800">
              <p className="font-bold mb-1">🔑 Credenciais de teste:</p>
              <p>prof@trilhas.edu.br / Trilhas@2026</p>
              <p>coord@trilhas.edu.br / Trilhas@2026</p>
              <p>diretora@trilhas.edu.br / Trilhas@2026</p>
              <p>sme@trilhas.edu.br / Trilhas@2026</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
