"use client"

import { useState } from "react"
import {
  Server,
  Database,
  Wifi,
  HardDrive,
  Cpu,
  MemoryStickIcon as Memory,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Settings,
  Monitor,
} from "lucide-react"
import { useNotifications } from "@/contexts/NotificationContext"

interface SystemConfig {
  server: {
    maxConcurrentMeetings: number
    maxParticipantsPerMeeting: number
    sessionTimeout: number
    enableLoadBalancing: boolean
    autoScaling: boolean
  }
  storage: {
    recordingRetentionDays: number
    maxRecordingSize: number
    enableCloudBackup: boolean
    compressionLevel: number
  }
  network: {
    bandwidthLimit: number
    qualityAdaptation: boolean
    enableCDN: boolean
    prioritizeAudio: boolean
  }
  features: {
    enableScreenSharing: boolean
    enableRecording: boolean
    enableChat: boolean
    enableVirtualBackgrounds: boolean
    enableBreakoutRooms: boolean
  }
  maintenance: {
    autoUpdates: boolean
    maintenanceWindow: string
    backupSchedule: string
    logRetentionDays: number
  }
}

interface SystemStatus {
  cpu: { usage: number; cores: number; temperature: number }
  memory: { used: number; total: number; percentage: number }
  storage: { used: number; total: number; percentage: number }
  network: { incoming: number; outgoing: number; latency: number }
  database: { connections: number; maxConnections: number; queryTime: number }
  services: { name: string; status: "online" | "offline" | "warning"; uptime: string }[]
}

