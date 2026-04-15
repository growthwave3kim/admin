import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { TaskStatusBadge } from '@/features/tasks/TaskStatusBadge'
import {
  deleteTask,
  fetchTasks,
  updateTaskStatus,
} from '@/features/tasks/queries'
import {
  TASK_STATUS_LABELS,
  type Task,
  type TaskStatus,
} from '@/features/tasks/types'
import { cn } from '@/lib/utils'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils'
import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Link,
  createFileRoute,
  useNavigate,
  useRouter,
} from '@tanstack/react-router'
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronsUpDown,
  Columns,
  List,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'

const MOCK_TASKS: Task[] = [
  {
    id: 'm01',
    company_name: '강남 카페 블루문',
    received_amount: 650000,
    execution_cost: 420000,
    profit: 230000,
    status: 'done_settled',
    start_date: '2025-10-05',
    end_date: '2025-10-30',
    note: '재계약 가능성 높음',
    created_at: '2025-10-05T00:00:00Z',
    updated_at: '2025-10-05T00:00:00Z',
    task_marketings: [
      {
        id: 'mm01',
        task_id: 'm01',
        marketing_type_id: '',
        count: 5,
        marketing_types: {
          id: '',
          name: '블로그 체험단',
          sort_order: 3,
          created_at: '',
        },
      },
      {
        id: 'mm02',
        task_id: 'm01',
        marketing_type_id: '',
        count: 3,
        marketing_types: {
          id: '',
          name: '인스타그램 바이럴',
          sort_order: 4,
          created_at: '',
        },
      },
    ],
  },
  {
    id: 'm02',
    company_name: '홍대 파스타 하우스',
    received_amount: 880000,
    execution_cost: 540000,
    profit: 340000,
    status: 'in_progress',
    start_date: '2025-11-01',
    end_date: null,
    note: '월 정기 진행',
    created_at: '2025-11-01T00:00:00Z',
    updated_at: '2025-11-01T00:00:00Z',
    task_marketings: [
      {
        id: 'mm03',
        task_id: 'm02',
        marketing_type_id: '',
        count: 10,
        marketing_types: {
          id: '',
          name: '카페 바이럴',
          sort_order: 1,
          created_at: '',
        },
      },
    ],
  },
  {
    id: 'm03',
    company_name: '분당 네일아트 살롱',
    received_amount: 450000,
    execution_cost: 280000,
    profit: 170000,
    status: 'done_settled',
    start_date: '2025-10-15',
    end_date: '2025-11-10',
    note: '',
    created_at: '2025-10-15T00:00:00Z',
    updated_at: '2025-10-15T00:00:00Z',
    task_marketings: [],
  },
  {
    id: 'm04',
    company_name: '서초 헬스케어 클리닉',
    received_amount: 1200000,
    execution_cost: 750000,
    profit: 450000,
    status: 'done_unsettled',
    start_date: '2025-11-10',
    end_date: '2025-12-05',
    note: '정산 11월 말 예정',
    created_at: '2025-11-10T00:00:00Z',
    updated_at: '2025-11-10T00:00:00Z',
    task_marketings: [
      {
        id: 'mm04',
        task_id: 'm04',
        marketing_type_id: '',
        count: 8,
        marketing_types: {
          id: '',
          name: '블로그 기자단',
          sort_order: 2,
          created_at: '',
        },
      },
    ],
  },
  {
    id: 'm05',
    company_name: '마포 브런치 카페',
    received_amount: 320000,
    execution_cost: 190000,
    profit: 130000,
    status: 'done_settled',
    start_date: '2025-09-20',
    end_date: '2025-10-05',
    note: '',
    created_at: '2025-09-20T00:00:00Z',
    updated_at: '2025-09-20T00:00:00Z',
    task_marketings: [],
  },
  {
    id: 'm06',
    company_name: '이태원 버거랩',
    received_amount: 780000,
    execution_cost: 480000,
    profit: 300000,
    status: 'in_progress',
    start_date: '2025-12-01',
    end_date: null,
    note: '유튜버 연계 검토 중',
    created_at: '2025-12-01T00:00:00Z',
    updated_at: '2025-12-01T00:00:00Z',
    task_marketings: [
      {
        id: 'mm05',
        task_id: 'm06',
        marketing_type_id: '',
        count: 5,
        marketing_types: {
          id: '',
          name: '인스타그램 바이럴',
          sort_order: 4,
          created_at: '',
        },
      },
    ],
  },
  {
    id: 'm07',
    company_name: '신촌 치킨왕',
    received_amount: 540000,
    execution_cost: 330000,
    profit: 210000,
    status: 'done_settled',
    start_date: '2025-10-01',
    end_date: '2025-10-28',
    note: '',
    created_at: '2025-10-01T00:00:00Z',
    updated_at: '2025-10-01T00:00:00Z',
    task_marketings: [],
  },
  {
    id: 'm08',
    company_name: '송파 케이크공방',
    received_amount: 390000,
    execution_cost: 240000,
    profit: 150000,
    status: 'done_settled',
    start_date: '2025-09-10',
    end_date: '2025-09-30',
    note: '',
    created_at: '2025-09-10T00:00:00Z',
    updated_at: '2025-09-10T00:00:00Z',
    task_marketings: [],
  },
  {
    id: 'm09',
    company_name: '강서 피부과',
    received_amount: 1500000,
    execution_cost: 900000,
    profit: 600000,
    status: 'in_progress',
    start_date: '2025-12-05',
    end_date: null,
    note: '장기계약 3개월',
    created_at: '2025-12-05T00:00:00Z',
    updated_at: '2025-12-05T00:00:00Z',
    task_marketings: [
      {
        id: 'mm06',
        task_id: 'm09',
        marketing_type_id: '',
        count: 1,
        marketing_types: {
          id: '',
          name: '네이버 키워드 광고',
          sort_order: 9,
          created_at: '',
        },
      },
    ],
  },
  {
    id: 'm10',
    company_name: '목동 필라테스',
    received_amount: 420000,
    execution_cost: 260000,
    profit: 160000,
    status: 'done_settled',
    start_date: '2025-10-20',
    end_date: '2025-11-15',
    note: '',
    created_at: '2025-10-20T00:00:00Z',
    updated_at: '2025-10-20T00:00:00Z',
    task_marketings: [],
  },
  {
    id: 'm11',
    company_name: '잠실 삼겹살 명가',
    received_amount: 690000,
    execution_cost: 420000,
    profit: 270000,
    status: 'done_unsettled',
    start_date: '2025-11-15',
    end_date: '2025-12-10',
    note: '대표 연락 안됨',
    created_at: '2025-11-15T00:00:00Z',
    updated_at: '2025-11-15T00:00:00Z',
    task_marketings: [
      {
        id: 'mm07',
        task_id: 'm11',
        marketing_type_id: '',
        count: 8,
        marketing_types: {
          id: '',
          name: '카페 바이럴',
          sort_order: 1,
          created_at: '',
        },
      },
    ],
  },
  {
    id: 'm12',
    company_name: '노원 미용실 어반컷',
    received_amount: 310000,
    execution_cost: 185000,
    profit: 125000,
    status: 'done_settled',
    start_date: '2025-08-15',
    end_date: '2025-09-05',
    note: '',
    created_at: '2025-08-15T00:00:00Z',
    updated_at: '2025-08-15T00:00:00Z',
    task_marketings: [],
  },
  {
    id: 'm13',
    company_name: '판교 IT 스타트업',
    received_amount: 950000,
    execution_cost: 580000,
    profit: 370000,
    status: 'in_progress',
    start_date: '2025-12-10',
    end_date: null,
    note: 'B2B 콘텐츠 중심',
    created_at: '2025-12-10T00:00:00Z',
    updated_at: '2025-12-10T00:00:00Z',
    task_marketings: [
      {
        id: 'mm08',
        task_id: 'm13',
        marketing_type_id: '',
        count: 5,
        marketing_types: {
          id: '',
          name: '블로그 기자단',
          sort_order: 2,
          created_at: '',
        },
      },
    ],
  },
  {
    id: 'm14',
    company_name: '상암 빈티지 카페',
    received_amount: 280000,
    execution_cost: 170000,
    profit: 110000,
    status: 'done_settled',
    start_date: '2025-09-01',
    end_date: '2025-09-20',
    note: '',
    created_at: '2025-09-01T00:00:00Z',
    updated_at: '2025-09-01T00:00:00Z',
    task_marketings: [],
  },
  {
    id: 'm15',
    company_name: '여의도 프리미엄 스파',
    received_amount: 1800000,
    execution_cost: 1100000,
    profit: 700000,
    status: 'in_progress',
    start_date: '2026-01-01',
    end_date: null,
    note: 'VIP 고객 타겟',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    task_marketings: [
      {
        id: 'mm09',
        task_id: 'm15',
        marketing_type_id: '',
        count: 10,
        marketing_types: {
          id: '',
          name: '인스타그램 바이럴',
          sort_order: 4,
          created_at: '',
        },
      },
    ],
  },
  {
    id: 'm16',
    company_name: '건대 스터디카페 포커스',
    received_amount: 360000,
    execution_cost: 220000,
    profit: 140000,
    status: 'done_settled',
    start_date: '2025-10-10',
    end_date: '2025-10-31',
    note: '',
    created_at: '2025-10-10T00:00:00Z',
    updated_at: '2025-10-10T00:00:00Z',
    task_marketings: [],
  },
  {
    id: 'm17',
    company_name: '구로 방탈출 이스케이프',
    received_amount: 500000,
    execution_cost: 310000,
    profit: 190000,
    status: 'done_unsettled',
    start_date: '2025-11-20',
    end_date: '2025-12-20',
    note: '정산 1월 예정',
    created_at: '2025-11-20T00:00:00Z',
    updated_at: '2025-11-20T00:00:00Z',
    task_marketings: [],
  },
  {
    id: 'm18',
    company_name: '관악 프리미엄 정육점',
    received_amount: 430000,
    execution_cost: 265000,
    profit: 165000,
    status: 'done_settled',
    start_date: '2025-09-25',
    end_date: '2025-10-20',
    note: '',
    created_at: '2025-09-25T00:00:00Z',
    updated_at: '2025-09-25T00:00:00Z',
    task_marketings: [],
  },
  {
    id: 'm19',
    company_name: '중구 한우 전문점',
    received_amount: 750000,
    execution_cost: 460000,
    profit: 290000,
    status: 'done_settled',
    start_date: '2025-10-05',
    end_date: '2025-11-01',
    note: '',
    created_at: '2025-10-05T00:00:00Z',
    updated_at: '2025-10-05T00:00:00Z',
    task_marketings: [
      {
        id: 'mm10',
        task_id: 'm19',
        marketing_type_id: '',
        count: 4,
        marketing_types: {
          id: '',
          name: '블로그 기자단',
          sort_order: 2,
          created_at: '',
        },
      },
    ],
  },
  {
    id: 'm20',
    company_name: '동대문 편집샵',
    received_amount: 580000,
    execution_cost: 355000,
    profit: 225000,
    status: 'not_started',
    start_date: '2026-02-01',
    end_date: null,
    note: '계약 완료 시작 대기',
    created_at: '2026-02-01T00:00:00Z',
    updated_at: '2026-02-01T00:00:00Z',
    task_marketings: [],
  },
  {
    id: 'm21',
    company_name: '성동 수제버거',
    received_amount: 340000,
    execution_cost: 210000,
    profit: 130000,
    status: 'done_settled',
    start_date: '2025-09-15',
    end_date: '2025-10-05',
    note: '',
    created_at: '2025-09-15T00:00:00Z',
    updated_at: '2025-09-15T00:00:00Z',
    task_marketings: [],
  },
  {
    id: 'm22',
    company_name: '마포 네일앤속눈썹',
    received_amount: 480000,
    execution_cost: 295000,
    profit: 185000,
    status: 'done_unsettled',
    start_date: '2025-12-01',
    end_date: '2025-12-28',
    note: '12월말 정산 예정',
    created_at: '2025-12-01T00:00:00Z',
    updated_at: '2025-12-01T00:00:00Z',
    task_marketings: [
      {
        id: 'mm11',
        task_id: 'm22',
        marketing_type_id: '',
        count: 5,
        marketing_types: {
          id: '',
          name: '인스타그램 바이럴',
          sort_order: 4,
          created_at: '',
        },
      },
    ],
  },
  {
    id: 'm23',
    company_name: '서대문 일식당',
    received_amount: 710000,
    execution_cost: 435000,
    profit: 275000,
    status: 'done_settled',
    start_date: '2025-10-20',
    end_date: '2025-11-15',
    note: '',
    created_at: '2025-10-20T00:00:00Z',
    updated_at: '2025-10-20T00:00:00Z',
    task_marketings: [],
  },
  {
    id: 'm24',
    company_name: '광진 수영장 아쿠아',
    received_amount: 1100000,
    execution_cost: 680000,
    profit: 420000,
    status: 'in_progress',
    start_date: '2026-01-15',
    end_date: null,
    note: '여름 시즌 사전 마케팅',
    created_at: '2026-01-15T00:00:00Z',
    updated_at: '2026-01-15T00:00:00Z',
    task_marketings: [
      {
        id: 'mm12',
        task_id: 'm24',
        marketing_type_id: '',
        count: 8,
        marketing_types: {
          id: '',
          name: '인스타그램 바이럴',
          sort_order: 4,
          created_at: '',
        },
      },
    ],
  },
  {
    id: 'm25',
    company_name: '양천 산후조리원',
    received_amount: 1350000,
    execution_cost: 820000,
    profit: 530000,
    status: 'done_settled',
    start_date: '2025-09-01',
    end_date: '2025-10-15',
    note: '',
    created_at: '2025-09-01T00:00:00Z',
    updated_at: '2025-09-01T00:00:00Z',
    task_marketings: [
      {
        id: 'mm13',
        task_id: 'm25',
        marketing_type_id: '',
        count: 7,
        marketing_types: {
          id: '',
          name: '블로그 기자단',
          sort_order: 2,
          created_at: '',
        },
      },
    ],
  },
  {
    id: 'm26',
    company_name: '영등포 와인바',
    received_amount: 560000,
    execution_cost: 345000,
    profit: 215000,
    status: 'done_unsettled',
    start_date: '2025-12-10',
    end_date: '2025-12-31',
    note: '연말 정산',
    created_at: '2025-12-10T00:00:00Z',
    updated_at: '2025-12-10T00:00:00Z',
    task_marketings: [],
  },
  {
    id: 'm27',
    company_name: '중랑 반려견 카페',
    received_amount: 385000,
    execution_cost: 235000,
    profit: 150000,
    status: 'done_settled',
    start_date: '2025-10-12',
    end_date: '2025-11-05',
    note: '',
    created_at: '2025-10-12T00:00:00Z',
    updated_at: '2025-10-12T00:00:00Z',
    task_marketings: [
      {
        id: 'mm14',
        task_id: 'm27',
        marketing_type_id: '',
        count: 4,
        marketing_types: {
          id: '',
          name: '인스타그램 바이럴',
          sort_order: 4,
          created_at: '',
        },
      },
    ],
  },
  {
    id: 'm28',
    company_name: '강북 탁구클럽',
    received_amount: 240000,
    execution_cost: 148000,
    profit: 92000,
    status: 'done_settled',
    start_date: '2025-09-05',
    end_date: '2025-09-25',
    note: '',
    created_at: '2025-09-05T00:00:00Z',
    updated_at: '2025-09-05T00:00:00Z',
    task_marketings: [],
  },
  {
    id: 'm29',
    company_name: '송파 프리미엄 세차장',
    received_amount: 470000,
    execution_cost: 288000,
    profit: 182000,
    status: 'not_started',
    start_date: '2026-02-15',
    end_date: null,
    note: 'SNS 위주',
    created_at: '2026-02-15T00:00:00Z',
    updated_at: '2026-02-15T00:00:00Z',
    task_marketings: [],
  },
  {
    id: 'm30',
    company_name: '서초 IT 교육원',
    received_amount: 870000,
    execution_cost: 530000,
    profit: 340000,
    status: 'in_progress',
    start_date: '2026-01-20',
    end_date: null,
    note: '수강생 모집 캠페인',
    created_at: '2026-01-20T00:00:00Z',
    updated_at: '2026-01-20T00:00:00Z',
    task_marketings: [
      {
        id: 'mm15',
        task_id: 'm30',
        marketing_type_id: '',
        count: 1,
        marketing_types: {
          id: '',
          name: '메타 광고',
          sort_order: 10,
          created_at: '',
        },
      },
    ],
  },
  {
    id: 'm31',
    company_name: '마포 소품샵 디어',
    received_amount: 330000,
    execution_cost: 202000,
    profit: 128000,
    status: 'done_settled',
    start_date: '2025-09-20',
    end_date: '2025-10-10',
    note: '',
    created_at: '2025-09-20T00:00:00Z',
    updated_at: '2025-09-20T00:00:00Z',
    task_marketings: [],
  },
  {
    id: 'm32',
    company_name: '성북 한옥카페',
    received_amount: 490000,
    execution_cost: 300000,
    profit: 190000,
    status: 'done_settled',
    start_date: '2025-10-18',
    end_date: '2025-11-08',
    note: '',
    created_at: '2025-10-18T00:00:00Z',
    updated_at: '2025-10-18T00:00:00Z',
    task_marketings: [
      {
        id: 'mm16',
        task_id: 'm32',
        marketing_type_id: '',
        count: 5,
        marketing_types: {
          id: '',
          name: '카페 바이럴',
          sort_order: 1,
          created_at: '',
        },
      },
    ],
  },
  {
    id: 'm33',
    company_name: '종로 갤러리 카페',
    received_amount: 420000,
    execution_cost: 258000,
    profit: 162000,
    status: 'not_started',
    start_date: '2026-03-01',
    end_date: null,
    note: '봄 전시 연계 마케팅',
    created_at: '2026-03-01T00:00:00Z',
    updated_at: '2026-03-01T00:00:00Z',
    task_marketings: [],
  },
  {
    id: 'm34',
    company_name: '하남 파크골프',
    received_amount: 760000,
    execution_cost: 465000,
    profit: 295000,
    status: 'done_unsettled',
    start_date: '2025-11-25',
    end_date: '2025-12-22',
    note: '연말 행사 연계',
    created_at: '2025-11-25T00:00:00Z',
    updated_at: '2025-11-25T00:00:00Z',
    task_marketings: [
      {
        id: 'mm17',
        task_id: 'm34',
        marketing_type_id: '',
        count: 5,
        marketing_types: {
          id: '',
          name: '블로그 체험단',
          sort_order: 3,
          created_at: '',
        },
      },
    ],
  },
  {
    id: 'm35',
    company_name: '은평 한방 병원',
    received_amount: 980000,
    execution_cost: 600000,
    profit: 380000,
    status: 'in_progress',
    start_date: '2026-01-10',
    end_date: null,
    note: '블로그+플레이스 패키지',
    created_at: '2026-01-10T00:00:00Z',
    updated_at: '2026-01-10T00:00:00Z',
    task_marketings: [
      {
        id: 'mm18',
        task_id: 'm35',
        marketing_type_id: '',
        count: 6,
        marketing_types: {
          id: '',
          name: '블로그 기자단',
          sort_order: 2,
          created_at: '',
        },
      },
    ],
  },
  {
    id: 'm36',
    company_name: '강동 키즈카페 플레이',
    received_amount: 620000,
    execution_cost: 380000,
    profit: 240000,
    status: 'done_settled',
    start_date: '2025-10-01',
    end_date: '2025-10-28',
    note: '',
    created_at: '2025-10-01T00:00:00Z',
    updated_at: '2025-10-01T00:00:00Z',
    task_marketings: [],
  },
  {
    id: 'm37',
    company_name: '용산 전자기기 수리',
    received_amount: 250000,
    execution_cost: 155000,
    profit: 95000,
    status: 'done_settled',
    start_date: '2025-08-20',
    end_date: '2025-09-10',
    note: '',
    created_at: '2025-08-20T00:00:00Z',
    updated_at: '2025-08-20T00:00:00Z',
    task_marketings: [],
  },
  {
    id: 'm38',
    company_name: '도봉 프리미엄 김밥',
    received_amount: 200000,
    execution_cost: 125000,
    profit: 75000,
    status: 'done_settled',
    start_date: '2025-08-10',
    end_date: '2025-08-30',
    note: '',
    created_at: '2025-08-10T00:00:00Z',
    updated_at: '2025-08-10T00:00:00Z',
    task_marketings: [],
  },
  {
    id: 'm39',
    company_name: '관악 대학가 분식',
    received_amount: 185000,
    execution_cost: 113000,
    profit: 72000,
    status: 'done_settled',
    start_date: '2025-08-25',
    end_date: '2025-09-10',
    note: '',
    created_at: '2025-08-25T00:00:00Z',
    updated_at: '2025-08-25T00:00:00Z',
    task_marketings: [],
  },
  {
    id: 'm40',
    company_name: '강남 프리미엄 세탁소',
    received_amount: 290000,
    execution_cost: 175000,
    profit: 115000,
    status: 'done_settled',
    start_date: '2025-08-01',
    end_date: '2025-08-25',
    note: '',
    created_at: '2025-08-01T00:00:00Z',
    updated_at: '2025-08-01T00:00:00Z',
    task_marketings: [],
  },
]

