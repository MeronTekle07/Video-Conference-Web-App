"use client"

import React, { createContext, useContext, useState, useCallback } from 'react'

export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface NotificationContextType {
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, 'id'>) => void
  removeNotification: (id: string) => void
  clearAll: () => void
  success: (title: string, message?: string, duration?: number) => void
  error: (title: string, message?: string, duration?: number) => void
  warning: (title: string, message?: string, duration?: number, action?: { label: string; onClick: () => void }) => void
  info: (title: string, message?: string, duration?: number) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9)
    const newNotification: Notification = {
      ...notification,
      id,
      duration: notification.duration ?? 5000
    }

    setNotifications(prev => [...prev, newNotification])

    // Auto remove after duration
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, newNotification.duration)
    }
  }, [])

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id))
  }, [])

  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  const success = useCallback((title: string, message?: string, duration?: number) => {
    addNotification({ type: 'success', title, message, duration })
  }, [addNotification])

  const error = useCallback((title: string, message?: string, duration?: number) => {
    addNotification({ type: 'error', title, message, duration })
  }, [addNotification])

  const warning = useCallback((title: string, message?: string, duration?: number, action?: { label: string; onClick: () => void }) => {
    addNotification({ type: 'warning', title, message, duration, action })
  }, [addNotification])

  const info = useCallback((title: string, message?: string, duration?: number) => {
    addNotification({ type: 'info', title, message, duration })
  }, [addNotification])

  const value: NotificationContextType = {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    success,
    error,
    warning,
    info
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}
