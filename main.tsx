import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { LanguageProvider } from './providers/LanguageProvider'
import App from './App.tsx'
import { applyTheme } from './config/theme'
import './index.css'

applyTheme('neon-tech')

if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual'
window.scrollTo({ top: 0, left: 0, behavior: 'auto' })

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter><LanguageProvider><App /></LanguageProvider></BrowserRouter>
  </React.StrictMode>,
)
