import { describe, expect, it } from 'vitest';

import * as tsMessages from '../messages';
// Import the JS build explicitly to ensure runtime consumers resolve correctly.
import * as jsMessages from '../messages.js';

const samplePayload = {
  rooms: [{ id: 'demo', status: 'waiting', players: 1, capacity: 6 }],
  notifications: [{ id: 'notice', message: 'ok', tone: 'info' }]
};

describe('shared message schema exports', () => {
  it('exposes LobbyRoomsResponse in the JS build', () => {
    expect(jsMessages.LobbyRoomsResponse).toBeDefined();
  });

  it('keeps TS and JS schema exports in sync', () => {
    expect(() => tsMessages.LobbyRoomsResponse.parse(samplePayload)).not.toThrow();
    expect(() => jsMessages.LobbyRoomsResponse.parse(samplePayload)).not.toThrow();
  });
});
