import React, { useState } from 'react';
import { Send, Calendar, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface EmailSchedulerProps {
  user: any;
  onEmailScheduled: () => void;
}

export function EmailScheduler({ user, onEmailScheduled }: EmailSchedulerProps) {
  const [formData, setFormData] = useState({
    to_email: '',
    subject: '',
    body: '',
    scheduled_at: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.user_metadata?.gmail_access_token) {
      alert('Please connect your Gmail account first.');
      return;
    }

    setIsSubmitting(true);

    try {
      const scheduledDate = new Date(formData.scheduled_at);
      if (scheduledDate <= new Date()) {
        alert('Please select a future date and time.');
        setIsSubmitting(false);
        return;
      }

      const { error } = await supabase
        .from('scheduled_emails')
        .insert({
          user_id: user.id,
          to_email: formData.to_email,
          subject: formData.subject,
          body: formData.body,
          scheduled_at: scheduledDate.toISOString(),
          gmail_access_token: user.user_metadata.gmail_access_token,
          gmail_refresh_token: user.user_metadata.gmail_refresh_token
        });

      if (error) {
        console.error('Error scheduling email:', error);
        alert('Failed to schedule email. Please try again.');
        return;
      }

      // Reset form
      setFormData({
        to_email: '',
        subject: '',
        body: '',
        scheduled_at: ''
      });

      alert('Email scheduled successfully!');
      onEmailScheduled();

    } catch (error) {
      console.error('Error scheduling email:', error);
      alert('Failed to schedule email. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Send className="w-6 h-6 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Schedule Email</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="to_email" className="block text-sm font-medium text-gray-700 mb-2">
            To Email
          </label>
          <input
            type="email"
            id="to_email"
            name="to_email"
            value={formData.to_email}
            onChange={handleChange}
            required
            placeholder="recipient@example.com"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>

        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
            Subject
          </label>
          <input
            type="text"
            id="subject"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            required
            placeholder="Email subject"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>

        <div>
          <label htmlFor="body" className="block text-sm font-medium text-gray-700 mb-2">
            Message
          </label>
          <textarea
            id="body"
            name="body"
            value={formData.body}
            onChange={handleChange}
            required
            rows={6}
            placeholder="Your email message..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-vertical"
          />
        </div>

        <div>
          <label htmlFor="scheduled_at" className="block text-sm font-medium text-gray-700 mb-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Schedule Date & Time
            </div>
          </label>
          <input
            type="datetime-local"
            id="scheduled_at"
            name="scheduled_at"
            value={formData.scheduled_at}
            onChange={handleChange}
            required
            min={new Date().toISOString().slice(0, 16)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-lg transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Clock className="w-5 h-5 animate-spin" />
              Scheduling...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              Schedule Email
            </>
          )}
        </button>
      </form>
    </div>
  );
}