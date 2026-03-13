import { StrictMode }      from 'react'
import { createRoot }      from 'react-dom/client'
import { BrowserRouter }   from 'react-router-dom'
import { HelmetProvider }  from 'react-helmet-async'   // ← ADDED
import { Toaster }         from 'react-hot-toast'

import '@/styles/index.css'
import App from './App'

const container = document.getElementById('root')

if (!container) {
  throw new Error('[TrendZip] Root element #root not found in index.html')
}

createRoot(container).render(
  <StrictMode>
    <HelmetProvider>                    {/* ← ADDED — wraps entire app */}
      <BrowserRouter>
        <App />

        <Toaster
          position="bottom-right"
          gutter={12}
          containerStyle={{ bottom: 28, right: 28 }}
          toastOptions={{
            duration: 3000,
            style: {
              background:   '#1a1a1a',
              color:        '#e8e0d6',
              border:       '1px solid #2a2a2a',
              borderRadius: '0px',
              fontFamily:   '"DM Sans", sans-serif',
              fontSize:     '14px',
              fontWeight:   '400',
              padding:      '14px 18px',
              boxShadow:    '0 8px 32px rgba(0,0,0,0.6)',
              maxWidth:     '360px',
            },
            success: {
              duration: 2500,
              iconTheme: { primary: '#c9a96e', secondary: '#0a0a0a' },
            },
            error: {
              duration: 4000,
              iconTheme: { primary: '#e84040', secondary: '#fff' },
            },
          }}
        />
      </BrowserRouter>
    </HelmetProvider>                   
  </StrictMode>
)