import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { Card } from "../../components/common/Card";
import { Badge, getStatusBadgeVariant } from "../../components/common/Badge";
import { HelpCircle, Send, CheckCircle, AlertCircle } from "lucide-react";

export const ClarificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState<{ [id: number]: string }>({});
  const [submitting, setSubmitting] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadNotifications = async () => {
    try {
      const res = await api.get("/notifications");
      setNotifications(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Notifications & Clarification Requests</h1>
        <p className="text-xs text-slate-500 mt-1">
          Review queries and status notifications sent by admission officers and evaluators.
        </p>
      </div>

      {message && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {loading ? (
        <div className="text-center py-10 text-xs text-slate-400">Loading notifications...</div>
      ) : notifications.length === 0 ? (
        <Card className="text-center py-10 text-xs text-slate-500">
          No notifications or pending clarification requests.
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <Card key={n.notification_id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{n.title}</h4>
                    <p className="text-xs text-slate-600 mt-1">{n.message}</p>
                    <div className="text-[10px] text-slate-400 mt-2">
                      {new Date(n.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
                <Badge variant={n.is_read ? "neutral" : "primary"} size="sm">
                  {n.is_read ? "Read" : "New"}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
