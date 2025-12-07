import { NextRequest, NextResponse } from 'next/server';
import { verifySlackRequest } from '@/lib/slack/verify';
import { handleStart, handleStop, handleStatus, handleSummary } from '@/lib/slack/commands';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signingSecret = process.env.SLACK_SIGNING_SECRET;
    
    if (!signingSecret) {
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }

    if (!(await verifySlackRequest(rawBody, req.headers, signingSecret))) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const params = new URLSearchParams(rawBody);
    const command = params.get('command');
    const text = params.get('text') || '';
    const userId = params.get('user_id');

    if (!command || !userId) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    let result: any;

    switch (command) {
      case '/zeit-start':
        result = await handleStart(userId, text);
        break;
      case '/zeit-stop':
        result = await handleStop(userId);
        break;
      case '/zeit-status':
        result = await handleStatus(userId);
        break;
      case '/zeit-summary':
        result = await handleSummary(userId, text);
        break;
      default:
        result = { text: 'Unbekannter Befehl.' };
    }

    return NextResponse.json({
      response_type: 'ephemeral',
      text: typeof result === 'string' ? result : result.text,
      blocks: typeof result === 'object' ? result.blocks : undefined,
    });

  } catch (error) {
    console.error('Error in Slack Command Handler:', error);
    return NextResponse.json({ 
      response_type: 'ephemeral',
      text: 'Es ist ein Fehler aufgetreten.' 
    });
  }
}
