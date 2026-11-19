import app from './app';
import config from './app/config';
import { connectDB } from './app/config/database';
import { Server } from 'http';
import { startSalaryScheduler } from './app/modules/salary/salary.scheduler';
let server: Server;
async function main() {
  try {
    await connectDB();
    server = app.listen(config.port, () => {
      console.log(`Example app listening on port ${config.port}`);
    });
    startSalaryScheduler();
  } catch (error) {
    console.log(error);
  }
}

// Start the HTTP server only when this file is run directly (npm run dev, node dist/server.js).
// When imported by a serverless host such as Vercel, the app is exported and no port is opened.
if (require.main === module) {
  main();
}

process.on('unhandledRejection', (err) => {
  console.log(`😈 unahandledRejection is detected , shutting down ...`, err);
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  }
  process.exit(1);
});

process.on('uncaughtException', () => {
  console.log(`😈 uncaughtException is detected , shutting down ...`);
  process.exit(1);
});

export default app;
