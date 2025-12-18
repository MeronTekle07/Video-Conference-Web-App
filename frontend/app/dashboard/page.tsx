"use client"

import { useAuth } from "@/contexts/AuthContext"
import { Video, Calendar, Play, Plus, Users } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import apiClient from "@/lib/api"

export default function DashboardPage() {
  const { user } = useAuth()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [realTimeStats, setRealTimeStats] = useState({
    meetingsToday: 0,
    upcomingMeetings: 0
  })
  const [meetings, setMeetings] = useState<any[]>([])
  const [isCreatingInstantMeeting, setIsCreatingInstantMeeting] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Load real-time meeting data
  useEffect(() => {
    const loadMeetings = async () => {
      try {
        const res = await apiClient.getMyMeetings()
        const apiMeetings = res.data.meetings as any[]
        setMeetings(apiMeetings)
        
        // Calculate real-time stats
        const today = new Date().toDateString()
        const meetingsToday = apiMeetings.filter(m => 
          new Date(m.start_time).toDateString() === today
        ).length
        
        const upcomingMeetings = apiMeetings.filter(m => 
          m.status === 'scheduled' && new Date(m.start_time) > new Date()
        ).length

        setRealTimeStats({
          meetingsToday,
          upcomingMeetings
        })
      } catch (error) {
        console.error('Failed to load meetings:', error)
      }
    }

    loadMeetings()
  }, [])

  const stats = [
    {
      name: "Meetings Today",
      value: realTimeStats.meetingsToday.toString(),
      icon: Video,
      color: "text-blue-400",
      bgColor: "bg-blue-500/20",
    },
    {
      name: "Upcoming Meetings",
      value: realTimeStats.upcomingMeetings.toString(),
      icon: Calendar,
      color: "text-green-400",
      bgColor: "bg-green-500/20",
    },
  ]

  // Get real upcoming meetings from API data
  const upcomingMeetings = meetings
    .filter(m => m.status === 'scheduled' && new Date(m.start_time) > new Date())
    .slice(0, 3)
    .map(m => ({
      id: m.id,
      title: m.title,
      time: new Date(m.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: new Date(m.start_time).getTime() - new Date().getTime() < 30 * 60 * 1000 ? "starting-soon" : "scheduled"
    }))

  // Get real recent activity from meetings
  const recentActivity = meetings
    .filter(m => new Date(m.start_time) < new Date())
    .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())
    .slice(0, 3)
    .map(m => ({
      id: m.id,
      action: m.status === 'completed' ? "Meeting ended" : "Joined meeting",
      meeting: m.title,
      time: getRelativeTime(new Date(m.start_time))
    }))

  function getRelativeTime(date: Date) {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffHours < 1) return "Just now"
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays === 1) return "Yesterday"
    return `${diffDays} days ago`
  }

  const handleInstantMeeting = async () => {
    setIsCreatingInstantMeeting(true)
    try {
      const meetingData = {
        title: `Instant Meeting - ${new Date().toLocaleTimeString()}`,
        description: 'Quick instant meeting',
        startTime: new Date().toISOString(),
        duration: 60,
        isRecurring: false
      }
      
      const response = await apiClient.createMeeting(meetingData)
      if (response.success) {
        router.push(`/meeting/${response.data.meeting.meeting_code}`)
      } else {
        console.error('Failed to create instant meeting:', response.message)
      }
    } catch (error) {
      console.error('Error creating instant meeting:', error)
    } finally {
      setIsCreatingInstantMeeting(false)
    }
  }

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Welcome back, {user?.name?.split(" ")[0]}!</h1>
            <p className="text-slate-400">
              {currentTime.toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
            <p className="text-slate-300 text-lg font-mono">{currentTime.toLocaleTimeString()}</p>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-3">
            <Link href="/dashboard/meetings" className="btn-primary">
              <Plus className="h-5 w-5 mr-2" />
              Schedule Meeting
            </Link>
            <button 
              onClick={handleInstantMeeting} 
              disabled={isCreatingInstantMeeting}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="h-5 w-5 mr-2" />
              {isCreatingInstantMeeting ? 'Creating...' : 'Start Instant Meeting'}
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <div key={stat.name} className="stat-card">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-slate-400 text-sm">{stat.name}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Meetings */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Upcoming Meetings</h2>
            <Link href="/dashboard/meetings" className="text-indigo-400 hover:text-indigo-300 text-sm">
              View all
            </Link>
          </div>
          <div className="space-y-4">
            {upcomingMeetings.map((meeting) => (
              <div
                key={meeting.id}
                className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                    <Video className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium">{meeting.title}</h3>
                    <p className="text-slate-400 text-sm">
                      {meeting.time}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {meeting.status === "starting-soon" && (
                    <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">
                      Starting Soon
                    </span>
                  )}
                  <Link href={`/meeting/${meeting.id}`} className="btn-outline text-sm px-3 py-1">
                    Join
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <h2 className="text-xl font-bold text-white mb-6">Recent Activity</h2>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3 p-3 bg-slate-700/30 rounded-lg">
                <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center mt-1">
                  <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm">
                    <span className="font-medium">{activity.action}</span> "{activity.meeting}"
                  </p>
                  <p className="text-slate-400 text-xs mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-xl font-bold text-white mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/dashboard/meetings" className="card hover:bg-slate-700/30 transition-colors text-center">
            <Calendar className="h-12 w-12 text-indigo-400 mx-auto mb-4" />
            <h3 className="text-white font-semibold mb-2">Schedule Meeting</h3>
            <p className="text-slate-400 text-sm">Plan and organize your next meeting</p>
          </Link>

          <Link href="/dashboard/contacts" className="card hover:bg-slate-700/30 transition-colors text-center">
            <Users className="h-12 w-12 text-green-400 mx-auto mb-4" />
            <h3 className="text-white font-semibold mb-2">Manage Contacts</h3>
            <p className="text-slate-400 text-sm">Add and organize your meeting contacts</p>
          </Link>

          <Link href="/dashboard/settings" className="card hover:bg-slate-700/30 transition-colors text-center">
            <Video className="h-12 w-12 text-purple-400 mx-auto mb-4" />
            <h3 className="text-white font-semibold mb-2">Meeting Settings</h3>
            <p className="text-slate-400 text-sm">Configure your video and audio preferences</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
