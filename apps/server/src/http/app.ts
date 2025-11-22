import express from 'express';

export function buildAllowedOrigins(rawOrigins: string | undefined) {
  const allowedOrigins = new Set(
    (rawOrigins ?? '')
      .split(',')
      .map(origin => origin.trim())
      .filter(Boolean)
  );
  if (allowedOrigins.size === 0) {
    allowedOrigins.add('http://localhost:3000');
  }
  return allowedOrigins;
}

export function createHttpApp(allowedOrigins: Set<string>) {
  const app = express();
  app.use(express.json());

  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && allowedOrigins.has(origin)) {
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Access-Control-Allow-Credentials', 'true');
    }
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PATCH,OPTIONS');
    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }
    next();
  });

  return app;
}