type SortBy =
  | 'start_date'
  | 'created_at'
  | 'received_amount'
  | 'execution_cost'
  | 'profit'

const searchSchema = z.object({
  mode: z.enum(['list', 'board']).optional().default('list'),
  page: z.coerce.number().optional().default(1),
  sortBy: z
    .enum([
      'start_date',
      'created_at',
      'received_amount',
      'execution_cost',
      'profit',
    ])
    .optional(),
  sortDir: z.enum(['asc', 'desc']).optional().default('asc'),
})

export const Route = createFileRoute('/_authed/tasks/')({
  validateSearch: searchSchema,
  component: TasksPage,
})

const STATUS_ORDER: TaskStatus[] = [
  'not_started',
  'in_progress',
  'done_settled',
  'done_unsettled',
]
const PAGE_SIZE = 15

const COLUMN_STYLES: Record<TaskStatus, { dot: string; header: string }> = {
  not_started: {
    dot: 'bg-slate-400',
    header: 'text-slate-600 dark:text-slate-400',
  },
  in_progress: {
    dot: 'bg-blue-500',
    header: 'text-blue-700 dark:text-blue-400',
  },
  done_settled: {
    dot: 'bg-emerald-500',
    header: 'text-emerald-700 dark:text-emerald-400',
  },
  done_unsettled: {
    dot: 'bg-amber-500',
    header: 'text-amber-700 dark:text-amber-400',
  },
}

