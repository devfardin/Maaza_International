import { Request } from 'express';

export type TClientInfo = {
    ip: string;
    deviceType: 'mobile' | 'tablet' | 'desktop' | 'bot' | 'unknown';
    browser: string;
    os: string;
    userAgent: string;
};

const parseBrowser = (ua: string): string => {
    const rules: [RegExp, string][] = [
        [/Edg(?:e|A|iOS)?\/([\d.]+)/, 'Edge'],
        [/OPR\/([\d.]+)|Opera\/([\d.]+)/, 'Opera'],
        [/SamsungBrowser\/([\d.]+)/, 'Samsung Internet'],
        [/(?:Chrome|CriOS)\/([\d.]+)/, 'Chrome'],
        [/(?:Firefox|FxiOS)\/([\d.]+)/, 'Firefox'],
        [/Version\/([\d.]+).*Safari/, 'Safari'],
        [/MSIE ([\d.]+)|Trident\/.*rv:([\d.]+)/, 'Internet Explorer'],
    ];
    for (const [re, name] of rules) {
        const m = ua.match(re);
        if (m) return `${name} ${(m[1] || m[2] || '').split('.')[0]}`.trim();
    }
    return 'Unknown';
};

const parseOS = (ua: string): string => {
    if (/Windows NT 10/.test(ua)) return 'Windows 10/11';
    if (/Windows NT/.test(ua)) return 'Windows';
    const android = ua.match(/Android ([\d.]+)/);
    if (android) return `Android ${android[1]}`;
    const ios = ua.match(/(?:iPhone|iPad|iPod).*OS ([\d_]+)/);
    if (ios) return `iOS ${ios[1].replace(/_/g, '.')}`;
    const mac = ua.match(/Mac OS X ([\d_]+)/);
    if (mac) return `macOS ${mac[1].replace(/_/g, '.')}`;
    if (/CrOS/.test(ua)) return 'Chrome OS';
    if (/Linux/.test(ua)) return 'Linux';
    return 'Unknown';
};

const parseDevice = (ua: string): TClientInfo['deviceType'] => {
    if (!ua) return 'unknown';
    if (/bot|crawler|spider|curl|wget|postman/i.test(ua)) return 'bot';
    if (/iPad|Tablet|PlayBook|Silk/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua))) return 'tablet';
    if (/Mobi|iPhone|iPod|Android/i.test(ua)) return 'mobile';
    return 'desktop';
};

export const getClientInfo = (req: Request): TClientInfo => {
    const userAgent = String(req.headers['user-agent'] || '').slice(0, 500);
    // req.ip honours the `trust proxy` setting, so it is not spoofable via
    // X-Forwarded-For unless a trusted proxy is configured.
    const ip = (req.ip || req.socket?.remoteAddress || 'unknown').replace(/^::ffff:/, '');
    return {
        ip,
        deviceType: parseDevice(userAgent),
        browser: parseBrowser(userAgent),
        os: parseOS(userAgent),
        userAgent,
    };
};
