import { NextRequest, NextResponse } from 'next/server';
import { verifySlackRequest } from '@/lib/slack/verify';
import { handleStart, handleStop, handleStatus, handleSummary } from '@/lib/slack/commands';

export async function POST(req: NextRequest) {
  try {
    // 1. Raw Body für Signatur-Verifizierung lesen
    const rawBody = await req.text();
    
    // 2. Signatur prüfen
    const signingSecret = process.env.SLACK_SIGNING_SECRET;
    if (!signingSecret) {
      console.error('SLACK_SIGNING_SECRET is not set');
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }

    const isValid = await verifySlackRequest(rawBody, req.headers, signingSecret);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // 3. Body parsen
    const params = new URLSearchParams(rawBody);
    const command = params.get('command');
    const text = params.get('text') || '';
    const userId = params.get('user_id');

    if (!command || !userId) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // 4. Command verarbeiten
    let responseText = '';

    switch (command) {
      case '/zeit-start':
        responseText = await handleStart(userId, text);
        break;
      case '/zeit-stop':
        responseText = await handleStop(userId);
        break;
      case '/zeit-status':
        responseText = await handleStatus(userId);
        break;
      case '/zeit-summary':
        responseText = await handleSummary(userId, text);
        break;
      default:
        responseText = 'Unbekannter Befehl.';
    }

    // 5. Antwort an Slack zurückgeben
    return NextResponse.json({
      response_type: 'ephemeral', // Nur für den User sichtbar
      text: responseText,
    });

  } catch (error) {
    console.error('Error in Slack Command Handler:', error);
    return NextResponse.json({ 
      response_type: 'ephemeral',
      text: 'Es ist ein Fehler aufgetreten.' 
    });
  }
}

