import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertCircle, ArrowRight, BadgeCheck, BookOpen, Check, ChevronRight, Clock3, ExternalLink, Globe2, Layers3, MessageCircle, Send, Sparkles, X } from 'lucide-react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkBreaks from 'remark-breaks'
import remarkGfm from 'remark-gfm'
import { api } from '../lib/api'
import type { Conversation, ExperienceRecord, Pattern, Product, Routine, WebSource } from '../lib/types'
import { AiBadge, Button, Card, ErrorState, Loading, ProductGlyph, Screen, TopBar } from '../components/ui'
import { startChatPath } from '../lib/chat'

const INITIAL_PROMPTS = [
  { text: '피부가 불편해졌어요', mode: 'RESCUE', caution: true },
  { text: '내 최근 기록에서 반복되는 취향을 알려줘', mode: 'GENERAL', caution: false },
  { text: '다음 제품을 볼 때 기준으로 쓸 내 경험이 있어?', mode: 'GENERAL', caution: false },
]

export function AiLandingPage() {
  const navigate = useNavigate()
  const [text, setText] = useState('')
  const conversations = useQuery({ queryKey: ['conversations'], queryFn: api.conversations })
  const submit = (value: string, mode = 'GENERAL') => { const prompt = value.trim(); if (prompt) navigate(startChatPath(mode, prompt)) }
  return <Screen nav={false} className="flex min-h-svh flex-col">
    <TopBar title="SKN AI" back backTo="/"/>
    <div className="flex-1 px-5 pb-44 pt-10">
      <div className="grid size-12 place-items-center rounded-2xl bg-ink text-lime"><Sparkles size={22}/></div><h1 className="mt-5 text-[28px] font-bold leading-9 tracking-[-.045em]">내가 남긴 경험을<br/>같이 살펴볼게요.</h1><p className="mt-3 text-sm leading-6 text-muted">AI는 제품의 적합성을 판정하지 않아요.<br/>내 기록과 확인된 제품 정보를 연결해 설명해요.</p>
      <div className="mt-8 flex flex-wrap gap-2">{INITIAL_PROMPTS.map(prompt => <button key={prompt.text} onClick={() => submit(prompt.text, prompt.mode)} className={`inline-flex items-center gap-1.5 rounded-2xl border px-3.5 py-2.5 text-left text-xs font-semibold leading-5 transition active:scale-[.99] ${prompt.caution ? 'border-[#efcaca] bg-[#fff6f6] text-danger shadow-[0_5px_18px_rgba(182,64,64,.08)]' : 'border-line bg-white'}`}>{prompt.caution && <AlertCircle size={14}/>}<span>{prompt.text}</span></button>)}</div>
      {!!conversations.data?.length && <section className="mt-10"><h2 className="text-xs font-bold text-muted">최근 대화</h2><div className="mt-3 divide-y divide-line rounded-[20px] border border-line bg-white px-4">{conversations.data.slice(0, 4).map(item => <Link key={item.id} to={`/ai/${item.id}`} className="flex items-center gap-3 py-3.5"><MessageCircle size={18} className="text-muted"/><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{titleFor(item)}</p><p className="mt-1 truncate text-[11px] text-muted">{item.messages.at(-1)?.content}</p></div><ChevronRight size={16} className="text-muted"/></Link>)}</div></section>}
    </div>
    <Composer value={text} onChange={setText} onSubmit={submit} pending={false} suggestions={[]} placeholder="내 화장품 경험에 대해 물어보세요"/>
  </Screen>
}

