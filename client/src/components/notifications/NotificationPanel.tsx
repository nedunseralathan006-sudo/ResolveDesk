import { formatDistanceToNow } from 'date-fns';
import api from '@/lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const NotificationPanel = ({ notifications, onClose }: { notifications: any[]; onClose: () => void }) => {
  const queryClient = useQueryClient();

  const markAsRead = useMutation({
    mutationFn: async (id?: string) => {
      if (id) {
        await api.put(`/notifications/${id}/read`);
      } else {
        await api.put('/notifications/read-all');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  return (
    <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
        <button
          onClick={() => markAsRead.mutate()}
          className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
        >
          Mark all as read
        </button>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-gray-500">
            No new notifications.
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {notifications.map((notif) => (
              <div
                key={notif._id}
                className={`px-4 py-3 flex gap-3 hover:bg-gray-50 transition-colors cursor-pointer ${!notif.read ? 'bg-blue-50/40' : ''}`}
                onClick={() => {
                  if (!notif.read) markAsRead.mutate(notif._id);
                }}
              >
                {!notif.read && (
                  <div className="mt-1.5 shrink-0">
                    <span className="block h-2 w-2 rounded-full bg-blue-600" />
                  </div>
                )}
                <div className={`flex-1 ${notif.read ? 'ml-5' : ''}`}>
                  <p className="text-sm text-gray-800 leading-snug">{notif.message}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {(() => {
                      try {
                        return formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true });
                      } catch {
                        return '';
                      }
                    })()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
