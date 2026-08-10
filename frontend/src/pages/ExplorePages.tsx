import { useEffect, useRef, useState } from 'react'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowRight, BadgeCheck, ChevronRight, CirclePlus, ExternalLink, Plus, Search, Sparkles, X } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../lib/api'
import { startChatPath } from '../lib/chat'
import type { Product, ProductFact, ProductGuide, UserProduct } from '../lib/types'
import { Button, EmptyState, ErrorState, Loading, ProductGlyph, Screen, TopBar } from '../components/ui'

export function ExplorePage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const products = useInfiniteQuery({
    queryKey: ['product-pages', query],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) => api.products(query, pageParam, 24),
    getNextPageParam: lastPage => lastPage.hasMore ? lastPage.nextCursor : undefined,
  })
  const productItems = products.data?.pages.flatMap(page => page.items) || []
  const { fetchNextPage, hasNextPage, isFetchingNextPage } = products
  const openRecommendationChat = () => navigate(startChatPath('RECOMMEND', '내가 좋아했던 사용감과 아쉬웠던 경험을 바탕으로 다음에 탐색할 제품 후보를 찾아줘.'))
  const contextualProduct = productItems.find(product => product.personalRecordCount > 0) || productItems[0]
  useEffect(() => {
    const target = loadMoreRef.current
    if (!target || !hasNextPage) return
    const observer = new IntersectionObserver(entries => {
      if (entries[0]?.isIntersecting && !isFetchingNextPage) fetchNextPage()
    }, { rootMargin: '240px 0px' })
    observer.observe(target)
    return () => observer.disconnect()
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])
  return <Screen>
    <TopBar title="탐색" right={<Link to="/my-products" className="whitespace-nowrap text-xs font-semibold text-muted">내 화장품</Link>}/>
    <div className="px-5 pt-6">
      <h1 className="text-[28px] font-bold tracking-[-.045em]">다음에 써볼 제품</h1><p className="mt-2 text-sm leading-6 text-muted">인기 순위보다, 이전에 남긴 내 경험과<br/>비교하며 탐색해요.</p>
      <div className="sticky top-16 z-10 -mx-1 mt-5 bg-paper/95 px-1 py-3 backdrop-blur"><label className="flex h-12 items-center gap-3 rounded-2xl border border-line bg-white px-4 focus-within:border-accent"><Search size={19} className="text-muted"/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="브랜드 또는 제품명" className="min-w-0 flex-1 bg-transparent text-sm outline-none"/>{query && <button aria-label="검색어 지우기" onClick={() => setQuery('')}><X size={17} className="text-muted"/></button>}</label></div>
      {!query && contextualProduct && <section className="mb-7"><h2 className="text-sm font-bold">내 기록에서 다시 볼 제품</h2><div className="mt-3 grid grid-cols-2 gap-3"><Link to={`/products/${contextualProduct.id}`} className="rounded-[22px] border border-line bg-white p-4"><ProductGlyph category={contextualProduct.category} src={contextualProduct.imageUrl}/><p className="mt-3 text-[10px] font-semibold text-muted">{contextualProduct.brand}</p><h3 className="mt-1 line-clamp-2 text-sm font-bold leading-5">{contextualProduct.name}</h3><p className="mt-2 text-[10px] font-bold text-accent">{contextualProduct.personalRecordCount ? `내 기록 ${contextualProduct.personalRecordCount}건과 비교` : '제품 정보 살펴보기'}</p></Link><button onClick={openRecommendationChat} className="rounded-[22px] border border-[#d9ddff] bg-[#f8f8ff] p-4 text-left"><div className="grid size-12 place-items-center rounded-2xl bg-accent-soft text-accent"><Sparkles size={20}/></div><p className="mt-4 text-[10px] font-semibold text-accent">SKN AI</p><h3 className="mt-1 text-sm font-bold leading-5">내 패턴에서<br/>다음 제품 찾기</h3><p className="mt-2 text-[10px] text-muted">후보와 비교할 이유 확인</p></button></div><div className="mt-5 flex gap-2 overflow-x-auto pb-1"><span className="shrink-0 rounded-full bg-soft px-3 py-2 text-[11px] font-semibold text-muted">밀림 없는 조합</span><span className="shrink-0 rounded-full bg-soft px-3 py-2 text-[11px] font-semibold text-muted">가벼운 사용감</span><span className="shrink-0 rounded-full bg-soft px-3 py-2 text-[11px] font-semibold text-muted">저녁 레이어링</span></div></section>}
      <h2 className="mb-3 text-sm font-bold">{query ? '검색 결과' : '전체 제품'}</h2>
      {products.isPending ? <Loading/> : products.isError && !productItems.length ? <ErrorState message={products.error.message} onRetry={() => products.refetch()}/> : productItems.length ? <><div className="space-y-2">{productItems.map(product => <ProductRow key={product.id} product={product}/>)}</div><div ref={loadMoreRef} className="grid min-h-24 place-items-center pb-4" aria-live="polite">{isFetchingNextPage ? <div className="flex items-center gap-2 text-xs text-muted"><span className="size-4 animate-spin rounded-full border-2 border-line border-t-accent"/>제품 더 불러오는 중</div> : products.isFetchNextPageError ? <button onClick={() => fetchNextPage()} className="rounded-full border border-line bg-white px-4 py-2 text-xs font-semibold">다시 불러오기</button> : !hasNextPage ? <p className="text-[11px] text-muted">{query ? '검색된 제품을 모두 봤어요.' : '모든 제품을 봤어요.'}</p> : null}</div></> : <EmptyState icon={<Search/>} title="검색 결과가 없어요" body="브랜드나 제품명을 다시 확인해주세요." action={query ? <Button variant="secondary" onClick={() => setQuery('')}>전체 제품 보기</Button> : undefined}/>} 
    </div>
  </Screen>
}

