"use client"

import { useAuth } from "@/contexts/AuthContext"
import { Users, Calendar, TrendingUp, Server, Shield, Activity, AlertTriangle, Play, Video, Settings, Plus } from 'lucide-react'
import { useNotifications } from "@/contexts/NotificationContext"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import apiClient from "@/lib/api"

export default function AdminDashboard() {
  const { user } = useAuth()
  const { success, error: showError, info } = useNotifications()
  const router = useRouter()
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    liveMeetings: 0,
    todayMeetings: 0,
    systemHealth: {
      status: "good" as "good" | "warning" | "critical",
      cpuUsage: 0,
      memoryUsage: 0,
      serverLoad: 0
    }
  })
  const [alerts, setAlerts] = useState<any[]>([])
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [currentTime, setCurrentTime] = useState(new Date())
  const [creatingInstant, setCreatingInstant] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Load real-time admin data
  useEffect(() => {
    const loadAdminData = async () => {
      try {
        const [statsRes, alertsRes, activityRes] = await Promise.all([
          apiClient.getAdminStats(),
          apiClient.getSystemAlerts(),
          apiClient.getRecentActivity()
        ])
        
        setStats(statsRes.stats)
        setAlerts(alertsRes.alerts)
        setRecentActivity(activityRes.activities)
      } catch (error) {
        console.error('Failed to load admin data:', error)
        // Use fallback data if API fails
        setStats({
          totalUsers: 0,
          activeUsers: 0,
          liveMeetings: 0,
          todayMeetings: 0,
          systemHealth: {
            status: "good",
            cpuUsage: 0,
            memoryUsage: 0,
            serverLoad: 0
          }
        })
        setAlerts([])
        setRecentActivity([])
      }
    }

    loadAdminData()
    
    // Refresh data every 30 seconds
    const interval = setInterval(loadAdminData, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleStartInstantMeeting = async () => {
    try {
      setCreatingInstant(true)
      const res = await apiClient.createMeeting({
        title: "Admin Instant Meeting",
        description: "Instant meeting created by admin",
        startTime: new Date().toISOString(),
        duration: 60, // Default 1 hour for admin meetings
        isRecurring: false,
      })
      const meeting = res.data.meeting
      router.push(`/meeting/${meeting.meeting_code}`)
    } catch (error: any) {
      console.error('Failed to create instant meeting:', error)
      showError('Failed to start instant meeting', error.message || 'Please try again later')
    } finally {
      setCreatingInstant(false)
    }
  }

  const systemStats = [
    {
      name: "Active Users",
      value: stats.activeUsers.toString(),
      change: "+12%",
      icon: Users,
      color: "text-blue-400",
      bgColor: "bg-blue-500/20",
    },
    {
      name: "Live Meetings",
      value: stats.liveMeetings.toString(),
      change: "+5%",
      icon: Video,
      color: "text-green-400",
      bgColor: "bg-green-500/20",
    },
    {
      name: "System Health",
      value: `${stats.systemHealth.cpuUsage}%`,
      change: "0%",
      icon: Activity,
      color: stats.systemHealth.status === 'good' ? "text-green-400" : stats.systemHealth.status === 'warning' ? "text-yellow-400" : "text-red-400",
      bgColor: stats.systemHealth.status === 'good' ? "bg-green-500/20" : stats.systemHealth.status === 'warning' ? "bg-yellow-500/20" : "bg-red-500/20",
    },
    {
      name: "Server Load",
      value: `${stats.systemHealth.serverLoad}%`,
      change: "-8%",
      icon: Server,
      color: "text-yellow-400",
      bgColor: "bg-yellow-500/20",
    },
  ]

  const recentAlerts = alerts

  // Use real recent activity data instead of dummy active users

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "text-red-400 bg-red-500/10 border-red-500/20"
      case "medium":
        return "text-yellow-400 bg-yellow-500/10 border-yellow-500/20"
      case "low":
        return "text-blue-400 bg-blue-500/10 border-blue-500/20"
      default:
        return "text-gray-400 bg-gray-500/10 border-gray-500/20"
    }
  }

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
              <Shield className="h-8 w-8 text-red-500 mr-3" />
              Admin Dashboard
            </h1>
            <p className="text-slate-400">System overview and management controls</p>
            <p className="text-slate-300 text-lg font-mono mt-1">{currentTime.toLocaleString()}</p>
          </div>
          <div className="mt-4 md:mt-0 flex flex-col items-end space-y-3">
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-400">All Systems Operational</span>
            </div>
            <div className="flex space-x-3">
              <Link href="/dashboard/meetings" className="btn-primary">
                <Plus className="h-5 w-5 mr-2" />
                Schedule Meeting
              </Link>
              <button 
                onClick={handleStartInstantMeeting} 
                disabled={creatingInstant}
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play className="h-5 w-5 mr-2" />
                {creatingInstant ? 'Creating...' : 'Start Instant Meeting'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        {systemStats.map((stat) => (
          <div key={stat.name} className="stat-card">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 sm:w-12 sm:h-12 ${stat.bgColor} rounded-lg flex items-center justify-center flex-shrink-0`}>
                <stat.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${stat.color}`} />
              </div>
              <div className="text-right min-w-0 flex-1 ml-3">
                <p className="text-xl sm:text-2xl font-bold text-white truncate">{stat.value}</p>
                <p className="text-slate-400 text-xs sm:text-sm truncate">{stat.name}</p>
                <p
                  className={`text-xs ${stat.change.startsWith("+") ? "text-green-400" : stat.change.startsWith("-") ? "text-red-400" : "text-slate-400"}`}
                >
                  {stat.change} from last hour
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* System Alerts */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center">
              <AlertTriangle className="h-5 w-5 text-yellow-400 mr-2" />
              System Alerts
            </h2>
            <span className="text-slate-400 text-sm">{recentAlerts.length} active</span>
          </div>
          <div className="space-y-4">
            {recentAlerts.map((alert) => (
              <div key={alert.id} className="p-4 bg-slate-700/30 rounded-lg border-l-4 border-yellow-500">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-white font-medium mb-1">{alert.message}</p>
                    <p className="text-slate-400 text-sm">{alert.time}</p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(alert.severity)}`}
                  >
                    {alert.severity.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Recent Activity</h2>
          <span className="text-slate-400 text-sm">{recentActivity.length} events</span>
        </div>
        <div className="space-y-4">
          {recentActivity.map((activity: any) => (
            <div key={activity.id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">{activity.user?.charAt(0) || 'U'}</span>
                </div>
                <div>
                  <p className="text-white font-medium">{activity.user || 'Unknown User'}</p>
                  <p className="text-slate-400 text-sm">{activity.action}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-slate-300 text-sm">{activity.time}</p>
                {activity.ip && <p className="text-slate-400 text-xs">{activity.ip}</p>}
              </div>
            </div>
          ))}
          {recentActivity.length === 0 && (
            <div className="text-center text-slate-400 py-8">
              No recent activity
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-xl font-bold text-white mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/dashboard/meetings" className="card hover:bg-slate-700/30 transition-colors text-center">
            <Calendar className="h-12 w-12 text-indigo-400 mx-auto mb-4" />
            <h3 className="text-white font-semibold mb-2">Schedule Meeting</h3>
            <p className="text-slate-400 text-sm mb-4">Plan and organize meetings for users</p>
            <div className="btn-outline w-full">Schedule Now</div>
          </Link>

          <div 
            className="card hover:bg-slate-700/30 transition-colors cursor-pointer text-center" 
            onClick={handleStartInstantMeeting}
          >
            <Play className="h-12 w-12 text-green-400 mx-auto mb-4" />
            <h3 className="text-white font-semibold mb-2">Instant Meeting</h3>
            <p className="text-slate-400 text-sm mb-4">Start an immediate admin meeting</p>
            <div className="btn-outline w-full">{creatingInstant ? 'Creating...' : 'Start Now'}</div>
          </div>

          <Link href="/admin/users" className="card hover:bg-slate-700/30 transition-colors text-center">
            <Users className="h-12 w-12 text-blue-400 mx-auto mb-4" />
            <h3 className="text-white font-semibold mb-2">User Management</h3>
            <p className="text-slate-400 text-sm mb-4">Manage user accounts and permissions</p>
            <div className="btn-outline w-full">Manage Users</div>
          </Link>
        </div>
      </div>

      {/* Additional Admin Actions */}
      <div className="mt-8">
        <h2 className="text-xl font-bold text-white mb-6">Advanced Controls</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/admin/system" className="card hover:bg-slate-700/30 transition-colors text-center">
            <Server className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-white font-semibold mb-2">System Health</h3>
            <p className="text-slate-400 text-sm mb-4">Monitor server performance</p>
            <div className="btn-outline w-full">View Status</div>
          </Link>

          <Link href="/admin/security" className="card hover:bg-slate-700/30 transition-colors text-center">
            <Shield className="h-12 w-12 text-cyan-400 mx-auto mb-4" />
            <h3 className="text-white font-semibold mb-2">Security</h3>
            <p className="text-slate-400 text-sm mb-4">Review security events and logs</p>
            <div className="btn-outline w-full">Security Center</div>
          </Link>

          <div 
            className="card hover:bg-slate-700/30 transition-colors cursor-pointer text-center"
            onClick={() => info("System Maintenance", "Maintenance mode will be available in a future update")}
          >
            <Settings className="h-12 w-12 text-purple-400 mx-auto mb-4" />
            <h3 className="text-white font-semibold mb-2">Maintenance</h3>
            <p className="text-slate-400 text-sm mb-4">System maintenance and updates</p>
            <div className="btn-outline w-full">Maintenance</div>
          </div>
        </div>
      </div>
    </div>
  )
}
