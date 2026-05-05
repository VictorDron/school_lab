import winston from 'winston';

const { combine, timestamp, printf, colorize, json } = winston.format;

// PII fields that must never appear in log output (per D-10, D-11, D-12)
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

// Mutates info in-place to preserve Winston's Symbol properties (level, splat, etc.)
const piiRedact = winston.format((info) => {
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

/** Safely stringify meta — handles circular references without crashing */
function safeStringify(obj: Record<string, unknown>): string {
  try {
    const seen = new WeakSet();
    return JSON.stringify(obj, (_key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) return '[Circular]';
        seen.add(value);
      }
      return value;
    });
  } catch {
    return '[unserializable]';
  }
}

const devFormat = combine(
  colorize(),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  piiRedact,
  printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${safeStringify(meta as Record<string, unknown>)}` : '';
    return `${timestamp} [${level}]${metaStr} ${message}`;
  })
);

const prodFormat = combine(
  timestamp(),
  piiRedact,
  json()
);

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  levels: winston.config.npm.levels,
  format: process.env.NODE_ENV === 'production' ? prodFormat : devFormat,
  transports: [
    new winston.transports.Console(),
  ],
});

export default logger;
