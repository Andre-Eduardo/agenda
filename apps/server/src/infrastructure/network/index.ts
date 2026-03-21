import * as os from 'node:os';

export function getLocalIPAddress(): string {
    const networkInterfaces = os.networkInterfaces();

    for (const interfaces of Object.values(networkInterfaces)) {
        for (const info of interfaces ?? []) {
            if (info.family === 'IPv4' && info.address !== '127.0.0.1' && !info.internal) {
                return info.address;
            }
        }
    }

    return '127.0.0.1';
}
