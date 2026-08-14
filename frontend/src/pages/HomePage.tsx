import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowRight, ChevronRight, Search, Sparkles } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import type { Home, Pattern } from '../lib/types'
import { AppHeader, BottomSheet, Button, Card, ErrorState, Loading, Screen } from '../components/ui'
import heroWave from '../assets/figma/hero-wave.webp'
import insightWave1 from '../assets/figma/insight-wave-1.svg'
import insightWave2 from '../assets/figma/insight-wave-2.svg'

const insightWaves = [insightWave1, insightWave2]

export function HomePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [endOpen, setEndOpen] = useState(false)
  const home = useQuery({ queryKey: ['home'], queryFn: api.home })
  const complete = useMutation({
    mutationFn: (id: number) => api.completeExperience(id),
    onSuccess: () => { queryClient.invalidateQueries(); setEndOpen(false) },
  })
  if (home.isPending) return <Screen><AppHeader/><Loading/></Screen>
  if (home.isError) return <Screen><AppHeader/><ErrorState message={home.error.message} onRetry={() => home.refetch()}/></Screen>
  const data = home.data
  const experience = data.currentExperience

  return <Screen>
    <AppHeader/>
    <div className="px-5 pb-2">
      <p className="mt-1 text-[32px] font-bold leading-tight tracking-[-.03em]">{data.displayName} 님</p>
    </div>
    <div className="px-5">
      {experience ? <ActiveRoutineCard experience={experience} onOpen={() => navigate(`/experiences/${experience.id}`)} onEnd={() => setEndOpen(true)}/>
        : <EmptyRoutineCard productCount={data.productCount}/>}

      <button onClick={() => navigate('/ai')} className="mt-4 flex w-full items-center gap-4 rounded-[20px] bg-ink p-5 text-left text-white">
        <div className="grid size-9 shrink-0 place-items-center rounded-full bg-white/10 text-lime"><Sparkles size={18}/></div>
        <div className="min-w-0 flex-1"><p className="text-sm font-medium text-[#eaf1ff]">SKIN AI에게 편하게 물어보세요.</p><p className="mt-0.5 text-[16px] font-medium">피부에 대해 궁금한 게 있나요?</p></div>
        <ChevronRight size={19} className="shrink-0 text-white/60"/>
      </button>

      <section className="mt-9">
        <p className="text-[16px] font-medium">MY INSIGHT</p>
        {data.patterns.length ? <div className="mt-3 space-y-3">{data.patterns.slice(0, 2).map((pattern, index) => <InsightCard key={pattern.id} pattern={pattern} wave={insightWaves[index % insightWaves.length]}/>)}</div>
          : <Card className="mt-3 border-dashed text-center"><p className="text-sm font-semibold">두 번째 기록부터 서로 비교해요</p><p className="mt-1 text-xs leading-5 text-muted">좋았던 점과 아쉬웠던 점이 쌓이면<br/>SKN이 반복되는 패턴을 연결해요.</p></Card>}
        {data.patterns.length > 0 && <Link to="/records" className="mt-2 block text-right text-xs text-black">더보기</Link>}
      </section>

      <button onClick={() => navigate('/explore')} className="mt-4 flex w-full items-center gap-4 rounded-[20px] border border-[#d9e6ff] bg-[#fbfdff] p-5 text-left">
        <div className="grid size-9 shrink-0 place-items-center rounded-full bg-white text-ink"><Search size={17}/></div>
        <div className="min-w-0 flex-1"><p className="text-sm text-[#b2ccff]">검색해서 내 LAB에 등록해보세요.</p><p className="mt-0.5 text-[16px] font-medium">궁금한 제품이 있나요?</p></div>
        <ChevronRight size={19} className="shrink-0 text-muted"/>
      </button>

      <section className="mt-9 pb-4">
        <p className="text-[16px] font-medium">MY PROFILE</p>
        <Link to="/records" className="mt-3 grid aspect-square place-items-center rounded-[20px] border border-[#d9e6ff] bg-[#fbfdff]"><span className="text-[80px] font-medium leading-none">?</span></Link>
      </section>
    </div>

    {experience && <BottomSheet open={endOpen} onClose={() => setEndOpen(false)} title="이번 루틴을 종료할까요?">
      <p className="-mt-2 mb-5 text-sm leading-6 text-muted">현재까지의 경험을 정리하고 결과를 분석할 수 있어요. 종료 후에는 평가를 진행하게 됩니다.</p>
      {complete.error && <p className="mb-3 text-xs text-danger">{complete.error.message}</p>}
      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" onClick={() => setEndOpen(false)}>취소</Button>
        <Button disabled={complete.isPending} onClick={() => complete.mutate(experience.id)}>{complete.isPending ? '종료하는 중…' : '루틴 종료하기'}</Button>
      </div>
    </BottomSheet>}
  </Screen>
}

function ActiveRoutineCard({ experience, onOpen, onEnd }: { experience: NonNullable<Home['currentExperience']>; onOpen: () => void; onEnd: () => void }) {
  const filled = Math.max(1, Math.min(7, experience.day))
  return <div className="relative overflow-hidden rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,.1)]">
    <div aria-hidden className="absolute inset-0"><img src={heroWave} alt="" className="size-full object-cover object-bottom"/><div className="absolute inset-0 bg-[#d9e6ff] mix-blend-hue"/><div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,.6) 0%, rgba(255,255,255,0) 50%)' }}/></div>
    <div className="relative p-5">
      <div className="flex items-center justify-between"><p className="text-[16px]">현재 연구 중인 루틴</p><p className="text-[16px]">DAY {experience.day} / 7</p></div>
      <div className="mt-4 flex gap-[3px]">{Array.from({ length: 7 }, (_, index) => <span key={index} className={`h-1 flex-1 rounded-full ${index < filled ? 'bg-black' : 'bg-black/20'}`}/>)}</div>
      <div className="mt-6 grid grid-cols-2 gap-1">
        <button onClick={onEnd} className="h-[50px] rounded-[40px] border border-[#d9e6ff] bg-[#f6f9ff] text-[16px] font-medium">루틴 종료하기</button>
        <button onClick={onOpen} className="h-[50px] rounded-[40px] border border-[#d9e6ff] bg-[#f6f9ff] text-[16px] font-medium">상세 내용 보기</button>
      </div>
    </div>
  </div>
}

function EmptyRoutineCard({ productCount }: { productCount: number }) {
  return <div className="rounded-[20px] border border-line bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,.06)]">
    <p className="text-[16px]">현재 연구 중인 루틴이 없습니다.</p>
    <Link to={productCount ? '/routine/edit' : '/explore'} className="mt-4 flex h-[50px] items-center justify-center gap-1 rounded-[40px] bg-ink text-[16px] font-medium text-white">새 연구 시작하기<ArrowRight size={16}/></Link>
  </div>
}

function InsightCard({ pattern, wave }: { pattern: Pattern; wave: string }) {
  return <Link to={`/patterns/${pattern.id}`} className="relative block h-[120px] overflow-hidden rounded-[20px] bg-[#f6f9ff]">
    <img src={wave} alt="" aria-hidden className="absolute inset-0 size-full object-cover"/>
    <span className="absolute left-4 top-[18px] rounded-full bg-[#d9e6ff]/50 px-3 py-1 text-xs">기록 {pattern.supportingCount + pattern.contradictingCount}건</span>
    <p className="absolute left-4 top-16 text-[16px] font-medium leading-snug">{pattern.title}</p>
  </Link>
}
