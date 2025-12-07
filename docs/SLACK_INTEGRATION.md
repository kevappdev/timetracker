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

## Wichtige Voraussetzung: User Mapping & Login

Damit der Login-Abgleich funktioniert, müssen zwei Dinge konfiguriert sein:

### 1. Datenbank-Funktion (im Supabase SQL Editor)

Führe folgendes SQL aus, um die User-Zuordnung zu ermöglichen:

```sql
CREATE OR REPLACE FUNCTION public.get_user_by_slack_id(slack_user_id text)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = auth, public
AS $$
  SELECT user_id
  FROM auth.identities
  WHERE provider = 'slack'
  AND (identity_data->>'sub')::text = slack_user_id
  LIMIT 1;
$$;
```

### 2. Supabase Auth Provider aktivieren

Damit der "Mit Slack anmelden"-Button funktioniert, musst du Slack in Supabase aktivieren:

1.  Gehe zu deinem **Supabase Dashboard** -> **Authentication** -> **Providers**.
2.  Wähle **Slack** aus.
3.  Aktiviere **"Enable Sign in with Slack"**.
4.  Gib die **Client ID** und das **Client Secret** deiner Slack App ein (zu finden unter *Basic Information* in deinem Slack App Dashboard).
5.  Kopiere die **Redirect URL** (z.B. `https://dein-projekt.supabase.co/auth/v1/callback`) aus dem Supabase Dashboard.
6.  Füge diese URL in deinem **Slack App Dashboard** unter **OAuth & Permissions** -> **Redirect URLs** hinzu.
7.  **Speichere** die Änderungen in Supabase UND in Slack.

## Schritt 1: Umgebungsvariablen konfigurieren

Füge folgende Variablen zu deiner `.env.local` hinzu:

```env
# Slack Credentials (aus api.slack.com -> Basic Information / OAuth & Permissions)
SLACK_BOT_TOKEN=xoxb-dein-bot-token
SLACK_SIGNING_SECRET=dein-signing-secret

# Supabase Admin Access (aus Supabase Dashboard -> Project Settings -> API)
# ACHTUNG: Dieser Key darf niemals im Client/Browser verwendet werden!
SUPABASE_SERVICE_ROLE_KEY=dein-service-role-key
```

## Schritt 2: Slack App erstellen (Manuell)

Falls du das Manifest nicht verwenden möchtest, folge den Schritten unten.

1. Gehe zu [api.slack.com/apps](https://api.slack.com/apps)
2. Erstelle eine neue App ("From scratch")
3. Unter **"OAuth & Permissions"** -> **"Bot Token Scopes"** füge hinzu:
   - `chat:write`
   - `chat:write.public`
   - `commands`
   - `users:read`
   - `users:read.email` (Wichtig für die Benutzer-Zuordnung!)
4. Installiere die App in deinen Workspace ("Install to Workspace")

## Schritt 3: Slash Commands einrichten

Erstelle unter **"Slash Commands"** folgende Befehle:

| Command | Request URL | Beschreibung | Usage Hint |
|---------|-------------|--------------|------------|
| `/zeit-start` | `.../api/slack/commands` | Startet Zeiterfassung | `[projekt] [ticket]` |
| `/zeit-stop` | `.../api/slack/commands` | Stoppt Zeiterfassung | |
| `/zeit-status` | `.../api/slack/commands` | Zeigt Status | |
| `/zeit-summary` | `.../api/slack/commands` | Zeigt Zusammenfassung | `[heute/woche/monat]` |

*Hinweis:* Alle Commands nutzen denselben Endpoint `.../api/slack/commands`.

## Implementierungs-Details

Die Integration besteht aus folgenden Komponenten:

1.  **`/api/slack/commands/route.ts`**: Der zentrale API-Endpunkt, der alle Slash Commands empfängt, die Signatur prüft und an die Logik weiterleitet.
2.  **`/lib/slack/verify.ts`**: Utility zur Verifizierung der Slack-Signatur (`X-Slack-Signature`), um sicherzustellen, dass Anfragen wirklich von Slack kommen.
3.  **`/lib/slack/commands.ts`**: Die Logik für die einzelnen Befehle (`handleStart`, `handleStop`, etc.). Hier findet auch die Benutzer-Zuordnung statt.
4.  **`/lib/supabase/admin.ts`**: Ein Supabase-Client mit Admin-Rechten (Service Role), um Datenbankoperationen im Kontext des API-Routes durchzuführen (da keine User-Session/Cookies vorhanden sind).

## Sicherheitshinweise

- **Signature Verification**: Alle Requests werden auf eine gültige Slack-Signatur geprüft.
- **Service Role Key**: Der `SUPABASE_SERVICE_ROLE_KEY` wird nur serverseitig verwendet, um Nutzer anhand ihrer E-Mail zu finden und Einträge zu erstellen.
- **Ephemeral Responses**: Die Antworten des Bots sind `ephemeral`, d.h. nur für den aufrufenden Benutzer sichtbar.
