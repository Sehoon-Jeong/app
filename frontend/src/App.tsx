import { useQuery } from '@tanstack/react-query'
import { Navigate, Route, Routes } from 'react-router-dom'
import { api } from './lib/api'
import { Loading } from './components/ui'
import { AuthPage } from './pages/AuthPage'
import { HomePage } from './pages/HomePage'
import { ExplorePage, ProductPage, ShelfPage } from './pages/ExplorePages'
import { ExperiencePage, RecordPage, RoutineEditPage } from './pages/ExperiencePages'
import { AiLandingPage, ChatPage, ChatStartPage } from './pages/ChatPages'
import { PatternPage, RecordsPage } from './pages/RecordsPages'
import { ExperienceHubPage } from './pages/ExperienceHubPage'
import { DesktopQuickLogin } from './components/DesktopQuickLogin'
import { OnboardingPage } from './pages/OnboardingPage'

export default function App() {
  const auth = useQuery({ queryKey: ['auth'], queryFn: api.me, retry: false })
  const content = auth.isPending ? <div className="mobile-shell h-full bg-paper"><Loading label="SKN 준비 중"/></div>
    : auth.isError ? <AuthPage />
    : !auth.data.onboardingCompleted ? <OnboardingPage auth={auth.data}/>
    : <Routes>
    <Route path="/" element={<HomePage/>}/>
    <Route path="/explore" element={<ExplorePage/>}/>
    <Route path="/experience" element={<ExperienceHubPage/>}/>
    <Route path="/products/:id" element={<ProductPage/>}/>
    <Route path="/my-products" element={<ShelfPage/>}/>
    <Route path="/routine/edit" element={<RoutineEditPage/>}/>
    <Route path="/experiences/:id" element={<ExperiencePage/>}/>
    <Route path="/experiences/:id/record" element={<RecordPage/>}/>
    <Route path="/ai" element={<AiLandingPage/>}/>
    <Route path="/ai/new" element={<ChatStartPage/>}/>
    <Route path="/ai/:id" element={<ChatPage/>}/>
    <Route path="/records" element={<RecordsPage/>}/>
    <Route path="/patterns/:id" element={<PatternPage/>}/>
    <Route path="*" element={<Navigate to="/" replace/>}/>
  </Routes>

  return <>{content}<DesktopQuickLogin currentUsername={auth.data?.username}/></>
}
