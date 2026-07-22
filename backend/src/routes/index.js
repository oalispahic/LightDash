import publicRoutes from './public.routes.js';
import systemRoutes from './system.routes.js';
import tempRoutes from './temp.routes.js';
import telegramRoutes from './telegram.routes.js';
import deviceRoutes from './device.routes.js';
import firmwareRoutes from './firmware.routes.js';

export function mountRoutes(app) {
  app.use('/', publicRoutes);
  app.use('/', systemRoutes);
  app.use('/temp', tempRoutes);
  app.use('/telegram', telegramRoutes);
  app.use('/device', deviceRoutes);
  app.use('/firmware', firmwareRoutes);
}
