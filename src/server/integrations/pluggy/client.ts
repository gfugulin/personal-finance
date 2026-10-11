import { PluggyClient } from 'pluggy-sdk';

let pluggyClientInstance: PluggyClient | null = null;

export function getPluggyClient(): PluggyClient {
  const clientId = process.env.PLUGGY_CLIENT_ID;
  const clientSecret = process.env.PLUGGY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('PLUGGY_CLIENT_ID or PLUGGY_CLIENT_SECRET is not configured');
  }

  if (!pluggyClientInstance) {
    pluggyClientInstance = new PluggyClient({
      clientId,
      clientSecret,
    });
  }

  return pluggyClientInstance;
}
