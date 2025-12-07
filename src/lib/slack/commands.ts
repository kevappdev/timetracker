import { createAdminClient } from '@/lib/supabase/admin';
import { getSlackUserEmail } from './api';

const supabase = createAdminClient();

/**
 * Findet den Supabase User ID anhand der Slack User ID
 * 
 * Strategie:
 * 1. Versuche direkten Lookup über Slack ID (wenn User mit Slack eingeloggt ist)
 * 2. Fallback: E-Mail von Slack holen und User anhand der E-Mail suchen
 */
async function getSupabaseUserId(slackUserId: string): Promise<string | null> {
  // 1. RPC Aufruf versuchen (Schneller Lookup via Identity)
  const { data: userIdBySlackId, error: rpcError } = await supabase.rpc('get_user_by_slack_id', {
    slack_user_id: slackUserId
  });

  if (!rpcError && userIdBySlackId) {
    return userIdBySlackId as string;
  }

  // 2. Fallback: E-Mail Lookup
  // E-Mail von Slack holen
  const email = await getSlackUserEmail(slackUserId);
  if (!email) return null;

  // User in Supabase suchen
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  
  if (error || !users) {
    console.error('Error fetching Supabase users:', error);
    return null;
  }

  const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
  return user ? user.id : null;
}

/**
 * /zeit-start
 */
