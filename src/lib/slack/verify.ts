import crypto from 'crypto';

/**
 * Verifiziert die Slack-Signatur eines Requests
 * 
 * @param body - Der Raw Body des Requests als String
 * @param headers - Die Headers des Requests
 * @param signingSecret - Das Slack Signing Secret
 * @returns true wenn die Signatur gültig ist, sonst false
 */
export async function verifySlackRequest(
  body: string,
  headers: Headers,
  signingSecret: string
): Promise<boolean> {
  const signature = headers.get('x-slack-signature');
  const timestamp = headers.get('x-slack-request-timestamp');

  if (!signature || !timestamp) {
    return false;
  }

  // Prüfen, ob der Request älter als 5 Minuten ist (Replay Attack Schutz)
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(timestamp)) > 60 * 5) {
    return false;
  }

  const baseString = `v0:${timestamp}:${body}`;
  const hmac = crypto.createHmac('sha256', signingSecret);
  const calculatedSignature = `v0=${hmac.update(baseString).digest('hex')}`;

  // Timing-sicheren Vergleich verwenden
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(calculatedSignature)
    );
  } catch (e) {
    return false;
  }
}

