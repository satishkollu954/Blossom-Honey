import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { CookiesProvider } from "react-cookie";
import { CartProvider } from './components/context/cartcontext.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CookiesProvider>
      <CartProvider>
        <App />
      </CartProvider>
    </CookiesProvider>
  </StrictMode>
)