const formatMarketingSummary = (task: Task): string => {
  if (!task.task_marketings?.length) return '-'
  return task.task_marketings
    .map((m) => `${m.marketing_types?.name ?? '?'} ${m.count}건`)
    .join(', ')
}

const SortIcon = ({
  col,
  sortBy,
  sortDir,
}: { col: SortBy; sortBy?: SortBy; sortDir?: string }) => {
  if (sortBy !== col)
    return <ChevronsUpDown className="w-3 h-3 opacity-30 shrink-0" />
  return sortDir === 'asc' ? (
    <ChevronUp className="w-3 h-3 shrink-0" />
  ) : (
    <ChevronDown className="w-3 h-3 shrink-0" />
  )
}

const KanbanCard = ({ task }: { task: Task }) => {
  const router = useRouter()
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white dark:bg-gray-800/80 rounded-xl border border-gray-100 dark:border-gray-700/60 p-3.5 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md dark:hover:shadow-black/20 transition-all"
      onClick={() =>
        router.navigate({ to: '/tasks/$taskId', params: { taskId: task.id } })
      }
    >
      <p className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate leading-snug">
        {task.company_name}
      </p>
      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1.5">
        {formatCurrency(task.profit || 0)}
      </p>
      <p className="text-xs text-gray-400 dark:text-slate-500 mt-1 truncate">
        {formatMarketingSummary(task)}
      </p>
      <p className="text-xs text-gray-300 dark:text-slate-600 mt-1">
        {formatDate(task.start_date)}
      </p>
    </div>
  )
}

