import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AlertCircle, ArrowRight, BookOpen, ChevronRight, CircleUserRound, PackageOpen, Plus, Sparkles } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { BottomSheet, BrandMark, Button, Card, ErrorState, Loading, Screen } from '../components/ui'

export function HomePage() {
  const navigate = useNavigate()
  const [quickOpen, setQuickOpen] = useState(false)
  const home = useQuery({ queryKey: ['home'], queryFn: api.home })
  if (home.isPending) return <Screen><Loading/></Screen>
  if (home.isError) return <Screen><ErrorState message={home.error.message} onRetry={() => home.refetch()}/></Screen>
  const data = home.data
  const experience = data.currentExperience

  return <Screen>
    <header className="flex items-center justify-between px-5 pb-4 pt-6"><BrandMark compact/><div className="flex items-center gap-2"><button onClick={() => setQuickOpen(true)} aria-label="빠른 기록" className="grid size-10 place-items-center rounded-full border border-line bg-white"><Plus size={20}/></button><Link to="/records" aria-label="내 기록" className="grid size-10 place-items-center rounded-full border border-line bg-white"><CircleUserRound size={21}/></Link></div></header>
    <div className="px-5">
      <button onClick={() => navigate('/ai')} className="mt-3 flex w-full items-center gap-4 rounded-[22px] bg-ink p-5 text-left text-white shadow-[0_16px_38px_rgba(23,24,22,.16)]">
        <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-white/10 text-lime"><Sparkles size={20}/></div><div className="min-w-0 flex-1"><p className="text-xs font-bold text-lime">SKN AI</p><p className="mt-1 text-sm font-semibold">내 화장품과 기록에 대해 묻기</p><p className="mt-1 text-[11px] text-white/55">제품 비교·루틴·사용 경험</p></div><ChevronRight size={19}/>
      </button>

      <h2 className="mt-9 text-xl font-bold tracking-[-.035em]">{experience ? '지금 확인 중인 루틴' : data.recordCount === 0 ? '첫 루틴 기록' : '다음 루틴 기록'}</h2>
      {experience ? <ActiveExperience experience={experience} onRecord={() => navigate(`/experiences/${experience.id}/record`)} onDiscomfort={() => navigate(`/experiences/${experience.id}/record?discomfort=1`)} onOpen={() => navigate(`/experiences/${experience.id}`)}/> : data.recordCount === 0 ? <FirstExperienceStart productCount={data.productCount}/> : <NoExperience productCount={data.productCount}/>} 

      <section className="mt-6 grid grid-cols-2 gap-3">
        <Link to="/my-products" className="rounded-[20px] border border-line bg-white p-4"><div className="grid size-9 place-items-center rounded-xl bg-soft text-ink"><PackageOpen size={17}/></div><p className="mt-4 text-sm font-bold">내 화장품</p><p className="mt-1 text-xs text-muted">{data.productCount}개 담겨 있어요</p></Link>
        <Link to="/routine/edit" className="rounded-[20px] border border-line bg-white p-4"><div className="grid size-9 place-items-center rounded-xl bg-soft text-ink"><BookOpen size={17}/></div><p className="mt-4 text-sm font-bold">현재 루틴</p><p className="mt-1 text-xs text-muted">{experience?.routine ? `${experience.routine.items.length}개 순서 확인` : '실제 조합 만들기'}</p></Link>
      </section>

      <section className="mt-9">
        <div className="mb-3 flex items-end justify-between"><div><p className="text-xs font-bold text-accent">내 기록이 연결된 결과</p><h2 className="mt-1 text-xl font-bold tracking-[-.035em]">요즘 보이는 패턴</h2></div><Link to="/records" className="text-xs font-semibold text-muted">전체보기</Link></div>
        {data.patterns.length ? <div className="space-y-3">{data.patterns.map((pattern, index) => <Link key={pattern.id} to={`/patterns/${pattern.id}`} className="block"><Card className={`relative overflow-hidden transition active:scale-[.99] ${index === 0 ? 'border-[#d9ddff] bg-[#f7f7ff]' : ''}`}>
          {index === 0 && <div className="absolute right-0 top-0 h-24 w-24 rounded-bl-full bg-accent-soft"/>}<div className="relative"><div className="mb-3 flex items-center justify-between"><span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-muted">기록 {pattern.supportingCount + pattern.contradictingCount}건</span><ChevronRight size={18} className="text-muted"/></div><h3 className="max-w-[290px] text-[17px] font-bold leading-6 tracking-[-.025em]">{pattern.title}</h3><p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">{pattern.summary}</p></div>
        </Card></Link>)}</div> : <Card className="border-dashed text-center"><BookOpen className="mx-auto text-muted"/><p className="mt-3 text-sm font-semibold">두 번째 기록부터 서로 비교해요</p><p className="mt-1 text-xs leading-5 text-muted">좋았던 점과 아쉬웠던 점이 쌓이면<br/>SKN이 반복되는 패턴을 연결해요.</p></Card>}
      </section>

      {(!experience || data.recordCount > 0) && <section className="mt-9"><p className="text-xs font-bold text-muted">바로 기록하기</p><button onClick={() => setQuickOpen(true)} className="mt-3 flex w-full items-center gap-4 rounded-[22px] border border-line bg-white p-4 text-left"><div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-soft text-ink"><Plus size={20}/></div><div className="min-w-0 flex-1"><p className="text-sm font-bold">지금 떠오른 사용 경험</p><p className="mt-1 text-xs text-muted">현재 조합이나 제품 하나부터 남겨요</p></div><ChevronRight size={18} className="text-muted"/></button></section>}

      <section className="mt-8"><p className="text-xs font-bold text-muted">다음 탐색</p><button onClick={() => navigate('/explore')} className="mt-3 flex w-full items-center gap-4 rounded-[22px] border border-[#d9ddff] bg-[#f8f8ff] p-4 text-left"><div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-accent-soft text-accent"><Sparkles size={20}/></div><div className="min-w-0 flex-1"><p className="text-sm font-bold">궁금한 제품, 내 기록과 비교하기</p><p className="mt-1 text-xs text-muted">써본 사용감과 조합을 함께 봐요</p></div><ChevronRight size={18} className="text-muted"/></button></section>

    </div>
    <BottomSheet open={quickOpen} onClose={() => setQuickOpen(false)} title="무엇을 남길까요?">
      <p className="-mt-2 mb-5 text-xs leading-5 text-muted">짧게 시작하고 필요한 내용만 다음 화면에서 받아요.</p>
      <div className="space-y-2">
        {experience && <button onClick={() => navigate(`/experiences/${experience.id}/record`)} className="flex w-full items-center gap-3 rounded-2xl border border-line p-4 text-left"><div className="grid size-10 place-items-center rounded-xl bg-soft"><BookOpen size={18}/></div><div className="flex-1"><p className="text-sm font-bold">현재 조합의 느낌</p><p className="mt-1 text-xs text-muted">{experience.title}</p></div><ChevronRight size={17} className="text-muted"/></button>}
        <button onClick={() => navigate('/my-products')} className="flex w-full items-center gap-3 rounded-2xl border border-line p-4 text-left"><div className="grid size-10 place-items-center rounded-xl bg-soft"><PackageOpen size={18}/></div><div className="flex-1"><p className="text-sm font-bold">제품 하나의 사용 경험</p><p className="mt-1 text-xs text-muted">내 화장품에서 제품을 고르기</p></div><ChevronRight size={17} className="text-muted"/></button>
        <button onClick={() => navigate(experience ? `/experiences/${experience.id}/record?discomfort=1` : '/ai')} className="flex w-full items-center gap-3 rounded-2xl border border-line p-4 text-left"><div className="grid size-10 place-items-center rounded-xl bg-[#fff1f1] text-danger"><AlertCircle size={18}/></div><div className="flex-1"><p className="text-sm font-bold">불편함을 AI와 정리하기</p><p className="mt-1 text-xs text-muted">{experience ? '지금 느낌을 저장한 뒤 변경점 확인' : 'AI에게 상황부터 이야기하기'}</p></div><ChevronRight size={17} className="text-muted"/></button>
      </div>
    </BottomSheet>
  </Screen>
}

function ActiveExperience({ experience, onRecord, onDiscomfort, onOpen }: { experience: NonNullable<Awaited<ReturnType<typeof api.home>>['currentExperience']>; onRecord: () => void; onDiscomfort: () => void; onOpen: () => void }) {
  const progress = Math.min(100, Math.max(8, (experience.day / 7) * 100))
  return <Card className="mt-5 overflow-hidden border-0 bg-ink p-0 text-white shadow-[0_18px_45px_rgba(25,28,24,.18)]">
    <button onClick={onOpen} className="w-full p-5 text-left">
      <div className="flex items-center justify-between"><span className="rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-bold text-lime">사용 {experience.day}일째</span><span className="text-xs text-white/55">{experience.reviewDue ? '오늘 전체 확인' : `${experience.daysUntilReview}일 뒤 전체 확인`}</span></div>
      <h2 className="mt-5 text-[22px] font-bold leading-7 tracking-[-.035em]">{experience.title}</h2><p className="mt-2 line-clamp-1 text-sm text-white/60">{experience.subtitle}</p>
      <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-lime transition-all" style={{ width: `${progress}%` }}/></div>
    </button>
    <div className="grid grid-cols-[1fr_auto] gap-2 border-t border-white/10 p-3"><Button onClick={onRecord} className="bg-white text-ink hover:bg-white">지금 느낌 남기기</Button><button onClick={onDiscomfort} className="rounded-2xl px-4 text-xs font-semibold text-white/65">불편함 발생</button></div>
  </Card>
}

function NoExperience({ productCount }: { productCount: number }) {
  return <Card className="mt-5 border-dashed bg-white py-7 text-center"><div className="mx-auto grid size-12 place-items-center rounded-2xl bg-soft text-muted"><Plus/></div><h2 className="mt-4 text-lg font-bold">지금 확인 중인 루틴이 없어요</h2><p className="mt-2 text-sm leading-6 text-muted">{productCount ? '현재 루틴은 그대로 사용 중이에요. 새 조합을 확인하고 싶다면 루틴을 바꿔 시작하세요.' : '먼저 화장품을 추가한 뒤 실제로 사용할 루틴을 만들어보세요.'}</p><Link to={productCount ? '/routine/edit' : '/explore'}><Button className="mx-auto mt-5">{productCount ? '새 루틴 시작하기' : '화장품 찾기'}<ArrowRight size={17}/></Button></Link></Card>
}

function FirstExperienceStart({ productCount }: { productCount: number }) {
  const hasProduct = productCount > 0
  return <Card className="mt-5 overflow-hidden border-[#d9ddff] bg-[#f8f8ff] p-0">
    <div className="p-5">
      <div className="flex items-center justify-between"><span className="text-xs font-bold text-accent">첫 경험 만들기</span><span className="text-xs font-semibold text-muted">{hasProduct ? '2' : '1'} / 3</span></div>
      <div className="mt-3 grid grid-cols-3 gap-1.5">{[0,1,2].map(index => <span key={index} className={`h-1.5 rounded-full ${index < (hasProduct ? 2 : 1) ? 'bg-accent' : 'bg-[#dfe2ef]'}`}/>)}</div>
      <h2 className="mt-5 text-[20px] font-bold tracking-[-.035em]">{hasProduct ? '첫 루틴을 만들어보세요' : '먼저 화장품을 추가해요'}</h2>
      <p className="mt-2 text-sm leading-6 text-muted">{hasProduct ? '실제로 함께 쓰는 제품과 순서를 정하면 이 조합의 사용 경험 기록이 시작돼요.' : '과거 기록을 억지로 적지 않아도 돼요. 지금부터 쓰는 경험을 하나씩 연결해요.'}</p>
    </div>
    <div className="border-t border-[#e2e4f6] bg-white/70 p-3"><Link to={hasProduct ? '/routine/edit' : '/explore'}><Button className="w-full">{hasProduct ? '첫 루틴 만들기' : '첫 화장품 찾기'}<ArrowRight size={17}/></Button></Link></div>
  </Card>
}
