import express from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../users/user.constant';
import { RealtimeServices, TRealtimeConnection } from './realtime.services';

const router = express.Router();

const HEARTBEAT_MS = 25_000;

// GET /realtime/stream — long-lived Server-Sent Events connection for the logged-in user.
// Authorization is sent as a normal header (fetch streaming), so the token never sits in the URL.
router.get(
    '/stream',
    auth(USER_ROLE.super_admin, USER_ROLE.admin, USER_ROLE.user),
    (req, res) => {
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            Connection: 'keep-alive',
            'X-Accel-Buffering': 'no', // stop nginx from buffering the stream
        });
        res.flushHeaders();

        const conn: TRealtimeConnection = {
            userId: req.user!.userId,
            role: req.user!.role,
            res,
        };
        RealtimeServices.addConnection(conn);
        RealtimeServices.write(res, 'ready', { connectedAt: new Date().toISOString() });

        // Keeps proxies and browsers from closing an idle connection
        const heartbeat = setInterval(() => RealtimeServices.sendHeartbeat(res), HEARTBEAT_MS);

        req.on('close', () => {
            clearInterval(heartbeat);
            RealtimeServices.removeConnection(conn);
        });
    }
);

export const RealtimeRoutes = router;
