"use client"

import type React from "react"

import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Shield, Users, Video, BarChart3, LogOut, Home, Lock, Monitor, Menu, X, Settings } from "lucide-react"
import Link from "next/link"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, logout, loading } = useAuth()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      router.push("/login")
    }
  }, [user, loading, router])

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500"></div>
      </div>
    )
  }

  if (!user || user.role !== "admin") {
    return null
  }

  const navigation = [
    { name: "Dashboard", href: "/admin", icon: Home },
    { name: "User Management", href: "/admin/users", icon: Users },
    { name: "Meeting Control", href: "/admin/meetings", icon: Video },
    { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    { name: "Security", href: "/admin/security", icon: Lock },
    { name: "System", href: "/admin/system", icon: Monitor },
    { name: "Settings", href: "/admin/settings", icon: Settings },
  ]

  return (
    <div className="min-h-screen gradient-bg">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-800/95 backdrop-blur-sm border-r border-slate-700/50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
            <div className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-red-500" />
              <span className="text-xl font-bold text-white">Admin Panel</span>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="sidebar-item group"
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-slate-700/50">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold">{user.name.charAt(0).toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{user.name}</p>
                <p className="text-red-400 text-sm">Administrator</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-2 px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Mobile header */}
        <div className="lg:hidden bg-slate-800/95 backdrop-blur-sm border-b border-slate-700/50 px-4 py-3">
          <div className="flex items-center justify-between">
            <button onClick={() => setSidebarOpen(true)} className="text-slate-400 hover:text-white">
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex items-center space-x-2">
              <Shield className="h-6 w-6 text-red-500" />
              <span className="text-lg font-semibold text-white">Admin</span>
            </div>
            <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-semibold">{user.name.charAt(0).toUpperCase()}</span>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="min-h-screen">{children}</main>
      </div>
    </div>
  )
}
