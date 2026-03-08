import { createApp } from './app';
import { config } from './infrastructure/config/env';
import { startNotificationScheduler } from './modules/notifications/notificationScheduler';

const app = createApp();

app.listen(config.port, () => {
  console.log(`Backend listening on port ${config.port}`);
  if (config.enableEmailScheduler) {
    startNotificationScheduler(config.emailSchedulerIntervalMs);
    console.log(`[notifications] scheduler enabled (${Math.max(60000, config.emailSchedulerIntervalMs)}ms interval)`);
  }
});
