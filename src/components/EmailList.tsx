import React, { useState, useEffect } from 'react';
import { Mail, Clock, CheckCircle, XCircle, AlertCircle, Trash2 } from 'lucide-react';
import { supabase, type ScheduledEmail } from '../lib/supabase';

interface EmailListProps {
  user: any;
  refreshTrigger: number;
}

export function EmailList({ user, refreshTrigger }: EmailListProps) {
  const [emails, setEmails] = useState<ScheduledEmail[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEmails = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('scheduled_emails')
        .select('*')
        .eq('user_id', user.id)
        .order('scheduled_at', { ascending: false });

      if (error) {
        console.error('Error fetching emails:', error);
        return;
      }

      setEmails(data || []);
    } catch (error) {
      console.error('Error fetching emails:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteEmail = async (emailId: string) => {
    if (!confirm('Are you sure you want to delete this scheduled email?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('scheduled_emails')
        .delete()
        .eq('id', emailId);

      if (error) {
        console.error('Error deleting email:', error);
        alert('Failed to delete email. Please try again.');
        return;
      }

      setEmails(prev => prev.filter(email => email.id !== emailId));
    } catch (error) {
      console.error('Error deleting email:', error);
      alert('Failed to delete email. Please try again.');
    }
  };

  useEffect(() => {
    fetchEmails();
  }, [user, refreshTrigger]);

  const getStatusIcon = (email: ScheduledEmail) => {
    if (email.sent_at) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
    if (email.error) {
      return <XCircle className="w-5 h-5 text-red-500" />;
    }
    if (new Date(email.scheduled_at) <= new Date()) {
      return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    }
    return <Clock className="w-5 h-5 text-blue-500" />;
  };

  const getStatusText = (email: ScheduledEmail) => {
    if (email.sent_at) {
      return 'Sent';
    }
    if (email.error) {
      return 'Failed';
    }
    if (new Date(email.scheduled_at) <= new Date()) {
      return 'Pending';
    }
    return 'Scheduled';
  };

  const getStatusColor = (email: ScheduledEmail) => {
    if (email.sent_at) return 'text-green-600 bg-green-50';
    if (email.error) return 'text-red-600 bg-red-50';
    if (new Date(email.scheduled_at) <= new Date()) return 'text-yellow-600 bg-yellow-50';
    return 'text-blue-600 bg-blue-50';
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-center py-12">
          <Clock className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-green-100 rounded-lg">
          <Mail className="w-6 h-6 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Scheduled Emails</h2>
        <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
          {emails.length} total
        </span>
      </div>

      {emails.length === 0 ? (
        <div className="text-center py-12">
          <Mail className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No scheduled emails yet.</p>
          <p className="text-sm text-gray-400">Schedule your first email to get started!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {emails.map((email) => (
            <div
              key={email.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    {getStatusIcon(email)}
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(email)}`}>
                      {getStatusText(email)}
                    </span>
                  </div>
                  
                  <h3 className="font-semibold text-gray-900 mb-1 truncate">
                    {email.subject}
                  </h3>
                  
                  <p className="text-sm text-gray-600 mb-2">
                    To: {email.to_email}
                  </p>
                  
                  <div className="text-xs text-gray-500 space-y-1">
                    <p>Scheduled: {formatDateTime(email.scheduled_at)}</p>
                    {email.sent_at && (
                      <p>Sent: {formatDateTime(email.sent_at)}</p>
                    )}
                    {email.error && (
                      <p className="text-red-600">Error: {email.error}</p>
                    )}
                  </div>
                </div>
                
                {!email.sent_at && (
                  <button
                    onClick={() => deleteEmail(email.id)}
                    className="ml-4 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete scheduled email"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}