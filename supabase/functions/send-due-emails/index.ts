/*
  # Gmail Email Sender Edge Function
  
  This function runs every minute via cron and:
  1. Fetches all due emails that haven't been sent
  2. Refreshes expired access tokens
  3. Sends emails via Gmail API
  4. Updates database with results
*/

import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScheduledEmail {
  id: string;
  user_id: string;
  to_email: string;
  subject: string;
  body: string;
  scheduled_at: string;
  gmail_access_token: string;
  gmail_refresh_token: string;
}

interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting email sending process...');

    // Fetch all due emails that haven't been sent
    const { data: dueEmails, error: fetchError } = await supabaseClient
      .from('scheduled_emails')
      .select('*')
      .is('sent_at', null)
      .lte('scheduled_at', new Date().toISOString())
      .limit(50); // Process max 50 emails per run

    if (fetchError) {
      console.error('Error fetching due emails:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${dueEmails?.length || 0} due emails to send`);

    if (!dueEmails || dueEmails.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No due emails to send' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results = [];

    // Process each email
    for (const email of dueEmails as ScheduledEmail[]) {
      try {
        console.log(`Processing email ${email.id} to ${email.to_email}`);

        // Try to send the email
        let accessToken = email.gmail_access_token;
        
        // First, try with current access token
        let sendResult = await sendGmailEmail(email, accessToken);
        
        // If token is expired, refresh it
        if (sendResult.needsRefresh) {
          console.log(`Refreshing access token for email ${email.id}`);
          
          const refreshResult = await refreshAccessToken(email.gmail_refresh_token);
          
          if (refreshResult.success) {
            accessToken = refreshResult.access_token!;
            
            // Update the database with new access token
            await supabaseClient
              .from('scheduled_emails')
              .update({ gmail_access_token: accessToken })
              .eq('id', email.id);
            
            // Try sending again with new token
            sendResult = await sendGmailEmail(email, accessToken);
          } else {
            throw new Error(`Failed to refresh token: ${refreshResult.error}`);
          }
        }

        if (sendResult.success) {
          // Mark as sent
          await supabaseClient
            .from('scheduled_emails')
            .update({ 
              sent_at: new Date().toISOString(),
              error: null 
            })
            .eq('id', email.id);

          console.log(`Successfully sent email ${email.id}`);
          results.push({ id: email.id, status: 'sent' });
        } else {
          throw new Error(sendResult.error);
        }

      } catch (error) {
        console.error(`Failed to send email ${email.id}:`, error);
        
        // Update error in database
        await supabaseClient
          .from('scheduled_emails')
          .update({ 
            error: error.message || 'Unknown error occurred' 
          })
          .eq('id', email.id);

        results.push({ 
          id: email.id, 
          status: 'failed', 
          error: error.message 
        });
      }
    }

    return new Response(
      JSON.stringify({ 
        message: `Processed ${results.length} emails`,
        results 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in send-due-emails function:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function sendGmailEmail(
  email: ScheduledEmail, 
  accessToken: string
): Promise<{ success: boolean; error?: string; needsRefresh?: boolean }> {
  try {
    // Create RFC822 message
    const message = [
      `To: ${email.to_email}`,
      `Subject: ${email.subject}`,
      'Content-Type: text/plain; charset=utf-8',
      '',
      email.body
    ].join('\r\n');

    // Encode to base64url
    const encodedMessage = btoa(message)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // Send via Gmail API
    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        raw: encodedMessage
      })
    });

    if (response.status === 401) {
      return { success: false, needsRefresh: true };
    }

    if (!response.ok) {
      const errorText = await response.text();
      return { 
        success: false, 
        error: `Gmail API error: ${response.status} ${errorText}` 
      };
    }

    return { success: true };

  } catch (error) {
    return { 
      success: false, 
      error: `Network error: ${error.message}` 
    };
  }
}

async function refreshAccessToken(refreshToken: string): Promise<{
  success: boolean;
  access_token?: string;
  error?: string;
}> {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: Deno.env.get('GOOGLE_CLIENT_ID') ?? '',
        client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET') ?? '',
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { 
        success: false, 
        error: `Token refresh failed: ${response.status} ${errorText}` 
      };
    }

    const data: GoogleTokenResponse = await response.json();
    
    return {
      success: true,
      access_token: data.access_token,
    };

  } catch (error) {
    return {
      success: false,
      error: `Token refresh error: ${error.message}`,
    };
  }
}