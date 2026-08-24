import { describe, expect, it, vi } from 'vitest';
import { createEventStreamParser } from '../services/http';

describe('createEventStreamParser', () => {
  it('reconstroi um evento dividido entre chunks e ignora o heartbeat', () => {
    const onEvent = vi.fn();
    const parser = createEventStreamParser(onEvent);

    parser.push(': keep-alive\r\n\r\nevent: protocol-cre');
    parser.push('ated\r\nid: abc-123\r\ndata: {"id":"abc-123",');
    parser.push('"status":"Aberto"}\r\n\r\n');
    parser.finish();

    expect(onEvent).toHaveBeenCalledOnce();
    expect(onEvent).toHaveBeenCalledWith({
      event: 'protocol-created',
      id: 'abc-123',
      data: '{"id":"abc-123","status":"Aberto"}',
    });
  });

  it('junta varias linhas data conforme a especificacao SSE', () => {
    const events: Array<{ event: string; data: string; id?: string }> = [];
    const parser = createEventStreamParser((event) => events.push(event));

    parser.push('event: message\ndata: primeira\ndata: segunda\n\n');
    parser.finish();

    expect(events).toEqual([{ event: 'message', data: 'primeira\nsegunda', id: undefined }]);
  });
});
