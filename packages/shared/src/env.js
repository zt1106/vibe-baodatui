import { z } from 'zod';
export const ServerEnv = z.object({
    PORT: z.string().default('3001'),
    DATABASE_URL: z.string().optional(),
    WEB_ORIGINS: z.string().default('http://localhost:3000,http://127.0.0.1:3000')
});
export function loadServerEnv() {
    const parsed = ServerEnv.safeParse(process.env);
    if (!parsed.success) {
        console.error('Invalid env', parsed.error.flatten());
        process.exit(1);
    }
    return parsed.data;
}
