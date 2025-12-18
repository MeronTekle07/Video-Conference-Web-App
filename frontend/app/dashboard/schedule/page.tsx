"use client"

import { useState } from "react"
import { Calendar, Clock, Users, Video, Plus, ArrowLeft, ArrowRight, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { useNotifications } from "@/contexts/NotificationContext"

export default function SchedulePage() {
  const { success, error, info } = useNotifications()
  const [currentStep, setCurrentStep] = useState(1)
  const [meetingData, setMeetingData] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    duration: "30",
    participants: [] as string[],
    recurring: false,
    recordMeeting: false,
    waitingRoom: true,
  })

  const [newParticipant, setNewParticipant] = useState("")

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const addParticipant = () => {
    if (newParticipant.trim() && !meetingData.participants.includes(newParticipant.trim())) {
      setMeetingData({
        ...meetingData,
        participants: [...meetingData.participants, newParticipant.trim()],
      })
      setNewParticipant("")
    }
  }

  const removeParticipant = (email: string) => {
    setMeetingData({
      ...meetingData,
      participants: meetingData.participants.filter((p) => p !== email),
    })
  }

  const handleSchedule = () => {
    // Here you would typically send the data to your backend
    console.log("Scheduling meeting:", meetingData)
    success("Meeting Scheduled", `"${meetingData.title}" has been scheduled successfully!`)
    // Reset form
    setMeetingData({
      title: "",
      description: "",
      date: "",
      time: "",
      duration: "30",
      participants: [],
      recurring: false,
      recordMeeting: false,
      waitingRoom: true,
    })
    setCurrentStep(1)
  }

  const steps = [
    { number: 1, title: "Meeting Details", icon: Video },
    { number: 2, title: "Participants", icon: Users },
    { number: 3, title: "Settings", icon: Clock },
  ]

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Schedule Meeting</h1>
          <p className="text-slate-400">Create a new video conference meeting</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors",
                    currentStep >= step.number
                      ? "bg-indigo-500 border-indigo-500 text-white"
                      : "border-slate-600 text-slate-400",
                  )}
                >
                  {currentStep > step.number ? <Check className="h-5 w-5" /> : <step.icon className="h-5 w-5" />}
                </div>
                <div className="ml-3">
                  <p
                    className={cn("text-sm font-medium", currentStep >= step.number ? "text-white" : "text-slate-400")}
                  >
                    {step.title}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "w-24 h-0.5 mx-4 transition-colors",
                      currentStep > step.number ? "bg-indigo-500" : "bg-slate-600",
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          {/* Step 1: Meeting Details */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white mb-4">Meeting Details</h2>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Meeting Title</label>
                <input
                  type="text"
                  value={meetingData.title}
                  onChange={(e) => setMeetingData({ ...meetingData, title: e.target.value })}
                  className="input-field w-full"
                  placeholder="Enter meeting title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Description (Optional)</label>
                <textarea
                  value={meetingData.description}
                  onChange={(e) => setMeetingData({ ...meetingData, description: e.target.value })}
                  className="input-field w-full h-24 resize-none"
                  placeholder="Meeting agenda or description"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                    <input
                      type="date"
                      value={meetingData.date}
                      onChange={(e) => setMeetingData({ ...meetingData, date: e.target.value })}
                      className="input-field pl-10 w-full"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Time</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                    <input
                      type="time"
                      value={meetingData.time}
                      onChange={(e) => setMeetingData({ ...meetingData, time: e.target.value })}
                      className="input-field pl-10 w-full"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Duration</label>
                <select
                  value={meetingData.duration}
                  onChange={(e) => setMeetingData({ ...meetingData, duration: e.target.value })}
                  className="input-field w-full"
                >
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="60">1 hour</option>
                  <option value="90">1.5 hours</option>
                  <option value="120">2 hours</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 2: Participants */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white mb-4">Add Participants</h2>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={newParticipant}
                    onChange={(e) => setNewParticipant(e.target.value)}
                    className="input-field flex-1"
                    placeholder="Enter participant email"
                    onKeyPress={(e) => e.key === "Enter" && addParticipant()}
                  />
                  <button onClick={addParticipant} className="btn-primary px-4 py-2 flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add
                  </button>
                </div>
              </div>

              {meetingData.participants.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-slate-300 mb-3">
                    Participants ({meetingData.participants.length})
                  </h3>
                  <div className="space-y-2">
                    {meetingData.participants.map((email, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="user-avatar text-sm">{email.charAt(0).toUpperCase()}</div>
                          <span className="text-white">{email}</span>
                        </div>
                        <button
                          onClick={() => removeParticipant(email)}
                          className="text-red-400 hover:text-red-300 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-4 bg-slate-700/20 rounded-lg border border-slate-600/30">
                <p className="text-slate-400 text-sm">
                  💡 Tip: Participants will receive an email invitation with the meeting link and calendar event.
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Settings */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white mb-4">Meeting Settings</h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-700/20 rounded-lg">
                  <div>
                    <h3 className="text-white font-medium">Waiting Room</h3>
                    <p className="text-slate-400 text-sm">Participants wait for host approval before joining</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={meetingData.waitingRoom}
                      onChange={(e) => setMeetingData({ ...meetingData, waitingRoom: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-700/20 rounded-lg">
                  <div>
                    <h3 className="text-white font-medium">Record Meeting</h3>
                    <p className="text-slate-400 text-sm">Automatically record the meeting for later viewing</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={meetingData.recordMeeting}
                      onChange={(e) => setMeetingData({ ...meetingData, recordMeeting: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-700/20 rounded-lg">
                  <div>
                    <h3 className="text-white font-medium">Recurring Meeting</h3>
                    <p className="text-slate-400 text-sm">Repeat this meeting on a schedule</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={meetingData.recurring}
                      onChange={(e) => setMeetingData({ ...meetingData, recurring: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                  </label>
                </div>
              </div>

              {/* Meeting Summary */}
              <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                <h3 className="text-indigo-400 font-medium mb-3">Meeting Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Title:</span>
                    <span className="text-white">{meetingData.title || "Untitled Meeting"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Date & Time:</span>
                    <span className="text-white">
                      {meetingData.date && meetingData.time ? `${meetingData.date} at ${meetingData.time}` : "Not set"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Duration:</span>
                    <span className="text-white">{meetingData.duration} minutes</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Participants:</span>
                    <span className="text-white">{meetingData.participants.length} invited</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-slate-700/50">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className={cn(
                "btn-outline flex items-center gap-2",
                currentStep === 1 && "opacity-50 cursor-not-allowed",
              )}
            >
              <ArrowLeft className="h-4 w-4" />
              Previous
            </button>

            {currentStep < 3 ? (
              <button
                onClick={handleNext}
                disabled={
                  (currentStep === 1 && (!meetingData.title || !meetingData.date || !meetingData.time)) ||
                  (currentStep === 2 && meetingData.participants.length === 0)
                }
                className="btn-primary flex items-center gap-2"
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button onClick={handleSchedule} className="btn-primary flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Schedule Meeting
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
