import type { SessionAddress, Ciphertext } from '@bravo/messenger-core';

export interface RelayEnvelope {
  from: SessionAddress;
  ct: Ciphertext;
}

/**
 * Minimal stand-in for the messenger relay: it stores envelopes transiently,
 * keyed by recipient, and hands them over FIFO when the recipient "fetches".
 * The real relay only transports (never decrypts) — same contract here. Lets a
 * headless test model offline backlog + delivery ordering without a server.
 */
export class InMemoryRelay {
  private readonly queues = new Map<string, RelayEnvelope[]>();

  private key(a: SessionAddress): string {
    return `${a.userId}:${a.deviceId}`;
  }

  /** Sender hands an encrypted envelope to the relay for a recipient. */
  enqueue(to: SessionAddress, from: SessionAddress, ct: Ciphertext): void {
    const k = this.key(to);
    const q = this.queues.get(k) ?? [];
    q.push({ from, ct });
    this.queues.set(k, q);
  }

  /** Recipient fetches (and clears) its backlog, in the order stored. */
  drain(to: SessionAddress): RelayEnvelope[] {
    const k = this.key(to);
    const q = this.queues.get(k) ?? [];
    this.queues.set(k, []);
    return q;
  }

  pending(to: SessionAddress): number {
    return (this.queues.get(this.key(to)) ?? []).length;
  }
}
