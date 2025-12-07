/**
 * Slack API Helper
 */

const SLACK_API_URL = 'https://slack.com/api';

export async function getSlackUserEmail(userId: string): Promise<string | null> {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) {
    console.error('SLACK_BOT_TOKEN is not set');
    return null;
  }

  try {
    const response = await fetch(`${SLACK_API_URL}/users.info?user=${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    if (!data.ok) {
      console.error('Error fetching Slack user:', data.error);
      return null;
    }

    return data.user?.profile?.email || null;
  } catch (error) {
    console.error('Error calling Slack API:', error);
    return null;
  }
}

