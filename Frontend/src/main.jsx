import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './Context/AuthContext.jsx'
import { NotesProvider } from './Context/NotesContext.jsx'
import AuthDebugPanel from './Pages/AuthDebugPanel.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <NotesProvider>
    <App />
    <AuthDebugPanel />
      </NotesProvider>
    </AuthProvider>
  </StrictMode>,
)
