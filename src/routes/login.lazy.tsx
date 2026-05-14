import { zodResolver } from '@hookform/resolvers/zod'
import { createLazyFileRoute, useRouter } from '@tanstack/react-router'
import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { signIn } from '@/features/auth/queries'
import { writeCurrentMember } from '@/features/auth/useCurrentMember'
import { useMembers } from '@/features/members/useMembers'

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
  const [isRememberMember, setIsRememberMember] = useState(() => !!localStorage.getItem(SAVED_MEMBER_ID_KEY))

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
    <div className="flex min-h-screen">
      {/* Left panel — branding */}
      <div className="relative hidden flex-col items-center justify-center overflow-hidden bg-[#0a0a0f] p-12 lg:flex lg:w-1/2">
        <div className="pointer-events-none absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-white/5 blur-[120px]" />
        <div className="pointer-events-none absolute right-[-10%] bottom-[-10%] h-[400px] w-[400px] rounded-full bg-violet-500/15 blur-[100px]" />
        <div className="pointer-events-none absolute top-1/2 left-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/10 blur-[80px]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div className="relative z-10 flex flex-col items-center gap-8 text-center">
          <img
            src="/logo.png"
            alt="GrowthWave"
            width={64}
            height={64}
            className="h-16 w-auto object-contain brightness-0 drop-shadow-[0_0_24px_rgba(255,255,255,0.2)] invert"
          />
          <div className="space-y-3">
            <h1 className="font-semibold text-4xl text-white tracking-tight">GrowthWave</h1>
            <p className="max-w-xs text-base text-white/40 leading-relaxed">
              팀의 성장을 함께 설계하는
              <br />
              업무 관리 플랫폼
            </p>
          </div>
        </div>
        <p className="absolute bottom-8 text-white/15 text-xs uppercase tracking-widest">© 2025 GrowthWave</p>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-sm space-y-8">
          <div className="flex justify-center lg:hidden">
            <img src="/logo.png" alt="GrowthWave" width={40} height={40} className="h-10 w-auto object-contain" />
          </div>

          <div className="space-y-1.5">
            <div className="font-semibold text-2xl text-gray-900 tracking-tight">오늘도 파이팅이에요 👋</div>
            <div className="text-gray-500 text-sm">본인을 선택하고 업무를 시작해보세요</div>
          </div>

          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
            <div className="space-y-1.5">
              <Label className="font-medium text-gray-700 text-sm">멤버 선택</Label>
              <Select
                value={form.watch('memberId') || null}
                onValueChange={(v) => form.setValue('memberId', v ?? '', { shouldValidate: true })}
                items={Object.fromEntries(members.map((m) => [m.id, m.name]))}
              >
                <SelectTrigger className="h-11 w-full rounded-xl border-gray-300 bg-gray-50 px-4 text-gray-900 text-sm transition focus:border-gray-500 focus:ring-gray-400/40">
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
                <p className="text-red-500 text-xs">{form.formState.errors.memberId.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="font-medium text-gray-700 text-sm">
                비밀번호
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={isShowPassword ? 'text' : 'password'}
                  placeholder="비밀번호를 입력하세요"
                  autoComplete="current-password"
                  className="h-11 rounded-xl border-gray-300 bg-gray-50 px-4 pr-11 text-gray-900 text-sm transition placeholder:text-gray-400 focus-visible:border-gray-500 focus-visible:ring-gray-400/40"
                  {...form.register('password')}
                />
                <button
                  type="button"
                  onClick={() => setIsShowPassword((v) => !v)}
                  aria-label={isShowPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600"
                  tabIndex={-1}
                >
                  {isShowPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {form.formState.errors.password && (
                <p className="text-red-500 text-xs">{form.formState.errors.password.message}</p>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsRememberMember((v) => !v)}
              className="group flex w-fit items-center gap-2"
            >
              <span
                className={`flex h-4 w-4 items-center justify-center rounded border transition-colors ${isRememberMember ? 'border-gray-900 bg-gray-900' : 'border-gray-300 bg-white'}`}
              >
                {isRememberMember && (
                  <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 10 8" fill="none" aria-hidden="true">
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
              <span className="select-none text-gray-500 text-sm transition-colors group-hover:text-gray-700">
                멤버 저장
              </span>
            </button>

            <Button
              type="submit"
              disabled={isLoading}
              className="h-11 w-full rounded-xl bg-gray-900 font-medium text-sm text-white shadow-lg transition-all duration-150 hover:bg-gray-800 active:bg-gray-700 disabled:opacity-60"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
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
