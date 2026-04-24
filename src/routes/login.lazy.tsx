import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { signIn } from '@/features/auth/queries'
import { writeCurrentMember } from '@/features/auth/useCurrentMember'
import { useMembers } from '@/features/members/useMembers'
import { zodResolver } from '@hookform/resolvers/zod'
import { createLazyFileRoute, useRouter } from '@tanstack/react-router'
import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

const SHARED_ACCOUNT_EMAIL = 'growthwave@growthwave.kr'
const SAVED_MEMBER_ID_KEY = 'growthwave_saved_member_id'

const loginSchema = z.object({
  memberId: z.string().min(1, '멤버를 선택해주세요'),
  password: z.string().min(1, '비밀번호를 입력해주세요'),
})

type LoginForm = z.infer<typeof loginSchema>

export const Route = createLazyFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  const router = useRouter()
  const { data: members = [] } = useMembers()
  const [isLoading, setIsLoading] = useState(false)
  const [isShowPassword, setIsShowPassword] = useState(false)
  const [isRememberMember, setIsRememberMember] = useState(
    () => !!localStorage.getItem(SAVED_MEMBER_ID_KEY),
  )

  const savedMemberId = localStorage.getItem(SAVED_MEMBER_ID_KEY) ?? ''

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      memberId: savedMemberId,
      password: '',
    },
  })

  const handleSubmit = async (data: LoginForm) => {
    const selectedMember = members.find((m) => m.id === data.memberId)
    if (!selectedMember) {
      toast.error('멤버를 선택해주세요')
      return
    }

    setIsLoading(true)
    try {
      await signIn(SHARED_ACCOUNT_EMAIL, data.password)
    } catch {
      setIsLoading(false)
      toast.error('로그인 실패: 비밀번호를 확인해주세요')
      return
    }

    writeCurrentMember({ id: selectedMember.id, name: selectedMember.name })

    if (isRememberMember) {
      localStorage.setItem(SAVED_MEMBER_ID_KEY, selectedMember.id)
    } else {
      localStorage.removeItem(SAVED_MEMBER_ID_KEY)
    }

    setIsLoading(false)
    router.navigate({ to: '/dashboard' })
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#0a0a0f] flex-col items-center justify-center p-12">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-white/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-violet-500/15 blur-[100px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-indigo-600/10 blur-[80px] pointer-events-none" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div className="relative z-10 flex flex-col items-center text-center gap-8">
          <img
            src="/logo.png"
            alt="GrowthWave"
            width={64}
            height={64}
            className="h-16 w-auto object-contain brightness-0 invert drop-shadow-[0_0_24px_rgba(255,255,255,0.2)]"
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
        <p className="absolute bottom-8 text-xs text-white/15 tracking-widest uppercase">
          © 2025 GrowthWave
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-sm space-y-8">
          <div className="flex lg:hidden justify-center">
            <img
              src="/logo.png"
              alt="GrowthWave"
              width={40}
              height={40}
              className="h-10 w-auto object-contain"
            />
          </div>

          <div className="space-y-1.5">
            <div className="text-2xl font-semibold tracking-tight text-gray-900">
              오늘도 파이팅이에요 👋
            </div>
            <div className="text-sm text-gray-500">
              본인을 선택하고 업무를 시작해보세요
            </div>
          </div>

          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-5"
          >
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">
                멤버 선택
              </Label>
              <Select
                value={form.watch('memberId') || null}
                onValueChange={(v) =>
                  form.setValue('memberId', v ?? '', { shouldValidate: true })
                }
                items={Object.fromEntries(members.map((m) => [m.id, m.name]))}
              >
                <SelectTrigger className="w-full h-11 rounded-xl border-gray-300 bg-gray-50 px-4 text-sm text-gray-900 focus:ring-gray-400/40 focus:border-gray-500 transition">
                  <SelectValue placeholder="접속할 유저를 선택해주세요" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.memberId && (
                <p className="text-xs text-red-500">
                  {form.formState.errors.memberId.message}
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
                  type={isShowPassword ? 'text' : 'password'}
                  placeholder="비밀번호를 입력하세요"
                  autoComplete="current-password"
                  className="h-11 rounded-xl border-gray-300 bg-gray-50 px-4 pr-11 text-sm text-gray-900 placeholder:text-gray-400 focus-visible:ring-gray-400/40 focus-visible:border-gray-500 transition"
                  {...form.register('password')}
                />
                <button
                  type="button"
                  onClick={() => setIsShowPassword((v) => !v)}
                  aria-label={
                    isShowPassword ? '비밀번호 숨기기' : '비밀번호 보기'
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {isShowPassword ? (
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
              onClick={() => setIsRememberMember((v) => !v)}
              className="flex items-center gap-2 group w-fit"
            >
              <span
                className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${isRememberMember ? 'bg-gray-900 border-gray-900' : 'bg-white border-gray-300'}`}
              >
                {isRememberMember && (
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
                멤버 저장
              </span>
            </button>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 rounded-xl bg-gray-900 hover:bg-gray-800 active:bg-gray-700 text-white text-sm font-medium shadow-lg transition-all duration-150 disabled:opacity-60"
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
