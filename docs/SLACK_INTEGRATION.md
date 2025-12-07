# Slack-Integration für Time Tracker

Diese Anleitung führt dich Schritt für Schritt durch die Einrichtung einer Slack-Integration für deinen Time Tracker.

## Schnellstart mit Manifest

**Option 1: Manifest verwenden (Empfohlen für schnelle Einrichtung)**

1. Öffne [api.slack.com/apps](https://api.slack.com/apps)
2. Klicke auf **"Create New App"**
3. Wähle **"From an app manifest"**
4. Wähle deinen Workspace
5. Kopiere den Inhalt von `slack-app-manifest.json` (oder `slack-app-manifest-local.json` für lokale Entwicklung)
6. Füge das Manifest ein und klicke auf **"Create"**
7. **Wichtig:** Ersetze `https://deine-domain.com` in den URLs mit deiner tatsächlichen Domain
8. Für lokale Entwicklung: Verwende `slack-app-manifest-local.json` und stelle sicher, dass du einen Tunnel-Service wie [ngrok](https://ngrok.com/) verwendest

**Option 2: Manuelle Einrichtung**

Falls du das Manifest nicht verwenden möchtest, folge den Schritten unten.

## Übersicht

Die Slack-Integration ermöglicht es:
- Zeiterfassungen direkt aus Slack zu starten und zu stoppen
- Benachrichtigungen über gestartete/gestoppte Zeiterfassungen zu erhalten
- Tägliche/wochentliche Zusammenfassungen der Arbeitszeit zu erhalten

## Schritt 1: Slack App erstellen

1. Gehe zu [api.slack.com/apps](https://api.slack.com/apps)
2. Klicke auf **"Create New App"**
3. Wähle **"From scratch"**
4. Gib deiner App einen Namen (z.B. "Time Tracker") und wähle deinen Workspace
5. Klicke auf **"Create App"**

## Schritt 2: Bot Token Scopes konfigurieren

1. Im linken Menü gehe zu **"OAuth & Permissions"**
2. Scrolle zu **"Scopes"** → **"Bot Token Scopes"**
3. Füge folgende Berechtigungen hinzu:
   - `chat:write` - Nachrichten senden
   - `chat:write.public` - Nachrichten in öffentlichen Kanälen senden
   - `commands` - Slash Commands verwenden
   - `users:read` - Benutzerinformationen lesen
   - `channels:read` - Kanalinformationen lesen (optional)

## Schritt 3: Slash Commands einrichten

1. Im linken Menü gehe zu **"Slash Commands"**
2. Klicke auf **"Create New Command"**
3. Erstelle folgende Commands:

### Command 1: `/zeit-start`
- **Command:** `/zeit-start`
- **Request URL:** `https://deine-domain.com/api/slack/commands`
- **Short Description:** Startet die Zeiterfassung
- **Usage Hint:** `[projekt] [ticket]` (optional)

### Command 2: `/zeit-stop`
- **Command:** `/zeit-stop`
- **Request URL:** `https://deine-domain.com/api/slack/commands`
- **Short Description:** Stoppt die laufende Zeiterfassung
- **Usage Hint:** (keine Parameter)

### Command 3: `/zeit-status`
- **Command:** `/zeit-status`
- **Request URL:** `https://deine-domain.com/api/slack/commands`
- **Short Description:** Zeigt den aktuellen Status der Zeiterfassung
- **Usage Hint:** (keine Parameter)

## Schritt 4: Interaktivität aktivieren

1. Im linken Menü gehe zu **"Interactivity & Shortcuts"**
2. Aktiviere **"Interactivity"**
3. Setze die **Request URL:** `https://deine-domain.com/api/slack/interactive`
4. Klicke auf **"Save Changes"**

## Schritt 5: Event Subscriptions einrichten (optional)

Für automatische Benachrichtigungen:

1. Im linken Menü gehe zu **"Event Subscriptions"**
2. Aktiviere **"Enable Events"**
3. Setze die **Request URL:** `https://deine-domain.com/api/slack/events`
4. Unter **"Subscribe to bot events"** füge hinzu:
   - `app_mention` - Wenn der Bot erwähnt wird
   - `message.channels` - Nachrichten in Kanälen (optional)

## Schritt 6: App zum Workspace hinzufügen

1. Im linken Menü gehe zu **"OAuth & Permissions"**
2. Scrolle nach oben zu **"OAuth Tokens for Your Workspace"**
3. Klicke auf **"Install to Workspace"**
4. Bestätige die Berechtigungen
5. Kopiere den **"Bot User OAuth Token"** (beginnt mit `xoxb-`)
6. Kopiere auch die **"Signing Secret"** (unter **"Basic Information"** → **"App Credentials"**)

## Schritt 7: Umgebungsvariablen konfigurieren

Füge folgende Variablen zu deiner `.env.local` hinzu:

```env
SLACK_BOT_TOKEN=xoxb-dein-bot-token
SLACK_SIGNING_SECRET=dein-signing-secret
SLACK_CLIENT_ID=deine-client-id
SLACK_CLIENT_SECRET=deine-client-secret
```

## Schritt 8: Slack SDK installieren

```bash
npm install @slack/bolt @slack/web-api
```

## Schritt 9: API Routes erstellen

### `/api/slack/commands/route.ts`

Diese Route verarbeitet Slash Commands von Slack.

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const command = formData.get('command') as string;
    const text = formData.get('text') as string;
    const userId = formData.get('user_id') as string;
    const responseUrl = formData.get('response_url') as string;

    // Verifiziere die Slack-Signatur (wichtig für Sicherheit)
    // TODO: Implementiere Signature Verification

    // Finde den Benutzer in der Datenbank über Slack User ID
    const supabase = createSupabaseServerClient();
    
    // TODO: Erstelle eine Mapping-Tabelle zwischen Slack User ID und Supabase User ID
    // const { data: user } = await supabase
    //   .from('user_slack_mapping')
    //   .select('supabase_user_id')
    //   .eq('slack_user_id', userId)
    //   .single();

    if (command === '/zeit-start') {
      // Parse Projekt und Ticket aus dem Text
      const parts = text.trim().split(' ');
      const projectName = parts[0];
      const ticketNumber = parts[1];

      // TODO: Implementiere Start-Logik
      // - Finde Projekt und Ticket
      // - Starte Zeiterfassung
      // - Sende Bestätigung an Slack

      return NextResponse.json({
        response_type: 'ephemeral', // Nur für den Benutzer sichtbar
        text: `Zeiterfassung gestartet für ${projectName}${ticketNumber ? ` - Ticket #${ticketNumber}` : ''}`,
      });
    }

    if (command === '/zeit-stop') {
      // TODO: Implementiere Stop-Logik
      // - Finde laufende Zeiterfassung
      // - Stoppe Zeiterfassung
      // - Sende Zusammenfassung an Slack

      return NextResponse.json({
        response_type: 'ephemeral',
        text: 'Zeiterfassung gestoppt. Dauer: X Stunden Y Minuten',
      });
    }

    if (command === '/zeit-status') {
      // TODO: Implementiere Status-Logik
      // - Finde laufende Zeiterfassung
      // - Zeige aktuelle Dauer und Details

      return NextResponse.json({
        response_type: 'ephemeral',
        text: 'Aktuell keine laufende Zeiterfassung',
      });
    }

    return NextResponse.json({
      response_type: 'ephemeral',
      text: 'Unbekannter Befehl',
    });
  } catch (error) {
    console.error('Slack Command Error:', error);
    return NextResponse.json({
      response_type: 'ephemeral',
      text: 'Ein Fehler ist aufgetreten',
    });
  }
}
```

### `/api/slack/interactive/route.ts`

Diese Route verarbeitet interaktive Komponenten (Buttons, Modals).

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const payload = formData.get('payload') as string;
    const data = JSON.parse(payload);

    // Verifiziere die Slack-Signatur
    // TODO: Implementiere Signature Verification

    // Handle button clicks, modal submissions, etc.
    if (data.type === 'block_actions') {
      // Handle button clicks
    }

    if (data.type === 'view_submission') {
      // Handle modal submissions
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Slack Interactive Error:', error);
    return NextResponse.json({ ok: false });
  }
}
```

### `/api/slack/events/route.ts`

Diese Route verarbeitet Events von Slack.

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // URL Verification Challenge
    if (body.type === 'url_verification') {
      return NextResponse.json({ challenge: body.challenge });
    }

    // Verifiziere die Slack-Signatur
    // TODO: Implementiere Signature Verification

    // Handle events
    if (body.event?.type === 'app_mention') {
      // Bot wurde erwähnt
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Slack Events Error:', error);
    return NextResponse.json({ ok: false });
  }
}
```

## Schritt 10: Signature Verification implementieren

Erstelle eine Utility-Funktion zur Verifizierung der Slack-Signatur:

### `/lib/slack/verify.ts`

```typescript
import crypto from 'crypto';

