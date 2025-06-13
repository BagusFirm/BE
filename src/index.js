// src/index.js

require('dotenv').config();
const Hapi = require('@hapi/hapi');
const winston = require('../src/utils/logger');
const forumRoutes = require('./routes/forum.routes');
const parentMatchRoutes = require('./routes/parentmatch.routes');
const authRoutes = require('./routes/auth.routes');
const { initDB } = require('./config/db');


const init = async () => {
  // Inisialisasi server
 // In your server initialization code (probably where you create the Hapi server)

const server = Hapi.server({
  port: process.env.PORT || 4000,
  host: '0.0.0.0',
  routes: {
    cors: {
      origin: ['https://front-parents.vercel.app'],
      credentials: true // ⬅️ WAJIB agar cookie diterima
    }
  }
});



  // Logging saat server mulai
  server.ext('onRequest', (request, h) => {
    winston.info(`[${request.method.toUpperCase()}] ${request.path}`);
    return h.continue;
  });

  // Inisialisasi koneksi DB
  await initDB();

  // Registrasi routes
  server.route([
    ...forumRoutes,
    ...parentMatchRoutes,
    ...authRoutes,
  ]);

  // Start server
  await server.start();
  console.log(`🚀 Server running at: ${server.info.uri}`);
  winston.info(`Server running at: ${server.info.uri}`);
};

// Global error handler
process.on('unhandledRejection', (err) => {
  winston.error(err);
  process.exit(1);
});

init();