function ProductRow({ product }: { product: Product }) {
  return <Link to={`/products/${product.id}`} className="flex items-center rounded-[20px] border border-line bg-white p-3 transition active:scale-[.99]"><ProductGlyph category={product.category} src={product.imageUrl}/><div className="min-w-0 flex-1 pr-1"><div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted"><span>{product.brand}</span>{product.verified && <BadgeCheck size={13} className="text-accent"/>}</div><h2 className="mt-1 truncate text-[15px] font-bold tracking-[-.02em]">{product.name}</h2><p className="mt-1 text-xs text-muted">{product.category} · {product.volume}</p>{product.personalRecordCount > 0 ? <p className="mt-2 inline-flex rounded-full bg-accent-soft px-2 py-1 text-[10px] font-bold text-accent">내 비교 기록 {product.personalRecordCount}건</p> : product.owned ? <p className="mt-2 text-[10px] font-bold text-muted">내 화장품에 있음</p> : null}</div><ChevronRight size={18} className="text-muted"/></Link>
}

export function ProductPage() {
  const { id } = useParams()
  const productId = Number(id)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [added, setAdded] = useState(false)
  const product = useQuery({ queryKey: ['product', productId], queryFn: () => api.product(productId), enabled: Number.isFinite(productId) })
  const add = useMutation({
    mutationFn: () => api.addProduct(productId),
    onSuccess: () => {
      setAdded(true)
      queryClient.invalidateQueries({ queryKey: ['product-pages'] })
      queryClient.invalidateQueries({ queryKey: ['product', productId] })
      queryClient.invalidateQueries({ queryKey: ['user-products'] })
      queryClient.invalidateQueries({ queryKey: ['home'] })
    },
  })
  if (product.isPending) return <Screen nav={false}><TopBar title="제품" back/><Loading/></Screen>
  if (product.isError) return <Screen nav={false}><TopBar title="제품" back/><ErrorState message={product.error.message} onRetry={() => product.refetch()}/></Screen>
  const data = product.data
  const guide = data.guide
  const owned = data.owned || added
  const texture = guide?.highlights.find(highlight => highlight.title === '제형')?.detail
    ?.replace(/\s*제형으로 등록된 제품이에요\.?$/, '')
    .trim()
  const overviewItems = guide ? [
    { label: '제품 유형', value: data.category },
    { label: '제형', value: texture },
    { label: '루틴 단계', value: guide.routineStep?.trim() },
    { label: '사용 방식', value: guide.usageType?.trim() },
  ].filter((item): item is { label: string; value: string } => Boolean(item.value)) : []
  const hasUsage = Boolean(guide?.usageTiming?.length || guide?.usageInstructions?.length)
  const openProductChat = () => navigate(startChatPath(
    'PRODUCT',
    data.personalRecordCount > 0
      ? '이 제품을 지금 내 기록과 비교해줘.'
      : '이 제품을 확인된 정보와 현재 루틴을 바탕으로 같이 살펴봐줘.',
    { productId },
  ))

  return <Screen nav={false} className="bg-white pb-44">
    <TopBar title="제품 정보" back/>
    <div className="pb-8">
      <ProductHero product={data}/>
      <div className="px-5">
        {guide?.summary?.trim() && <GuideSummary guide={guide} productName={data.name}/>}
        {overviewItems.length > 0 && <ProductOverview items={overviewItems}/>}
        {guide && guide.highlights && guide.highlights.length > 0 && <ProductFeatures highlights={guide.highlights}/>}
        {guide && hasUsage && <UsageGuide guide={guide}/>} 
        {data.facts.length > 0 && <VerifiedFacts facts={data.facts}/>}
        <div className="py-8"><ProductAiAction product={data} onClick={openProductChat}/></div>
      </div>
    </div>
    <div className="safe-bottom fixed inset-x-0 bottom-0 z-20 mx-auto max-w-[430px] border-t border-line bg-white/96 px-4 pb-4 pt-3 shadow-[0_-12px_36px_rgba(23,24,22,.06)] backdrop-blur-xl">
      {added && <p className="mb-2 text-center text-[11px] font-semibold text-[#52722d]">내 화장품에 담았어요. 현재 루틴은 바뀌지 않아요.</p>}
      {add.error && <p className="mb-2 text-center text-[11px] font-semibold leading-5 text-danger">{add.error.message}</p>}
      {owned ? <div className="grid grid-cols-[118px_1fr] gap-2.5"><Button variant="secondary" onClick={() => navigate('/my-products')}>내 화장품</Button><Button onClick={openProductChat}><Sparkles size={17}/>{data.personalRecordCount > 0 ? '내 기록과 비교' : 'AI에게 묻기'}</Button></div> : <div className="grid grid-cols-[116px_1fr] gap-2.5">
        <Button variant="secondary" onClick={openProductChat} aria-label="AI에게 이 제품 물어보기"><Sparkles size={17}/>AI에게 묻기</Button>
        <Button disabled={add.isPending} onClick={() => add.mutate()}>{add.isPending ? '추가하는 중…' : '내 화장품에 추가'}</Button>
      </div>}
    </div>
  </Screen>
}