export function verifySlackSignature(
  timestamp: string,
  body: string,
  signature: string
): boolean {
  const signingSecret = process.env.SLACK_SIGNING_SECRET;
  if (!signingSecret) {
    throw new Error('SLACK_SIGNING_SECRET is not set');
  }

  const hmac = crypto.createHmac('sha256', signingSecret);
  const [version, hash] = signature.split('=');
  const baseString = `${version}:${timestamp}:${body}`;
  const expectedSignature = hmac.update(baseString).digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(hash),
    Buffer.from(expectedSignature)
  );
}
```

## Schritt 11: User Mapping Tabelle erstellen

Erstelle eine Migration, um Slack User IDs mit Supabase User IDs zu verknüpfen:

### `supabase/migrations/create_slack_user_mapping.sql`

```sql
-- Tabelle für Slack User Mapping
CREATE TABLE IF NOT EXISTS slack_user_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supabase_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slack_user_id TEXT NOT NULL UNIQUE,
  slack_team_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE slack_user_mapping ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own mapping"
  ON slack_user_mapping
  FOR SELECT
  USING (auth.uid() = supabase_user_id);

CREATE POLICY "Users can insert their own mapping"
  ON slack_user_mapping
  FOR INSERT
  WITH CHECK (auth.uid() = supabase_user_id);

