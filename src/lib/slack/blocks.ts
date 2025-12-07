/**
 * Slack Block Kit Builder Helpers
 */

export function createHeaderBlock(text: string) {
  return {
    type: 'header',
    text: {
      type: 'plain_text',
      text: text,
      emoji: true,
    },
  };
}

export function createSectionBlock(text: string) {
  return {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: text,
    },
  };
}

export function createDividerBlock() {
  return {
    type: 'divider',
  };
}

export function createActionBlock(elements: any[]) {
  return {
    type: 'actions',
    elements: elements,
  };
}

export function createButton(text: string, actionId: string, value: string, style?: 'primary' | 'danger') {
  return {
    type: 'button',
    text: {
      type: 'plain_text',
      text: text,
      emoji: true,
    },
    action_id: actionId,
    value: value,
    style: style,
  };
}

export function createSelectBlock(text: string, actionId: string, options: { text: string; value: string }[]) {
  return {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: text,
    },
    accessory: {
      type: 'static_select',
      placeholder: {
        type: 'plain_text',
        text: 'Auswählen...',
        emoji: true,
      },
      options: options.map(opt => ({
        text: {
          type: 'plain_text',
          text: opt.text,
          emoji: true,
        },
        value: opt.value,
      })),
      action_id: actionId,
    },
  };
}

export function createTicketListBlock(tickets: any[]) {
  const blocks: any[] = [];

  if (tickets.length === 0) {
    blocks.push(createSectionBlock('Keine Tickets gefunden.'));
    return blocks;
  }

  tickets.forEach(ticket => {
    const statusEmoji = ticket.status === 'closed' ? '✅' : ticket.status === 'in_progress' ? '🚧' : '🆕';
    
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*#${ticket.ticket_number} ${ticket.title}*\nStatus: ${statusEmoji} ${ticket.status} | Prio: ${ticket.priority}`,
      },
      accessory: {
        type: 'overflow',
        options: [
          {
            text: { type: 'plain_text', text: 'Starten', emoji: true },
            value: `start:${ticket.project_id}:${ticket.id}`,
          },
          {
            text: { type: 'plain_text', text: 'Status ändern', emoji: true },
            value: `status:${ticket.id}`,
          },
          {
            text: { type: 'plain_text', text: 'Details', emoji: true },
            value: `details:${ticket.id}`,
          }
        ],
        action_id: 'ticket_overflow_action',
      },
    });
    blocks.push(createDividerBlock());
  });

  return blocks;
}

