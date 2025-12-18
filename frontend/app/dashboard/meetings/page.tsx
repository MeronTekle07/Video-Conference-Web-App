"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Video, Calendar, Users, Clock, ExternalLink, Search, Plus, Filter, Play, Eye } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import apiClient from "@/lib/api"
import { useNotifications } from "@/contexts/NotificationContext"

interface Meeting {
  id: string
  title: string
  host: string
  time: string
  duration: string
  participants: number
  status: "upcoming" | "live" | "ended"
  meetingCode: string
  description: string
  isRecurring: boolean
  recordingUrl?: string
}

export default function MeetingsPage() {
  const router = useRouter()
  const { success, error, info } = useNotifications()
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "upcoming" | "live" | "ended">("all")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newMeeting, setNewMeeting] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    duration: "30",
    isRecurring: false,
  })
  const [joinCode, setJoinCode] = useState("")
  const [creatingInstant, setCreatingInstant] = useState(false)

  useEffect(() => {
    const loadMeetings = async () => {
      try {
        const res = await apiClient.getMyMeetings()
        const apiMeetings = res.data.meetings as any[]
        const mapped: Meeting[] = apiMeetings.map((m) => ({
          id: m.id,
          title: m.title,
          host: m.host_name || "You",
          time: m.start_time,
          duration: m.duration ? `${m.duration} min` : "",
          participants: Number(m.participants_count || 0),
          status: m.status === "scheduled" ? "upcoming" : (m.status === "live" ? "live" : "ended"),
          meetingCode: m.meeting_code,
          description: m.description || "",
          isRecurring: Boolean(m.is_recurring),
          recordingUrl: m.recording_url || undefined,
        }))
        setMeetings(mapped)
      } catch (e) {
        console.error("Failed to load meetings", e)
      }
    }
    loadMeetings()
  }, [])

  const filteredMeetings = meetings.filter((meeting) => {
    const matchesSearch =
      meeting.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      meeting.host.toLowerCase().includes(searchTerm.toLowerCase()) ||
      meeting.meetingCode.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === "all" || meeting.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "live":
        return "bg-green-500"
      case "upcoming":
        return "bg-yellow-500"
      case "ended":
        return "bg-gray-500"
      default:
        return "bg-gray-500"
    }
  }

  const handleJoinByCode = async () => {
    if (!joinCode.trim()) return
    try {
      await apiClient.joinMeeting(joinCode.trim())
      router.push(`/meeting/${joinCode.trim()}`)
    } catch (e: any) {
      error("Failed to Join Meeting", e.message || "Unable to join the meeting. Please check the meeting code and try again.")
    }
  }

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const startISO = newMeeting.date && newMeeting.time ? new Date(`${newMeeting.date}T${newMeeting.time}:00`).toISOString() : new Date().toISOString()
      const res = await apiClient.createMeeting({
        title: newMeeting.title || "Scheduled Meeting",
        description: newMeeting.description,
        startTime: startISO,
        duration: parseInt(newMeeting.duration) || 30,
        isRecurring: newMeeting.isRecurring,
      })
      const m = res.data.meeting
      const added: Meeting = {
        id: m.id,
        title: m.title,
        host: "You",
        time: m.start_time,
        duration: m.duration ? `${m.duration} min` : "",
        participants: 1,
        status: m.status === "scheduled" ? "upcoming" : (m.status === "live" ? "live" : "ended"),
        meetingCode: m.meeting_code,
        description: m.description || "",
        isRecurring: Boolean(m.is_recurring),
      }
      setMeetings([added, ...meetings])
      setShowCreateModal(false)
      setNewMeeting({ title: "", description: "", date: "", time: "", duration: "30", isRecurring: false })
      success("Meeting Created", `"${newMeeting.title || "Scheduled Meeting"}" has been scheduled successfully.`)
    } catch (e: any) {
      error("Failed to Create Meeting", e.message || "Unable to create the meeting. Please try again.")
    }
  }

  const handleStartInstantMeeting = async () => {
    try {
      setCreatingInstant(true)
      const res = await apiClient.createMeeting({
        title: "Instant Meeting",
        description: "",
        startTime: new Date().toISOString(),
        duration: 30,
        isRecurring: false,
      })
      const m = res.data.meeting
      router.push(`/meeting/${m.meeting_code}`)
    } catch (e: any) {
      error("Failed to Start Meeting", e.message || "Unable to start the instant meeting. Please try again.")
    } finally {
      setCreatingInstant(false)
    }
  }

  const todayMeetings = filteredMeetings.filter((m) => new Date(m.time).toDateString() === new Date().toDateString()).length

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Meetings</h1>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
            <span className="text-sm text-slate-300">{todayMeetings} Today</span>
          </div>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Schedule Meeting
        </button>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Quick Join */}
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Video className="h-5 w-5 text-indigo-400" />
            Quick Join
          </h2>
          <div className="flex space-x-3">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              className="input-field flex-1"
              placeholder="Enter meeting code or paste meeting link"
            />
            <button onClick={handleJoinByCode} className="btn-primary" disabled={!joinCode.trim()}>
              Join
            </button>
          </div>
        </div>

        {/* Instant Meeting */}
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Play className="h-5 w-5 text-green-400" />
            Start Instant Meeting
          </h2>
          <button
            onClick={handleStartInstantMeeting}
            className="btn-secondary w-full"
            disabled={creatingInstant}
          >
            {creatingInstant ? "Starting..." : "Start Meeting Now"}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search meetings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10 w-full sm:w-64"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-slate-400" />
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as "all" | "upcoming" | "live" | "ended")} className="input-field">
                <option value="all">All Meetings</option>
                <option value="live">Live Now</option>
                <option value="upcoming">Upcoming</option>
                <option value="ended">Past Meetings</option>
              </select>
            </div>
          </div>

          <div className="text-slate-400 text-sm">
            {filteredMeetings.length} of {meetings.length} meetings
          </div>
        </div>
      </div>

      {/* Meetings Grid */}
      <div className="space-y-4">
        {filteredMeetings.map((meeting) => (
          <div key={meeting.id} className="card hover:bg-slate-700/30 transition-all duration-200">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-3">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(meeting.status)}`}></div>
                  <h3 className="text-xl font-semibold text-white">{meeting.title}</h3>
                  {meeting.isRecurring && (
                    <span className="px-2 py-1 bg-indigo-500/20 text-indigo-300 text-xs rounded-full border border-indigo-500/30">
                      Recurring
                    </span>
                  )}
                  {meeting.status === "live" && (
                    <span className="px-2 py-1 bg-red-500/20 text-red-300 text-xs rounded-full border border-red-500/30 animate-pulse">
                      LIVE
                    </span>
                  )}
                </div>

                <p className="text-slate-300 mb-4">{meeting.description}</p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-slate-400">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    {meeting.host}
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    {new Date(meeting.time).toLocaleDateString()}
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    {new Date(meeting.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    {meeting.participants} participants
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end space-y-3">
                <div className="text-right">
                  <div className="text-sm text-slate-400 mb-1">Meeting Code</div>
                  <div className="text-sm text-slate-300 font-mono bg-slate-700/50 px-2 py-1 rounded">
                    {meeting.meetingCode}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Link href={`/meeting/${meeting.meetingCode}`} className="btn-primary text-sm">
                    Join
                    <ExternalLink className="h-4 w-4 ml-1" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Meeting Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Schedule Meeting</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">
                ×
              </button>
            </div>
            <form onSubmit={handleCreateMeeting} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Title *</label>
                <input
                  type="text"
                  value={newMeeting.title}
                  onChange={(e) => setNewMeeting({ ...newMeeting, title: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter meeting title"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                <textarea
                  value={newMeeting.description}
                  onChange={(e) => setNewMeeting({ ...newMeeting, description: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Date *</label>
                  <input
                    type="date"
                    value={newMeeting.date}
                    onChange={(e) => setNewMeeting({ ...newMeeting, date: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Time *</label>
                  <input
                    type="time"
                    value={newMeeting.time}
                    onChange={(e) => setNewMeeting({ ...newMeeting, time: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Duration (minutes)</label>
                  <input
                    type="number"
                    min={1}
                    max={480}
                    value={newMeeting.duration}
                    onChange={(e) => setNewMeeting({ ...newMeeting, duration: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    id="recurring"
                    type="checkbox"
                    checked={newMeeting.isRecurring}
                    onChange={(e) => setNewMeeting({ ...newMeeting, isRecurring: e.target.checked })}
                    className="mr-2"
                  />
                  <label htmlFor="recurring" className="text-slate-300">Recurring meeting</label>
                </div>
              </div>
              <div className="flex space-x-3 pt-4">
                <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg transition-colors">
                  Create
                </button>
                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 bg-slate-600 hover:bg-slate-700 text-white py-2 px-4 rounded-lg transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
