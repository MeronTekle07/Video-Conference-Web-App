"use client"

import type React from "react"
import { useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useNotifications } from "@/contexts/NotificationContext"
import { Palette, Monitor, Save, Camera, Upload } from "lucide-react"

export default function AdminSettingsPage() {
  const { user } = useAuth()
  const { success } = useNotifications()
  const [settings, setSettings] = useState({
    appearance: {
      theme: "dark" as "dark" | "light" | "auto",
      language: "en",
      fontSize: "medium" as "small" | "medium" | "large",
      compactMode: false,
    },
  })

  const handleSave = async () => {
    localStorage.setItem("adminSettings", JSON.stringify(settings))
    success("Settings Saved", "Your appearance settings have been saved!")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Admin Settings</h1>
            <p className="text-slate-400">Manage your administrator preferences</p>
          </div>
          <button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg flex items-center gap-2">
            <Save className="h-5 w-5" />
            Save Changes
          </button>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Palette className="h-6 w-6" />
                Appearance & Display
              </h2>
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
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                <p className="text-slate-400 text-sm mb-4">Adjust text size for better readability</p>
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
                  <p className="text-slate-400 text-sm mt-1">Use smaller spacing for a compact interface</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.appearance.compactMode}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        appearance: { ...prev.appearance, compactMode: e.target.checked },
                      }))
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
