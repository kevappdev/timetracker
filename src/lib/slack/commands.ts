import { createAdminClient } from '@/lib/supabase/admin';
import { getSlackUserEmail } from './api';
import { 
  createHeaderBlock, 
  createSectionBlock, 
  createDividerBlock, 
  createButton, 
  createActionBlock 
} from './blocks';

const supabase = createAdminClient();

// --- Core Logic Helpers ---

export async function getSupabaseUserId(slackUserId: string): Promise<string | null> {
  const { data: userIdBySlackId, error: rpcError } = await supabase.rpc('get_user_by_slack_id', {
    slack_user_id: slackUserId
  });

  if (!rpcError && userIdBySlackId) {
    return userIdBySlackId as string;
  }

  const email = await getSlackUserEmail(slackUserId);
  if (!email) return null;

  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  
  if (error || !users) {
    console.error('Error fetching Supabase users:', error);
    return null;
  }

  const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
  return user ? user.id : null;
}

export async function startTimer(userId: string, projectId: string, ticketId: string | null = null) {
  // Laufende prüfen
  const { data: runningEntries } = await supabase
    .from('time_entries')
    .select('id')
    .eq('user_id', userId)
    .is('end_time', null);

  if (runningEntries && runningEntries.length > 0) {
    return { error: 'Es läuft bereits eine Zeiterfassung.' };
  }

  const { error } = await supabase
    .from('time_entries')
    .insert({
      user_id: userId,
      project_id: projectId,
      ticket_id: ticketId,
      start_time: new Date().toISOString(),
    });

  if (error) return { error: 'Datenbankfehler beim Starten.' };
  return { success: true };
}

// --- Command Handlers ---

