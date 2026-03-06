// src/app/instrumentation.js
import { setDefaultResultOrder } from 'node:dns';

export async function register() {
  try {
    // Prefer IPv4 when resolving api.malidag.com to avoid IPv6 timeouts
    setDefaultResultOrder('ipv4first');

    // Optional: log once at boot
    if (process.env.NODE_ENV !== 'production') {
      console.log('[instrumentation] DNS result order set to ipv4first');
    }
  } catch (err) {
    console.error('[instrumentation] Failed to set DNS result order:', err);
  }
}
