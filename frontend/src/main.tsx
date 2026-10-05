import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './auth/AuthContext.tsx'
import { ChatResultsProvider } from './search/ChatResultsContext.tsx'
import { PageContextProvider } from './pageContext/PageContextContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ChatResultsProvider>
          <PageContextProvider>
            <App />
          </PageContextProvider>
        </ChatResultsProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
