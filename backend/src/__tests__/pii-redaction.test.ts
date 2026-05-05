import { describe, it, expect } from 'vitest';
import { PassThrough } from 'node:stream';
import winston from 'winston';

/**
 * Tests for SEC-04 PII redaction in Winston logger.
 *
 * Strategy: build an isolated test logger with the same piiRedact format
 * the production logger uses. Output is captured via a PassThrough stream
 * so we can assert that PII field values are replaced with '[REDACTED]'.
 *
 * Winston format functions must MUTATE the info object in-place and return it.
 * Returning a new plain object drops Winston's Symbol properties (level, splat)
 * causing the log entry to be silently discarded.
 */

// ----- PII redaction logic (must match logger.ts implementation exactly) -----

const PII_FIELDS = new Set(['email', 'cpf', 'phone', 'telefone', 'celular', 'name', 'senha', 'password']);

function redactPII(obj: unknown, depth = 0): unknown {
  if (depth > 5 || obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map((v) => redactPII(v, depth + 1));
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    result[key] = PII_FIELDS.has(key.toLowerCase()) ? '[REDACTED]' : redactPII(value, depth + 1);
  }
  return result;
}

// ----- Test logger factory -----
function buildTestLogger() {
  const lines: string[] = [];
  const pt = new PassThrough();
  pt.on('data', (chunk: Buffer) => lines.push(chunk.toString()));

  // Mutates info in-place to preserve Winston's internal Symbol properties
  const piiRedactFormat = winston.format((info) => {
    const reserved = new Set(['message', 'level', 'timestamp']);
    for (const key of Object.keys(info)) {
      if (reserved.has(key)) continue;
      if (PII_FIELDS.has(key.toLowerCase())) {
        info[key] = '[REDACTED]';
      } else if (typeof info[key] === 'object' && info[key] !== null) {
        info[key] = redactPII(info[key], 1);
      }
    }
    return info;
  })();

  const logger = winston.createLogger({
    level: 'debug',
    format: winston.format.combine(
      winston.format.timestamp(),
      piiRedactFormat,
      winston.format.json()
    ),
    transports: [new winston.transports.Stream({ stream: pt })],
    silent: false,
  });

  const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 200));

  return { logger, lines, flush };
}

// ----- Tests -----

describe('PII redaction in logger (SEC-04)', () => {

  it('should redact email from metadata', async () => {
    const { logger, lines, flush } = buildTestLogger();
    logger.info('test message', { email: 'test@example.com' });
    await flush();

    const output = lines.join('');
    expect(output).toContain('[REDACTED]');
    expect(output).not.toContain('test@example.com');
  });

  it('should redact cpf from metadata', async () => {
    const { logger, lines, flush } = buildTestLogger();
    logger.info('test message', { cpf: '123.456.789-00' });
    await flush();

    const output = lines.join('');
    expect(output).toContain('[REDACTED]');
    expect(output).not.toContain('123.456.789-00');
  });

  it('should redact phone from metadata', async () => {
    const { logger, lines, flush } = buildTestLogger();
    logger.info('test message', { phone: '+55 11 99999-9999' });
    await flush();

    const output = lines.join('');
    expect(output).toContain('[REDACTED]');
    expect(output).not.toContain('+55 11 99999-9999');
  });

  it('should redact telefone from metadata', async () => {
    const { logger, lines, flush } = buildTestLogger();
    logger.info('test message', { telefone: '11999999999' });
    await flush();

    const output = lines.join('');
    expect(output).toContain('[REDACTED]');
    expect(output).not.toContain('11999999999');
  });

  it('should redact celular from metadata', async () => {
    const { logger, lines, flush } = buildTestLogger();
    logger.info('test message', { celular: '21988887777' });
    await flush();

    const output = lines.join('');
    expect(output).toContain('[REDACTED]');
    expect(output).not.toContain('21988887777');
  });

  it('should redact nested email at depth 2', async () => {
    const { logger, lines, flush } = buildTestLogger();
    logger.info('test message', { user: { email: 'nested@example.com', id: 'abc-123' } });
    await flush();

    const output = lines.join('');
    expect(output).toContain('[REDACTED]');
    expect(output).not.toContain('nested@example.com');
    // Non-PII field at same level must pass through unchanged
    expect(output).toContain('abc-123');
  });

  it('should NOT redact non-PII fields (id, status)', async () => {
    const { logger, lines, flush } = buildTestLogger();
    logger.info('test message', { id: 'user-42', status: 'active' });
    await flush();

    const output = lines.join('');
    expect(output).toContain('user-42');
    expect(output).toContain('active');
    expect(output).not.toContain('[REDACTED]');
  });

  it('should not crash when metadata is null or undefined', async () => {
    const { logger, flush } = buildTestLogger();

    expect(() => logger.info('test with no meta')).not.toThrow();
    expect(() => logger.info('test', null as unknown as object)).not.toThrow();

    await flush();
    // Reaching here without exception confirms the test passes
  });

  it('should redact name from metadata (per D-10)', async () => {
    const { logger, lines, flush } = buildTestLogger();
    logger.info('test message', { name: 'João Silva' });
    await flush();

    const output = lines.join('');
    expect(output).toContain('[REDACTED]');
    expect(output).not.toContain('João Silva');
  });
});
