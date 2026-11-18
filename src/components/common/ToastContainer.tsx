import React from 'react'
import { useNotification } from '../../context/NotificationContext'
import { XIcon } from '../layout/Layout'

export default function ToastContainer() {
  const { toasts, removeToast } = useNotification()

  return (
    <div className="toast-container" role="region" aria-label="Notifications">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`toast ${{
            success: 'toast-success',
            error: 'toast-error',
            info: 'toast-info',
            warning: 'toast-warning',
          }[toast.type]}`}
          role="alert"
          aria-live="polite"
        >
          <span className="flex-1">{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            className="p-1 rounded hover:bg-black/10 text-white/80 hover:text-white"
            aria-label="Dismiss"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  )
}