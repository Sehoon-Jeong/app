import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronRight, CircleUserRound, History, LogOut, PackageOpen, Sparkles } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../lib/api'
import { startChatPath } from '../lib/chat'
import type { ExperienceRecord, Routine } from '../lib/types'
import { AiBadge, BottomSheet, Button, Card, EmptyState, ErrorState, Loading, Screen, TopBar } from '../components/ui'

export function RecordsPage() {
  const navigate = useNavigate(); const queryClient = useQueryClient()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const auth = useQuery({ queryKey: ['auth'], queryFn: api.me })
  const records = useQuery({ queryKey: ['records'], queryFn: api.records })
  const patterns = useQuery({ queryKey: ['patterns'], queryFn: api.patterns })
  const products = useQuery({ queryKey: ['user-products'], queryFn: api.userProducts })
  const current = useQuery({ queryKey: ['current-routine'], queryFn: api.currentRoutine, retry: false })
  const baseline = useQuery({ queryKey: ['baseline-routine'], queryFn: api.baselineRoutine, retry: false })
  const logout = useMutation({ mutationFn: api.logout, onSuccess: () => { queryClient.clear(); window.location.href = '/' } })
  const deleteAccount = useMutation({ mutationFn: api.deleteAccount, onSuccess: () => { queryClient.clear(); window.location.href = '/' } })
  const reset = useMutation({ mutationFn: (scenario: 'default' | 'empty-experience' | 'cold-start') => api.resetDemo(scenario), onSuccess: () => { queryClient.invalidateQueries(); navigate('/') } })
  if (records.isPending || patterns.isPending || products.isPending) return <Screen><TopBar title="내 기록"/><Loading/></Screen>
  return <Screen><TopBar title="내 기록"/>
    <div className="px-5 py-6">
      <div className="flex items-center gap-3"><div className="grid size-12 place-items-center rounded-2xl bg-ink text-lime"><CircleUserRound size={23}/></div><div><h1 className="text-xl font-bold">{auth.data?.displayName}</h1><p className="mt-0.5 text-xs text-muted">화장품 {products.data?.length || 0}개 · 경험 {records.data?.length || 0}건</p></div></div>

      <section className="mt-8"><div className="flex items-end justify-between"><div><p className="text-xs font-bold text-accent">CONNECTED EXPERIENCE</p><h2 className="mt-1 text-xl font-bold tracking-[-.035em]">내 사용 패턴</h2></div></div>{patterns.data?.length ? <div className="mt-3 space-y-3">{patterns.data.map(pattern => <Link key={pattern.id} to={`/patterns/${pattern.id}`} className="block"><Card><div className="flex items-start gap-3"><div className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent"><Sparkles size={17}/></div><div className="min-w-0 flex-1"><h3 className="text-[15px] font-bold leading-6">{pattern.title}</h3><p className="mt-1 line-clamp-2 text-xs leading-5 text-muted">{pattern.summary}</p><p className="mt-3 text-[10px] font-bold text-muted">지지 {pattern.supportingCount} · 반대 {pattern.contradictingCount}</p></div><ChevronRight size={17} className="mt-1 text-muted"/></div></Card></Link>)}</div> : <Card className="mt-3 border-dashed"><p className="text-sm font-semibold">아직 연결할 패턴이 없어요</p><p className="mt-1 text-xs leading-5 text-muted">제품을 써본 느낌을 남기면 다른 기록과 비교해요.</p></Card>}</section>

      {(current.data || baseline.data) && <section className="mt-9"><div className="flex items-end justify-between"><div><p className="text-xs font-bold text-muted">ROUTINE</p><h2 className="mt-1 text-xl font-bold tracking-[-.035em]">조합의 변화</h2></div><Link to="/routine/edit" className="text-xs font-bold text-accent">편집</Link></div><div className="mt-3 space-y-3">{current.data && <RoutineCard routine={current.data} label="현재 사용" active/>}{baseline.data && <RoutineCard routine={baseline.data} label="비교 기준"/>}</div></section>}

      <section className="mt-9"><div className="flex items-end justify-between"><div><p className="text-xs font-bold text-muted">TIMELINE</p><h2 className="mt-1 text-xl font-bold tracking-[-.035em]">남긴 경험</h2></div></div>{records.data?.length ? <div className="mt-4 border-l border-line pl-5">{records.data.map(record => <RecordRow key={record.id} record={record}/>)}</div> : <EmptyState icon={<History/>} title="아직 남긴 경험이 없어요" body="첫 제품을 써보고 지금의 느낌을 남겨보세요." action={<Link to="/explore"><Button>제품 찾기</Button></Link>}/>}</section>

      <Link to="/my-products" className="mt-9 flex items-center gap-3 rounded-[20px] border border-line bg-white p-4"><div className="grid size-10 place-items-center rounded-xl bg-soft"><PackageOpen size={19}/></div><div className="flex-1"><p className="text-sm font-bold">내 화장품</p><p className="mt-1 text-xs text-muted">담은 제품 {products.data?.length || 0}개</p></div><ChevronRight size={18} className="text-muted"/></Link>

      {auth.data?.demo && <details className="mt-8 rounded-[18px] border border-dashed border-line p-4"><summary className="cursor-pointer text-xs font-bold text-muted">시연 상태 바꾸기</summary><p className="mt-3 text-[11px] leading-5 text-muted">빈 상태를 빠르게 확인하는 해커톤 시연용 도구예요.</p><div className="mt-3 grid grid-cols-3 gap-2">{[['default','기본'],['empty-experience','경험 없음'],['cold-start','첫 사용']] .map(([value,label]) => <button key={value} disabled={reset.isPending} onClick={() => reset.mutate(value as 'default' | 'empty-experience' | 'cold-start')} className="rounded-xl bg-soft px-2 py-2 text-[10px] font-semibold">{label}</button>)}</div></details>}
      <button disabled={logout.isPending} onClick={() => logout.mutate()} className="mx-auto mb-2 mt-8 flex items-center gap-2 py-3 text-xs font-semibold text-muted"><LogOut size={15}/>로그아웃</button>
      {!auth.data?.demo && <button onClick={() => setDeleteOpen(true)} className="mx-auto mb-6 block text-[11px] text-muted underline decoration-line underline-offset-4">계정과 기록 삭제</button>}
    </div>
    <BottomSheet open={deleteOpen} onClose={() => setDeleteOpen(false)} title="계정을 삭제할까요?">
      <p className="-mt-2 text-sm leading-6 text-muted">내 화장품, 루틴, 경험, 패턴과 AI 대화가 모두 삭제되며 되돌릴 수 없어요.</p>
      {deleteAccount.error && <p className="mt-3 text-xs text-danger">{deleteAccount.error.message}</p>}
      <Button variant="danger" disabled={deleteAccount.isPending} onClick={() => deleteAccount.mutate()} className="mt-5 w-full">{deleteAccount.isPending ? '삭제하는 중…' : '계정과 기록 모두 삭제'}</Button>
      <Button variant="ghost" disabled={deleteAccount.isPending} onClick={() => setDeleteOpen(false)} className="mt-1 w-full">취소</Button>
    </BottomSheet>
  </Screen>
}

function RoutineCard({ routine, label, active = false }: { routine: Routine; label: string; active?: boolean }) {
  return <Card className={active ? 'border-ink bg-ink text-white' : ''}><div className="flex items-center justify-between"><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${active ? 'bg-white/10 text-lime' : 'bg-soft text-muted'}`}>{label}</span><span className={`text-[10px] ${active ? 'text-white/50' : 'text-muted'}`}>{routine.items.length}개</span></div><h3 className="mt-3 text-sm font-bold">{routine.name}</h3><p className={`mt-2 line-clamp-2 text-xs leading-5 ${active ? 'text-white/55' : 'text-muted'}`}>{routine.items.map(item => item.productName).join(' → ')}</p></Card>
}

function RecordRow({ record }: { record: ExperienceRecord }) {
  const liked = record.sentiment === 'LIKED'; const disappointed = record.sentiment === 'DISAPPOINTED'
  return <article className="relative pb-6 last:pb-0"><span className={`absolute -left-[25px] top-1 size-2 rounded-full ring-4 ring-paper ${liked ? 'bg-accent' : disappointed ? 'bg-[#d78989]' : 'bg-[#a7aaa3]'}`}/><p className="text-[10px] font-semibold text-muted">{formatDate(record.createdAt)}</p><h3 className="mt-1 text-sm font-bold">{record.productName}</h3><p className="mt-1 text-xs font-semibold text-muted">{liked ? '마음에 들어요' : disappointed ? '아쉬워요' : '아직 모르겠어요'}{record.discomfort === 'REPORTED' && ' · 불편함 기록'}</p>{record.note && <p className="mt-2 text-sm leading-6">{record.note}</p>}{record.tags.length > 0 && <div className="mt-2 flex flex-wrap gap-1">{record.tags.map(tag => <span key={tag} className="rounded-full bg-soft px-2 py-1 text-[10px] font-semibold text-muted">{tag}</span>)}</div>}</article>
}

export function PatternPage() {
  const { id } = useParams(); const patternId = Number(id); const navigate = useNavigate()
  const pattern = useQuery({ queryKey: ['pattern', patternId], queryFn: () => api.pattern(patternId) })
  const openPatternChat = () => navigate(startChatPath('PATTERN', '이 패턴을 지지하는 기록과 반대하는 기록을 같이 설명해줘.'))
  if (pattern.isPending) return <Screen nav={false}><TopBar title="내 패턴" back/><Loading/></Screen>
  if (pattern.isError) return <Screen nav={false}><TopBar title="내 패턴" back/><ErrorState message={pattern.error.message}/></Screen>
  const data = pattern.data
  return <Screen nav={false} className="pb-28"><TopBar title="내 패턴" back/><div className="px-5 py-7"><AiBadge/><h1 className="mt-4 text-[27px] font-bold leading-9 tracking-[-.045em]">{data.title}</h1><p className="mt-4 text-sm leading-6 text-muted">{data.summary}</p><div className="mt-5 flex gap-2"><span className="rounded-full bg-[#ecf5d5] px-3 py-1.5 text-xs font-bold">지지 {data.supportingCount}</span><span className="rounded-full bg-[#f6eaea] px-3 py-1.5 text-xs font-bold">반대 {data.contradictingCount}</span></div><p className="mt-3 text-[11px] leading-5 text-muted">{data.confidenceNote}</p>
    <section className="mt-9"><h2 className="text-lg font-bold">연결된 경험</h2><div className="mt-3 space-y-3">{data.evidence.map(item => <Card key={item.recordId}><div className="flex items-center justify-between"><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${item.polarity === 'SUPPORTS' ? 'bg-[#ecf5d5]' : 'bg-[#f6eaea]'}`}>{item.polarity === 'SUPPORTS' ? '지지하는 기록' : '다른 경험'}</span><span className="text-[10px] text-muted">{formatDate(item.createdAt)}</span></div><h3 className="mt-3 text-sm font-bold">{item.productName}</h3><p className="mt-2 text-sm leading-6 text-muted">“{item.note}”</p></Card>)}</div></section>
    <div className="mt-7 rounded-2xl bg-soft p-4 text-xs leading-5 text-muted">이 패턴은 피부 타입이나 성분 효과 판정이 아니에요. 내가 남긴 경험 사이의 반복과 차이를 보여줍니다.</div></div>
    <div className="safe-bottom fixed inset-x-0 bottom-0 z-20 mx-auto max-w-[430px] border-t border-line bg-white/96 p-4 backdrop-blur"><Button onClick={openPatternChat} className="w-full">이 패턴을 AI와 살펴보기<Sparkles size={17}/></Button></div>
  </Screen>
}

function formatDate(value: string) { const date = new Date(value.replace(' ', 'T') + 'Z'); return Number.isNaN(date.getTime()) ? value.slice(0, 10) : new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric' }).format(date) }