CREATE POLICY "Users can update their own mapping"
  ON slack_user_mapping
  FOR UPDATE
  USING (auth.uid() = supabase_user_id);

-- Index für schnelle Lookups
CREATE INDEX IF NOT EXISTS idx_slack_user_mapping_slack_user_id 
  ON slack_user_mapping(slack_user_id);

CREATE INDEX IF NOT EXISTS idx_slack_user_mapping_supabase_user_id 
  ON slack_user_mapping(supabase_user_id);
```

## Schritt 12: OAuth Flow für User-Verbindung

Erstelle eine Seite, auf der Benutzer ihren Slack-Account verbinden können:

### `/app/slack/connect/page.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';

export default function SlackConnectPage() {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { data } = await supabase
        .from('slack_user_mapping')
        .select('slack_user_id')
        .eq('supabase_user_id', user.id)
        .single();
      
      setConnected(!!data);
    }
    setLoading(false);
  };

  const handleConnect = () => {
    const clientId = process.env.NEXT_PUBLIC_SLACK_CLIENT_ID;
    const redirectUri = `${window.location.origin}/api/slack/oauth/callback`;
    const scopes = 'commands,chat:write,users:read';
    const state = crypto.randomUUID(); // Store in session for verification
    
    const slackAuthUrl = `https://slack.com/oauth/v2/authorize?client_id=${clientId}&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
    
    window.location.href = slackAuthUrl;
  };

  if (loading) {
    return <div>Lädt...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Slack Integration</h1>
      
      {connected ? (
        <div>
          <p className="mb-4">Dein Slack-Account ist verbunden.</p>
          <Button onClick={() => {/* Disconnect logic */}}>
            Verbindung trennen
          </Button>
        </div>
      ) : (
        <div>
          <p className="mb-4">Verbinde deinen Slack-Account, um Zeiterfassungen direkt aus Slack zu steuern.</p>
          <Button onClick={handleConnect}>
            Mit Slack verbinden
          </Button>
        </div>
      )}
    </div>
  );
}
```

### `/api/slack/oauth/callback/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(new URL('/slack/connect?error=access_denied', request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/slack/connect?error=no_code', request.url));
  }

  // Exchange code for access token
  const clientId = process.env.SLACK_CLIENT_ID;
  const clientSecret = process.env.SLACK_CLIENT_SECRET;
  const redirectUri = `${request.nextUrl.origin}/api/slack/oauth/callback`;

  const response = await fetch('https://slack.com/api/oauth.v2.access', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId!,
      client_secret: clientSecret!,
      code,
      redirect_uri: redirectUri,
    }),
  });

  const data = await response.json();

  if (!data.ok) {
    return NextResponse.redirect(new URL('/slack/connect?error=token_exchange_failed', request.url));
  }

  // Get user info from Slack
  const userResponse = await fetch('https://slack.com/api/users.identity', {
    headers: {
      Authorization: `Bearer ${data.authed_user.access_token}`,
    },
  });

  const userData = await userResponse.json();

  if (!userData.ok) {
    return NextResponse.redirect(new URL('/slack/connect?error=user_info_failed', request.url));
  }

  // TODO: Get current Supabase user from session
  // const supabase = createSupabaseServerClient();
  // const { data: { user } } = await supabase.auth.getUser();

  // Store mapping in database
  // await supabase
  //   .from('slack_user_mapping')
  //   .upsert({
  //     supabase_user_id: user.id,
  //     slack_user_id: userData.user.id,
  //     slack_team_id: data.team.id,
  //   });

  return NextResponse.redirect(new URL('/slack/connect?success=true', request.url));
}
```

## Schritt 13: Benachrichtigungen senden

Erstelle eine Utility-Funktion zum Senden von Nachrichten an Slack:

### `/lib/slack/messages.ts`

```typescript
import { WebClient } from '@slack/web-api';