export function ChatStartPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const started = useRef(false)
  const mode = params.get('mode') || 'GENERAL'
  const prompt = params.get('prompt')?.trim() || '내 화장품 경험을 같이 봐줘.'
  const productId = Number(params.get('productId')) || undefined
  const experienceId = Number(params.get('experienceId')) || undefined
  const product = useQuery({ queryKey: ['product', productId], queryFn: () => api.product(productId!), enabled: Boolean(productId) })
  const create = useMutation({
    mutationFn: () => api.createConversation(mode, prompt, { productId, experienceId }),
    onSuccess: value => {
      queryClient.setQueryData(['conversation', value.id], value)
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      navigate(`/ai/${value.id}`, { replace: true })
    },
  })
  const startConversation = create.mutate
  useEffect(() => {
    if (started.current) return
    started.current = true
    startConversation()
  }, [startConversation])

  return <Screen nav={false} className="flex h-full min-h-0 flex-col pb-[118px]">
    <TopBar title={modeTitle(mode as Conversation['mode'])} back/>
    <div className="flex-1 px-5 py-6">
      {productId && product.isPending && <ProductContextSkeleton/>}
      {product.data && <ProductContextCard product={product.data}/>} 
      <div className="mt-6 flex justify-end"><div className="max-w-[82%] rounded-[20px] rounded-br-md bg-soft px-4 py-3 text-sm leading-6">{prompt}</div></div>
      {!create.isError && <div className="mt-6 flex items-start gap-3" aria-live="polite"><div className="grid size-8 shrink-0 place-items-center rounded-xl bg-ink text-lime"><Sparkles size={15}/></div><div className="min-w-0 flex-1 pt-1"><div className="flex gap-1 pt-2"><span className="size-1.5 animate-bounce rounded-full bg-muted"/><span className="size-1.5 animate-bounce rounded-full bg-muted [animation-delay:120ms]"/><span className="size-1.5 animate-bounce rounded-full bg-muted [animation-delay:240ms]"/></div><p className="mt-3 text-xs text-muted">{productId ? '제품 정보와 내 기록을 연결하고 있어요.' : '내 기록에서 관련된 경험을 찾고 있어요.'}</p></div></div>}
      {create.isError && <div className="mt-6 rounded-2xl bg-[#fff3f3] p-4 text-xs leading-5 text-danger"><p>{create.error.message}</p><button onClick={() => create.mutate()} className="mt-2 font-bold underline">다시 시도</button></div>}
    </div>
    <Composer value="" onChange={() => {}} onSubmit={() => {}} pending suggestions={[]} placeholder="첫 답변을 준비하고 있어요"/>
  </Screen>
}