function ProductHero({ product }: { product: Product }) {
  const meta = [product.volume, product.versionLabel ? `${product.versionLabel} 버전` : undefined].filter(Boolean)
  return <section>
    <div className="relative isolate flex min-h-[286px] items-center justify-center overflow-hidden bg-[#f3f4ef]">
      <div className="absolute -left-16 top-0 size-52 rounded-full bg-white/80 blur-3xl"/>
      <div className="absolute -right-20 bottom-0 size-52 rounded-full bg-[#e9ebff]/75 blur-3xl"/>
      <div className="absolute inset-x-20 bottom-8 h-8 rounded-[50%] bg-black/[.06] blur-xl"/>
      <div className="relative -translate-y-1 drop-shadow-[0_18px_22px_rgba(32,38,31,.12)]"><ProductGlyph category={product.category} size="lg" src={product.imageUrl}/></div>
    </div>
    <div className="px-5 pb-7 pt-6">
      <div className="flex items-center gap-2 text-[12px] font-bold tracking-[.01em] text-muted"><span>{product.brand}</span><span className="size-0.5 rounded-full bg-[#b7bab3]"/><span>{product.category}</span></div>
      <h1 className="mt-2.5 text-[29px] font-bold leading-[1.2] tracking-[-.05em]">{product.name}</h1>
      {(meta.length > 0 || product.verified) && <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] font-medium text-muted">{meta.map(item => <span key={item}>{item}</span>)}{product.verified && <span className="inline-flex items-center gap-1 font-bold text-[#52722d]"><BadgeCheck size={14}/>제품 버전 확인됨</span>}</div>}
    </div>
  </section>
}

function GuideSummary({ guide, productName }: { guide: ProductGuide; productName: string }) {
  const aiGenerated = guide.origin === 'AI_GENERATED'
  const summary = withoutRepeatedProductName(guide.summary, productName)
  return <section aria-labelledby="guide-summary-title" className="border-t border-line py-7">
    <div className="flex items-center gap-1.5 text-[11px] font-bold text-accent"><Sparkles size={13}/><span>{aiGenerated ? 'SKN AI 제품 요약' : 'SKN 제품 요약'}</span></div>
    <h2 id="guide-summary-title" className="sr-only">이 제품이 무엇인지</h2>
    <p className="mt-3 text-[19px] font-semibold leading-8 tracking-[-.03em]">{summary}</p>
  </section>
}

function withoutRepeatedProductName(summary: string, productName: string) {
  const trimmed = summary.trim()
  if (!trimmed.startsWith(productName)) return trimmed
  const remainder = trimmed.slice(productName.length)
  if (!/^\s*[:：\-–—]/.test(remainder)) return trimmed
  return remainder.replace(/^\s*[:：\-–—]\s*/, '').trim()
}

function ProductOverview({ items }: { items: { label: string; value: string }[] }) {
  return <section aria-labelledby="product-overview-title" className="border-t border-line py-7">
    <h2 id="product-overview-title" className="text-[18px] font-bold tracking-[-.03em]">기본 정보</h2>
    <dl className="mt-4 grid grid-cols-2 overflow-hidden rounded-[20px] border border-line bg-[#fafbf8]">
      {items.map(({ label, value }, index) => <div key={label} className={`min-w-0 p-4 ${index % 2 === 0 ? 'border-r border-line' : ''} ${index < 2 && items.length > 2 ? 'border-b border-line' : ''}`}>
        <dt className="text-[10px] font-bold text-muted">{label}</dt>
        <dd className="mt-1.5 text-[14px] font-semibold leading-5 tracking-[-.02em]">{value}</dd>
      </div>)}
    </dl>
  </section>
}

function ProductFeatures({ highlights }: { highlights: ProductGuide['highlights'] }) {
  return <section aria-labelledby="product-features-title" className="border-t border-line py-7">
    <h2 id="product-features-title" className="text-[18px] font-bold tracking-[-.03em]">제품 특징</h2>
    <div className="mt-4 divide-y divide-line rounded-[20px] border border-line bg-white px-4">
      {highlights.map((highlight, index) => <div key={`${highlight.title}-${index}`} className="grid grid-cols-[88px_1fr] gap-3 py-4">
        <p className="text-[11px] font-bold leading-5 text-muted">{highlight.title}</p>
        <p className="text-[13px] font-semibold leading-5 tracking-[-.01em]">{highlight.detail}</p>
      </div>)}
    </div>
  </section>
}

function UsageGuide({ guide }: { guide: ProductGuide }) {
  const timings = guide.usageTiming.filter(Boolean)
  const instructions = guide.usageInstructions.filter(Boolean)
  return <section aria-labelledby="usage-guide-title" className="border-t border-line py-7">
    <div className="flex items-center justify-between gap-3"><h2 id="usage-guide-title" className="text-[18px] font-bold tracking-[-.03em]">사용 방법</h2>{timings.length > 0 && <div className="flex gap-1.5">{timings.map(timing => <span key={timing} className="rounded-full bg-accent-soft px-2.5 py-1.5 text-[10px] font-bold text-accent">{timing}</span>)}</div>}</div>
    {instructions.length > 0 && <ol className="mt-5 space-y-4">{instructions.map((instruction, index) => <li key={`${instruction}-${index}`} className="flex gap-3.5"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-ink text-[11px] font-bold text-white">{index + 1}</span><p className="pt-0.5 text-[14px] leading-6">{instruction}</p></li>)}</ol>}
  </section>
}

function VerifiedFacts({ facts }: { facts: ProductFact[] }) {
  return <section aria-labelledby="verified-facts-title" className="border-t border-line py-7">
    <div className="flex items-center justify-between gap-4"><h2 id="verified-facts-title" className="text-[18px] font-bold tracking-[-.03em]">출처에서 확인한 정보</h2><span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#52722d]"><BadgeCheck size={13}/>{facts.length}건</span></div>
    <div className="mt-4 divide-y divide-line border-y border-line">{facts.map((fact, index) => <article key={`${fact.type}-${fact.text}-${index}`} className="py-4">
      <p className="text-[10px] font-bold text-[#66833e]">{factTypeLabel(fact.type)}</p><p className="mt-1.5 text-[13px] font-semibold leading-5">{fact.text}</p>
      <div className="mt-2.5 flex items-center justify-between gap-3 text-[10px] text-muted"><a href={fact.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex min-w-0 items-center gap-1 font-semibold underline decoration-line underline-offset-2"><span className="truncate">{fact.sourceLabel}</span><ExternalLink size={11} className="shrink-0"/></a><span className="shrink-0">{formatProductDate(fact.checkedAt)} 확인</span></div>
    </article>)}</div>
  </section>
}

function ProductAiAction({ product, onClick }: { product: Product; onClick: () => void }) {
  const hasRecords = product.personalRecordCount > 0
  return <button type="button" onClick={onClick} aria-labelledby="product-ai-title" className="flex w-full items-center gap-4 rounded-[22px] border border-[#dfe1ff] bg-[linear-gradient(135deg,#f1f2ff_0%,#fafaff_100%)] p-4 text-left transition active:scale-[.99]">
    <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-accent text-white shadow-[0_8px_18px_rgba(83,101,245,.22)]"><Sparkles size={19}/></span>
    <span className="min-w-0 flex-1"><span className="text-[10px] font-bold text-accent">SKN AI</span><span id="product-ai-title" className="mt-1 block text-[15px] font-bold leading-5 tracking-[-.02em]">{hasRecords ? `내 경험 ${product.personalRecordCount}건과 비교하기` : '내 루틴에서 이 제품 물어보기'}</span><span className="mt-1 block text-[11px] leading-4 text-muted">제품 정보와 내 기록을 구분해서 답해요.</span></span>
    <ArrowRight size={18} className="shrink-0 text-accent"/>
  </button>
}

function factTypeLabel(type: string) {
  const labels: Record<string, string> = {
    DIRECTIONS: '사용 방법',
    TEXTURE: '제형·사용감',
    LABEL_CLAIM: '제품 표시 정보',
    CAUTION: '사용 시 주의',
    SUN_PROTECTION: '자외선 차단 표시',
    INGREDIENT_LABEL: '성분 표시',
    CERTIFICATION: '인증 정보',
  }
  return labels[type] || '확인된 제품 정보'
}

function formatProductDate(value?: string) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value.slice(0, 10).replaceAll('-', '.')
  return new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' }).format(date)
}

export function ShelfPage() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState<'ALL' | 'ROUTINE' | 'UNUSED'>('ALL')
  const products = useQuery({ queryKey: ['user-products'], queryFn: api.userProducts })
  const current = useQuery({ queryKey: ['current-routine'], queryFn: api.currentRoutine, retry: false })
  const routineIds = new Set(current.data?.items.map(item => item.userProductId) || [])
  const filtered = products.data?.filter(item => filter === 'ALL' || (filter === 'ROUTINE' ? routineIds.has(item.id) : !routineIds.has(item.id) && !(item.product?.personalRecordCount)))
  return <Screen nav={false}>
    <TopBar title="내 화장품" back right={<button onClick={() => navigate('/explore')} aria-label="탐색에서 화장품 추가" className="grid size-9 place-items-center rounded-full bg-ink text-white"><Plus size={18}/></button>}/>
    <div className="px-5 py-6"><div className="flex items-end justify-between"><div><h1 className="text-[26px] font-bold tracking-[-.04em]">내가 가진 화장품</h1><p className="mt-2 text-sm text-muted">루틴에 넣을 제품을 고를 수 있어요.</p></div><Link to="/routine/edit" className="text-xs font-bold text-accent">루틴 편집</Link></div>
      {!!products.data?.length && <div className="mt-6 flex gap-2">{([['ALL',`전체 ${products.data.length}`],['ROUTINE',`현재 루틴 ${routineIds.size}`],['UNUSED',`아직 안 써봄 ${products.data.filter(item => !routineIds.has(item.id) && !item.product?.personalRecordCount).length}`]] as const).map(([value,label]) => <button key={value} onClick={() => setFilter(value)} className={`rounded-full px-3 py-2 text-[11px] font-bold ${filter === value ? 'bg-ink text-white' : 'bg-soft text-muted'}`}>{label}</button>)}</div>}
      {products.isPending ? <Loading/> : products.data?.length ? filtered?.length ? <div className="mt-5 grid grid-cols-2 gap-3">{filtered.map(item => <ShelfCard key={item.id} item={item} inRoutine={routineIds.has(item.id)} onStart={() => {
        if (item.product) navigate(`/products/${item.product.id}`)
        else navigate('/routine/edit')
      }}/>)}</div> : <EmptyState icon={<CirclePlus/>} title={filter === 'ROUTINE' ? '현재 루틴에 제품이 없어요' : '아직 사용 전인 제품이 없어요'} body={filter === 'ROUTINE' ? '루틴 편집에서 실제 사용하는 제품을 추가해보세요.' : '새로 추가한 제품은 현재 루틴에 넣기 전까지 여기에 보여요.'} action={<Button variant="secondary" onClick={() => setFilter('ALL')}>전체 보기</Button>}/> : <EmptyState icon={<CirclePlus/>} title="아직 추가한 화장품이 없어요" body="탐색에서 제품을 찾아 내 화장품에 추가해주세요." action={<Link to="/explore"><Button>화장품 찾기</Button></Link>}/>} 
    </div>
  </Screen>
}

function ShelfCard({ item, inRoutine, onStart }: { item: UserProduct; inRoutine: boolean; onStart: () => void }) {
  const product = item.product
  return <button onClick={onStart} className="rounded-[20px] border border-line bg-white p-3 text-left"><div className="flex justify-center"><ProductGlyph category={product?.category || item.customCategory} src={product?.imageUrl}/></div><p className="mt-2 truncate text-[11px] font-semibold text-muted">{product?.brand || item.customBrand || '브랜드 미입력'}</p><h2 className="mt-1 line-clamp-2 min-h-10 text-sm font-bold leading-5">{product?.name || item.customName}</h2><p className="mt-2 text-[10px] font-bold text-accent">{inRoutine ? '현재 루틴' : product?.personalRecordCount ? `연결된 경험 ${product.personalRecordCount}건` : '아직 안 써봄'} <ArrowRight className="inline" size={11}/></p></button>
}
