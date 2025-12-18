"use client"

import { useState, useEffect } from "react"
import { Shield, AlertTriangle, Eye, Lock, Key, Globe, UserX, Activity, Download, Search } from "lucide-react"
import { useNotifications } from "@/contexts/NotificationContext"
import apiClient from "@/lib/api"

interface SecurityEvent {
  id: string
  type: "login" | "failed_login" | "password_change" | "permission_change" | "data_access" | "suspicious_activity"
  user: string
  ip: string
  location: string
  timestamp: string
  details: string
  severity: "low" | "medium" | "high" | "critical"
}

interface SecuritySettings {
  passwordPolicy: {
    minLength: number
    requireNumbers: boolean
    requireSymbols: boolean
    requireUppercase: boolean
    maxAge: number
  }
  sessionSettings: {
    sessionTimeout: number
    maxSessions: number
    requireReauth: boolean
  }
  accessControl: {
    enableTwoFactor: boolean
    allowRemoteAccess: boolean
    restrictByLocation: boolean
    enableSSO: boolean
  }
  monitoring: {
    logFailedLogins: boolean
    alertSuspiciousActivity: boolean
    monitorDataAccess: boolean
    enableRealTimeAlerts: boolean
  }
}

export default function SecurityPage() {
  const { success, error, info } = useNotifications()
  const [activeTab, setActiveTab] = useState("events")
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [severityFilter, setSeverityFilter] = useState<"all" | "low" | "medium" | "high" | "critical">("all")
  const [settings, setSettings] = useState<SecuritySettings>({
    passwordPolicy: {
      minLength: 8,
      requireNumbers: true,
      requireSymbols: true,
      requireUppercase: true,
      maxAge: 90,
    },
    sessionSettings: {
      sessionTimeout: 30,
      maxSessions: 3,
      requireReauth: true,
    },
    accessControl: {
      enableTwoFactor: true,
      allowRemoteAccess: true,
      restrictByLocation: false,
      enableSSO: true,
    },
    monitoring: {
      logFailedLogins: true,
      alertSuspiciousActivity: true,
      monitorDataAccess: true,
      enableRealTimeAlerts: true,
    },
  })

  useEffect(() => {
    loadSecurityData()
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadSecurityData, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadSecurityData = async () => {
    try {
      const [eventsResponse, settingsResponse] = await Promise.all([
        apiClient.getSecurityEvents(),
        apiClient.getSecuritySettings()
      ])
      
      if (eventsResponse.success) {
        setSecurityEvents(eventsResponse.data || [])
      }
      
      if (settingsResponse.success && settingsResponse.data) {
        setSettings(settingsResponse.data)
      }
    } catch (error) {
      console.error('Failed to load security data:', error)
      // Use fallback empty data
      setSecurityEvents([])
    }
  }

  const filteredEvents = securityEvents.filter((event) => {
    const matchesSearch =
      event.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.ip.includes(searchTerm)
    const matchesSeverity = severityFilter === "all" || event.severity === severityFilter
    return matchesSearch && matchesSeverity
  })

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      case "high":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30"
      case "medium":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "low":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case "login":
        return <Eye className="h-4 w-4" />
      case "failed_login":
        return <UserX className="h-4 w-4" />
      case "password_change":
        return <Key className="h-4 w-4" />
      case "permission_change":
        return <Shield className="h-4 w-4" />
      case "data_access":
        return <Globe className="h-4 w-4" />
      case "suspicious_activity":
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  const calculateSecurityScore = () => {
    let score = 100
    
    // Deduct points based on critical and high severity events
    const recentCritical = securityEvents.filter(e => 
      e.severity === "critical" && 
      new Date(e.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    ).length
    const recentHigh = securityEvents.filter(e => 
      e.severity === "high" && 
      new Date(e.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    ).length
    
    score -= (recentCritical * 15) + (recentHigh * 5)
    
    // Add points for good security practices
    if (settings.accessControl.enableTwoFactor) score += 5
    if (settings.monitoring.enableRealTimeAlerts) score += 3
    if (settings.passwordPolicy.minLength >= 12) score += 2
    
    return Math.max(0, Math.min(100, score))
  }

  const getSecurityScoreColor = () => {
    const score = calculateSecurityScore()
    if (score >= 80) return "text-green-500"
    if (score >= 60) return "text-yellow-500"
    if (score >= 40) return "text-orange-500"
    return "text-red-500"
  }

  const getSecurityScoreStatus = () => {
    const score = calculateSecurityScore()
    if (score >= 80) return "Excellent"
    if (score >= 60) return "Good"
    if (score >= 40) return "Fair"
    return "Poor"
  }

  const exportSecurityLog = () => {
    const data = {
      exported_at: new Date().toISOString(),
      events: filteredEvents,
      summary: {
        total_events: filteredEvents.length,
        critical: filteredEvents.filter((e) => e.severity === "critical").length,
        high: filteredEvents.filter((e) => e.severity === "high").length,
        medium: filteredEvents.filter((e) => e.severity === "medium").length,
        low: filteredEvents.filter((e) => e.severity === "low").length,
      },
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `security-log-${new Date().toISOString().split("T")[0]}.json`
    a.click()
  }

  const saveSettings = async () => {
    try {
      const response = await apiClient.updateSecuritySettings(settings)
      if (response.success) {
        success("Security Settings Saved", "Your security settings have been saved successfully!")
      } else {
        error("Save Failed", "Failed to save security settings. Please try again.")
      }
    } catch (err) {
      console.error('Failed to save security settings:', err)
      error("Save Failed", "Failed to save security settings. Please try again.")
    }
  }

  const tabs = [
    { id: "overview", label: "Security Overview", icon: Shield },
    { id: "events", label: "Security Events", icon: Activity },
    { id: "settings", label: "Security Settings", icon: Lock },
  ]

  const criticalEvents = securityEvents.filter((e) => e.severity === "critical").length
  const highEvents = securityEvents.filter((e) => e.severity === "high").length
  const todayEvents = securityEvents.filter((e) => {
    const eventDate = new Date(e.timestamp).toDateString()
    const today = new Date().toDateString()
    return eventDate === today
  }).length

  return (
    <div className="min-h-screen gradient-bg">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Security Center</h1>
            <p className="text-slate-400">Monitor and manage system security</p>
          </div>
          <button onClick={exportSecurityLog} className="btn-outline flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Security Log
          </button>
        </div>

        {/* Security Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="stat-card">
            <div className="flex items-center justify-between mb-4">
              <AlertTriangle className="h-8 w-8 text-red-400" />
              <div className="flex items-center gap-1 text-sm">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-red-400">Critical</span>
              </div>
            </div>
            <div>
              <p className="text-slate-400 text-sm mb-1">Critical Events</p>
              <p className="text-2xl font-bold text-white">{criticalEvents}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between mb-4">
              <Shield className="h-8 w-8 text-orange-400" />
              <div className="flex items-center gap-1 text-sm">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span className="text-orange-400">High</span>
              </div>
            </div>
            <div>
              <p className="text-slate-400 text-sm mb-1">High Priority</p>
              <p className="text-2xl font-bold text-white">{highEvents}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between mb-4">
              <Activity className="h-8 w-8 text-blue-400" />
              <div className="flex items-center gap-1 text-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-blue-400">Today</span>
              </div>
            </div>
            <div>
              <p className="text-slate-400 text-sm mb-1">Today's Events</p>
              <p className="text-2xl font-bold text-white">{todayEvents}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between mb-4">
              <Eye className="h-8 w-8 text-green-400" />
              <div className="flex items-center gap-1 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-green-400">Active</span>
              </div>
            </div>
            <div>
              <p className="text-slate-400 text-sm mb-1">Monitoring Status</p>
              <p className="text-2xl font-bold text-white">Active</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 bg-slate-800/50 rounded-lg p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? "bg-indigo-600 text-white"
                  : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
              }`}
            >
              <tab.icon className="h-5 w-5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="card">
          {/* Security Overview */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-4">Security Overview</h2>
                <p className="text-slate-400 mb-6">Current security status and recent activity summary</p>
              </div>

              {/* Security Score */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-700/30 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Security Score</h3>
                  <div className="flex items-center justify-center mb-4">
                    <div className="relative w-32 h-32">
                      <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="none"
                          className="text-slate-700"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="none"
                          strokeDasharray={`${calculateSecurityScore() * 2.51}, 251`}
                          className={getSecurityScoreColor()}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-bold text-white">{calculateSecurityScore()}%</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-center text-slate-300">Your security score is {getSecurityScoreStatus().toLowerCase()}</p>
                </div>

                <div className="space-y-4">
                  <div className="bg-slate-700/30 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-300">Two-Factor Authentication</span>
                      <div className={`w-3 h-3 rounded-full ${settings.accessControl.enableTwoFactor ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    </div>
                    <p className="text-sm text-slate-400">
                      {settings.accessControl.enableTwoFactor ? 'Enabled for all admin accounts' : 'Not enabled - security risk'}
                    </p>
                  </div>

                  <div className="bg-slate-700/30 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-300">Password Policy</span>
                      <div className={`w-3 h-3 rounded-full ${settings.passwordPolicy.minLength >= 8 ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                    </div>
                    <p className="text-sm text-slate-400">
                      {settings.passwordPolicy.minLength >= 12 ? 'Strong password requirements active' : 
                       settings.passwordPolicy.minLength >= 8 ? 'Basic password requirements active' : 'Weak password policy'}
                    </p>
                  </div>

                  <div className="bg-slate-700/30 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-300">Session Management</span>
                      <div className={`w-3 h-3 rounded-full ${settings.sessionSettings.sessionTimeout <= 30 ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                    </div>
                    <p className="text-sm text-slate-400">
                      {settings.sessionSettings.sessionTimeout <= 30 ? 'Secure session timeout configured' : 'Consider reducing session timeout'}
                    </p>
                  </div>

                  <div className="bg-slate-700/30 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-300">Access Monitoring</span>
                      <div className={`w-3 h-3 rounded-full ${settings.monitoring.enableRealTimeAlerts ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    </div>
                    <p className="text-sm text-slate-400">
                      {settings.monitoring.enableRealTimeAlerts ? 'Real-time monitoring active' : 'Real-time monitoring disabled'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Recent Critical Events */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Recent Critical Events</h3>
                <div className="space-y-3">
                  {securityEvents
                    .filter((e) => e.severity === "critical")
                    .slice(0, 3)
                    .map((event) => (
                      <div
                        key={event.id}
                        className="flex items-center space-x-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg"
                      >
                        <div className="p-2 bg-red-500/20 rounded-lg">{getEventIcon(event.type)}</div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-white font-medium">{event.details}</h4>
                            <span className="text-xs text-slate-400">{new Date(event.timestamp).toLocaleString()}</span>
                          </div>
                          <p className="text-sm text-slate-400">
                            User: {event.user} • IP: {event.ip} • Location: {event.location}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* Security Events */}
          {activeTab === "events" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-white mb-2">Security Events</h2>
                  <p className="text-slate-400">Monitor and investigate security events</p>
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <div className="flex space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search events..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="input-field pl-10 w-64"
                    />
                  </div>

                  <select
                    value={severityFilter}
                    onChange={(e) => setSeverityFilter(e.target.value as "all" | "low" | "medium" | "high" | "critical")}
                    className="input-field"
                  >
                    <option value="all">All Severities</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div className="text-slate-400 text-sm">
                  {filteredEvents.length} of {securityEvents.length} events
                </div>
              </div>

              {/* Events List */}
              <div className="space-y-3">
                {filteredEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center space-x-4 p-4 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="p-2 bg-slate-600 rounded-lg">{getEventIcon(event.type)}</div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-white font-medium">{event.details}</h4>
                        <div className="flex items-center space-x-3">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(event.severity)}`}
                          >
                            {event.severity.toUpperCase()}
                          </span>
                          <span className="text-xs text-slate-400">{new Date(event.timestamp).toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-6 text-sm text-slate-400">
                        <span>User: {event.user}</span>
                        <span>IP: {event.ip}</span>
                        <span>Location: {event.location}</span>
                        <span className="capitalize">Type: {event.type.replace("_", " ")}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredEvents.length === 0 && (
                <div className="text-center py-12">
                  <Shield className="h-16 w-16 text-slate-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">No security events found</h3>
                  <p className="text-slate-400">No events match your current filter criteria</p>
                </div>
              )}
            </div>
          )}

          {/* Security Settings */}
          {activeTab === "settings" && (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-white mb-2">Security Settings</h2>
                  <p className="text-slate-400">Configure security policies and controls</p>
                </div>
                <button onClick={saveSettings} className="btn-primary">
                  Save Settings
                </button>
              </div>

              {/* Password Policy */}
              <div className="bg-slate-700/30 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Password Policy
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Minimum Length</label>
                    <input
                      type="number"
                      min="6"
                      max="20"
                      value={settings.passwordPolicy.minLength}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          passwordPolicy: {
                            ...prev.passwordPolicy,
                            minLength: Number.parseInt(e.target.value),
                          },
                        }))
                      }
                      className="input-field w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Password Expiry (days)</label>
                    <input
                      type="number"
                      min="30"
                      max="365"
                      value={settings.passwordPolicy.maxAge}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          passwordPolicy: {
                            ...prev.passwordPolicy,
                            maxAge: Number.parseInt(e.target.value),
                          },
                        }))
                      }
                      className="input-field w-full"
                    />
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  {Object.entries(settings.passwordPolicy)
                    .filter(
                      ([key]) =>
                        typeof settings.passwordPolicy[key as keyof typeof settings.passwordPolicy] === "boolean",
                    )
                    .map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-slate-300 capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={value as boolean}
                            onChange={(e) =>
                              setSettings((prev) => ({
                                ...prev,
                                passwordPolicy: {
                                  ...prev.passwordPolicy,
                                  [key]: e.target.checked,
                                },
                              }))
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                      </div>
                    ))}
                </div>
              </div>

              {/* Session Settings */}
              <div className="bg-slate-700/30 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Session Management
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Session Timeout (minutes)</label>
                    <input
                      type="number"
                      min="5"
                      max="480"
                      value={settings.sessionSettings.sessionTimeout}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          sessionSettings: {
                            ...prev.sessionSettings,
                            sessionTimeout: Number.parseInt(e.target.value),
                          },
                        }))
                      }
                      className="input-field w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Max Concurrent Sessions</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={settings.sessionSettings.maxSessions}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          sessionSettings: {
                            ...prev.sessionSettings,
                            maxSessions: Number.parseInt(e.target.value),
                          },
                        }))
                      }
                      className="input-field w-full"
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Require Re-authentication for Sensitive Actions</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.sessionSettings.requireReauth}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            sessionSettings: {
                              ...prev.sessionSettings,
                              requireReauth: e.target.checked,
                            },
                          }))
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Access Control */}
              <div className="bg-slate-700/30 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Access Control
                </h3>
                <div className="space-y-4">
                  {Object.entries(settings.accessControl).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <div>
                        <span className="text-slate-300 capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</span>
                        <p className="text-sm text-slate-400 mt-1">
                          {key === "enableTwoFactor" && "Require two-factor authentication for all users"}
                          {key === "allowRemoteAccess" && "Allow users to access the system remotely"}
                          {key === "restrictByLocation" && "Restrict access based on geographical location"}
                          {key === "enableSSO" && "Enable single sign-on integration"}
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) =>
                            setSettings((prev) => ({
                              ...prev,
                              accessControl: {
                                ...prev.accessControl,
                                [key]: e.target.checked,
                              },
                            }))
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Monitoring Settings */}
              <div className="bg-slate-700/30 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Security Monitoring
                </h3>
                <div className="space-y-4">
                  {Object.entries(settings.monitoring).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <div>
                        <span className="text-slate-300 capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</span>
                        <p className="text-sm text-slate-400 mt-1">
                          {key === "logFailedLogins" && "Log all failed login attempts"}
                          {key === "alertSuspiciousActivity" && "Send alerts for suspicious user activity"}
                          {key === "monitorDataAccess" && "Monitor access to sensitive data"}
                          {key === "enableRealTimeAlerts" && "Enable real-time security alerts"}
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) =>
                            setSettings((prev) => ({
                              ...prev,
                              monitoring: {
                                ...prev.monitoring,
                                [key]: e.target.checked,
                              },
                            }))
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
