"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useNotifications } from "@/contexts/NotificationContext"
import apiClient from "@/lib/api"
import {
  User,
  Bell,
  Shield,
  Palette,
  Monitor,
  Mic,
  Video,
  Globe,
  Lock,
  Eye,
  EyeOff,
  Save,
  Camera,
  Upload,
} from "lucide-react"

interface UserSettings {
  profile: {
    name: string
    email: string
    avatar: string
    title: string
    department: string
    phone: string
    timezone: string
  }
  notifications: {
    meetingReminders: boolean
    emailNotifications: boolean
    desktopNotifications: boolean
    soundNotifications: boolean
    meetingInvites: boolean
  }
  privacy: {
    profileVisibility: "public" | "team" | "private"
    showOnlineStatus: boolean
    allowDirectMessages: boolean
    shareCalendar: boolean
  }
  meeting: {
    defaultCamera: boolean
    defaultMicrophone: boolean
    autoJoinAudio: boolean
    enableWaitingRoom: boolean
    recordMeetings: boolean
    backgroundBlur: boolean
  }
  appearance: {
    theme: "dark" | "light" | "auto"
    language: string
    fontSize: "small" | "medium" | "large"
    compactMode: boolean
  }
}

export default function SettingsPage() {
  const { user } = useAuth()
  const { success, error, info } = useNotifications()
  const [activeTab, setActiveTab] = useState("profile")
  const [showPassword, setShowPassword] = useState(false)
  const [settings, setSettings] = useState<UserSettings>({
    profile: {
      name: user?.name || "",
      email: user?.email || "",
      avatar: "",
      title: "",
      department: "",
      phone: "",
      timezone: "America/New_York",
    },
    notifications: {
      meetingReminders: true,
      emailNotifications: true,
      desktopNotifications: false,
      soundNotifications: true,
      meetingInvites: true,
    },
    privacy: {
      profileVisibility: "team",
      showOnlineStatus: true,
      allowDirectMessages: true,
      shareCalendar: true,
    },
    meeting: {
      defaultCamera: true,
      defaultMicrophone: true,
      autoJoinAudio: true,
      enableWaitingRoom: false,
      recordMeetings: false,
      backgroundBlur: true,
    },
    appearance: {
      theme: "dark",
      language: "en",
      fontSize: "medium",
      compactMode: false,
    },
  })

  const handleSave = async () => {
    try {
      await apiClient.updateUserSettings({
        notifications: settings.notifications,
        privacy: settings.privacy,
        meeting_preferences: settings.meeting,
        appearance: settings.appearance
      })
      success("Settings Saved", "Your settings have been saved successfully!")
    } catch (error) {
      console.error('Failed to save settings:', error)
      // Fallback to localStorage for now
      localStorage.setItem("userSettings", JSON.stringify(settings))
      success("Settings Saved", "Your settings have been saved locally!")
    }
  }

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setSettings((prev) => ({
          ...prev,
          profile: {
            ...prev.profile,
            avatar: event.target?.result as string,
          },
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "privacy", label: "Privacy", icon: Shield },
    { id: "meeting", label: "Meeting", icon: Video },
    { id: "appearance", label: "Appearance", icon: Palette },
  ]

  return (
    <div className="min-h-screen gradient-bg">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
            <p className="text-slate-400">Manage your account preferences and settings</p>
          </div>
          <button onClick={handleSave} className="btn-primary flex items-center gap-2">
            <Save className="h-5 w-5" />
            Save Changes
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="card">
              <nav className="space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 text-left rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? "bg-indigo-600 text-white"
                        : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
                    }`}
                  >
                    <tab.icon className="h-5 w-5" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="card">
              {/* Profile Settings */}
              {activeTab === "profile" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-white mb-4">Profile Information</h2>
                    <p className="text-slate-400 mb-6">Update your personal information and profile details</p>
                    
                    {/* Last Online Status */}
                    {user?.last_login && (
                      <div className="mb-6 p-4 bg-slate-700/30 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                          <div>
                            <p className="text-white font-medium">Status: Active</p>
                            <p className="text-slate-400 text-sm">
                              Last online: {new Date(user.last_login).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Avatar Upload */}
                  <div className="flex items-center space-x-6">
                    <div className="relative">
                      {settings.profile.avatar ? (
                        <img
                          src={settings.profile.avatar || "/placeholder.svg"}
                          alt="Profile"
                          className="w-20 h-20 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-20 h-20 bg-gradient-to-r from-indigo-500 to-pink-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-2xl font-semibold">
                            {settings.profile.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <label
                        htmlFor="avatar-upload"
                        className="absolute -bottom-2 -right-2 p-2 bg-indigo-600 hover:bg-indigo-700 rounded-full cursor-pointer transition-colors"
                      >
                        <Camera className="h-4 w-4 text-white" />
                      </label>
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                      />
                    </div>
                    <div>
                      <h3 className="text-white font-medium mb-1">Profile Picture</h3>
                      <p className="text-slate-400 text-sm mb-3">Upload a new profile picture</p>
                      <label htmlFor="avatar-upload" className="btn-outline text-sm cursor-pointer">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Photo
                      </label>
                    </div>
                  </div>

                  {/* Profile Form */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
                      <input
                        type="text"
                        value={settings.profile.name}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            profile: { ...prev.profile, name: e.target.value },
                          }))
                        }
                        className="input-field w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
                      <input
                        type="email"
                        value={settings.profile.email}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            profile: { ...prev.profile, email: e.target.value },
                          }))
                        }
                        className="input-field w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Job Title</label>
                      <input
                        type="text"
                        value={settings.profile.title}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            profile: { ...prev.profile, title: e.target.value },
                          }))
                        }
                        className="input-field w-full"
                        placeholder="e.g. Senior Developer"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Department</label>
                      <select
                        value={settings.profile.department}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            profile: { ...prev.profile, department: e.target.value },
                          }))
                        }
                        className="input-field w-full"
                      >
                        <option value="">Select Department</option>
                        <option value="Engineering">Engineering</option>
                        <option value="Product">Product</option>
                        <option value="Design">Design</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Sales">Sales</option>
                        <option value="Human Resources">Human Resources</option>
                        <option value="Finance">Finance</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Phone Number</label>
                      <input
                        type="tel"
                        value={settings.profile.phone}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            profile: { ...prev.profile, phone: e.target.value },
                          }))
                        }
                        className="input-field w-full"
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Timezone</label>
                      <select
                        value={settings.profile.timezone}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            profile: { ...prev.profile, timezone: e.target.value },
                          }))
                        }
                        className="input-field w-full"
                      >
                        <option value="America/New_York">Eastern Time (EST/EDT)</option>
                        <option value="America/Chicago">Central Time (CST/CDT)</option>
                        <option value="America/Denver">Mountain Time (MST/MDT)</option>
                        <option value="America/Los_Angeles">Pacific Time (PST/PDT)</option>
                        <option value="Europe/London">Greenwich Mean Time (GMT)</option>
                        <option value="Europe/Paris">Central European Time (CET)</option>
                        <option value="Asia/Tokyo">Japan Standard Time (JST)</option>
                      </select>
                    </div>
                  </div>

                  {/* Password Change */}
                  <div className="border-t border-slate-700 pt-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Change Password</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Current Password</label>
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            className="input-field w-full pr-10"
                            placeholder="Enter current password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-3 text-slate-400 hover:text-white"
                          >
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">New Password</label>
                        <input
                          type={showPassword ? "text" : "password"}
                          className="input-field w-full"
                          placeholder="Enter new password"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Notification Settings */}
              {activeTab === "notifications" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-white mb-4">Notification Preferences</h2>
                    <p className="text-slate-400 mb-6">
                      Choose how you want to be notified about meetings and activities
                    </p>
                  </div>

                  <div className="space-y-4">
                    {Object.entries(settings.notifications).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                        <div>
                          <h3 className="text-white font-medium capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</h3>
                          <p className="text-slate-400 text-sm mt-1">
                            {key === "meetingReminders" && "Get reminded about upcoming meetings"}
                            {key === "emailNotifications" && "Receive notifications via email"}
                            {key === "desktopNotifications" && "Show desktop notifications"}
                            {key === "soundNotifications" && "Play sound for notifications"}
                            {key === "meetingInvites" && "Get notified when invited to meetings"}
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={value}
                            onChange={(e) =>
                              setSettings((prev) => ({
                                ...prev,
                                notifications: {
                                  ...prev.notifications,
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
              )}

              {/* Privacy Settings */}
              {activeTab === "privacy" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-white mb-4">Privacy & Security</h2>
                    <p className="text-slate-400 mb-6">Control who can see your information and contact you</p>
                  </div>

                  <div className="space-y-6">
                    <div className="p-4 bg-slate-700/30 rounded-lg">
                      <h3 className="text-white font-medium mb-2">Profile Visibility</h3>
                      <p className="text-slate-400 text-sm mb-4">Choose who can see your profile information</p>
                      <select
                        value={settings.privacy.profileVisibility}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            privacy: {
                              ...prev.privacy,
                              profileVisibility: e.target.value as any,
                            },
                          }))
                        }
                        className="input-field w-full"
                      >
                        <option value="public">Public - Everyone can see</option>
                        <option value="team">Team Only - Only team members can see</option>
                        <option value="private">Private - Only you can see</option>
                      </select>
                    </div>

                    {Object.entries(settings.privacy)
                      .filter(([key]) => key !== "profileVisibility")
                      .map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                          <div>
                            <h3 className="text-white font-medium capitalize">
                              {key.replace(/([A-Z])/g, " $1").trim()}
                            </h3>
                            <p className="text-slate-400 text-sm mt-1">
                              {key === "showOnlineStatus" && "Let others see when you're online"}
                              {key === "allowDirectMessages" && "Allow others to send you direct messages"}
                              {key === "shareCalendar" && "Share your calendar availability with team"}
                            </p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={value as boolean}
                              onChange={(e) =>
                                setSettings((prev) => ({
                                  ...prev,
                                  privacy: {
                                    ...prev.privacy,
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
              )}

              {/* Meeting Settings */}
              {activeTab === "meeting" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-white mb-4">Meeting Preferences</h2>
                    <p className="text-slate-400 mb-6">Configure your default meeting settings and behavior</p>
                  </div>

                  <div className="space-y-4">
                    {Object.entries(settings.meeting).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-slate-600 rounded-lg">
                            {key.includes("Camera") && <Video className="h-5 w-5 text-slate-300" />}
                            {key.includes("Microphone") && <Mic className="h-5 w-5 text-slate-300" />}
                            {key.includes("Waiting") && <Lock className="h-5 w-5 text-slate-300" />}
                            {key.includes("record") && <Monitor className="h-5 w-5 text-slate-300" />}
                            {key.includes("blur") && <Eye className="h-5 w-5 text-slate-300" />}
                            {key.includes("Audio") && <Globe className="h-5 w-5 text-slate-300" />}
                          </div>
                          <div>
                            <h3 className="text-white font-medium capitalize">
                              {key.replace(/([A-Z])/g, " $1").trim()}
                            </h3>
                            <p className="text-slate-400 text-sm mt-1">
                              {key === "defaultCamera" && "Turn on camera when joining meetings"}
                              {key === "defaultMicrophone" && "Turn on microphone when joining meetings"}
                              {key === "autoJoinAudio" && "Automatically connect to audio"}
                              {key === "enableWaitingRoom" && "Enable waiting room for meetings you host"}
                              {key === "recordMeetings" && "Automatically record meetings you host"}
                              {key === "backgroundBlur" && "Enable background blur by default"}
                            </p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={value}
                            onChange={(e) =>
                              setSettings((prev) => ({
                                ...prev,
                                meeting: {
                                  ...prev.meeting,
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
              )}

              {/* Appearance Settings */}
              {activeTab === "appearance" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-white mb-4">Appearance & Display</h2>
                    <p className="text-slate-400 mb-6">Customize how the application looks and feels</p>
                  </div>

                  <div className="space-y-6">
                    <div className="p-4 bg-slate-700/30 rounded-lg">
                      <h3 className="text-white font-medium mb-2">Theme</h3>
                      <p className="text-slate-400 text-sm mb-4">Choose your preferred color scheme</p>
                      <div className="grid grid-cols-3 gap-3">
                        {(["dark", "light", "auto"] as const).map((theme) => (
                          <button
                            key={theme}
                            onClick={() =>
                              setSettings((prev) => ({
                                ...prev,
                                appearance: { ...prev.appearance, theme },
                              }))
                            }
                            className={`p-3 rounded-lg border-2 transition-colors capitalize ${
                              settings.appearance.theme === theme
                                ? "border-indigo-500 bg-indigo-500/20"
                                : "border-slate-600 hover:border-slate-500"
                            }`}
                          >
                            <div className="text-white font-medium">{theme}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 bg-slate-700/30 rounded-lg">
                      <h3 className="text-white font-medium mb-2">Language</h3>
                      <p className="text-slate-400 text-sm mb-4">Select your preferred language</p>
                      <select
                        value={settings.appearance.language}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            appearance: { ...prev.appearance, language: e.target.value },
                          }))
                        }
                        className="input-field w-full"
                      >
                        <option value="en">English</option>
                        <option value="es">Español</option>
                        <option value="fr">Français</option>
                        <option value="de">Deutsch</option>
                        <option value="it">Italiano</option>
                        <option value="pt">Português</option>
                        <option value="zh">中文</option>
                        <option value="ja">日本語</option>
                      </select>
                    </div>

                    <div className="p-4 bg-slate-700/30 rounded-lg">
                      <h3 className="text-white font-medium mb-2">Font Size</h3>
                      <p className="text-slate-400 text-sm mb-4">Adjust the text size for better readability</p>
                      <div className="grid grid-cols-3 gap-3">
                        {(["small", "medium", "large"] as const).map((size) => (
                          <button
                            key={size}
                            onClick={() =>
                              setSettings((prev) => ({
                                ...prev,
                                appearance: { ...prev.appearance, fontSize: size },
                              }))
                            }
                            className={`p-3 rounded-lg border-2 transition-colors capitalize ${
                              settings.appearance.fontSize === size
                                ? "border-indigo-500 bg-indigo-500/20"
                                : "border-slate-600 hover:border-slate-500"
                            }`}
                          >
                            <div className="text-white font-medium">{size}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                      <div>
                        <h3 className="text-white font-medium">Compact Mode</h3>
                        <p className="text-slate-400 text-sm mt-1">Use smaller spacing for a more compact interface</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.appearance.compactMode}
                          onChange={(e) =>
                            setSettings((prev) => ({
                              ...prev,
                              appearance: {
                                ...prev.appearance,
                                compactMode: e.target.checked,
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
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
