import { useQuery } from '@tanstack/react-query'
import { ChevronRight, Plus, Sparkles } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../lib/api'
import type { Routine } from '../lib/types'
import { AppHeader, Button, ErrorState, Loading, Screen } from '../components/ui'
import routineCard1 from '../assets/figma/routine-card-1.webp'
import routineCard2 from '../assets/figma/routine-card-2.webp'
import routineCard3 from '../assets/figma/routine-card-3.webp'

const routineCards = [routineCard1, routineCard2, routineCard3]

function dayPartLabel(dayPart: Routine['dayPart']) { return dayPart === 'MORNING' ? '아침' : dayPart === 'EVENING' ? '저녁' : '아무때나' }
function formatDate(value: string) { const date = new Date(value.replace(' ', 'T') + 'Z'); return Number.isNaN(date.getTime()) ? value.slice(0, 10) : new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }).format(date) }

export function RoutineListPage() {
  const navigate = useNavigate()
  const auth = useQuery({ queryKey: ['auth'], queryFn: api.me })
  const current = useQuery({ queryKey: ['current-routine'], queryFn: api.currentRoutine, retry: false })
  const baseline = useQuery({ queryKey: ['baseline-routine'], queryFn: api.baselineRoutine, retry: false })
  if (current.isPending || baseline.isPending || auth.isPending) return <Screen><AppHeader/><Loading/></Screen>

  const routines = [current.data, baseline.data].filter((value): value is Routine => Boolean(value))

  return <Screen>
    <AppHeader/>
    <div className="px-5">
      <div className="flex items-start justify-between">
        <p className="text-[36px] font-medium leading-tight tracking-[-.02em]">{auth.data?.displayName} 님의 루틴</p>
        <Link to="/routine/edit" aria-label="루틴 추가" className="grid size-10 shrink-0 place-items-center rounded-full bg-white shadow-[0_2px_2px_rgba(0,0,0,.1)]"><Plus size={18}/></Link>
      </div>
      <p className="mt-2 text-[16px] text-[#868181]">총 {routines.length}개의 루틴이 있어요 !</p>
    </div>

    {routines.length === 0 ? <div className="px-5 py-10 text-center"><p className="text-sm font-semibold">아직 등록된 루틴이 없어요</p><p className="mt-2 text-xs leading-5 text-muted">실제로 사용할 제품과 순서를 정하면 루틴이 여기 쌓여요.</p><Link to="/routine/edit"><Button className="mx-auto mt-5">루틴 만들기</Button></Link></div>
      : <div className="mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-9 pb-4 hide-scrollbar">
        {routines.map((routine, index) => <button key={routine.id} onClick={() => navigate(`/routines/${routine.id}`)} className="relative h-[360px] w-[260px] shrink-0 snap-center overflow-hidden rounded-[20px] text-left shadow-[0_2px_8px_rgba(0,0,0,.1)]">
          <img src={routineCards[index % routineCards.length]} alt="" aria-hidden className="absolute inset-0 size-full object-cover"/>
          <div className="absolute inset-0 bg-gradient-to-b from-white via-white/10 to-transparent"/>
          <div className="absolute left-4 top-5 flex gap-1.5">
            <span className="rounded-full bg-black/[.07] px-3 py-2 text-xs">{dayPartLabel(routine.dayPart)}</span>
            <span className="rounded-full bg-black/[.07] px-3 py-2 text-xs">{routine.items.length}개 제품</span>
          </div>
          <div className="absolute bottom-6 left-4 right-4">
            <p className="text-[24px] font-medium leading-tight tracking-[-.011em]">{routine === current.data ? '실제 사용 중' : '비교 기준'}</p>
            <p className="text-[24px] font-medium leading-tight tracking-[-.011em]">{routine.name}</p>
            <p className="mt-2 text-[16px] font-light">{formatDate(routine.startedAt)}</p>
          </div>
        </button>)}
      </div>}
  </Screen>
}

export function RoutineDetailPage() {
  const { id } = useParams(); const routineId = Number(id)
  const current = useQuery({ queryKey: ['current-routine'], queryFn: api.currentRoutine, retry: false })
  const baseline = useQuery({ queryKey: ['baseline-routine'], queryFn: api.baselineRoutine, retry: false })
  if (current.isPending || baseline.isPending) return <Screen><AppHeader/><Loading/></Screen>
  const routine = [current.data, baseline.data].find(value => value?.id === routineId)
  const isCurrent = routine?.id === current.data?.id
  if (!routine) return <Screen><AppHeader/><ErrorState message="루틴을 찾을 수 없어요."/></Screen>

  return <Screen>
    <AppHeader/>
    <div className="px-5">
      <div className="flex items-start justify-between">
        <div><p className="text-[16px] text-[#868181]">{formatDate(routine.startedAt)}</p><p className="mt-1 text-[40px] font-medium leading-tight tracking-[-.02em]">{routine.name}</p></div>
        {isCurrent && <Link to="/routine/edit" className="mt-2 shrink-0 border-b border-[#868181] pb-0.5 text-[16px] text-[#868181]">편집</Link>}
      </div>

      <div className="mt-7 rounded-[20px] bg-gradient-to-b from-[#fffcf2] to-[#edfeee] p-5">
        <p className="flex items-center gap-2 text-[20px] font-medium"><Sparkles size={20}/> AI 분석</p>
        <p className="mt-4 text-sm leading-6 text-black/70">{isCurrent ? '기록이 쌓이면 이 루틴에서 반복되는 패턴과 만족도를 AI가 정리해 보여드려요.' : '이 조합은 마지막으로 문제없다고 남긴 비교 기준이에요. 이후 변경을 비교할 때 활용돼요.'}</p>
      </div>

      <p className="mt-7 text-[16px] font-medium">ROUTINE</p>
      <div className="relative mt-3 space-y-3">
        <div className="absolute bottom-[42px] left-[12px] top-[42px] w-px bg-line"/>
        {routine.items.map((item, index) => <div key={item.userProductId} className="relative flex items-center gap-4">
          <span className="z-10 grid size-6 shrink-0 place-items-center rounded-full bg-black text-xs font-medium text-white">{index + 1}</span>
          <div className="flex flex-1 items-center justify-between rounded-[10px] bg-white/80 px-4 py-4 shadow-[0_1px_4px_rgba(0,0,0,.06)]"><div><p className="text-[16px] font-medium">{item.productName}</p><p className="mt-1 text-xs text-black/70">{item.category} · {item.frequency}</p></div><ChevronRight size={18} className="text-muted"/></div>
        </div>)}
      </div>
    </div>
  </Screen>
}
