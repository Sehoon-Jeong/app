import type { ButtonHTMLAttributes, PropsWithChildren, ReactNode } from 'react'
import { useState } from 'react'
import { Bot, ChevronLeft, CircleUserRound, FlaskConical, Home, LibraryBig, Search, Sparkles } from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import { twMerge } from 'tailwind-merge'

export function Screen({ children, className = '', nav = true }: PropsWithChildren<{ className?: string; nav?: boolean }>) {
  return <main className={twMerge('mobile-shell h-full min-h-0 overflow-y-auto overscroll-contain bg-paper text-ink', nav && 'pb-24', className)}>{children}{nav && <BottomNav />}</main>
}

export function TopBar({ title, back = false, backTo, right }: { title: string; back?: boolean; backTo?: string; right?: ReactNode }) {
  const navigate = useNavigate()
  return <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-line/70 bg-paper/95 px-5 backdrop-blur">
    <div className="w-10">{back && <button aria-label="뒤로" onClick={() => backTo ? navigate(backTo) : navigate(-1)} className="-ml-2 grid size-10 place-items-center rounded-full hover:bg-soft"><ChevronLeft size={24}/></button>}</div>
    <h1 className="text-[16px] font-semibold tracking-[-.02em]">{title}</h1>
    <div className="flex w-10 justify-end">{right}</div>
  </header>
}

function BottomNav() {
  const items = [
    { to: '/', label: '홈', icon: Home, end: true },
    { to: '/explore', label: '탐색', icon: Search },
    { to: '/experience', label: 'My Lab', icon: FlaskConical },
    { to: '/ai', label: 'AI', icon: Sparkles },
    { to: '/records', label: '나', icon: LibraryBig },
  ]
  return <nav className="safe-bottom fixed inset-x-0 bottom-0 z-30 mx-auto flex h-[78px] max-w-[430px] items-start justify-around border-t border-line bg-white/96 px-1 pt-2 backdrop-blur-lg">
    {items.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end} className={({ isActive }) => twMerge('flex min-w-14 flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[11px] font-medium text-muted transition', isActive && 'text-accent')}>
      <Icon size={22} strokeWidth={1.9}/><span>{label}</span>
    </NavLink>)}
  </nav>
}

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return <div className="inline-flex items-center gap-2.5"><div className="grid size-8 place-items-center rounded-xl bg-ink text-lime"><FlaskConical size={18}/></div><span className={twMerge('font-black tracking-[-.08em]', compact ? 'text-xl' : 'text-3xl')}>SKN</span></div>
}

export function Button({ className, variant = 'primary', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' }) {
  const variants = {
    primary: 'bg-ink text-white shadow-sm hover:bg-black disabled:bg-[#a9aba6]',
    secondary: 'border border-line bg-white text-ink hover:bg-soft',
    ghost: 'bg-transparent text-ink hover:bg-soft',
    danger: 'bg-[#fff0f0] text-danger hover:bg-[#ffe8e8]',
  }
  return <button className={twMerge('flex min-h-12 items-center justify-center gap-2 rounded-2xl px-4 text-[15px] font-semibold transition active:scale-[.99] disabled:cursor-not-allowed disabled:opacity-60', variants[variant], className)} {...props}/>
}

export function Card({ children, className = '' }: PropsWithChildren<{ className?: string }>) {
  return <section className={twMerge('rounded-[22px] border border-line bg-white p-5', className)}>{children}</section>
}

export function Eyebrow({ children, className = '' }: PropsWithChildren<{ className?: string }>) {
  return <p className={twMerge('text-[12px] font-bold uppercase tracking-[.08em] text-muted', className)}>{children}</p>
}

export function ProductGlyph({ category = '제품', size = 'md', src }: { category?: string; size?: 'sm' | 'md' | 'lg'; src?: string }) {
  const [failed, setFailed] = useState(false)
  const isDropper = /세럼|앰플/.test(category)
  const isTube = /선|클렌/.test(category)
  const dims = size === 'lg' ? 'h-48 w-36' : size === 'sm' ? 'h-14 w-12' : 'h-24 w-18'
  if (src && !failed) {
    return <div className={twMerge('shrink-0 overflow-hidden rounded-2xl border border-line bg-white', dims)}>
      <img src={src} alt={category} loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(true)} className="h-full w-full object-contain p-1.5"/>
    </div>
  }
  return <div className={twMerge('relative grid shrink-0 place-items-end', dims)} aria-hidden="true">
    <div className={twMerge('relative w-3/5 border border-[#cdd2cb] bg-gradient-to-b from-white to-[#e8eee8] shadow-[0_10px_25px_rgba(31,42,31,.10)]', isDropper ? 'h-3/4 rounded-b-2xl rounded-t-lg' : isTube ? 'h-5/6 rounded-[45%_45%_16px_16px]' : 'h-2/3 rounded-2xl')}>
      {isDropper && <><div className="absolute -top-7 left-1/2 h-8 w-1/2 -translate-x-1/2 rounded-t-xl bg-[#22251f]"/><div className="absolute -top-1 left-1/2 h-2 w-2/3 -translate-x-1/2 bg-[#dfe4dd]"/></>}
      <div className="absolute inset-x-1.5 top-1/3 rounded-sm border border-black/5 bg-white/75 py-1 text-center text-[6px] font-bold tracking-widest text-[#555a53]">SKN</div>
    </div>
  </div>
}

export function Loading({ label = '불러오는 중' }: { label?: string }) {
  return <div className="grid min-h-[55svh] place-items-center"><div className="flex flex-col items-center gap-3 text-sm text-muted"><span className="size-6 animate-spin rounded-full border-2 border-line border-t-accent"/><span>{label}</span></div></div>
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return <div className="mx-5 mt-24 text-center"><div className="mx-auto mb-4 grid size-12 place-items-center rounded-full bg-soft text-muted"><Bot size={22}/></div><h2 className="font-semibold">잠시 연결하지 못했어요</h2><p className="mx-auto mt-2 max-w-64 text-sm leading-6 text-muted">{message}</p>{onRetry && <Button className="mx-auto mt-5" variant="secondary" onClick={onRetry}>다시 시도</Button>}</div>
}

export function EmptyState({ icon, title, body, action }: { icon?: ReactNode; title: string; body: string; action?: ReactNode }) {
  return <div className="px-7 py-16 text-center"><div className="mx-auto mb-5 grid size-14 place-items-center rounded-2xl bg-soft text-muted">{icon || <CircleUserRound/>}</div><h2 className="text-xl font-bold tracking-[-.03em]">{title}</h2><p className="mx-auto mt-2 max-w-72 text-sm leading-6 text-muted">{body}</p>{action && <div className="mt-6">{action}</div>}</div>
}

export function BottomSheet({ open, onClose, title, children }: PropsWithChildren<{ open: boolean; onClose: () => void; title: string }>) {
  if (!open) return null
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30" onMouseDown={onClose}>
    <section className="safe-bottom w-full max-w-[430px] animate-rise rounded-t-[28px] bg-white px-5 pb-4 pt-3 shadow-2xl" onMouseDown={event => event.stopPropagation()}>
      <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-[#d9dcd6]"/><div className="mb-5 flex items-start justify-between"><h2 className="text-xl font-bold tracking-[-.03em]">{title}</h2><button onClick={onClose} className="text-sm text-muted">닫기</button></div>{children}
    </section>
  </div>
}

export function AiBadge() {
  return <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1 text-[11px] font-bold text-accent"><Sparkles size={12}/> SKN AI</span>
}
