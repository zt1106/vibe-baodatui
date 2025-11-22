/**
 * Avatars that are available under `apps/web/public/avatars`. This list keeps both the
 * server and the client in sync about the filenames we can issue to players.
 */
export const AVATAR_FILENAMES = [
    '1F332.png',
    '1F333.png',
    '1F334.png',
    '1F335.png',
    '1F337.png',
    '1F338.png',
    '1F339.png',
    '1F33A.png',
    '1F33B.png',
    '1F3D4.png',
    '1F42D.png',
    '1F42E.png',
    '1F42F.png',
    '1F430.png',
    '1F431.png',
    '1F435.png',
    '1F436.png',
    '1F43B.png',
    '1F43C.png',
    '1F981.png',
    '3d_1.png',
    '3d_4.png',
    'bluey_4.png',
    'memo_12.png',
    'notion_7.png',
    'vibrent_1.png',
    'vibrent_2.png',
    'vibrent_3.png',
    'vibrent_6.png'
];
export function pickRandomAvatar() {
    const index = Math.floor(Math.random() * AVATAR_FILENAMES.length);
    return AVATAR_FILENAMES[index];
}
export const DEFAULT_AVATAR = AVATAR_FILENAMES[0];
