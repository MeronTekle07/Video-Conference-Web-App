"use client"

import { useState, useEffect } from "react"
import { Video, Users, Clock, Play, Pause, Square, Eye, VolumeX, Shield, AlertCircle, Download } from "lucide-react"

interface LiveMeeting {
  id: string
  title: string
  host: string
  participants: number
  duration: string
  status: "live" | "paused" | "recording"
  isRecording: boolean
  hasIssues: boolean
  roomCode: string
  quality: "excellent" | "good" | "poor"
}

interface MeetingControl {
  meetingId: string
  action: "mute" | "remove" | "warning" | "end"
  timestamp: string
  admin: string
  target?: string
  reason?: string
}

export default function MeetingControlPage() {
  const [liveMeetings, setLiveMeetings] = useState<LiveMeeting[]>([])
  const [selectedMeeting, setSelectedMeeting] = useState<LiveMeeting | null>(null)
  const [controlHistory, setControlHistory] = useState<MeetingControl[]>([])
  const [showControlModal, setShowControlModal] = useState(false)
  const [controlAction, setControlAction] = useState<string>("")
  const [controlReason, setControlReason] = useState("")

  useEffect(() => {
    // Load real meeting data
    loadMeetingData()
  }, [])

  const loadMeetingData = async () => {
    try {
      // For now, show empty state until real API endpoints are implemented
      setLiveMeetings([])
      setControlHistory([])
    } catch (error) {
      console.error('Error loading meeting data:', error)
      setLiveMeetings([])
      setControlHistory([])
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "live":
        return "bg-green-500"
      case "paused":
        return "bg-yellow-500"
      case "recording":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case "excellent":
        return "text-green-400"
      case "good":
        return "text-yellow-400"
      case "poor":
        return "text-red-400"
      default:
        return "text-gray-400"
    }
  }

  const handleMeetingControl = (meeting: LiveMeeting, action: string) => {
    setSelectedMeeting(meeting)
    setControlAction(action)
    setShowControlModal(true)
  }

  const executeMeetingControl = () => {
    if (!selectedMeeting) return

    const newControl: MeetingControl = {
      meetingId: selectedMeeting.id,
      action: controlAction as any,
      timestamp: new Date().toISOString(),
      admin: "Admin User",
      reason: controlReason || undefined,
    }

    setControlHistory([newControl, ...controlHistory])

    // Update meeting status based on action
    if (controlAction === "end") {
      setLiveMeetings((prev) => prev.filter((m) => m.id !== selectedMeeting.id))
    } else if (controlAction === "pause") {
      setLiveMeetings((prev) =>
        prev.map((m) => (m.id === selectedMeeting.id ? { ...m, status: "paused" as const } : m)),
      )
    }

    setShowControlModal(false)
    setControlReason("")
    setSelectedMeeting(null)
    setControlAction("")
  }

  const joinMeetingAsAdmin = (meeting: LiveMeeting) => {
    // Join the meeting with admin monitoring privileges
    const adminParams = new URLSearchParams({
      admin: 'true',
      meetingId: meeting.id,
      roomCode: meeting.roomCode,
      adminName: 'Admin Monitor'
    })
    window.open(`/meeting/${meeting.id}?${adminParams.toString()}`, "_blank")
  }

  const exportMeetingData = () => {
    const data = {
      exported_at: new Date().toISOString(),
      live_meetings: liveMeetings,
      control_history: controlHistory,
      summary: {
        total_live_meetings: liveMeetings.length,
        total_participants: liveMeetings.reduce((sum, m) => sum + m.participants, 0),
        meetings_with_issues: liveMeetings.filter((m) => m.hasIssues).length,
        recording_meetings: liveMeetings.filter((m) => m.isRecording).length,
      },
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `meeting-control-${new Date().toISOString().split("T")[0]}.json`
    a.click()
  }

  const totalParticipants = liveMeetings.reduce((sum, m) => sum + m.participants, 0)
  const recordingCount = liveMeetings.filter((m) => m.isRecording).length
  const issuesCount = liveMeetings.filter((m) => m.hasIssues).length

  return (
    <div className="min-h-screen gradient-bg">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Meeting Control Center</h1>
            <p className="text-slate-400">Monitor and manage live meetings across the platform</p>
          </div>
          <button onClick={exportMeetingData} className="btn-outline flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Data
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="stat-card">
            <div className="flex items-center justify-between mb-4">
              <Video className="h-8 w-8 text-blue-400" />
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-400 text-sm">Live</span>
              </div>
            </div>
            <div>
              <p className="text-slate-400 text-sm mb-1">Active Meetings</p>
              <p className="text-2xl font-bold text-white">{liveMeetings.length}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between mb-4">
              <Users className="h-8 w-8 text-green-400" />
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-blue-400 text-sm">Active</span>
              </div>
            </div>
            <div>
              <p className="text-slate-400 text-sm mb-1">Total Participants</p>
              <p className="text-2xl font-bold text-white">{totalParticipants}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between mb-4">
              <Video className="h-8 w-8 text-red-400" />
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-red-400 text-sm">Recording</span>
              </div>
            </div>
            <div>
              <p className="text-slate-400 text-sm mb-1">Being Recorded</p>
              <p className="text-2xl font-bold text-white">{recordingCount}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between mb-4">
              <AlertCircle className="h-8 w-8 text-yellow-400" />
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-yellow-400 text-sm">Issues</span>
              </div>
            </div>
            <div>
              <p className="text-slate-400 text-sm mb-1">With Issues</p>
              <p className="text-2xl font-bold text-white">{issuesCount}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Live Meetings */}
          <div className="xl:col-span-2">
            <div className="card">
              <h2 className="text-xl font-bold text-white mb-6">Live Meetings</h2>
              <div className="space-y-4">
                {liveMeetings.map((meeting) => (
                  <div
                    key={meeting.id}
                    className="bg-slate-700/30 rounded-lg p-4 hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <div
                            className={`w-3 h-3 rounded-full ${getStatusColor(meeting.status)} ${meeting.status === "live" ? "animate-pulse" : ""}`}
                          ></div>
                          <h3 className="text-white font-semibold">{meeting.title}</h3>
                          {meeting.hasIssues && <AlertCircle className="h-4 w-4 text-yellow-400" />}
                          {meeting.isRecording && (
                            <div className="flex items-center space-x-1 text-red-400">
                              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                              <span className="text-xs">REC</span>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm text-slate-400">
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-2" />
                            Host: {meeting.host}
                          </div>
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-2" />
                            {meeting.participants} participants
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-2" />
                            Duration: {meeting.duration}
                          </div>
                          <div className="flex items-center">
                            <Video className="h-4 w-4 mr-2" />
                            Room: {meeting.roomCode}
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-slate-400">Quality:</span>
                            <span className={`text-sm font-medium capitalize ${getQualityColor(meeting.quality)}`}>
                              {meeting.quality}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-slate-400">Status:</span>
                            <span className="text-sm font-medium text-white capitalize">{meeting.status}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Control Buttons */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-600">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => joinMeetingAsAdmin(meeting)}
                          className="btn-outline text-sm flex items-center gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          Monitor
                        </button>

                        {meeting.status === "live" ? (
                          <button
                            onClick={() => handleMeetingControl(meeting, "pause")}
                            className="btn-outline text-sm flex items-center gap-2"
                          >
                            <Pause className="h-4 w-4" />
                            Pause
                          </button>
                        ) : meeting.status === "paused" ? (
                          <button
                            onClick={() => handleMeetingControl(meeting, "resume")}
                            className="btn-outline text-sm flex items-center gap-2"
                          >
                            <Play className="h-4 w-4" />
                            Resume
                          </button>
                        ) : null}
                      </div>

                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleMeetingControl(meeting, "mute")}
                          className="p-2 bg-slate-600 hover:bg-slate-500 text-slate-300 rounded transition-colors"
                          title="Mute All"
                        >
                          <VolumeX className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => handleMeetingControl(meeting, "warning")}
                          className="p-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded transition-colors"
                          title="Send Warning"
                        >
                          <Shield className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => handleMeetingControl(meeting, "end")}
                          className="p-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                          title="End Meeting"
                        >
                          <Square className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {liveMeetings.length === 0 && (
                  <div className="text-center py-12">
                    <Video className="h-16 w-16 text-slate-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">No live meetings</h3>
                    <p className="text-slate-400">All meetings have ended or are paused</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Control History */}
          <div>
            <div className="card">
              <h3 className="text-lg font-bold text-white mb-4">Recent Control Actions</h3>
              <div className="space-y-3">
                {controlHistory.slice(0, 10).map((control, index) => (
                  <div key={index} className="p-3 bg-slate-700/30 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium capitalize">{control.action}</span>
                      <span className="text-slate-400 text-xs">{new Date(control.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div className="text-sm text-slate-400">
                      <p>Meeting: {liveMeetings.find((m) => m.id === control.meetingId)?.title || "Unknown"}</p>
                      <p>Admin: {control.admin}</p>
                      {control.target && <p>Target: {control.target}</p>}
                      {control.reason && <p>Reason: {control.reason}</p>}
                    </div>
                  </div>
                ))}

                {controlHistory.length === 0 && (
                  <div className="text-center py-8">
                    <Shield className="h-12 w-12 text-slate-500 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">No control actions yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card mt-6">
              <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full btn-outline text-left flex items-center gap-3">
                  <VolumeX className="h-5 w-5" />
                  Mute All Meetings
                </button>
                <button className="w-full btn-outline text-left flex items-center gap-3">
                  <Shield className="h-5 w-5" />
                  Send Global Warning
                </button>
                <button className="w-full btn-outline text-left flex items-center gap-3 text-red-400 hover:text-red-300">
                  <Square className="h-5 w-5" />
                  Emergency Stop All
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Control Action Modal */}
        {showControlModal && selectedMeeting && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md">
              <h2 className="text-xl font-bold text-white mb-4">
                {controlAction.charAt(0).toUpperCase() + controlAction.slice(1)} Meeting
              </h2>

              <div className="mb-4">
                <p className="text-slate-300 mb-2">Meeting: {selectedMeeting.title}</p>
                <p className="text-slate-400 text-sm">Host: {selectedMeeting.host}</p>
                <p className="text-slate-400 text-sm">Participants: {selectedMeeting.participants}</p>
              </div>

              {controlAction !== "end" && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-300 mb-2">Reason (optional)</label>
                  <textarea
                    value={controlReason}
                    onChange={(e) => setControlReason(e.target.value)}
                    className="input-field w-full h-20 resize-none"
                    placeholder="Enter reason for this action..."
                  />
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={executeMeetingControl}
                  className={`flex-1 ${
                    controlAction === "end" ? "bg-red-600 hover:bg-red-700" : "btn-primary"
                  } transition-colors`}
                >
                  Confirm {controlAction.charAt(0).toUpperCase() + controlAction.slice(1)}
                </button>
                <button onClick={() => setShowControlModal(false)} className="btn-outline flex-1">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
