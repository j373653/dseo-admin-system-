'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { supabaseClient } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabaseClient.auth.getSession()
      
      if (!session && pathname !== '/admin/login') {
        router.push('/admin/login')
        return
      }
      
      if (session && pathname === '/admin/login') {
        router.push('/admin')
        return
      }
      
      setUser(session?.user ?? null)
      setLoading(false)
    }

    checkAuth()

    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      if (!session && pathname !== '/admin/login') {
        router.push('/admin/login')
      }
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [pathname, router])

  const handleLogout = async () => {
    await supabaseClient.auth.signOut()
    router.push('/admin/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  // Si no hay usuario y no estamos en login, no renderizar nada (redirigirá)
  if (!user && pathname !== '/admin/login') {
    return null
  }

  // Si estamos en login, solo renderizar children
  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-gray-900 text-white">
        <div className="p-6">
          <h1 className="text-xl font-bold">D-SEO Admin</h1>
        </div>
        
        <nav className="mt-6">
          <Link
            href="/admin"
            className={`block px-6 py-3 hover:bg-gray-800 ${pathname === '/admin' ? 'bg-gray-800' : ''}`}
          >
            Dashboard
          </Link>
          <Link
            href="/admin/leads"
            className={`block px-6 py-3 hover:bg-gray-800 ${pathname.startsWith('/admin/leads') ? 'bg-gray-800' : ''}`}
          >
            Leads
          </Link>
          <Link
            href="/admin/keywords"
            className={`block px-6 py-3 hover:bg-gray-800 ${pathname.startsWith('/admin/keywords') ? 'bg-gray-800' : ''}`}
          >
            Keywords
          </Link>
          <Link
            href="/admin/content"
            className={`block px-6 py-3 hover:bg-gray-800 ${pathname.startsWith('/admin/content') ? 'bg-gray-800' : ''}`}
          >
            Contenido Web
          </Link>
          <Link
            href="/admin/keywords/strategy"
            className={`block px-6 py-3 hover:bg-gray-800 pl-10 ${pathname.startsWith('/admin/keywords/strategy') ? 'bg-gray-800' : ''}`}
          >
            Estrategia
          </Link>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="text-sm text-gray-400 mb-2">{user?.email}</div>
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-sm"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="ml-64 p-8">
        {children}
      </div>
    </div>
  )
}
