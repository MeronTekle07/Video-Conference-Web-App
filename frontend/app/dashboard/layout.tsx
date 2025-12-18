"use client"

import type React from "react"

import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Video, Calendar, Users, Settings, LogOut, Home, Clock, Menu, X } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, logout, loading } = useAuth()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!loading && (!user || user.role === "admin")) {
      if (user?.role === "admin") {
        router.push("/admin")
      } else {
        router.push("/login")
      }
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

  if (!user || user.role === "admin") {
    return null
  }

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Meetings", href: "/dashboard/meetings", icon: Video },
    { name: "Calendar", href: "/dashboard/calendar", icon: Calendar },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
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
              <Video className="h-8 w-8 text-indigo-500" />
              <span className="text-xl font-bold text-white">VideoConf</span>
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
              <div className="relative">
                <div className="user-avatar">{user.name.charAt(0).toUpperCase()}</div>
                {/* Online indicator - green dot for logged in user */}
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 border-2 border-slate-800 rounded-full"></div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{user.name}</p>
                <p className="text-slate-400 text-sm truncate">{user.email}</p>
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
              <Video className="h-6 w-6 text-indigo-500" />
              <span className="text-lg font-semibold text-white">VideoConf</span>
            </div>
            <div className="user-avatar w-8 h-8 text-sm">{user.name.charAt(0).toUpperCase()}</div>
          </div>
        </div>

        {/* Page content */}
        <main className="min-h-screen">{children}</main>
      </div>
    </div>
  )
}
