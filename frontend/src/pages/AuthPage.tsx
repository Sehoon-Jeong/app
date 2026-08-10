import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowRight, Check, Eye, EyeOff } from 'lucide-react'
import { api, ApiError } from '../lib/api'
import { BrandMark, Button } from '../components/ui'

export function AuthPage() {
  const queryClient = useQueryClient()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const auth = useMutation({
    mutationFn: () => mode === 'login' ? api.login(username, password) : api.signup(username, password),
    onSuccess: data => {
      queryClient.setQueryData(['auth'], data)
      queryClient.invalidateQueries({ queryKey: ['quick-accounts'] })
    },
  })
  const demo = useMutation({ mutationFn: api.demo, onSuccess: data => queryClient.setQueryData(['auth'], data) })
  const error = auth.error instanceof ApiError ? auth.error.message : auth.isError ? '잠시 후 다시 시도해주세요.' : ''

  return <main className="mobile-shell flex h-full min-h-0 flex-col overflow-y-auto bg-paper px-6 pb-8 pt-12">
    <div className="animate-rise"><BrandMark/><p className="mt-5 max-w-[310px] text-[26px] font-bold leading-[1.28] tracking-[-.045em]">써본 화장품이 쌓일수록<br/>나를 더 잘 알게 됩니다.</p><p className="mt-3 text-sm leading-6 text-muted">사용감·조합·피부 반응을 연결하는<br/>나만의 스킨케어 기록.</p></div>

    <section className="mt-10 min-w-0 rounded-[26px] border border-line bg-white p-5 shadow-[0_16px_45px_rgba(22,28,21,.07)]">
      <div className="mb-5 grid grid-cols-2 rounded-xl bg-soft p-1">
        {(['login','signup'] as const).map(item => <button key={item} onClick={() => { setMode(item); auth.reset() }} className={`rounded-[10px] py-2 text-sm font-semibold transition ${mode === item ? 'bg-white text-ink shadow-sm' : 'text-muted'}`}>{item === 'login' ? '로그인' : '회원가입'}</button>)}
      </div>
      <form onSubmit={event => { event.preventDefault(); auth.mutate() }} className="space-y-3">
        <label className="block"><span className="mb-1.5 block text-xs font-semibold text-muted">아이디</span><input autoCapitalize="none" value={username} onChange={e => setUsername(e.target.value)} placeholder="영문 소문자·숫자 4자 이상" className="h-12 w-full rounded-xl border border-line bg-white px-4 text-sm outline-none focus:border-accent"/></label>
        <label className="block"><span className="mb-1.5 block text-xs font-semibold text-muted">비밀번호</span><div className="relative"><input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="8자 이상" className="h-12 w-full rounded-xl border border-line bg-white px-4 pr-12 text-sm outline-none focus:border-accent"/><button type="button" aria-label="비밀번호 보기" onClick={() => setShowPassword(v => !v)} className="absolute right-1 top-1 grid size-10 place-items-center text-muted">{showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button></div></label>
        {error && <p role="alert" className="text-xs leading-5 text-danger">{error}</p>}
        <Button type="submit" disabled={auth.isPending || !username || !password} className="w-full">{auth.isPending ? '확인하는 중' : mode === 'login' ? '로그인' : '시작하기'}<ArrowRight size={17}/></Button>
      </form>
    </section>

    <button disabled={demo.isPending} onClick={() => demo.mutate()} className="mt-5 text-center text-sm font-semibold text-muted underline decoration-line underline-offset-4">{demo.isPending ? '데모 준비 중…' : '기록이 있는 데모로 둘러보기'}</button>
    <div className="mt-auto flex items-center justify-center gap-2 pt-8 text-[11px] text-muted"><Check size={13}/><span>비밀번호는 일방향 해시로 저장됩니다.</span></div>
  </main>
}