export async function handleStart(slackUserId: string, text: string) {
  const userId = await getSupabaseUserId(slackUserId);
  if (!userId) return 'Konnte keinen verknüpften Account finden. Bitte melde dich einmal mit Slack an oder stelle sicher, dass deine E-Mail-Adressen übereinstimmen.';

  // Parse text: "ProjektName TicketNummer" oder "ProjektName"
  const parts = text.trim().split(' ');
  let ticketNumber: number | null = null;
  let projectName = text.trim();

  // Prüfen, ob das letzte Element eine Nummer ist
  if (parts.length > 1) {
    const lastPart = parts[parts.length - 1];
    if (/^#?\d+$/.test(lastPart)) {
      ticketNumber = parseInt(lastPart.replace('#', ''), 10);
      projectName = parts.slice(0, parts.length - 1).join(' ');
    }
  }

  // Projekt suchen
  const { data: projects, error: projectError } = await supabase
    .from('projects')
    .select('id, name')
    .ilike('name', projectName)
    .limit(1);

  if (projectError || !projects || projects.length === 0) {
    return `Projekt "${projectName}" nicht gefunden.`;
  }
  const project = projects[0];

  let ticketId = null;
  if (ticketNumber) {
    // Ticket suchen
    const { data: tickets, error: ticketError } = await supabase
      .from('tickets')
      .select('id, title')
      .eq('project_id', project.id)
      .eq('ticket_number', ticketNumber)
      .limit(1);

    if (ticketError || !tickets || tickets.length === 0) {
      return `Ticket #${ticketNumber} in Projekt "${project.name}" nicht gefunden.`;
    }
    ticketId = tickets[0].id;
  }

  // Laufende Zeiterfassung prüfen
  const { data: runningEntries } = await supabase
    .from('time_entries')
    .select('id')
    .eq('user_id', userId)
    .is('end_time', null);

  if (runningEntries && runningEntries.length > 0) {
    return 'Es läuft bereits eine Zeiterfassung. Bitte beende diese zuerst mit `/zeit-stop`.';
  }

  // Neue Zeiterfassung starten
  const { error: insertError } = await supabase
    .from('time_entries')
    .insert({
      user_id: userId,
      project_id: project.id,
      ticket_id: ticketId,
      start_time: new Date().toISOString(),
    });

  if (insertError) {
    console.error('Error starting timer:', insertError);
    return 'Fehler beim Starten der Zeiterfassung.';
  }

  return `Zeiterfassung gestartet für Projekt *${project.name}*${ticketId ? ` (Ticket #${ticketNumber})` : ''}.`;
}

/**
 * /zeit-stop
 */
export async function handleStop(slackUserId: string) {
  const userId = await getSupabaseUserId(slackUserId);
  if (!userId) return 'Konnte keinen verknüpften Account finden.';

  // Laufende Zeiterfassung suchen
  const { data: entries, error } = await supabase
    .from('time_entries')
    .select('id, start_time, projects(name), tickets(ticket_number, title)')
    .eq('user_id', userId)
    .is('end_time', null)
    .limit(1);

  if (error || !entries || entries.length === 0) {
    return 'Es läuft aktuell keine Zeiterfassung.';
  }

  const entry = entries[0];
  const endTime = new Date().toISOString();

  // Zeiterfassung beenden
  const { error: updateError } = await supabase
    .from('time_entries')
    .update({ end_time: endTime })
    .eq('id', entry.id);

  if (updateError) {
    return 'Fehler beim Stoppen der Zeiterfassung.';
  }

  // Dauer berechnen (optional für die Antwort)
  const durationMs = new Date(endTime).getTime() - new Date(entry.start_time).getTime();
  const durationMinutes = Math.round(durationMs / 1000 / 60);
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;

  const project = Array.isArray(entry.projects) ? entry.projects[0] : entry.projects;
  const ticket = Array.isArray(entry.tickets) ? entry.tickets[0] : entry.tickets;

  return `Zeiterfassung beendet für *${project?.name || 'Unbekannt'}* (${hours}h ${minutes}m).`;
}

/**
 * /zeit-status
 */
export async function handleStatus(slackUserId: string) {
  const userId = await getSupabaseUserId(slackUserId);
  if (!userId) return 'Konnte keinen verknüpften Account finden.';

  const { data: entries, error } = await supabase
    .from('time_entries')
    .select('start_time, projects(name), tickets(ticket_number, title)')
    .eq('user_id', userId)
    .is('end_time', null)
    .limit(1);

  if (error || !entries || entries.length === 0) {
    return 'Aktuell läuft keine Zeiterfassung.';
  }

  const entry = entries[0];
  const startTime = new Date(entry.start_time);
  const now = new Date();
  const durationMs = now.getTime() - startTime.getTime();
  const durationMinutes = Math.round(durationMs / 1000 / 60);
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;

  const project = Array.isArray(entry.projects) ? entry.projects[0] : entry.projects;
  const ticket = Array.isArray(entry.tickets) ? entry.tickets[0] : entry.tickets;

  let message = `⏱️ Läuft seit ${hours}h ${minutes}m\n`;
  message += `📂 Projekt: *${project?.name || 'Unbekannt'}*\n`;
  if (ticket) {
    message += `🎫 Ticket: #${ticket.ticket_number} - ${ticket.title}`;
  }

  return message;
}

/**
 * /zeit-summary
 */
export async function handleSummary(slackUserId: string, text: string) {
  const userId = await getSupabaseUserId(slackUserId);
  if (!userId) return 'Konnte keinen verknüpften Account finden.';

  const period = text.trim().toLowerCase() || 'heute';
  let startDate = new Date();
  let endDate = new Date();
  
  // Datumsgrenzen berechnen
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);

  if (period === 'woche') {
    const day = startDate.getDay();
    const diff = startDate.getDate() - day + (day === 0 ? -6 : 1); // Montag
    startDate.setDate(diff);
  } else if (period === 'monat') {
    startDate.setDate(1);
  }

  const { data: entries, error } = await supabase
    .from('time_entries')
    .select('duration_minutes')
    .eq('user_id', userId)
    .gte('start_time', startDate.toISOString())
    .lte('start_time', endDate.toISOString())
    .not('end_time', 'is', null);

  if (error || !entries) {
    return 'Fehler beim Abrufen der Zusammenfassung.';
  }

  const totalMinutes = entries.reduce((acc, curr) => acc + (curr.duration_minutes || 0), 0);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `📊 Zusammenfassung für *${period}*:\nGesamtzeit: *${hours}h ${minutes}m*`;
}
