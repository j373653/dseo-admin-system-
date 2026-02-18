'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabaseClient } from '@/lib/supabase'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalLeads: 0,
    newLeads: 0,
    totalKeywords: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      // Contar leads
      const { count: totalLeads } = await supabaseClient
        .from('d_seo_admin_leads')
        .select('*', { count: 'exact', head: true })

      // Contar leads nuevos (últimos 7 días)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      
      const { count: newLeads } = await supabaseClient
        .from('d_seo_admin_leads')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgo.toISOString())

        // Contar keywords (try-catch para tabla que puede no existir)
        let totalKeywords = 0
        try {
          const result = await supabaseClient
            .from('d_seo_admin_raw_keywords')
            .select('*', { count: 'exact', head: true })
          totalKeywords = result.count || 0
        } catch {
          totalKeywords = 0
        }

      setStats({
        totalLeads: totalLeads || 0,
        newLeads: newLeads || 0,
        totalKeywords: totalKeywords || 0
      })
      setLoading(false)
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Leads Card */}
        <Link href="/admin/leads">
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Leads</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalLeads}</p>
              </div>
            </div>
          </div>
        </Link>

        {/* New Leads Card */}
        <Link href="/admin/leads">
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Nuevos (7 días)</p>
                <p className="text-2xl font-bold text-gray-900">{stats.newLeads}</p>
              </div>
            </div>
          </div>
        </Link>

        {/* Keywords Card */}
        <Link href="/admin/keywords">
          <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Keywords</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalKeywords}</p>
              </div>
            </div>
          </div>
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/admin/leads">
            <button className="w-full px-4 py-3 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors">
              Ver Leads
            </button>
          </Link>
          <Link href="/admin/keywords/import">
            <button className="w-full px-4 py-3 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors">
              Importar Keywords
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}