const client = new WebClient(process.env.SLACK_BOT_TOKEN);

export async function sendTimeTrackingNotification(
  slackUserId: string,
  message: string
) {
  try {
    await client.chat.postMessage({
      channel: slackUserId,
      text: message,
    });
  } catch (error) {
    console.error('Error sending Slack message:', error);
  }
}

export async function sendTimeTrackingSummary(
  slackUserId: string,
  summary: {
    totalHours: number;
    totalMinutes: number;
    entries: Array<{
      project: string;
      ticket?: string;
      duration: string;
    }>;
  }
) {
  const blocks = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: '📊 Zeiterfassungs-Zusammenfassung',
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Gesamt:* ${summary.totalHours}:${summary.totalMinutes.toString().padStart(2, '0')}`,
      },
    },
    {
      type: 'divider',
    },
    ...summary.entries.map((entry) => ({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${entry.project}*${entry.ticket ? ` - ${entry.ticket}` : ''}\n${entry.duration}`,
      },
    })),
  ];

  try {
    await client.chat.postMessage({
      channel: slackUserId,
      blocks,
      text: 'Zeiterfassungs-Zusammenfassung',
    });
  } catch (error) {
    console.error('Error sending Slack summary:', error);
  }
}
```

## Schritt 14: Integration in bestehende Komponenten

Integriere Slack-Benachrichtigungen in die bestehenden Komponenten:

- `StartTimeTracking.tsx` - Sende Benachrichtigung beim Start
- `RunningTimer.tsx` - Sende Benachrichtigung beim Stoppen
- Optional: Tägliche/wochentliche Zusammenfassungen per Cron Job

## Schritt 15: Testing

1. Teste die Slash Commands in Slack
2. Teste die OAuth-Verbindung
3. Teste die Benachrichtigungen
4. Überprüfe die Signature Verification

## Sicherheitshinweise

- **Immer Signature Verification implementieren** - Verhindert gefälschte Requests
- **Rate Limiting** - Begrenze die Anzahl der Requests pro Benutzer
- **Sensible Daten** - Speichere keine Tokens im Klartext
- **HTTPS verwenden** - Alle Webhooks müssen über HTTPS laufen

## Nächste Schritte

- [ ] Erweiterte Slash Commands (z.B. `/zeit-summary`)
- [ ] Interaktive Buttons zum Starten/Stoppen
- [ ] Tägliche Zusammenfassungen per Cron Job
- [ ] Projekt- und Ticket-Auswahl per Dropdown in Slack
- [ ] Multi-Workspace Support

## Ressourcen

- [Slack API Documentation](https://api.slack.com/)
- [Slack Bolt Framework](https://slack.dev/bolt-js/)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)

