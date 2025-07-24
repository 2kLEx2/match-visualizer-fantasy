import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import App from './App.tsx'
import Index from './pages/Index.tsx'
import Schedule from './pages/Schedule.tsx'
import NotFound from './pages/NotFound.tsx'

import './index.css'
import { Toaster } from './components/ui/toaster'

const queryClient = new QueryClient()

const router = createBrowserRouter([
  {
    path: '/',
    element: <Index />,
  },
  {
    path: '/schedule',
    element: <Schedule />,
  },
  {
    path: '*',
    element: <NotFound />,
  },
])

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster />
    </QueryClientProvider>
  </React.StrictMode>,
)