export default function SystemPage() {
  const { success, error, info } = useNotifications()
  const [activeTab, setActiveTab] = useState("overview")
  const [config, setConfig] = useState<SystemConfig>({
    server: {
      maxConcurrentMeetings: 100,
      maxParticipantsPerMeeting: 50,
      sessionTimeout: 30,
      enableLoadBalancing: true,
      autoScaling: true,
    },
    storage: {
      recordingRetentionDays: 90,
      maxRecordingSize: 5000,
      enableCloudBackup: true,
      compressionLevel: 3,
    },
    network: {
      bandwidthLimit: 1000,
      qualityAdaptation: true,
      enableCDN: true,
      prioritizeAudio: true,
    },
    features: {
      enableScreenSharing: true,
      enableRecording: true,
      enableChat: true,
      enableVirtualBackgrounds: true,
      enableBreakoutRooms: false,
    },
    maintenance: {
      autoUpdates: false,
      maintenanceWindow: "02:00",
      backupSchedule: "daily",
      logRetentionDays: 30,
    },
  })

  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    cpu: { usage: 45, cores: 8, temperature: 62 },
    memory: { used: 12.5, total: 32, percentage: 39 },
    storage: { used: 450, total: 1000, percentage: 45 },
    network: { incoming: 125.5, outgoing: 89.3, latency: 12 },
    database: { connections: 45, maxConnections: 100, queryTime: 2.3 },
    services: [
      { name: "API Server", status: "online", uptime: "15d 4h 32m" },
      { name: "Media Server", status: "online", uptime: "15d 4h 30m" },
      { name: "Database", status: "online", uptime: "30d 12h 15m" },
      { name: "Redis Cache", status: "online", uptime: "20d 8h 45m" },
      { name: "File Storage", status: "warning", uptime: "2d 3h 20m" },
      { name: "CDN", status: "online", uptime: "45d 18h 10m" },
    ],
  })

  const saveConfig = () => {
    localStorage.setItem("systemConfig", JSON.stringify(config))
    success("Configuration Saved", "System configuration has been saved successfully!")
  }

  const restartService = (serviceName: string) => {
    info("Service Restart", `${serviceName} restart has been initiated`, 5000)
    // Simulate service restart
    setTimeout(() => {
      success("Service Restarted", `${serviceName} has been restarted successfully`)
    }, 2000)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "text-green-400"
      case "warning":
        return "text-yellow-400"
      case "offline":
        return "text-red-400"
      default:
        return "text-gray-400"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "online":
        return <CheckCircle className="h-4 w-4 text-green-400" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-400" />
      case "offline":
        return <AlertTriangle className="h-4 w-4 text-red-400" />
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-400" />
    }
  }

  const tabs = [
    { id: "overview", label: "System Overview", icon: Monitor },
    { id: "server", label: "Server Config", icon: Server },
    { id: "storage", label: "Storage Config", icon: HardDrive },
    { id: "network", label: "Network Config", icon: Wifi },
    { id: "features", label: "Feature Config", icon: Settings },
    { id: "maintenance", label: "Maintenance", icon: RefreshCw },
  ]

  return (
    <div className="min-h-screen gradient-bg">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">System Configuration</h1>
            <p className="text-slate-400">Configure and monitor your VidConnect Pro infrastructure</p>
          </div>
          <div className="flex space-x-3">
            <button className="btn-outline flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Refresh Status
            </button>
            <button onClick={saveConfig} className="btn-primary flex items-center gap-2">
              <Save className="h-5 w-5" />
              Save Configuration
            </button>
          </div>
        </div>

        {/* System Health Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="stat-card">
            <div className="flex items-center justify-between mb-4">
              <Cpu className="h-8 w-8 text-blue-400" />
              <span className="text-sm text-slate-400">{systemStatus.cpu.cores} cores</span>
            </div>
            <div>
              <p className="text-slate-400 text-sm mb-1">CPU Usage</p>
              <p className="text-2xl font-bold text-white">{systemStatus.cpu.usage}%</p>
              <div className="w-full bg-slate-700 rounded-full h-2 mt-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${systemStatus.cpu.usage}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between mb-4">
              <Memory className="h-8 w-8 text-green-400" />
              <span className="text-sm text-slate-400">{systemStatus.memory.total}GB</span>
            </div>
            <div>
              <p className="text-slate-400 text-sm mb-1">Memory Usage</p>
              <p className="text-2xl font-bold text-white">{systemStatus.memory.percentage}%</p>
              <div className="w-full bg-slate-700 rounded-full h-2 mt-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${systemStatus.memory.percentage}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between mb-4">
              <HardDrive className="h-8 w-8 text-purple-400" />
              <span className="text-sm text-slate-400">{systemStatus.storage.total}GB</span>
            </div>
            <div>
              <p className="text-slate-400 text-sm mb-1">Storage Usage</p>
              <p className="text-2xl font-bold text-white">{systemStatus.storage.percentage}%</p>
              <div className="w-full bg-slate-700 rounded-full h-2 mt-2">
                <div
                  className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${systemStatus.storage.percentage}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between mb-4">
              <Database className="h-8 w-8 text-yellow-400" />
              <span className="text-sm text-slate-400">{systemStatus.database.maxConnections} max</span>
            </div>
            <div>
              <p className="text-slate-400 text-sm mb-1">DB Connections</p>
              <p className="text-2xl font-bold text-white">{systemStatus.database.connections}</p>
              <div className="w-full bg-slate-700 rounded-full h-2 mt-2">
                <div
                  className="bg-yellow-500 h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${(systemStatus.database.connections / systemStatus.database.maxConnections) * 100}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 bg-slate-800/50 rounded-lg p-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
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
          {/* System Overview */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-4">System Overview</h2>
                <p className="text-slate-400 mb-6">Monitor system health and service status</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Services Status */}
                <div className="bg-slate-700/30 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Service Status</h3>
                  <div className="space-y-3">
                    {systemStatus.services.map((service) => (
                      <div
                        key={service.name}
                        className="flex items-center justify-between p-3 bg-slate-600/30 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(service.status)}
                          <div>
                            <h4 className="text-white font-medium">{service.name}</h4>
                            <p className="text-slate-400 text-sm">Uptime: {service.uptime}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`text-sm font-medium capitalize ${getStatusColor(service.status)}`}>
                            {service.status}
                          </span>
                          <button
                            onClick={() => restartService(service.name)}
                            className="p-1 hover:bg-slate-500 rounded transition-colors"
                            title="Restart Service"
                          >
                            <RefreshCw className="h-4 w-4 text-slate-400 hover:text-white" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Network Stats */}
                <div className="bg-slate-700/30 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Network Statistics</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Incoming Traffic</span>
                      <span className="text-white font-semibold">{systemStatus.network.incoming} MB/s</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Outgoing Traffic</span>
                      <span className="text-white font-semibold">{systemStatus.network.outgoing} MB/s</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Average Latency</span>
                      <span className="text-white font-semibold">{systemStatus.network.latency}ms</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">Database Query Time</span>
                      <span className="text-white font-semibold">{systemStatus.database.queryTime}ms</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* System Alerts */}
              <div className="bg-slate-700/30 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">System Alerts</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-yellow-400" />
                    <div>
                      <h4 className="text-white font-medium">File Storage Service Restarted</h4>
                      <p className="text-slate-400 text-sm">Service was automatically restarted due to memory issues</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    <div>
                      <h4 className="text-white font-medium">All Services Running Normally</h4>
                      <p className="text-slate-400 text-sm">System performance is within normal parameters</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Server Configuration */}
          {activeTab === "server" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-4">Server Configuration</h2>
                <p className="text-slate-400 mb-6">Configure server capacity and performance settings</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Max Concurrent Meetings</label>
                  <input
                    type="number"
                    min="10"
                    max="1000"
                    value={config.server.maxConcurrentMeetings}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        server: { ...prev.server, maxConcurrentMeetings: Number.parseInt(e.target.value) },
                      }))
                    }
                    className="input-field w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Max Participants per Meeting</label>
                  <input
                    type="number"
                    min="2"
                    max="500"
                    value={config.server.maxParticipantsPerMeeting}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        server: { ...prev.server, maxParticipantsPerMeeting: Number.parseInt(e.target.value) },
                      }))
                    }
                    className="input-field w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Session Timeout (minutes)</label>
                  <input
                    type="number"
                    min="5"
                    max="480"
                    value={config.server.sessionTimeout}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        server: { ...prev.server, sessionTimeout: Number.parseInt(e.target.value) },
                      }))
                    }
                    className="input-field w-full"
                  />
                </div>
              </div>

              <div className="space-y-4">
                {Object.entries(config.server)
                  .filter(([key, value]) => typeof value === "boolean")
                  .map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                      <div>
                        <h3 className="text-white font-medium capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</h3>
                        <p className="text-slate-400 text-sm mt-1">
                          {key === "enableLoadBalancing" && "Distribute load across multiple servers"}
                          {key === "autoScaling" && "Automatically scale resources based on demand"}
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={value as boolean}
                          onChange={(e) =>
                            setConfig((prev) => ({
                              ...prev,
                              server: { ...prev.server, [key]: e.target.checked },
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
          )}

          {/* Storage Configuration */}
          {activeTab === "storage" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-4">Storage Configuration</h2>
                <p className="text-slate-400 mb-6">Configure recording storage and backup settings</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Recording Retention (days)</label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={config.storage.recordingRetentionDays}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        storage: { ...prev.storage, recordingRetentionDays: Number.parseInt(e.target.value) },
                      }))
                    }
                    className="input-field w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Max Recording Size (MB)</label>
                  <input
                    type="number"
                    min="100"
                    max="50000"
                    value={config.storage.maxRecordingSize}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        storage: { ...prev.storage, maxRecordingSize: Number.parseInt(e.target.value) },
                      }))
                    }
                    className="input-field w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Compression Level (1-9)</label>
                  <input
                    type="number"
                    min="1"
                    max="9"
                    value={config.storage.compressionLevel}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        storage: { ...prev.storage, compressionLevel: Number.parseInt(e.target.value) },
                      }))
                    }
                    className="input-field w-full"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                  <div>
                    <h3 className="text-white font-medium">Enable Cloud Backup</h3>
                    <p className="text-slate-400 text-sm mt-1">Automatically backup recordings to cloud storage</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.storage.enableCloudBackup}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          storage: { ...prev.storage, enableCloudBackup: e.target.checked },
                        }))
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Network Configuration */}
          {activeTab === "network" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-4">Network Configuration</h2>
                <p className="text-slate-400 mb-6">Configure network and streaming settings</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Bandwidth Limit (Mbps)</label>
                  <input
                    type="number"
                    min="10"
                    max="10000"
                    value={config.network.bandwidthLimit}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        network: { ...prev.network, bandwidthLimit: Number.parseInt(e.target.value) },
                      }))
                    }
                    className="input-field w-full"
                  />
                </div>
              </div>

              <div className="space-y-4">
                {Object.entries(config.network)
                  .filter(([key, value]) => typeof value === "boolean")
                  .map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                      <div>
                        <h3 className="text-white font-medium capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</h3>
                        <p className="text-slate-400 text-sm mt-1">
                          {key === "qualityAdaptation" && "Automatically adjust video quality based on connection"}
                          {key === "enableCDN" && "Use content delivery network for better performance"}
                          {key === "prioritizeAudio" && "Prioritize audio quality over video when bandwidth is limited"}
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={value as boolean}
                          onChange={(e) =>
                            setConfig((prev) => ({
                              ...prev,
                              network: { ...prev.network, [key]: e.target.checked },
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
          )}

          {/* Feature Configuration */}
          {activeTab === "features" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-4">Feature Configuration</h2>
                <p className="text-slate-400 mb-6">Enable or disable platform features</p>
              </div>

              <div className="space-y-4">
                {Object.entries(config.features).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                    <div>
                      <h3 className="text-white font-medium capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</h3>
                      <p className="text-slate-400 text-sm mt-1">
                        {key === "enableScreenSharing" && "Allow users to share their screen during meetings"}
                        {key === "enableRecording" && "Allow meeting hosts to record sessions"}
                        {key === "enableChat" && "Enable text chat during meetings"}
                        {key === "enableVirtualBackgrounds" && "Allow users to use virtual backgrounds"}
                        {key === "enableBreakoutRooms" && "Enable breakout room functionality"}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            features: { ...prev.features, [key]: e.target.checked },
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
          )}

          {/* Maintenance Configuration */}
          {activeTab === "maintenance" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-4">Maintenance Configuration</h2>
                <p className="text-slate-400 mb-6">Configure system maintenance and backup settings</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Maintenance Window</label>
                  <input
                    type="time"
                    value={config.maintenance.maintenanceWindow}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        maintenance: { ...prev.maintenance, maintenanceWindow: e.target.value },
                      }))
                    }
                    className="input-field w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Backup Schedule</label>
                  <select
                    value={config.maintenance.backupSchedule}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        maintenance: { ...prev.maintenance, backupSchedule: e.target.value },
                      }))
                    }
                    className="input-field w-full"
                  >
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Log Retention (days)</label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={config.maintenance.logRetentionDays}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        maintenance: { ...prev.maintenance, logRetentionDays: Number.parseInt(e.target.value) },
                      }))
                    }
                    className="input-field w-full"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                  <div>
                    <h3 className="text-white font-medium">Auto Updates</h3>
                    <p className="text-slate-400 text-sm mt-1">
                      Automatically install system updates during maintenance window
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.maintenance.autoUpdates}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          maintenance: { ...prev.maintenance, autoUpdates: e.target.checked },
                        }))
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
              </div>

              {/* Maintenance Actions */}
              <div className="bg-slate-700/30 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Maintenance Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button className="btn-outline flex items-center justify-center gap-2">
                    <Database className="h-5 w-5" />
                    Run Database Cleanup
                  </button>
                  <button className="btn-outline flex items-center justify-center gap-2">
                    <HardDrive className="h-5 w-5" />
                    Clear Temporary Files
                  </button>
                  <button className="btn-outline flex items-center justify-center gap-2">
                    <RefreshCw className="h-5 w-5" />
                    Restart All Services
                  </button>
                  <button className="btn-outline flex items-center justify-center gap-2">
                    <Save className="h-5 w-5" />
                    Create System Backup
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
