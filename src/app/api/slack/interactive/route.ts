import { NextRequest, NextResponse } from 'next/server';
import { verifySlackRequest } from '@/lib/slack/verify';
import { createAdminClient } from '@/lib/supabase/admin';
import { handleStop, startTimer } from '@/lib/slack/commands';

const supabase = createAdminClient();

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signingSecret = process.env.SLACK_SIGNING_SECRET;

    if (!signingSecret) {
      return NextResponse.json({ error: 'Config Error' }, { status: 500 });
    }

    if (!(await verifySlackRequest(rawBody, req.headers, signingSecret))) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload = JSON.parse(new URLSearchParams(rawBody).get('payload') || '{}');
    const slackUserId = payload.user?.id;

    if (payload.type === 'block_actions') {
      const action = payload.actions[0];
      const actionId = action.action_id;
      const value = action.value;

      // STOP Action
      if (actionId === 'stop_timer') {
        const result = await handleStop(slackUserId);
        
        if (payload.response_url) {
          await fetch(payload.response_url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              replace_original: true,
              text: result.text,
              blocks: result.blocks
            })
          });
        }
        return NextResponse.json({ ok: true });
      }

      // START Project Action
      if (actionId === 'start_project') {
         // Wir müssen erst den Supabase User finden (Logik dupliziert oder importieren?)
         // Besser: getSupabaseUserId exportieren und nutzen.
         // Aber commands.ts importiert admin client...
         
         // User Lookup via RPC
         const { data: userId } = await supabase.rpc('get_user_by_slack_id', { slack_user_id: slackUserId });
         
         if (userId) {
           // Timer starten
           await startTimer(userId, value); // value ist projectId
           
           if (payload.response_url) {
            await fetch(payload.response_url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                replace_original: true,
                text: 'Gestartet',
                blocks: [
                  {
                    type: 'section',
                    text: { type: 'mrkdwn', text: `✅ Zeiterfassung für Projekt gestartet.` }
                  },
                  {
                    type: 'actions',
                    elements: [
                      {
                        type: 'button',
                        text: { type: 'plain_text', text: 'Stoppen', emoji: true },
                        action_id: 'stop_timer',
                        value: 'stop',
                        style: 'danger'
                      }
                    ]
                  }
                ]
              })
            });
           }
         }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Interactive Error:', error);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}
