# Gmail Scheduler

A production-ready Gmail email scheduler built with Supabase, React, and TypeScript. Schedule emails to be sent at the perfect time, even when you're offline.

## Features

- 🔐 **Secure Gmail OAuth2 Integration** - Full access to Gmail API with token refresh
- ⏰ **Precise Email Scheduling** - Schedule emails down to the minute
- 🚀 **Automated Sending** - Emails sent via Supabase Edge Functions with cron
- 💾 **Persistent Storage** - All scheduled emails stored in Supabase Postgres
- 🔄 **Error Handling** - Comprehensive error tracking and retry logic
- 📱 **Responsive Design** - Beautiful UI that works on all devices
- 🛡️ **Row Level Security** - Users can only access their own data

## Setup Instructions

### 1. Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run the database migration:
   ```bash
   supabase db push
   ```
3. Deploy the edge functions:
   ```bash
   supabase functions deploy send-due-emails
   supabase functions deploy auth-callback
   ```
4. Set up the cron job in your Supabase dashboard:
   - Go to Database > Extensions
   - Enable the `pg_cron` extension
   - Go to SQL Editor and run:
   ```sql
   SELECT cron.schedule(
     'send-due-emails',
     '* * * * *',
     'SELECT net.http_post(url:=''https://your-project-ref.supabase.co/functions/v1/send-due-emails'', headers:=''{"Content-Type": "application/json", "Authorization": "Bearer your-service-role-key"}'') as request_id;'
   );
   ```

### 2. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Enable the Gmail API
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs: `https://your-project-ref.supabase.co/functions/v1/auth-callback`
5. Copy the Client ID and Client Secret

### 3. Environment Variables

Create a `.env` file in your project root:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

Also set these in your Supabase Edge Functions environment:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

### 4. Run the Application

```bash
npm install
npm run dev
```

## Database Schema

The `scheduled_emails` table includes:

- **id**: Unique identifier
- **user_id**: Reference to authenticated user
- **to_email**: Recipient email address
- **subject**: Email subject line
- **body**: Email content (plain text)
- **scheduled_at**: When to send the email
- **sent_at**: When the email was actually sent (nullable)
- **gmail_access_token**: OAuth2 access token
- **gmail_refresh_token**: OAuth2 refresh token
- **error**: Error message if sending failed (nullable)

## Edge Functions

### send-due-emails
- Runs every minute via cron
- Fetches emails where `sent_at` is null and `scheduled_at` <= now
- Refreshes expired tokens automatically
- Sends emails via Gmail API
- Updates database with results

### auth-callback
- Handles OAuth2 callback from Google
- Exchanges authorization code for tokens
- Stores tokens in user metadata

## Security Features

- Row Level Security (RLS) enabled
- Users can only access their own data
- Secure token storage and refresh
- CORS headers properly configured
- Input validation and sanitization

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details