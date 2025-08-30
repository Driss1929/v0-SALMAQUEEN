"use client"
import { useNotifications } from "../contexts/NotificationContext"
import { useAuth } from "../contexts/AuthContext"

function Notifications() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications } = useNotifications()
  const { currentUser } = useAuth()

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - timestamp
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const getAuthorColor = (author: string) => {
    return author === "idriss" ? "text-blue-600" : "text-pink-600"
  }

  const getAuthorBg = (author: string) => {
    return author === "idriss" ? "bg-blue-100" : "bg-pink-100"
  }

  if (!currentUser) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-2">🔔 Notifications</h1>
          <p className="text-lg text-gray-600">Stay updated with all your social interactions</p>
        </div>

        {/* Action Bar */}
        {notifications.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
            <div className="flex flex-wrap gap-3 justify-between items-center">
              <div className="flex items-center gap-4">
                <span className="text-gray-700 font-medium">
                  {unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
                </span>
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">{unreadCount}</span>
                )}
              </div>
              <div className="flex gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors text-sm"
                  >
                    Mark All Read
                  </button>
                )}
                <button
                  onClick={clearNotifications}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors text-sm"
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Notifications List */}
        <div className="space-y-4">
          {notifications.length === 0 ? (
            <div className="bg-white rounded-3xl shadow-xl p-12 text-center">
              <div className="text-6xl mb-4">🔕</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">No notifications yet</h3>
              <p className="text-gray-600 mb-6">
                When someone likes, comments, or shares your content, you'll see it here!
              </p>
              <button
                onClick={() => (window.location.href = "/feed")}
                className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
              >
                Go to Feed
              </button>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-white rounded-2xl shadow-lg overflow-hidden transition-all hover:shadow-xl ${
                  !notification.read ? "border-l-4 border-blue-500" : ""
                }`}
                onClick={() => !notification.read && markAsRead(notification.id)}
              >
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    {/* User Avatar */}
                    <div
                      className={`w-12 h-12 rounded-full ${getAuthorBg(notification.fromUser)} flex items-center justify-center flex-shrink-0`}
                    >
                      <span className={`text-xl font-bold ${getAuthorColor(notification.fromUser)}`}>
                        {notification.fromUserName.charAt(0)}
                      </span>
                    </div>

                    {/* Notification Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-2xl">{notification.icon}</span>
                            <h3 className={`font-bold ${getAuthorColor(notification.fromUser)}`}>
                              {notification.title}
                            </h3>
                            {!notification.read && <span className="w-2 h-2 bg-blue-500 rounded-full"></span>}
                          </div>
                          <p className="text-gray-700 mb-2">{notification.message}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>{formatTimestamp(notification.timestamp)}</span>
                            <span className="capitalize">{notification.type}</span>
                          </div>
                        </div>

                        {/* Action Button */}
                        <div className="flex-shrink-0">
                          {notification.targetType && notification.targetId && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                // Navigate to the relevant content
                                if (notification.targetType === "post" || notification.targetType === "reel") {
                                  window.location.href = "/feed"
                                } else if (notification.targetType === "story") {
                                  window.location.href = "/stories"
                                } else if (notification.targetType === "journal") {
                                  window.location.href = "/journal"
                                }
                              }}
                              className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                            >
                              View
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Load More Button (if needed in future) */}
        {notifications.length >= 50 && (
          <div className="text-center mt-8">
            <p className="text-gray-500 text-sm">Showing latest 50 notifications</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Notifications
