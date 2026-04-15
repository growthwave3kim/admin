# GrowthWave Admin — 코드 컨벤션

## 컴포넌트 선언

- **Route 페이지 컴포넌트**: `function PageName()` — TanStack Router의 `Route`가 파일 상단에서 컴포넌트를 참조하므로 호이스팅 필요
- **일반/공통 컴포넌트**: `export const ComponentName = () => {}`
- **shadcn UI (`src/components/ui/`)**: 건드리지 않음

## 폴더 구조

```
src/
  routes/           # TanStack Router 파일 기반 라우트 (페이지만)
  features/
    tasks/
      queries.ts    # Supabase API 호출
      types.ts      # 타입 + 상수 (TASK_STATUS_LABELS 등)
      TaskForm.tsx  # feature 전용 컴포넌트
    marketing-types/
      queries.ts
  components/
    common/         # 2개 이상 feature에서 공유하는 컴포넌트
    layout/         # LNB, Header 등 레이아웃
    ui/             # shadcn (수정 금지)
  hooks/            # 전역 공유 훅 (useTheme 등)
  lib/              # supabase, queryClient, utils
```

## 훅 분리 기준

- 로직이 `useState`/`useQuery` 조합 3개 이상이고 재사용 가능하면 `useXxx.ts`로 분리
- feature 전용: `src/features/xxx/useXxx.ts`
- 전역 공유: `src/hooks/useXxx.ts`

## API / Queries 규칙

- Supabase 호출은 반드시 `features/xxx/queries.ts`에만
- 컴포넌트/훅에서 직접 `supabase.from()` 금지
- 함수명: `fetchXxx`, `createXxx`, `updateXxx`, `deleteXxx`

## 타입

- `type` 통일 — `interface` 사용 금지
- 스키마(`z.object`): 사용하는 파일에 같이 둠 (별도 schema 파일 X)
- 상수(enum성): `types.ts`에 같이 선언

## 네이밍

- boolean state: `isXxx`, `hasXxx`
- 핸들러: `handleXxx`
- named export만 — default export 금지

## 파일 내 컴포넌트 분리

- 해당 파일 전용 서브컴포넌트: 같은 파일에 둠 (e.g., `KanbanColumn`, `SortableItem`)
- 2개 이상 페이지/feature에서 사용: `components/common/`으로 분리

## shadcn / base-ui 오버라이드

- `DialogTitle` 등 base-ui 컴포넌트는 자체 스타일을 주입함
- `dialog.tsx` 등 `components/ui/` 파일에서 기본 스타일을 `!` 포함하여 정의해 두면 사용처에서 `!` 불필요
- 사용처에서 `!` 를 반복 사용해야 하는 경우 → 기반 컴포넌트 수정으로 해결

## 에러 처리

- 에러 토스트: `onError: () => toast.error('...')` 패턴 통일
- 성공 토스트: `onSuccess: () => toast.success('...')`
