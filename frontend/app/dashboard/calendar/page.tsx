"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, Calendar, Clock, Users, Plus, Edit, Trash2, Video } from "lucide-react"
import { useNotifications } from "@/contexts/NotificationContext"

interface CalendarEvent {
  id: string
  title: string
  date: string
  time: string
  duration: number
  type: "meeting" | "reminder" | "task"
  attendees?: string[]
  description?: string
  color: string
}

export default function CalendarPage() {
  const { success, error, warning, info } = useNotifications()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [showEventModal, setShowEventModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [newEvent, setNewEvent] = useState({
    title: "",
    date: "",
    time: "",
    duration: 30,
    type: "meeting" as const,
    description: "",
    attendees: [] as string[],
  })

  useEffect(() => {
    // Load calendar events from backend
    loadCalendarEvents()
  }, [])

  const loadCalendarEvents = async () => {
    try {
      const apiClient = (await import("@/lib/api")).default
      const response = await apiClient.getCalendarEvents()
      
      if (response.success) {
        const formattedEvents = response.events.map((event: any) => ({
          id: event.id,
          title: event.title,
          date: new Date(event.start_time).toISOString().split('T')[0],
          time: new Date(event.start_time).toTimeString().slice(0, 5),
          duration: event.end_time ? 
            Math.round((new Date(event.end_time).getTime() - new Date(event.start_time).getTime()) / (1000 * 60)) : 
            30,
          type: event.event_type,
          description: event.description || "",
          attendees: Array.isArray(event.attendees) ? event.attendees : [],
          color: event.color || "bg-blue-500",
        }))
        setEvents(formattedEvents)
      }
    } catch (error) {
      console.error('Failed to load calendar events:', error)
      // Keep empty array if loading fails
    }
  }

  // If no events loaded from backend, use empty array
  if (events.length === 0) {
    console.log('No events loaded from backend')
  }

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const getEventsForDate = (date: string) => {
    return events.filter((event) => event.date === date)
  }

  const formatDate = (date: Date) => {
    return date.toISOString().split("T")[0]
  }

  const handleDateClick = (day: number) => {
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    setSelectedDate(clickedDate)
  }

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    const colorMap = {
      "bg-blue-500": "#3B82F6",
      "bg-green-500": "#10B981", 
      "bg-purple-500": "#8B5CF6",
      "bg-yellow-500": "#F59E0B",
      "bg-pink-500": "#EC4899"
    }
    const tailwindColors = ["bg-blue-500", "bg-green-500", "bg-purple-500", "bg-yellow-500", "bg-pink-500"]
    const randomTailwindColor = tailwindColors[Math.floor(Math.random() * tailwindColors.length)]
    const hexColor = colorMap[randomTailwindColor as keyof typeof colorMap]

    try {
      const startISO = new Date(`${newEvent.date}T${newEvent.time}:00`).toISOString()
      const endISO = new Date(new Date(startISO).getTime() + newEvent.duration * 60000).toISOString()
      
      const apiClient = (await import("@/lib/api")).default
      
      // Create calendar event in backend
      const eventData = {
        title: newEvent.title,
        description: newEvent.description,
        eventType: newEvent.type,
        startTime: startISO,
        endTime: endISO,
        color: hexColor,
        attendees: newEvent.attendees,
      }

      const response = await apiClient.createCalendarEvent(eventData)
      
      if (response.success) {
        // If it's a meeting type, also create an actual meeting
        let meetingCode = response.event.id
        if (newEvent.type === "meeting") {
          try {
            const meetingRes = await apiClient.createMeeting({
              title: newEvent.title,
              description: newEvent.description,
              startTime: startISO,
              duration: newEvent.duration,
              isRecurring: false,
            })
            meetingCode = meetingRes.data.meeting.meeting_code
          } catch (error) {
            console.error('Failed to create meeting:', error)
          }
        }

        const event: CalendarEvent = {
          id: meetingCode,
          title: newEvent.title,
          date: newEvent.date,
          time: newEvent.time,
          duration: newEvent.duration,
          type: newEvent.type,
          description: newEvent.description,
          attendees: newEvent.attendees,
          color: randomTailwindColor,
        }

        setEvents([...events, event])
        setShowEventModal(false)
        setNewEvent({
          title: "",
          date: "",
          time: "",
          duration: 30,
          type: "meeting",
          description: "",
          attendees: [],
        })
        success('Event Created', `${newEvent.type === 'meeting' ? 'Meeting' : 'Event'} "${newEvent.title}" has been scheduled successfully.`)
      }
    } catch (error: any) {
      console.error('Failed to create calendar event:', error)
      console.error('Error response:', error.response?.data)
      error('Failed to Create Event', error.response?.data?.message || error.message)
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
    try {
      const apiClient = (await import("@/lib/api")).default
      await apiClient.deleteCalendarEvent(eventId)
      setEvents(events.filter((e) => e.id !== eventId))
      setSelectedEvent(null)
      success('Event Deleted', 'The event has been removed from your calendar.')
    } catch (err: any) {
      console.error('Failed to delete calendar event:', err)
      error('Delete Failed', 'Failed to delete event. Please try again.')
    }
  }

  const daysInMonth = getDaysInMonth(currentDate)
  const firstDay = getFirstDayOfMonth(currentDate)
  const monthName = currentDate.toLocaleString("default", { month: "long", year: "numeric" })
  const today = new Date().toDateString()

  const renderCalendarDays = () => {
    const days = []
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

    // Day headers
    dayNames.forEach((day) => {
      days.push(
        <div key={day} className="p-2 text-center text-sm font-medium text-slate-400">
          {day}
        </div>,
      )
    })

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2"></div>)
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
      const dateString = formatDate(date)
      const dayEvents = getEventsForDate(dateString)
      const isToday = date.toDateString() === today
      const isSelected = selectedDate?.toDateString() === date.toDateString()

      days.push(
        <div
          key={day}
          onClick={() => handleDateClick(day)}
          className={`p-2 min-h-[80px] cursor-pointer border border-slate-700/50 hover:bg-slate-700/30 transition-colors ${
            isToday ? "bg-indigo-500/20 border-indigo-500" : ""
          } ${isSelected ? "bg-slate-600/50" : ""}`}
        >
          <div className={`text-sm font-medium mb-1 ${isToday ? "text-indigo-300" : "text-slate-300"}`}>{day}</div>
          <div className="space-y-1">
            {dayEvents.slice(0, 2).map((event) => (
              <div
                key={event.id}
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedEvent(event)
                }}
                className={`text-xs p-1 rounded text-white truncate ${event.color} hover:opacity-80`}
              >
                {event.time} {event.title}
              </div>
            ))}
            {dayEvents.length > 2 && <div className="text-xs text-slate-400">+{dayEvents.length - 2} more</div>}
          </div>
        </div>,
      )
    }

    return days
  }

  return (
    <div className="min-h-screen gradient-bg">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Calendar</h1>
            <p className="text-slate-400">Manage your schedule and meetings</p>
          </div>
          <button onClick={() => setShowEventModal(true)} className="btn-primary flex items-center gap-2">
            <Plus className="h-5 w-5" />
            New Event
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-3">
            <div className="card">
              {/* Calendar Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">{monthName}</h2>
                <div className="flex space-x-2">
                  <button
                    onClick={() => navigateMonth("prev")}
                    className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5 text-slate-300" />
                  </button>
                  <button
                    onClick={() => setCurrentDate(new Date())}
                    className="px-4 py-2 text-sm bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
                  >
                    Today
                  </button>
                  <button
                    onClick={() => navigateMonth("next")}
                    className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <ChevronRight className="h-5 w-5 text-slate-300" />
                  </button>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-px bg-slate-700/50 rounded-lg overflow-hidden">
                {renderCalendarDays()}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Today's Events */}
            <div className="card">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-indigo-400" />
                Today's Events
              </h3>
              <div className="space-y-3">
                {events
                  .filter((event) => event.date === formatDate(new Date()))
                  .map((event) => (
                    <div
                      key={event.id}
                      onClick={() => setSelectedEvent(event)}
                      className="p-3 bg-slate-700/30 rounded-lg cursor-pointer hover:bg-slate-700/50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-white font-medium text-sm">{event.title}</h4>
                        <div className={`w-3 h-3 rounded-full ${event.color}`}></div>
                      </div>
                      <div className="flex items-center text-xs text-slate-400">
                        <Clock className="h-3 w-3 mr-1" />
                        {event.time} • {event.duration}min
                      </div>
                    </div>
                  ))}
                {events.filter((event) => event.date === formatDate(new Date())).length === 0 && (
                  <p className="text-slate-400 text-sm">No events scheduled for today</p>
                )}
              </div>
            </div>

            {/* Upcoming Events */}
            <div className="card">
              <h3 className="text-lg font-semibold text-white mb-4">Upcoming Events</h3>
              <div className="space-y-3">
                {events
                  .filter((event) => new Date(event.date) > new Date())
                  .slice(0, 5)
                  .map((event) => (
                    <div
                      key={event.id}
                      onClick={() => setSelectedEvent(event)}
                      className="p-3 bg-slate-700/30 rounded-lg cursor-pointer hover:bg-slate-700/50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-white font-medium text-sm">{event.title}</h4>
                        <div className={`w-3 h-3 rounded-full ${event.color}`}></div>
                      </div>
                      <div className="text-xs text-slate-400">
                        {new Date(event.date).toLocaleDateString()} at {event.time}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>

        {/* Event Details Modal */}
        {selectedEvent && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Event Details</h2>
                <button onClick={() => setSelectedEvent(null)} className="text-slate-400 hover:text-white">
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">{selectedEvent.title}</h3>
                  <div className="flex items-center space-x-4 text-sm text-slate-400">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(selectedEvent.date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {selectedEvent.time} ({selectedEvent.duration}min)
                    </div>
                  </div>
                </div>

                {selectedEvent.description && (
                  <div>
                    <h4 className="text-sm font-medium text-slate-300 mb-2">Description</h4>
                    <p className="text-slate-400 text-sm">{selectedEvent.description}</p>
                  </div>
                )}

                {selectedEvent.attendees && selectedEvent.attendees.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-slate-300 mb-2">Attendees</h4>
                    <div className="space-y-1">
                      {selectedEvent.attendees.map((attendee, index) => (
                        <div key={index} className="flex items-center text-sm text-slate-400">
                          <Users className="h-3 w-3 mr-2" />
                          {attendee}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex space-x-3 pt-4">
                  {selectedEvent.type === "meeting" && (
                    <button
                      onClick={() => {
                        const eventDateTime = new Date(`${selectedEvent.date}T${selectedEvent.time}:00`)
                        const now = new Date()
                        const eventDate = eventDateTime.toDateString()
                        const currentDate = now.toDateString()
                        
                        // Check if meeting is on a different date
                        if (eventDate !== currentDate) {
                          const isPastDate = eventDateTime.getTime() < now.getTime()
                          if (isPastDate) {
                            warning(
                              "Meeting Has Passed",
                              `This meeting was scheduled for ${eventDateTime.toLocaleDateString()} at ${eventDateTime.toLocaleTimeString()}.`
                            )
                          } else {
                            info(
                              "Meeting Not Available",
                              `This meeting is scheduled for ${eventDateTime.toLocaleDateString()} at ${eventDateTime.toLocaleTimeString()}. You can only join on the scheduled date.`
                            )
                          }
                          return
                        }
                        
                        const timeDiff = eventDateTime.getTime() - now.getTime()
                        const minutesDiff = Math.floor(timeDiff / (1000 * 60))
                        
                        // Allow joining 15 minutes before scheduled time
                        if (minutesDiff > 15) {
                          const timeUntil = Math.floor(minutesDiff / 60) > 0 
                            ? `${Math.floor(minutesDiff / 60)} hours and ${minutesDiff % 60} minutes`
                            : `${minutesDiff} minutes`
                          info(
                            "Meeting Not Ready",
                            `Meeting starts at ${eventDateTime.toLocaleTimeString()}. You can join ${timeUntil} before the scheduled time.`
                          )
                          return
                        }
                        
                        window.location.href = `/meeting/${selectedEvent.id}`
                      }}
                      className="btn-primary flex-1 flex items-center justify-center gap-2"
                    >
                      <Video className="h-4 w-4" />
                      Join Meeting
                    </button>
                  )}
                  <button className="btn-outline flex items-center gap-2">
                    <Edit className="h-4 w-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      warning(
                        "Delete Event",
                        `Are you sure you want to delete "${selectedEvent.title}"?`,
                        0,
                        {
                          label: "Delete",
                          onClick: () => handleDeleteEvent(selectedEvent.id)
                        }
                      )
                    }}
                    className="btn-outline text-red-400 hover:bg-red-500/20 flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Event Modal */}
        {showEventModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold text-white mb-6">Create New Event</h2>
              <form onSubmit={handleCreateEvent} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Event Title</label>
                  <input
                    type="text"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    className="input-field w-full"
                    placeholder="Enter event title"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Event Type</label>
                  <select
                    value={newEvent.type}
                    onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value as any })}
                    className="input-field w-full"
                  >
                    <option value="meeting">Meeting</option>
                    <option value="reminder">Reminder</option>
                    <option value="task">Task</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Date</label>
                    <input
                      type="date"
                      value={newEvent.date}
                      onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                      className="input-field w-full"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Time</label>
                    <input
                      type="time"
                      value={newEvent.time}
                      onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                      className="input-field w-full"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Duration (minutes)</label>
                  <select
                    value={newEvent.duration}
                    onChange={(e) => setNewEvent({ ...newEvent, duration: Number.parseInt(e.target.value) })}
                    className="input-field w-full"
                  >
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={90}>1.5 hours</option>
                    <option value={120}>2 hours</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                  <textarea
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    className="input-field w-full h-20 resize-none"
                    placeholder="Event description (optional)"
                  ></textarea>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button type="submit" className="btn-primary flex-1">
                    Create Event
                  </button>
                  <button type="button" onClick={() => setShowEventModal(false)} className="btn-outline flex-1">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