export async function handleStart(slackUserId: string, text: string) {
  const userId = await getSupabaseUserId(slackUserId);
  if (!userId) {
    return {
      text: 'Fehler',
      blocks: [createSectionBlock('⚠️ Konnte keinen verknüpften Account finden.')]
    };
  }

  // Fall 1: Keine Argumente -> Projektwahl anzeigen
  if (!text.trim()) {
    const { data: projects } = await supabase
      .from('projects')
      .select('id, name')
      .order('created_at', { ascending: false })
      .limit(5);

    if (!projects || projects.length === 0) {
      return {
        text: 'Keine Projekte',
        blocks: [createSectionBlock('Du hast noch keine Projekte.')]
      };
    }

    const projectButtons = projects.map(p => 
      createButton(p.name, 'start_project', p.id)
    );

    return {
      text: 'Projekt wählen',
      blocks: [
        createHeaderBlock('⏱️ Zeiterfassung starten'),
        createSectionBlock('Wähle ein Projekt aus:'),
        createActionBlock(projectButtons),
      ]
    };
  }

  // Fall 2: Text Argumente (legacy/power user)
  const parts = text.trim().split(' ');
  let ticketNumber: number | null = null;
  let projectName = text.trim();

  if (parts.length > 1) {
    const lastPart = parts[parts.length - 1];
    if (/^#?\d+$/.test(lastPart)) {
      ticketNumber = parseInt(lastPart.replace('#', ''), 10);
      projectName = parts.slice(0, parts.length - 1).join(' ');
    }
  }

  const { data: projects } = await supabase
    .from('projects')
    .select('id, name')
    .ilike('name', projectName)
    .limit(1);

  if (!projects || projects.length === 0) {
     return {
       text: 'Fehler',
       blocks: [createSectionBlock(`❌ Projekt "${projectName}" nicht gefunden.`)]
     };
  }
  const project = projects[0];

  let ticketId = null;
  if (ticketNumber) {
    const { data: tickets } = await supabase
      .from('tickets')
      .select('id')
      .eq('project_id', project.id)
      .eq('ticket_number', ticketNumber)
      .limit(1);

    if (!tickets || tickets.length === 0) {
       return {
         text: 'Fehler',
         blocks: [createSectionBlock(`❌ Ticket #${ticketNumber} nicht gefunden.`)]
       };
    }
    ticketId = tickets[0].id;
  }

  const result = await startTimer(userId, project.id, ticketId);
  if (result.error) {
    return {
      text: 'Fehler',
      blocks: [createSectionBlock(`⚠️ ${result.error}`)]
    };
  }

  return {
    text: 'Gestartet',
    blocks: [
      createSectionBlock(`✅ Zeiterfassung gestartet für *${project.name}*${ticketId ? ` (Ticket #${ticketNumber})` : ''}.`),
      createActionBlock([createButton('Stoppen', 'stop_timer', 'stop', 'danger')])
    ]
  };
}

export async function handleStop(slackUserId: string) {
  const userId = await getSupabaseUserId(slackUserId);
  if (!userId) return { text: 'User nicht gefunden' };

  const { data: entries } = await supabase
    .from('time_entries')
    .select('id, start_time, projects(name), tickets(ticket_number, title)')
    .eq('user_id', userId)
    .is('end_time', null)
    .limit(1);

  if (!entries || entries.length === 0) {
    return {
      text: 'Keine Zeiterfassung',
      blocks: [createSectionBlock('Es läuft aktuell keine Zeiterfassung.')]
    };
  }

  const entry = entries[0];
  const endTime = new Date().toISOString();

  await supabase
    .from('time_entries')
    .update({ end_time: endTime })
    .eq('id', entry.id);

  const durationMs = new Date(endTime).getTime() - new Date(entry.start_time).getTime();
  const durationMinutes = Math.round(durationMs / 1000 / 60);
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;

  const project = Array.isArray(entry.projects) ? entry.projects[0] : entry.projects;
  
  return {
    text: 'Gestoppt',
    blocks: [
      createHeaderBlock('🏁 Zeiterfassung beendet'),
      createSectionBlock(`*${project?.name || 'Unbekannt'}*`),
      createSectionBlock(`Dauer: *${hours}h ${minutes}m*`),
    ]
  };
}

export async function handleStatus(slackUserId: string) {
  const userId = await getSupabaseUserId(slackUserId);
  if (!userId) return { text: 'User nicht gefunden' };

  const { data: entries } = await supabase
    .from('time_entries')
    .select('start_time, projects(name), tickets(ticket_number, title)')
    .eq('user_id', userId)
    .is('end_time', null)
    .limit(1);

  if (!entries || entries.length === 0) {
     return {
       text: 'Status',
       blocks: [
         createSectionBlock('💤 Aktuell läuft keine Zeiterfassung.'),
         createActionBlock([createButton('Zeiterfassung starten', 'open_start_modal', 'start', 'primary')])
       ]
     };
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

  return {
    text: 'Status',
    blocks: [
      createHeaderBlock('⏱️ Aktuelle Zeiterfassung'),
      createSectionBlock(`Läuft seit: *${hours}h ${minutes}m*`),
      createDividerBlock(),
      createSectionBlock(`📂 Projekt: *${project?.name}*`),
      ticket ? createSectionBlock(`🎫 Ticket: *#${ticket.ticket_number} - ${ticket.title}*`) : undefined,
      createDividerBlock(),
      createActionBlock([createButton('Stoppen', 'stop_timer', 'stop', 'danger')])
    ].filter(Boolean)
  };
}

export async function handleSummary(slackUserId: string, text: string) {
  const userId = await getSupabaseUserId(slackUserId);
  if (!userId) return { text: 'User nicht gefunden' };

  const period = text.trim().toLowerCase() || 'heute';
  let startDate = new Date();
  let endDate = new Date();
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);

  if (period === 'woche') {
      const day = startDate.getDay();
      const diff = startDate.getDate() - day + (day === 0 ? -6 : 1);
      startDate.setDate(diff);
  } else if (period === 'monat') {
      startDate.setDate(1);
  }

  const { data: entries } = await supabase
      .from('time_entries')
      .select('duration_minutes')
      .eq('user_id', userId)
      .gte('start_time', startDate.toISOString())
      .lte('start_time', endDate.toISOString())
      .not('end_time', 'is', null);

  if (!entries) return { text: 'Fehler' };

  const totalMinutes = entries.reduce((acc, curr) => acc + (curr.duration_minutes || 0), 0);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return {
    text: 'Summary',
    blocks: [
      createHeaderBlock(`📊 Zusammenfassung (${period})`),
      createSectionBlock(`Gesamtzeit: *${hours}h ${minutes}m*`)
    ]
  };
}
