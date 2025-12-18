"use client"

import React from 'react'
import { useNotifications, Notification } from '@/contexts/NotificationContext'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'

const NotificationItem: React.FC<{ notification: Notification }> = ({ notification }) => {
  const { removeNotification } = useNotifications()

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />
      default:
        return <Info className="h-5 w-5 text-gray-500" />
    }
  }

  const getBorderColor = () => {
    switch (notification.type) {
      case 'success':
        return 'border-l-green-500'
      case 'error':
        return 'border-l-red-500'
      case 'warning':
        return 'border-l-yellow-500'
      case 'info':
        return 'border-l-blue-500'
      default:
        return 'border-l-gray-500'
    }
  }

  return (
    <div className={`
      bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 
      border-l-4 ${getBorderColor()} rounded-lg shadow-lg p-4 mb-3
      transform transition-all duration-300 ease-in-out
      hover:shadow-xl animate-in slide-in-from-right-full
    `}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
            {notification.title}
          </h4>
          {notification.message && (
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              {notification.message}
            </p>
          )}
          {notification.action && (
            <button
              onClick={notification.action.onClick}
              className="mt-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
            >
              {notification.action.label}
            </button>
          )}
        </div>

        <button
          onClick={() => removeNotification(notification.id)}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export const NotificationContainer: React.FC = () => {
  const { notifications } = useNotifications()

  if (notifications.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 w-96 max-w-sm">
      <div className="space-y-2">
        {notifications.map((notification) => (
          <NotificationItem key={notification.id} notification={notification} />
        ))}
      </div>
    </div>
  )
}
