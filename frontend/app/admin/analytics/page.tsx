"use client"

import { useState, useEffect } from "react"
import { BarChart3, TrendingUp, Users, Clock, Video, Download, Filter } from "lucide-react"

interface AnalyticsData {
  totalMeetings: number
  totalUsers: number
  totalMinutes: number
  averageDuration: number
  meetingsByMonth: { month: string; count: number; minutes: number }[]
  userEngagement: { name: string; meetings: number; minutes: number }[]
  peakHours: { hour: number; count: number }[]
  departmentUsage: { department: string; meetings: number; users: number }[]
}

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState("30")
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [activeChart, setActiveChart] = useState("meetings")

  useEffect(() => {
    loadAnalytics()
  }, [dateRange])

  const loadAnalytics = async () => {
    try {
      const apiClient = (await import("@/lib/api")).default
      const response = await apiClient.getAnalytics(dateRange)
      
      if (response.success) {
        setAnalytics(response.data)
      } else {
        console.error('Failed to load analytics:', response.message)
        setAnalytics(null)
      }
    } catch (error) {
      console.error('Error loading analytics:', error)
      setAnalytics(null)
    }
  }

  const exportData = async () => {
    if (!analytics) return
    
    try {
      const data = {
        exported_at: new Date().toISOString(),
        date_range: `${dateRange} days`,
        ...analytics,
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `analytics-${dateRange}days.json`
      a.click()
    } catch (error) {
      console.error('Error exporting data:', error)
    }
  }

  if (!analytics) {
    return (
      <div className="min-h-screen gradient-bg">
        <div className="container mx-auto px-6 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Analytics Dashboard</h1>
              <p className="text-slate-400">Insights into meeting usage and user engagement</p>
            </div>
          </div>
          
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="loading-spinner w-12 h-12 mx-auto mb-4" />
              <p className="text-slate-400">Loading analytics data...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const maxMeetings = Math.max(...analytics.meetingsByMonth.map((m) => m.count))
  const maxMinutes = Math.max(...analytics.meetingsByMonth.map((m) => m.minutes))
  const maxHour = Math.max(...analytics.peakHours.map((h) => h.count))

  return (
    <div className="min-h-screen gradient-bg">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Analytics Dashboard</h1>
            <p className="text-slate-400">Insights into meeting usage and user engagement</p>
          </div>
          <div className="flex space-x-3">
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-slate-400" />
              <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="input-field">
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="365">Last year</option>
              </select>
            </div>
            <button onClick={exportData} className="btn-outline flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export Data
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="stat-card">
            <div className="flex items-center justify-between mb-4">
              <Video className="h-8 w-8 text-blue-400" />
              <div className="flex items-center gap-1 text-sm">
                <span className="text-slate-500">--</span>
              </div>
            </div>
            <div>
              <p className="text-slate-400 text-sm mb-1">Total Meetings</p>
              <p className="text-2xl font-bold text-white">{analytics.totalMeetings.toLocaleString()}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between mb-4">
              <Users className="h-8 w-8 text-green-400" />
              <div className="flex items-center gap-1 text-sm">
                <span className="text-slate-500">--</span>
              </div>
            </div>
            <div>
              <p className="text-slate-400 text-sm mb-1">Active Users</p>
              <p className="text-2xl font-bold text-white">{analytics.totalUsers}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between mb-4">
              <Clock className="h-8 w-8 text-purple-400" />
              <div className="flex items-center gap-1 text-sm">
                <span className="text-slate-500">--</span>
              </div>
            </div>
            <div>
              <p className="text-slate-400 text-sm mb-1">Total Minutes</p>
              <p className="text-2xl font-bold text-white">{analytics.totalMinutes.toLocaleString()}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between mb-4">
              <BarChart3 className="h-8 w-8 text-yellow-400" />
              <div className="flex items-center gap-1 text-sm">
                <span className="text-slate-500">--</span>
              </div>
            </div>
            <div>
              <p className="text-slate-400 text-sm mb-1">Avg Duration</p>
              <p className="text-2xl font-bold text-white">{analytics.averageDuration} min</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Meeting Trends Chart */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Meeting Trends</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => setActiveChart("meetings")}
                  className={`px-3 py-1 rounded-lg text-sm ${
                    activeChart === "meetings" ? "bg-indigo-600 text-white" : "bg-slate-700 text-slate-300"
                  }`}
                >
                  Meetings
                </button>
                <button
                  onClick={() => setActiveChart("minutes")}
                  className={`px-3 py-1 rounded-lg text-sm ${
                    activeChart === "minutes" ? "bg-indigo-600 text-white" : "bg-slate-700 text-slate-300"
                  }`}
                >
                  Minutes
                </button>
              </div>
            </div>
            <div className="space-y-3">
              {analytics.meetingsByMonth.map((month) => (
                <div key={month.month} className="flex items-center justify-between">
                  <span className="text-slate-300 text-sm w-12">{month.month}</span>
                  <div className="flex-1 mx-4">
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div
                        className="bg-indigo-500 h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${
                            activeChart === "meetings"
                              ? (month.count / maxMeetings) * 100
                              : (month.minutes / maxMinutes) * 100
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>
                  <span className="text-slate-300 text-sm w-16 text-right">
                    {activeChart === "meetings" ? month.count : `${month.minutes}m`}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Peak Hours */}
          <div className="card">
            <h3 className="text-xl font-bold text-white mb-6">Peak Usage Hours</h3>
            <div className="space-y-3">
              {analytics.peakHours.map((hour) => (
                <div key={hour.hour} className="flex items-center justify-between">
                  <span className="text-slate-300 text-sm w-16">
                    {hour.hour}:00 - {hour.hour + 1}:00
                  </span>
                  <div className="flex-1 mx-4">
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${(hour.count / maxHour) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <span className="text-slate-300 text-sm w-8 text-right">{hour.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Users */}
          <div className="card">
            <h3 className="text-xl font-bold text-white mb-6">Most Active Users</h3>
            <div className="space-y-4">
              {analytics.userEngagement.map((user, index) => (
                <div key={user.name} className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-pink-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-semibold">
                        {user.name
                          .split(" ")
                          .map((n) => n.charAt(0))
                          .join("")}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-white font-medium truncate">{user.name}</p>
                      <div className="flex items-center space-x-3 text-sm text-slate-400">
                        <span>{user.meetings} meetings</span>
                        <span>{user.minutes} min</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-1.5">
                      <div
                        className="bg-indigo-500 h-1.5 rounded-full"
                        style={{ width: `${(user.meetings / 60) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Department Usage */}
          <div className="card">
            <h3 className="text-xl font-bold text-white mb-6">Usage by Department</h3>
            <div className="space-y-4">
              {analytics.departmentUsage.map((dept) => (
                <div key={dept.department} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                  <div>
                    <h4 className="text-white font-medium">{dept.department}</h4>
                    <p className="text-slate-400 text-sm">{dept.users} users</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-semibold">{dept.meetings}</p>
                    <p className="text-slate-400 text-sm">meetings</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
