import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CircleUserRound, LogOut, Sparkles } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../lib/api'
import { startChatPath } from '../lib/chat'
import type { ExperienceRecord } from '../lib/types'
import { AiBadge, AppHeader, BottomSheet, Button, Card, ErrorState, Loading, Screen, TopBar } from '../components/ui'

const preferences = [
  { key: 'TEXTURE', title: 'TEXTURE', body: '가볍고 빠르게 흡수되는' },
  { key: 'FINISH', title: 'FINISH', body: '산뜻하고 깔끔하게 마무리되는' },
  { key: 'HYDRATION', title: 'HYDRATION', body: '촉촉함이 오래 유지되는' },
]

export function RecordsPage() {
  const navigate = useNavigate(); const queryClient = useQueryClient()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const auth = useQuery({ queryKey: ['auth'], queryFn: api.me })
  const records = useQuery({ queryKey: ['records'], queryFn: api.records })
  const products = useQuery({ queryKey: ['user-products'], queryFn: api.userProducts })
  const current = useQuery({ queryKey: ['current-routine'], queryFn: api.currentRoutine, retry: false })
  const baseline = useQuery({ queryKey: ['baseline-routine'], queryFn: api.baselineRoutine, retry: false })
  const logout = useMutation({ mutationFn: api.logout, onSuccess: () => { queryClient.clear(); window.location.href = '/' } })
  const deleteAccount = useMutation({ mutationFn: api.deleteAccount, onSuccess: () => { queryClient.clear(); window.location.href = '/' } })
  const reset = useMutation({ mutationFn: (scenario: 'default' | 'empty-experience' | 'cold-start') => api.resetDemo(scenario), onSuccess: () => { queryClient.invalidateQueries(); navigate('/') } })
  if (records.isPending || products.isPending || auth.isPending) return <Screen><AppHeader back backTo="/"/><Loading/></Screen>
  if (records.isError) return <Screen><AppHeader back backTo="/"/><ErrorState message={records.error.message}/></Screen>

  const routineCount = (current.data ? 1 : 0) + (baseline.data ? 1 : 0)
  return <Screen><AppHeader back backTo="/"/>
    <div className="px-5 pb-6">
      <div className="flex items-center gap-4"><div className="grid size-[60px] shrink-0 place-items-center rounded-full bg-soft text-ink"><CircleUserRound size={28}/></div><div><p className="text-[32px] font-medium leading-tight">{auth.data?.displayName} 님</p><p className="mt-1 text-[16px] text-black/70">ID : {auth.data?.username}</p></div></div>

      <div className="mt-6 rounded-[20px] bg-[#f6f9fe] p-4">
        <p className="text-[20px] font-medium text-[#a8c6ff]">Skin Archivist</p>
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-white"><div className="h-full rounded-full bg-[#a8c6ff]" style={{ width: `${Math.min(100, records.data.length * 8 + 20)}%` }}/></div>
        <p className="mt-2 text-xs text-black">기록을 통해 자신만의 스킨케어 패턴을 구축하고 있습니다.</p>
      </div>

      <div className="mt-4 flex rounded-[20px] border border-[#d9e6ff] bg-[#fbfdff] py-5">
        <Stat label="제품 분석" value={products.data?.length || 0}/>
        <div className="w-px bg-[#d9e6ff]"/>
        <Stat label="루틴 기록" value={routineCount}/>
        <div className="w-px bg-[#d9e6ff]"/>
        <Stat label="경험 축적" value={records.data.length}/>
      </div>

      <section className="mt-9">
        <p className="text-[16px] font-medium">나의 스킨케어 취향</p>
        <div className="mt-3 grid grid-cols-3 gap-2">{preferences.map(pref => <div key={pref.key} className="rounded-[20px] border border-[#d9e6ff] bg-[#fbfdff]/60 p-3"><p className="text-sm font-medium">{pref.title}</p><p className="mt-4 text-xs font-light leading-5">{pref.body}</p></div>)}</div>
      </section>

      <section className="mt-9">
        <p className="text-[16px] font-medium">나의 연구기록</p>
        {records.data.length ? <div className="mt-3 rounded-[20px] border border-[#d9e6ff] bg-[#fbfdff]/60 p-5">
          <div className="relative space-y-6 border-l border-line pl-5">{records.data.slice(0, 5).map(record => <RecordRow key={record.id} record={record}/>)}</div>
          {records.data.length > 5 && <Link to="/explore" className="mt-5 block text-center text-[16px] font-medium">+ 더보기</Link>}
        </div> : <Card className="mt-3 border-dashed"><p className="text-sm font-semibold">아직 등록된 연구기록이 없습니다.</p><Link to="/explore"><Button className="mx-auto mt-4">새 연구 시작하기</Button></Link></Card>}
      </section>

      {auth.data?.demo && <details className="mt-8 rounded-[18px] border border-dashed border-line p-4"><summary className="cursor-pointer text-xs font-bold text-muted">시연 상태 바꾸기</summary><p className="mt-3 text-[11px] leading-5 text-muted">빈 상태를 빠르게 확인하는 해커톤 시연용 도구예요.</p><div className="mt-3 grid grid-cols-3 gap-2">{[['default','기본'],['empty-experience','경험 없음'],['cold-start','첫 사용']] .map(([value,label]) => <button key={value} disabled={reset.isPending} onClick={() => reset.mutate(value as 'default' | 'empty-experience' | 'cold-start')} className="rounded-xl bg-soft px-2 py-2 text-[10px] font-semibold">{label}</button>)}</div></details>}
      <button disabled={logout.isPending} onClick={() => logout.mutate()} className="mt-9 flex w-full items-center gap-2 py-3 text-[16px] text-black/60"><LogOut size={15}/>로그아웃</button>
      {!auth.data?.demo && <button onClick={() => setDeleteOpen(true)} className="block w-full py-3 text-left text-[16px] text-black">계정 탈퇴</button>}
    </div>
    <BottomSheet open={deleteOpen} onClose={() => setDeleteOpen(false)} title="계정을 삭제할까요?">
      <p className="-mt-2 text-sm leading-6 text-muted">내 화장품, 루틴, 경험, 패턴과 AI 대화가 모두 삭제되며 되돌릴 수 없어요.</p>
      {deleteAccount.error && <p className="mt-3 text-xs text-danger">{deleteAccount.error.message}</p>}
      <Button variant="danger" disabled={deleteAccount.isPending} onClick={() => deleteAccount.mutate()} className="mt-5 w-full">{deleteAccount.isPending ? '삭제하는 중…' : '계정과 기록 모두 삭제'}</Button>
      <Button variant="ghost" disabled={deleteAccount.isPending} onClick={() => setDeleteOpen(false)} className="mt-1 w-full">취소</Button>
    </BottomSheet>
  </Screen>
}

function Stat({ label, value }: { label: string; value: number }) {
  return <div className="flex-1 text-center"><p className="text-[36px] font-medium text-[#a8c6ff]">{value}<span className="text-base font-normal">개</span></p><p className="mt-1 text-sm">{label}</p></div>
}

function RecordRow({ record }: { record: ExperienceRecord }) {
  const liked = record.sentiment === 'LIKED'; const disappointed = record.sentiment === 'DISAPPOINTED'
  return <article className="relative"><span className={`absolute -left-[26px] top-1 size-3 rounded-full ${liked ? 'bg-accent' : disappointed ? 'bg-[#d78989]' : 'bg-[#a7aaa3]'}`}/><div className="flex items-start justify-between gap-3"><h3 className="text-[16px] font-medium">{record.productName}</h3><p className="shrink-0 text-xs text-black/40">{formatDate(record.createdAt)}</p></div><p className="mt-1 text-xs text-[#b2ccff]">{liked ? '마음에 들어요' : disappointed ? '아쉬워요' : '아직 모르겠어요'}{record.discomfort === 'REPORTED' && ' · 불편함 기록'}</p></article>
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
