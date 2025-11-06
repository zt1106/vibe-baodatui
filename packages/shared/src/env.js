import { z } from 'zod';
export const ServerEnv = z.object({
    PORT: z.string().default('3001'),
    DATABASE_URL: z.string().optional()
});
export function loadServerEnv() {
    const parsed = ServerEnv.safeParse(process.env);
    if (!parsed.success) {
        console.error('Invalid env', parsed.error.flatten());
        process.exit(1);
    }
    return parsed.data;
}