export function ChatPage() {
  const { id } = useParams(); const conversationId = Number(id)
  const navigate = useNavigate(); const queryClient = useQueryClient(); const bottomRef = useRef<HTMLDivElement>(null)
  const [text, setText] = useState('')
  const [openEvidence, setOpenEvidence] = useState<{ refs: string[]; webSources: WebSource[] } | null>(null)
  const conversation = useQuery({ queryKey: ['conversation', conversationId], queryFn: () => api.conversation(conversationId) })
  const productId = conversation.data?.productId
  const product = useQuery({ queryKey: ['product', productId], queryFn: () => api.product(productId!), enabled: Boolean(productId) })
  const send = useMutation({ mutationFn: (message: string) => api.sendMessage(conversationId, message), onSuccess: value => { queryClient.setQueryData(['conversation', conversationId], value); queryClient.invalidateQueries({ queryKey: ['conversations'] }); setText('') } })
  const apply = useMutation({ mutationFn: () => api.applyRescue(conversationId), onSuccess: value => { queryClient.invalidateQueries(); navigate(`/experiences/${value.id}`) } })
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [conversation.data?.messages.length, send.isPending])
  if (conversation.isPending) return <Screen nav={false}><TopBar title="SKN AI" back/><Loading label="대화를 불러오는 중"/></Screen>
  if (conversation.isError) return <Screen nav={false}><TopBar title="SKN AI" back/><ErrorState message={conversation.error.message} onRetry={() => conversation.refetch()}/></Screen>
  const data = conversation.data
  const submit = (value: string) => { const message = value.trim(); if (message && !send.isPending) send.mutate(message) }
  return <Screen nav={false} className="flex h-full min-h-0 flex-col pb-[150px]">
    <TopBar title={modeTitle(data.mode)} back/>
    <div className="flex-1 px-5 py-6">
      {product.data && <ProductContextCard product={product.data}/>} 
      <div className="mb-7 flex gap-3 rounded-2xl bg-soft p-3 text-[11px] leading-5 text-muted"><Sparkles size={15} className="mt-0.5 shrink-0 text-accent"/><p>이 대화에 필요한 제품·루틴·사용 결과만 AI에 보내요. 외부 정보는 검색한 출처를 함께 보여줘요.</p></div>
      <div className="space-y-6">{data.messages.map(message => <div key={message.id} className={message.role === 'USER' ? 'flex justify-end' : 'flex items-start gap-3'}>{message.role === 'ASSISTANT' && <div className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl bg-ink text-lime"><Sparkles size={15}/></div>}<div className={message.role === 'USER' ? 'max-w-[82%] rounded-[20px] rounded-br-md bg-soft px-4 py-3 text-sm leading-6' : 'min-w-0 flex-1 pt-1 text-[14px] leading-6'}><MessageContent text={message.content} markdown={message.role === 'ASSISTANT'}/>{message.role === 'ASSISTANT' && data.mode === 'RECOMMEND' && <RecommendedProductLinks refs={message.evidenceRefs}/>} {message.role === 'ASSISTANT' && (message.evidenceRefs.length > 0 || (message.webSources?.length ?? 0) > 0) && <EvidenceSummary refs={message.evidenceRefs} webSources={message.webSources || []} onOpen={() => setOpenEvidence({ refs: message.evidenceRefs, webSources: message.webSources || [] })}/>} {message.status === 'FALLBACK' && <p className="mt-2 text-[10px] font-semibold text-muted">저장된 내 데이터로 바로 답했어요.</p>}</div></div>)}{send.isPending && <div className="flex items-start gap-3"><div className="grid size-8 place-items-center rounded-xl bg-ink text-lime"><Sparkles size={15}/></div><div className="min-w-0 pt-1"><div className="flex gap-1 pt-2"><span className="size-1.5 animate-bounce rounded-full bg-muted"/><span className="size-1.5 animate-bounce rounded-full bg-muted [animation-delay:120ms]"/><span className="size-1.5 animate-bounce rounded-full bg-muted [animation-delay:240ms]"/></div><p className="mt-3 text-[11px] text-muted">내 기록과 외부 근거를 함께 확인하고 있어요.</p></div></div>}</div>

      {data.rescuePlan && <RescuePlanCard conversation={data} onApply={() => apply.mutate()} pending={apply.isPending}/>} 
      {send.error && <div className="mt-5 rounded-2xl bg-[#fff3f3] p-4 text-xs leading-5 text-danger"><p>{send.error.message}</p><button onClick={() => text && send.mutate(text)} className="mt-2 font-bold underline">다시 보내기</button></div>}
      <div ref={bottomRef}/>
    </div>
    <Composer value={text} onChange={setText} onSubmit={submit} pending={send.isPending} suggestions={data.quickReplies} placeholder={data.mode === 'RESCUE' ? '지금 상태를 평소 말하듯 적어주세요' : '궁금한 것을 이어서 물어보세요'}/>
    {openEvidence && <EvidenceSheet refs={openEvidence.refs} webSources={openEvidence.webSources} onClose={() => setOpenEvidence(null)}/>}
  </Screen>
}

function Composer({ value, onChange, onSubmit, pending, suggestions, placeholder }: { value: string; onChange: (value: string) => void; onSubmit: (value: string) => void; pending: boolean; suggestions: string[]; placeholder: string }) {
  const submit = (event: FormEvent) => { event.preventDefault(); onSubmit(value) }
  return <div className="safe-bottom fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[430px] border-t border-line bg-white/97 px-4 pb-3 pt-3 backdrop-blur-xl">
    {!!suggestions.length && <div className="hide-scrollbar -mx-4 mb-3 flex gap-2 overflow-x-auto px-4">{suggestions.slice(0, 3).map(suggestion => {
      const caution = isCautionSuggestion(suggestion)
      return <button key={suggestion} disabled={pending} onClick={() => onSubmit(suggestion)} className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold active:bg-soft ${caution ? 'border-[#efcaca] bg-[#fff6f6] text-danger' : 'border-line bg-white'}`}>{caution && <AlertCircle size={13}/>}<span>{suggestion}</span></button>
    })}</div>}
    <form onSubmit={submit} className="flex items-end gap-2 rounded-[22px] border border-line bg-soft p-1.5 pl-4 focus-within:border-[#bbc2ff]"><textarea disabled={pending} rows={1} value={value} onChange={e => onChange(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSubmit(value) } }} placeholder={placeholder} className="max-h-28 min-h-10 flex-1 resize-none bg-transparent py-2 text-sm leading-5 outline-none placeholder:text-[#9a9d96] disabled:cursor-wait"/><button type="submit" disabled={pending || !value.trim()} aria-label="보내기" className="grid size-10 shrink-0 place-items-center rounded-2xl bg-ink text-white disabled:bg-[#c7cac4]"><Send size={17}/></button></form>
  </div>
}

function isCautionSuggestion(value: string) {
  const compact = value.replace(/\s/g, '')
  if (compact.includes('않아요') || compact.includes('아니에요')) return false
  return compact.includes('불편') || compact.includes('빠르게심해') || compact.includes('악화') || compact.includes('따가')
}

function ProductContextCard({ product }: { product: Product }) {
  return <section className="mb-5 overflow-hidden rounded-[22px] border border-[#d9ddff] bg-[linear-gradient(135deg,#f8f8ff_0%,#fff_72%)]">
    <div className="flex items-center gap-4 p-4"><div className="grid size-[72px] shrink-0 place-items-center rounded-2xl bg-white"><ProductGlyph category={product.category} size="sm" src={product.imageUrl}/></div><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><span className="rounded-full bg-accent-soft px-2 py-1 text-[9px] font-bold text-accent">선택한 제품</span><span className="text-[10px] text-muted">{product.category}</span></div><p className="mt-2 truncate text-[11px] font-semibold text-muted">{product.brand}</p><h2 className="mt-1 line-clamp-2 text-sm font-bold leading-5">{product.name}</h2><p className="mt-1 text-[10px] text-muted">{product.volume}</p></div></div>
    <div className="border-t border-[#e5e6f5] bg-white/65 px-4 py-2.5 text-[11px] font-semibold text-accent">SKN AI에게 이 제품을 내 기록과 비교해달라고 요청했어요.</div>
  </section>
}

function ProductContextSkeleton() {
  return <section className="mb-5 flex animate-pulse items-center gap-4 rounded-[22px] border border-[#d9ddff] bg-[#f8f8ff] p-4" aria-label="선택한 제품 불러오는 중">
    <div className="size-[72px] shrink-0 rounded-2xl bg-[#e9eafb]"/><div className="min-w-0 flex-1"><div className="h-5 w-20 rounded-full bg-[#e2e4f7]"/><div className="mt-3 h-3 w-24 rounded bg-[#e3e4e1]"/><div className="mt-2 h-4 w-full rounded bg-[#dedfef]"/><div className="mt-2 h-3 w-16 rounded bg-[#e3e4e1]"/></div>
  </section>
}

function RescuePlanCard({ conversation, onApply, pending }: { conversation: Conversation; onApply: () => void; pending: boolean }) {
  const plan = conversation.rescuePlan!
  if (plan.status === 'BLOCKED') return <Card className="mt-7 border-[#f1d1d1] bg-[#fff8f8]"><p className="text-sm font-bold text-danger">제품 분석을 멈췄어요</p><p className="mt-2 text-xs leading-5 text-muted">{plan.rationale}</p></Card>
  if (plan.status === 'APPLIED') return <Card className="mt-7 border-[#d6e9ac] bg-[#f8fde9]"><div className="flex items-center gap-2 text-sm font-bold"><Check size={18}/>새 루틴으로 적용했어요</div><p className="mt-2 text-xs text-muted">이번 루틴은 독립된 새 사용 경험으로 기록됩니다.</p></Card>
  return <Card className="mt-7 border-[#d9ddff] bg-[#f8f8ff]"><AiBadge/><p className="mt-3 text-[17px] font-bold tracking-[-.02em]">{plan.title}</p><p className="mt-2 text-xs leading-5 text-muted">{plan.rationale}</p>{plan.removeProductName && <div className="mt-4 flex items-center justify-between rounded-xl bg-white p-3"><div><p className="text-[10px] font-bold text-muted">먼저 빼고 확인</p><p className="mt-1 text-sm font-semibold">{plan.removeProductName}</p></div><ArrowRight size={17} className="text-accent"/></div>}<Button disabled={pending} onClick={onApply} className="mt-4 w-full">{pending ? '루틴 만드는 중…' : '이 루틴으로 시작'}</Button><p className="mt-2 text-center text-[10px] text-muted">적용하기 전에는 현재 루틴을 바꾸지 않아요.</p></Card>
}

function titleFor(item: Conversation) {
  if (item.mode === 'RESCUE') return '불편함 확인'
  if (item.mode === 'PRODUCT') return '제품 비교'
  if (item.mode === 'RECOMMEND') return '다음 제품 탐색'
  if (item.mode === 'PATTERN') return '내 패턴 해석'
  return item.messages.find(message => message.role === 'USER')?.content || '새 AI 대화'
}

function modeTitle(mode: Conversation['mode']) {
  if (mode === 'RESCUE') return '불편함 확인'
  if (mode === 'PRODUCT') return '제품 비교'
  if (mode === 'RECOMMEND') return '다음 제품 탐색'
  if (mode === 'PATTERN') return '내 패턴 해석'
  return 'SKN AI'
}

function MessageContent({ text, markdown = false }: { text: string; markdown?: boolean }) {
  if (!markdown) return <p className="whitespace-pre-wrap">{text}</p>
  return <div className="min-w-0 text-[14px] leading-6 text-ink">
    <ReactMarkdown
      skipHtml
      remarkPlugins={[remarkGfm, remarkBreaks]}
      components={{
        h1: ({ children }) => <h2 className="mb-2 mt-5 text-[17px] font-bold tracking-[-.025em] first:mt-0">{children}</h2>,
        h2: ({ children }) => <h2 className="mb-2 mt-5 text-[17px] font-bold tracking-[-.025em] first:mt-0">{children}</h2>,
        h3: ({ children }) => <h3 className="mb-2 mt-4 text-[15px] font-bold tracking-[-.015em] first:mt-0">{children}</h3>,
        p: ({ children }) => <p className="mb-3 whitespace-pre-wrap last:mb-0">{children}</p>,
        strong: ({ children }) => <strong className="font-bold text-ink">{children}</strong>,
        ul: ({ children }) => <ul className="mb-3 ml-1 list-disc space-y-1.5 pl-5 marker:text-accent last:mb-0">{children}</ul>,
        ol: ({ children }) => <ol className="mb-3 ml-1 list-decimal space-y-1.5 pl-5 marker:font-bold marker:text-accent last:mb-0">{children}</ol>,
        li: ({ children }) => <li className="pl-0.5 leading-6">{children}</li>,
        blockquote: ({ children }) => <blockquote className="my-3 rounded-r-xl border-l-3 border-accent bg-accent-soft px-3 py-2 text-muted">{children}</blockquote>,
        a: ({ children, href }) => <a href={href} target="_blank" rel="noreferrer" aria-label={`출처 ${String(children)} 새 창에서 열기`} className="mx-0.5 inline-flex min-w-5 -translate-y-px items-center justify-center rounded-full bg-accent-soft px-1.5 py-0.5 text-[10px] font-bold leading-4 text-accent no-underline ring-1 ring-inset ring-[#d9ddff]">{children}</a>,
        hr: () => <hr className="my-4 border-line"/>,
        table: ({ children }) => <div className="my-3 overflow-x-auto rounded-xl border border-line"><table className="w-full min-w-72 border-collapse text-xs">{children}</table></div>,
        th: ({ children }) => <th className="border-b border-line bg-soft px-3 py-2 text-left font-bold">{children}</th>,
        td: ({ children }) => <td className="border-b border-line px-3 py-2 align-top last:border-b-0">{children}</td>,
        code: ({ children }) => <code className="rounded bg-soft px-1.5 py-0.5 text-[12px] font-semibold">{children}</code>,
      }}
    >{text}</ReactMarkdown>
  </div>
}

function EvidenceSummary({ refs, webSources, onOpen }: { refs: string[]; webSources: WebSource[]; onOpen: () => void }) {
  const counts = refs.reduce<Record<string, number>>((all, ref) => {
    const label = ref.startsWith('PT-') ? '패턴' : ref.startsWith('P-') ? '제품 정보' : ref.startsWith('R-') ? '루틴' : '내 경험'
    all[label] = (all[label] || 0) + 1
    return all
  }, {})
  const labels = [...(webSources.length ? [`외부 출처 ${webSources.length}`] : []), ...Object.entries(counts).map(([label, count]) => `${label} ${count}`)]
  return <button type="button" onClick={onOpen} aria-haspopup="dialog" className="mt-3 flex w-full items-center gap-1.5 rounded-xl bg-soft px-3 py-2.5 text-left text-[10px] font-semibold text-muted transition active:bg-[#e9ebe5]"><BookOpen size={13} className="shrink-0 text-accent"/><span className="min-w-0 flex-1">근거 보기 · {labels.join(' · ')}</span><ChevronRight size={14} className="shrink-0"/></button>
}

function RecommendedProductLinks({ refs }: { refs: string[] }) {
  const productIds = [...new Set(refs
    .filter(ref => ref.startsWith('P-') && !ref.startsWith('PT-'))
    .map(ref => Number(ref.slice(2)))
    .filter(Number.isFinite))].slice(0, 3)
  const products = useQueries({ queries: productIds.map(id => ({ queryKey: ['product', id], queryFn: () => api.product(id) })) })
  if (!productIds.length) return null
  if (products.some(result => result.isPending)) return <div className="mt-4 space-y-2" aria-label="추천 제품 불러오는 중">{productIds.map(id => <div key={id} className="h-[74px] animate-pulse rounded-2xl border border-line bg-soft"/>)}</div>
  const loaded = products.flatMap(result => result.data ? [result.data] : [])
  if (!loaded.length) return null
  return <section className="mt-4" aria-label="AI 추천 제품">
    <p className="mb-2 text-[11px] font-bold text-muted">{loaded.length > 1 ? '추천한 제품 바로 보기' : '이 제품 바로 보기'}</p>
    <div className="space-y-2">{loaded.map((product, index) => <Link key={product.id} to={`/products/${product.id}`} className="flex items-center gap-3 rounded-[18px] border border-[#dfe1f4] bg-[linear-gradient(135deg,#fafaff_0%,#fff_76%)] p-3 transition active:scale-[.99]">
      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-accent text-[11px] font-bold text-white">{index + 1}</span>
      <div className="grid h-16 w-14 shrink-0 place-items-center rounded-xl bg-white"><ProductGlyph category={product.category} src={product.imageUrl} size="sm"/></div>
      <span className="min-w-0 flex-1"><span className="block truncate text-[10px] font-semibold text-muted">{product.brand} · {product.category}</span><span className="mt-0.5 block truncate text-sm font-bold text-ink">{product.name}</span><span className="mt-1 block text-[10px] font-semibold text-accent">탐색에서 상세 보기</span></span>
      <ChevronRight size={17} className="shrink-0 text-muted"/>
    </Link>)}</div>
  </section>
}

function EvidenceSheet({ refs, webSources, onClose }: { refs: string[]; webSources: WebSource[]; onClose: () => void }) {
  const uniqueRefs = [...new Set(refs)]
  const needsProducts = uniqueRefs.some(ref => ref.startsWith('P-') && !ref.startsWith('PT-'))
  const needsRoutines = uniqueRefs.some(ref => ref.startsWith('R-'))
  const needsRecords = uniqueRefs.some(ref => ref.startsWith('E-'))
  const needsPatterns = uniqueRefs.some(ref => ref.startsWith('PT-'))
  const productIds = uniqueRefs.filter(ref => ref.startsWith('P-') && !ref.startsWith('PT-')).map(ref => Number(ref.slice(2))).filter(Number.isFinite)
  const productQueries = useQueries({ queries: productIds.map(id => ({ queryKey: ['product', id], queryFn: () => api.product(id) })) })
  const current = useQuery({ queryKey: ['current-routine'], queryFn: api.currentRoutine, enabled: needsRoutines, retry: false })
  const baseline = useQuery({ queryKey: ['baseline-routine'], queryFn: api.baselineRoutine, enabled: needsRoutines, retry: false })
  const records = useQuery({ queryKey: ['records'], queryFn: api.records, enabled: needsRecords })
  const patterns = useQuery({ queryKey: ['patterns'], queryFn: api.patterns, enabled: needsPatterns })
  const loadedProducts = productQueries.flatMap(result => result.data ? [result.data] : [])
  const loading = (needsProducts && productQueries.some(result => result.isPending)) || ((current.isPending || baseline.isPending) && needsRoutines) || (records.isPending && needsRecords) || (patterns.isPending && needsPatterns)
  const evidence = uniqueRefs.map(ref => resolveEvidence(ref, loadedProducts, [current.data, baseline.data].filter(Boolean) as Routine[], records.data || [], patterns.data || []))

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onClose])

  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/35 px-0 backdrop-blur-[2px]" onMouseDown={onClose}>
    <section role="dialog" aria-modal="true" aria-labelledby="evidence-title" className="safe-bottom flex max-h-[82dvh] w-full max-w-[430px] animate-rise flex-col overflow-hidden rounded-t-[30px] bg-paper shadow-[0_-18px_60px_rgba(23,24,22,.18)]" onMouseDown={event => event.stopPropagation()}>
      <div className="shrink-0 px-5 pb-4 pt-3"><div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[#d9dcd6]"/><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold text-accent">ANSWER SOURCES</p><h2 id="evidence-title" className="mt-1 text-[22px] font-bold tracking-[-.035em]">이 답변에 쓴 근거</h2><p className="mt-2 text-xs leading-5 text-muted">웹에서 확인한 자료와 내 기록을 분리해서 보여줘요.</p></div><button type="button" onClick={onClose} aria-label="근거 닫기" className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-muted shadow-sm"><X size={19}/></button></div></div>
      <div className="overflow-y-auto border-t border-line px-5 py-5">
        {webSources.length > 0 && <section><p className="mb-3 text-[11px] font-bold text-muted">웹에서 확인한 자료</p><div className="space-y-3">{webSources.map(source => <WebSourceCard key={source.ref} source={source}/>)}</div></section>}
        {loading ? <div className="grid min-h-44 place-items-center"><span className="size-6 animate-spin rounded-full border-2 border-line border-t-accent"/></div> : evidence.length > 0 && <section className={webSources.length ? 'mt-6' : ''}><p className="mb-3 text-[11px] font-bold text-muted">내 데이터</p><div className="space-y-3">{evidence.map(item => <EvidenceCard key={item.ref} item={item}/>)}</div></section>}
        <div className="mt-5 rounded-2xl bg-soft p-4 text-[11px] leading-5 text-muted"><b className="text-ink">근거를 읽는 법</b><br/>P1은 제품 공식정보, P2는 공공기관, P3는 연구 자료, P4는 보조 자료예요. 연결된 자료는 적합성이나 원인을 증명하지 않아요.</div>
      </div>
    </section>
  </div>
}

function WebSourceCard({ source }: { source: WebSource }) {
  const tier = sourceTier(source.tier)
  let host = source.url
  try { host = new URL(source.url).hostname.replace(/^www\./, '') } catch { /* 서버가 이미 검증한 URL */ }
  return <a href={source.url} target="_blank" rel="noreferrer" className="group block overflow-hidden rounded-[20px] border border-[#dfe1f4] bg-[linear-gradient(135deg,#fafaff_0%,#fff_76%)] transition active:scale-[.99]">
    <div className="flex gap-3 p-4"><div className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent"><Globe2 size={18}/></div><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><span className="rounded-full bg-white px-2 py-1 text-[9px] font-bold text-accent ring-1 ring-inset ring-[#d9ddff]">{source.ref.replace('S-', '')}</span><span className="text-[10px] font-bold text-muted">{tier}</span></div><h3 className="mt-2 line-clamp-2 text-sm font-bold leading-5">{source.title}</h3><p className="mt-1 truncate text-[10px] text-muted">{host}</p></div><ExternalLink size={16} className="mt-1 shrink-0 text-muted transition group-hover:text-accent"/></div>
  </a>
}

function sourceTier(tier: WebSource['tier']) {
  if (tier === 'P1') return 'P1 · 제품 공식정보'
  if (tier === 'P2') return 'P2 · 공공기관'
  if (tier === 'P3') return 'P3 · 연구 자료'
  return 'P4 · 보조 자료'
}

type ResolvedEvidence = { ref: string; kind: 'PRODUCT' | 'ROUTINE' | 'RECORD' | 'PATTERN' | 'UNKNOWN'; eyebrow: string; title: string; subtitle?: string; details: string[] }

function resolveEvidence(ref: string, products: Product[], routines: Routine[], records: ExperienceRecord[], patterns: Pattern[]): ResolvedEvidence {
  const id = Number(ref.split('-').at(-1))
  if (ref.startsWith('PT-')) {
    const pattern = patterns.find(item => item.id === id)
    return pattern ? { ref, kind: 'PATTERN', eyebrow: '연결된 패턴', title: pattern.title, subtitle: `지지 ${pattern.supportingCount}건 · 반대 ${pattern.contradictingCount}건`, details: [pattern.summary] } : unresolvedEvidence(ref)
  }
  if (ref.startsWith('P-')) {
    const product = products.find(item => item.id === id)
    return product ? { ref, kind: 'PRODUCT', eyebrow: product.facts.length ? '출처에서 확인한 제품 정보' : '선택한 제품', title: product.name, subtitle: `${product.brand} · ${product.category}${product.volume ? ` · ${product.volume}` : ''}`, details: product.facts.map(fact => fact.text).slice(0, 5) } : unresolvedEvidence(ref)
  }
  if (ref.startsWith('R-')) {
    const routine = routines.find(item => item.id === id)
    return routine ? { ref, kind: 'ROUTINE', eyebrow: '내가 등록한 루틴', title: routine.name, subtitle: `${routine.items.length}개 제품 · ${routine.status === 'ACTIVE' ? '현재 사용' : '비교 기준'}`, details: routine.items.map((item, index) => `${index + 1}. ${item.productName} · ${timeSlotLabel(item.timeSlot)} · ${item.frequency}`) } : unresolvedEvidence(ref)
  }
  if (ref.startsWith('E-')) {
    const record = records.find(item => item.id === id)
    return record ? { ref, kind: 'RECORD', eyebrow: '내가 남긴 사용 경험', title: record.productName, subtitle: `${sentimentText(record.sentiment)} · ${formatEvidenceDate(record.createdAt)}`, details: [record.note, record.tags.length ? `느낌: ${record.tags.join(', ')}` : '', record.discomfort === 'REPORTED' ? '피부 불편함을 함께 남김' : ''].filter(Boolean) } : unresolvedEvidence(ref)
  }
  return unresolvedEvidence(ref)
}

function unresolvedEvidence(ref: string): ResolvedEvidence {
  return { ref, kind: 'UNKNOWN', eyebrow: '연결된 근거', title: '상세 정보를 불러오지 못했어요', details: ['답변은 그대로 보존했어요. 잠시 후 다시 열어보세요.'] }
}

function EvidenceCard({ item }: { item: ResolvedEvidence }) {
  const icon = item.kind === 'PRODUCT' ? <BadgeCheck size={18}/> : item.kind === 'ROUTINE' ? <Layers3 size={18}/> : item.kind === 'RECORD' ? <Clock3 size={18}/> : <Sparkles size={18}/>
  return <article className="overflow-hidden rounded-[20px] border border-line bg-white"><div className="flex gap-3 p-4"><div className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">{icon}</div><div className="min-w-0 flex-1"><p className="text-[10px] font-bold text-accent">{item.eyebrow}</p><h3 className="mt-1 text-sm font-bold leading-5">{item.title}</h3>{item.subtitle && <p className="mt-1 text-[11px] text-muted">{item.subtitle}</p>}</div></div>{item.details.length > 0 && <div className="border-t border-line bg-[#fcfcfa] px-4 py-3"><ul className="space-y-2">{item.details.map((detail, index) => <li key={index} className="flex gap-2 text-[11px] leading-5 text-muted"><span className="mt-2 size-1 shrink-0 rounded-full bg-[#aeb2aa]"/><span>{detail}</span></li>)}</ul></div>}</article>
}

function timeSlotLabel(value: Routine['items'][number]['timeSlot']) { return value === 'MORNING' ? '아침' : value === 'EVENING' ? '저녁' : '아침·저녁' }
function sentimentText(value: ExperienceRecord['sentiment']) { return value === 'LIKED' ? '마음에 들었음' : value === 'DISAPPOINTED' ? '아쉬웠음' : '아직 모르겠음' }
function formatEvidenceDate(value: string) { const date = new Date(value.replace(' ', 'T') + (value.includes('Z') ? '' : 'Z')); return Number.isNaN(date.getTime()) ? value.slice(0, 10) : new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }).format(date) }