const KanbanColumn = ({
  status,
  tasks,
}: { status: TaskStatus; tasks: Task[] }) => {
  const { setNodeRef } = useSortable({ id: `col-${status}` })
  const style = COLUMN_STYLES[status]

  return (
    <div
      ref={setNodeRef}
      className="flex flex-col bg-gray-50/80 dark:bg-gray-900/40 rounded-xl border border-gray-200 dark:border-gray-800 min-h-[400px]"
    >
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={cn('w-1.5 h-1.5 rounded-full', style.dot)} />
          <span className={cn('text-xs font-semibold', style.header)}>
            {TASK_STATUS_LABELS[status]}
          </span>
        </div>
        <span className="text-xs font-medium text-gray-400 dark:text-slate-500 bg-gray-100 dark:bg-gray-800 rounded-full px-2 py-0.5">
          {tasks.length}
        </span>
      </div>
      <SortableContext
        items={tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex-1 p-2.5 space-y-2 overflow-y-auto">
          {tasks.map((task) => (
            <KanbanCard key={task.id} task={task} />
          ))}
          {tasks.length === 0 && (
            <p className="text-xs text-gray-300 dark:text-slate-600 text-center py-10">
              업무 없음
            </p>
          )}
        </div>
      </SortableContext>
    </div>
  )
}

function TasksPage() {
  const { mode, page, sortBy, sortDir } = Route.useSearch()
  const router = useRouter()
  const navigate = useNavigate({ from: Route.fullPath })
  const qc = useQueryClient()

  const { data: realTasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: fetchTasks,
  })
  const tasks = [...MOCK_TASKS, ...realTasks]

  const deleteMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('업무가 삭제되었습니다')
      setDeleteId(null)
    },
    onError: () => toast.error('삭제에 실패했습니다'),
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateTaskStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
    onError: () => toast.error('상태 변경에 실패했습니다'),
  })

  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [activeTask, setActiveTask] = useState<Task | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  )

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id)
    if (task) setActiveTask(task)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null)
    const { active, over } = event
    if (!over) return

    const taskId = String(active.id)
    let targetStatus: TaskStatus | null = null

    const overId = String(over.id)
    if (overId.startsWith('col-')) {
      targetStatus = overId.replace('col-', '') as TaskStatus
    } else {
      const overTask = tasks.find((t) => t.id === overId)
      if (overTask) targetStatus = overTask.status
    }

    if (!targetStatus) return
    const task = tasks.find((t) => t.id === taskId)
    if (task && task.status !== targetStatus) {
      statusMutation.mutate({ id: taskId, status: targetStatus })
    }
  }

  const handleSort = (col: SortBy) => {
    if (sortBy !== col) {
      navigate({ search: { mode, page: 1, sortBy: col, sortDir: 'desc' } })
    } else if (sortDir === 'desc') {
      navigate({ search: { mode, page: 1, sortBy: col, sortDir: 'asc' } })
    } else {
      navigate({
        search: { mode, page: 1, sortBy: undefined, sortDir: 'desc' },
      })
    }
  }

  const sortedTasks = [...tasks].sort((a, b) => {
    if (!sortBy) return 0
    let aVal: number | string
    let bVal: number | string
    if (sortBy === 'start_date') {
      aVal = a.start_date
      bVal = b.start_date
    } else if (sortBy === 'created_at') {
      aVal = a.created_at
      bVal = b.created_at
    } else if (sortBy === 'received_amount') {
      aVal = a.received_amount
      bVal = b.received_amount
    } else if (sortBy === 'execution_cost') {
      aVal = a.execution_cost
      bVal = b.execution_cost
    } else {
      aVal = a.profit || 0
      bVal = b.profit || 0
    }
    const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
    return sortDir === 'asc' ? cmp : -cmp
  })

  const totalPages = Math.ceil(sortedTasks.length / PAGE_SIZE)
  const paginatedTasks = sortedTasks.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  )

  const tasksByStatus = STATUS_ORDER.reduce(
    (acc, s) => {
      acc[s] = tasks.filter((t) => t.status === s)
      return acc
    },
    {} as Record<TaskStatus, Task[]>,
  )

  return (
    <div className="h-full flex flex-col gap-4 p-6">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <span className="text-base font-semibold text-gray-800 dark:text-gray-200">
            업무 목록
          </span>
          <span className="text-xs text-gray-400 dark:text-slate-500">
            총 {tasks.length}건
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5 gap-0.5">
            <button
              type="button"
              onClick={() => navigate({ search: { mode: 'list', page: 1 } })}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                mode === 'list'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-gray-200',
              )}
            >
              <List className="w-3.5 h-3.5" />
              목록
            </button>
            <button
              type="button"
              onClick={() => navigate({ search: { mode: 'board', page: 1 } })}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                mode === 'board'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-gray-200',
              )}
            >
              <Columns className="w-3.5 h-3.5" />
              칸반
            </button>
          </div>
          <Link to="/tasks/new">
            <Button
              size="sm"
              className="gap-1.5 h-8 text-xs text-white bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600 shadow-sm shadow-purple-200 dark:shadow-none"
            >
              <Plus className="w-3.5 h-3.5" />새 업무
            </Button>
          </Link>
        </div>
      </div>

      {/* List Mode */}
      {mode === 'list' && (
        <div className="flex-1 min-h-0 flex flex-col border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
          {/* Scrollable table */}
          <div className="flex-1 overflow-auto">
            <table className="w-full table-fixed text-sm">
              <colgroup>
                <col className="w-44" />
                <col className="w-40" />
                <col className="w-32" />
                <col className="w-28" />
                <col className="w-24" />
                <col className="w-24" />
                <col className="w-36" />
                <col className="w-24" />
                <col className="w-24" />
                <col className="w-36" />
                <col className="w-16" />
              </colgroup>
              <thead className="sticky top-0 z-10 bg-white dark:bg-gray-900">
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                    업체명
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                    마케팅
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                    비고
                  </th>
                  <th
                    className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-300"
                    onClick={() => handleSort('received_amount')}
                    onKeyDown={(e) =>
                      e.key === 'Enter' && handleSort('received_amount')
                    }
                  >
                    <div className="flex items-center justify-end gap-1">
                      받은금액
                      <SortIcon
                        col="received_amount"
                        sortBy={sortBy}
                        sortDir={sortDir}
                      />
                    </div>
                  </th>
                  <th
                    className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-300"
                    onClick={() => handleSort('execution_cost')}
                    onKeyDown={(e) =>
                      e.key === 'Enter' && handleSort('execution_cost')
                    }
                  >
                    <div className="flex items-center justify-end gap-1">
                      실행비
                      <SortIcon
                        col="execution_cost"
                        sortBy={sortBy}
                        sortDir={sortDir}
                      />
                    </div>
                  </th>
                  <th
                    className="text-right px-4 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-300"
                    onClick={() => handleSort('profit')}
                    onKeyDown={(e) => e.key === 'Enter' && handleSort('profit')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      수익
                      <SortIcon
                        col="profit"
                        sortBy={sortBy}
                        sortDir={sortDir}
                      />
                    </div>
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                    상태
                  </th>
                  <th
                    className="text-center px-4 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-300"
                    onClick={() => handleSort('start_date')}
                    onKeyDown={(e) =>
                      e.key === 'Enter' && handleSort('start_date')
                    }
                  >
                    <div className="flex items-center justify-center gap-1">
                      시작일
                      <SortIcon
                        col="start_date"
                        sortBy={sortBy}
                        sortDir={sortDir}
                      />
                    </div>
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                    종료일
                  </th>
                  <th
                    className="text-center px-4 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-300"
                    onClick={() => handleSort('created_at')}
                    onKeyDown={(e) =>
                      e.key === 'Enter' && handleSort('created_at')
                    }
                  >
                    <div className="flex items-center justify-center gap-1">
                      등록일
                      <SortIcon
                        col="created_at"
                        sortBy={sortBy}
                        sortDir={sortDir}
                      />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
                {paginatedTasks.length === 0 && (
                  <tr>
                    <td
                      colSpan={11}
                      className="text-center py-20 text-xs text-gray-400 dark:text-slate-500"
                    >
                      등록된 업무가 없습니다
                    </td>
                  </tr>
                )}
                {paginatedTasks.map((task) => (
                  <tr
                    key={task.id}
                    className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40 cursor-pointer transition-colors group"
                    onClick={() =>
                      router.navigate({
                        to: '/tasks/$taskId',
                        params: { taskId: task.id },
                      })
                    }
                    onKeyDown={(e) =>
                      e.key === 'Enter' &&
                      router.navigate({
                        to: '/tasks/$taskId',
                        params: { taskId: task.id },
                      })
                    }
                  >
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100 text-sm truncate">
                      {task.company_name}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 dark:text-slate-400 truncate">
                      {formatMarketingSummary(task)}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 dark:text-slate-400 truncate">
                      {task.note || '-'}
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-gray-600 dark:text-slate-300 tabular-nums truncate">
                      {formatCurrency(task.received_amount)}
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-gray-600 dark:text-slate-300 tabular-nums truncate">
                      {formatCurrency(task.execution_cost)}
                    </td>
                    <td
                      className={cn(
                        'px-4 py-3 text-right text-xs font-semibold tabular-nums truncate',
                        (task.profit || 0) >= 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-red-500 dark:text-red-400',
                      )}
                    >
                      {formatCurrency(task.profit || 0)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <TaskStatusBadge status={task.status} />
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-gray-500 dark:text-slate-400 tabular-nums truncate">
                      {formatDate(task.start_date)}
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-gray-500 dark:text-slate-400 tabular-nums truncate">
                      {formatDate(task.end_date)}
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-gray-400 dark:text-slate-500 tabular-nums truncate">
                      {formatDateTime(task.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div
                        className="flex items-center justify-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                      >
                        <Link
                          to="/tasks/$taskId/edit"
                          params={{ taskId: task.id }}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-gray-400 hover:text-gray-700 dark:text-slate-500 dark:hover:text-gray-200"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-gray-400 hover:text-red-500 dark:text-slate-500"
                          onClick={() => setDeleteId(task.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination — pinned to bottom of card */}
          <div className="shrink-0 flex items-center justify-center gap-1 py-3 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
            <Button
              variant="ghost"
              size="icon"
              disabled={page <= 1}
              className="h-7 w-7 text-gray-500 dark:text-slate-400"
              onClick={() => navigate({ search: { mode, page: page - 1 } })}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            {Array.from(
              { length: Math.max(totalPages, 1) },
              (_, i) => i + 1,
            ).map((p) => (
              <Button
                key={p}
                variant="ghost"
                size="sm"
                className={cn(
                  'h-7 w-7 text-xs rounded-lg',
                  p === page
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : 'text-gray-500 dark:text-slate-400',
                )}
                onClick={() => navigate({ search: { mode, page: p } })}
              >
                {p}
              </Button>
            ))}
            <Button
              variant="ghost"
              size="icon"
              disabled={page >= totalPages}
              className="h-7 w-7 text-gray-500 dark:text-slate-400"
              onClick={() => navigate({ search: { mode, page: page + 1 } })}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Board Mode */}
      {mode === 'board' && (
        <div className="flex-1 min-h-0 overflow-auto">
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="grid grid-cols-4 gap-3 h-full min-h-[500px]">
              {STATUS_ORDER.map((status) => (
                <KanbanColumn
                  key={status}
                  status={status}
                  tasks={tasksByStatus[status]}
                />
              ))}
            </div>
            <DragOverlay>
              {activeTask && (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-purple-200 dark:border-purple-700 p-3.5 shadow-xl rotate-1 opacity-95">
                  <p className="font-medium text-sm text-gray-900 dark:text-gray-100">
                    {activeTask.company_name}
                  </p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                    {formatCurrency(activeTask.profit || 0)}
                  </p>
                </div>
              )}
            </DragOverlay>
          </DndContext>
        </div>
      )}

      {/* Delete confirm dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>업무 삭제</DialogTitle>
            <DialogDescription>
              이 업무를 삭제하면 복구할 수 없습니다. 삭제하시겠습니까?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              취소
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
            >
              {deleteMutation.isPending ? '삭제 중...' : '삭제'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
