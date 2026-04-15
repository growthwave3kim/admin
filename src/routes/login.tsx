import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { zodResolver } from '@hookform/resolvers/zod'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { Eye, EyeOff } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

const SAVED_ID_KEY = 'growthwave_saved_id'

const loginSchema = z.object({
  id: z.string().min(1, '아이디를 입력해주세요'),
  password: z.string().min(1, '비밀번호를 입력해주세요'),
})

type LoginForm = z.infer<typeof loginSchema>

const idToEmail = (id: string): string => {
  if (id.includes('@')) return id
  return `${id}@growthwave.kr`
}

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(
    () => !!localStorage.getItem(SAVED_ID_KEY),
  )

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      id: localStorage.getItem(SAVED_ID_KEY) ?? '',
      password: '',
    },
  })

  useEffect(() => {
    if (!rememberMe) localStorage.removeItem(SAVED_ID_KEY)
  }, [rememberMe])

  const handleSubmit = async (data: LoginForm) => {
    setIsLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email: idToEmail(data.id),
      password: data.password,
    })
    setIsLoading(false)

    if (error) {
      toast.error('로그인 실패: 아이디 또는 비밀번호를 확인해주세요')
      return
    }

    if (rememberMe) localStorage.setItem(SAVED_ID_KEY, data.id)
    else localStorage.removeItem(SAVED_ID_KEY)

    router.navigate({ to: '/dashboard' })
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#0a0a0f] flex-col items-center justify-center p-12">
        {/* Ambient blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-purple-600/20 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-violet-500/15 blur-[100px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-indigo-600/10 blur-[80px] pointer-events-none" />

        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center text-center gap-8">
          <img
            src="/logo.png"
            alt="GrowthWave"
            className="h-16 w-auto object-contain brightness-0 invert drop-shadow-[0_0_24px_rgba(168,85,247,0.5)]"
          />
          <div className="space-y-3">
            <h1 className="text-4xl font-semibold tracking-tight text-white">
              GrowthWave
            </h1>
            <p className="text-base text-white/40 max-w-xs leading-relaxed">
              팀의 성장을 함께 설계하는
              <br />
              업무 관리 플랫폼
            </p>
          </div>
        </div>

        {/* Bottom watermark */}
        <p className="absolute bottom-8 text-xs text-white/15 tracking-widest uppercase">
          © 2025 GrowthWave
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile logo */}
          <div className="flex lg:hidden justify-center">
            <img
              src="/logo.png"
              alt="GrowthWave"
              className="h-10 w-auto object-contain"
            />
          </div>

          <div className="space-y-1.5">
            <div className="text-2xl font-semibold tracking-tight text-gray-900">
              오늘도 파이팅이에요 👋
            </div>
            <div className="text-sm text-gray-400">
              로그인하고 업무를 시작해보세요
            </div>
          </div>

          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-5"
          >
            <div className="space-y-1.5">
              <Label htmlFor="id" className="text-sm font-medium text-gray-700">
                아이디
              </Label>
              <Input
                id="id"
                placeholder="아이디를 입력하세요"
                autoComplete="username"
                className="h-11 rounded-xl border-gray-200 bg-gray-50 px-4 text-sm placeholder:text-gray-300 focus-visible:ring-purple-500/40 focus-visible:border-purple-400 transition"
                {...form.register('id')}
              />
              {form.formState.errors.id && (
                <p className="text-xs text-red-500">
                  {form.formState.errors.id.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="password"
                className="text-sm font-medium text-gray-700"
              >
                비밀번호
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="비밀번호를 입력하세요"
                  autoComplete="current-password"
                  className="h-11 rounded-xl border-gray-200 bg-gray-50 px-4 pr-11 text-sm placeholder:text-gray-300 focus-visible:ring-purple-500/40 focus-visible:border-purple-400 transition"
                  {...form.register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {form.formState.errors.password && (
                <p className="text-xs text-red-500">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => setRememberMe((v) => !v)}
              className="flex items-center gap-2 group w-fit"
            >
              <span
                className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${rememberMe ? 'bg-purple-600 border-purple-600' : 'bg-white border-gray-300'}`}
              >
                {rememberMe && (
                  <svg
                    className="w-2.5 h-2.5 text-white"
                    viewBox="0 0 10 8"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M1 4l2.5 2.5L9 1"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </span>
              <span className="text-sm text-gray-500 select-none group-hover:text-gray-700 transition-colors">
                아이디 저장
              </span>
            </button>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] active:bg-[#5b21b6] text-white text-sm font-medium shadow-lg shadow-purple-500/25 transition-all duration-150 disabled:opacity-60"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  로그인 중...
                </span>
              ) : (
                '로그인'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
