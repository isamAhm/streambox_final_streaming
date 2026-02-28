import React from 'react';
import { XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/router';

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    imageUrl?: string;
    link?: string;
    read: boolean;
    createdAt: string;
}

interface NotificationCenterProps {
    visible?: boolean;
    onClose: () => void;
    notifications: Notification[];
    onMarkAsRead: (id: string) => void;
    onMarkAllAsRead: () => void;
    onDelete: (id: string) => void;
}

const formatTimeAgo = (date: string) => {
    const now = new Date();
    const past = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return `${Math.floor(diffInSeconds / 604800)}w ago`;
};

const NotificationCenter: React.FC<NotificationCenterProps> = ({
    visible,
    onClose,
    notifications,
    onMarkAsRead,
    onMarkAllAsRead,
    onDelete,
}) => {
    const router = useRouter();

    if (!visible) return null;

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.read) {
            onMarkAsRead(notification.id);
        }
        if (notification.link) {
            router.push(notification.link);
            onClose();
        }
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'new_content':
                return '🎬';
            case 'recommendation':
                return '⭐';
            case 'achievement':
                return '🏆';
            case 'system':
                return '🔔';
            default:
                return '📢';
        }
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div className="absolute top-full right-0 mt-2 w-80 md:w-96 bg-black bg-opacity-95 border border-gray-700 rounded-lg shadow-2xl max-h-[600px] flex flex-col z-50">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
                <div>
                    <h3 className="text-white font-semibold text-lg">Notifications</h3>
                    {unreadCount > 0 && (
                        <p className="text-gray-400 text-xs">{unreadCount} unread</p>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                        <button
                            onClick={onMarkAllAsRead}
                            className="text-blue-400 hover:text-blue-300 text-xs font-medium"
                            title="Mark all as read"
                        >
                            <CheckIcon className="w-5 h-5" />
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition"
                    >
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto flex-1">
                {notifications.length === 0 ? (
                    <div className="p-8 text-center">
                        <p className="text-gray-400 text-sm">No notifications yet</p>
                        <p className="text-gray-500 text-xs mt-2">
                            We&apos;ll notify you about new content and updates
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-800">
                        {notifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={`p-4 hover:bg-zinc-900 transition cursor-pointer relative group ${!notification.read ? 'bg-zinc-900/50' : ''
                                    }`}
                                onClick={() => handleNotificationClick(notification)}
                            >
                                {/* Unread indicator */}
                                {!notification.read && (
                                    <div className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full" />
                                )}

                                <div className="flex gap-3 pl-4">
                                    {/* Icon or Image */}
                                    <div className="flex-shrink-0">
                                        {notification.imageUrl ? (
                                            <img
                                                src={notification.imageUrl}
                                                alt=""
                                                className="w-12 h-12 rounded object-cover"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 rounded bg-zinc-800 flex items-center justify-center text-2xl">
                                                {getNotificationIcon(notification.type)}
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-white font-medium text-sm mb-1">
                                            {notification.title}
                                        </h4>
                                        <p className="text-gray-400 text-xs line-clamp-2">
                                            {notification.message}
                                        </p>
                                        <p className="text-gray-500 text-xs mt-1">
                                            {formatTimeAgo(notification.createdAt)}
                                        </p>
                                    </div>

                                    {/* Delete button */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDelete(notification.id);
                                        }}
                                        className="opacity-0 group-hover:opacity-100 transition text-gray-500 hover:text-red-400"
                                        title="Delete notification"
                                    >
                                        <XMarkIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationCenter;
