import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Bell, Clock3, History, UserRound } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import type { Routine } from '../lib/types'
import { Button, Card, ErrorState, Loading, Screen, SknMark, TopBar } from '../components/ui'

export function ExperienceHubPage() {
  const navigate = useNavigate()
  const home = useQuery({ queryKey: ['home'], queryFn: api.home })
  const current = useQuery({ queryKey: ['current-routine'], queryFn: api.currentRoutine, retry: false })
  const baseline = useQuery({ queryKey: ['baseline-routine'], queryFn: api.baselineRoutine, retry: false })
  const records = useQuery({ queryKey: ['records'], queryFn: api.records })

  if (home.isPending || records.isPending) return <Screen><TopBar title="사용 경험"/><Loading/></Screen>
  if (home.isError || records.isError) return <Screen><TopBar title="사용 경험"/><ErrorState message={(home.error || records.error)?.message || '사용 경험을 불러오지 못했어요.'}/></Screen>

  const experience = home.data.currentExperience
  return <Screen className="bg-white">
    <header className="sticky top-0 z-30 grid h-[82px] grid-cols-3 items-center bg-white px-5"><span/><SknMark className="h-9 w-9 justify-self-center"/><div className="flex items-center justify-self-end"><Link to="/records" aria-label="내 기록" className="grid size-10 place-items-center"><UserRound size={23}/></Link><button aria-label="알림" className="grid size-10 place-items-center"><Bell size={23}/></button></div></header>
    <div className="px-5 pb-8">
      <div className="flex items-center gap-3"><img src="/skn-assets/ai-drop.png" alt="" className="size-[82px] shrink-0 object-contain"/><div><h1 className="text-[23px] font-semibold leading-[1.28] tracking-[-.04em]">제품을 써본 조건과<br/>느낌을 함께 봐요.</h1><p className="mt-2 text-[12px] leading-5 text-[#969696]">확인 중인 조합과 실제 현재 루틴을<br/>구분하고, 지난 기록까지 한 흐름으로 봅니다.</p></div></div>

      <section className="mt-9">
        <p className="text-[12px] font-medium text-[#a8c8ff]">7일 동안 사용감을 남기는 조합</p>
        <h2 className="mt-2 text-[19px] font-semibold tracking-[-.035em]">확인 중인 루틴</h2>
      {experience ? <Card className="mt-2 overflow-hidden border-[#cfe0ff] bg-white p-0 text-black">
        <Link to={`/experiences/${experience.id}`} className="block p-5">
          <div className="flex items-center justify-between"><span className="rounded-full bg-black px-3 py-1 text-[11px] font-medium text-white">확인 중 · DAY {experience.day}</span><span className="text-[11px] text-[#8c8c8c]">{experience.reviewDue ? '오늘 돌아보기' : `${experience.daysUntilReview}일 뒤 돌아보기`}</span></div>
          <h2 className="mt-5 text-xl font-bold tracking-[-.03em]">{experience.title}</h2>
          <p className="mt-2 line-clamp-1 text-xs text-[#8c8c8c]">{experience.subtitle}</p>
          <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-[#edf3ff]"><div className="h-full rounded-full bg-black" style={{ width: `${Math.min(100, Math.max(8, experience.day / 7 * 100))}%` }}/></div>
        </Link>
        <div className="grid grid-cols-2 gap-2 border-t border-[#dce8ff] p-3"><Button onClick={() => navigate(`/experiences/${experience.id}/record`)} className="rounded-full bg-black text-white">지금 느낌 남기기</Button><Button onClick={() => navigate(`/experiences/${experience.id}/record?discomfort=1`)} className="rounded-full border border-[#cfe0ff] bg-white text-black shadow-none">불편함 기록</Button></div>
      </Card> : <Card className="mt-2 border-[#cfe0ff] bg-[#fcfdff] px-5 py-10 text-center"><h3 className="text-[18px] font-medium">지금 확인 중인 루틴이 없어요</h3><p className="mx-auto mt-4 max-w-[280px] text-[12px] leading-5 text-[#777]">{current.data ? '현재 루틴은 그대로 사용 중이에요. 조합을 바꾸면 새 루틴의 사용 경험 기록이 시작됩니다.' : '실제로 사용할 제품과 순서를 정하면 그 조합의 사용 경험 기록이 시작됩니다.'}</p><Link to="/routine/edit"><Button className="mt-8 w-full rounded-full border-[#b9d2ff] bg-white text-black" variant="secondary">새 연구 시작하기</Button></Link></Card>}
      </section>

      <section className="mt-9">
        <div className="flex items-end justify-between"><div><p className="text-xs font-bold text-muted">ROUTINE</p><h2 className="mt-1 text-xl font-bold tracking-[-.035em]">현재 루틴</h2></div><Link to="/routine/edit" className="text-xs font-bold text-accent">편집</Link></div>
        {current.data ? <RoutineDetail routine={current.data}/> : <Card className="mt-3 border-dashed"><p className="text-sm font-bold">등록된 루틴이 없어요</p><p className="mt-1 text-xs leading-5 text-muted">아침·저녁, 순서와 실제 빈도를 함께 저장할 수 있어요.</p><Link to="/routine/edit" className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-accent">루틴 만들기 <ArrowRight size={14}/></Link></Card>}
      </section>

      <section className="mt-9">
        <p className="text-xs font-bold text-muted">COMPARISON</p><h2 className="mt-1 text-xl font-bold tracking-[-.035em]">비교 기준</h2>
        {baseline.data ? <RoutineDetail routine={baseline.data} baseline/> : <Card className="mt-3 border-dashed"><p className="text-sm font-bold">아직 비교 기준이 없어요</p><p className="mt-1 text-xs leading-5 text-muted">루틴을 돌아보고 불편함이 없었다고 남기면 이후 변경을 비교할 기준이 됩니다.</p></Card>}
      </section>

      <section className="mt-9 pb-4">
        <div className="flex items-end justify-between"><div><p className="text-xs font-bold text-muted">HISTORY</p><h2 className="mt-1 text-xl font-bold tracking-[-.035em]">지난 경험</h2></div><Link to="/records" className="text-xs font-semibold text-muted">전체보기</Link></div>
        {records.data.length ? <div className="mt-4 border-l border-line pl-5">{records.data.slice(0, 4).map(record => <article key={record.id} className="relative pb-6 last:pb-0"><span className="absolute -left-[25px] top-1 size-2 rounded-full bg-accent ring-4 ring-paper"/><p className="text-[10px] font-semibold text-muted">{record.createdAt.slice(0, 10)}</p><h3 className="mt-1 text-sm font-bold">{record.productName}</h3><p className="mt-1 line-clamp-2 text-xs leading-5 text-muted">{record.note || (record.sentiment === 'LIKED' ? '마음에 들었던 경험' : record.sentiment === 'DISAPPOINTED' ? '아쉬웠던 경험' : '아직 판단하기 어려운 경험')}</p></article>)}</div> : <Card className="mt-3 border-dashed"><div className="flex items-center gap-3"><History className="text-muted" size={19}/><p className="text-sm font-semibold">아직 남긴 경험이 없어요</p></div></Card>}
      </section>
    </div>
  </Screen>
}

function RoutineDetail({ routine, baseline = false }: { routine: Routine; baseline?: boolean }) {
  const groups = [
    { label: '아침', items: routine.items.filter(item => item.timeSlot === 'MORNING' || item.timeSlot === 'BOTH') },
    { label: '저녁', items: routine.items.filter(item => item.timeSlot === 'EVENING' || item.timeSlot === 'BOTH') },
  ].filter(group => group.items.length)
  return <Card className={`mt-3 overflow-hidden p-0 ${baseline ? 'bg-soft' : ''}`}>
    <div className="flex items-center justify-between px-4 py-4"><div><span className="text-[10px] font-bold text-muted">{baseline ? '마지막으로 문제없다고 남긴 조합' : '실제 사용 중인 조합'}</span><h3 className="mt-1 text-sm font-bold">{routine.name}</h3></div><Clock3 size={17} className="text-muted"/></div>
    {groups.map(group => <div key={group.label} className="border-t border-line"><div className="bg-white/60 px-4 py-2 text-[10px] font-bold text-muted">{group.label} · {group.items.length}개</div>{group.items.map((item, index) => <div key={`${group.label}-${item.userProductId}`} className="flex items-center gap-3 border-t border-line/70 px-4 py-3"><span className="grid size-6 place-items-center rounded-full bg-white text-[10px] font-bold">{index + 1}</span><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold">{item.productName}</p><p className="mt-0.5 text-[10px] text-muted">{item.category} · {item.frequency}</p></div></div>)}</div>)}
    {baseline && <p className="border-t border-line px-4 py-3 text-[10px] leading-5 text-muted">완벽하거나 안전하다는 뜻이 아니라, 이후 변경을 비교하기 위한 내 기록입니다.</p>}
  </Card>
}
