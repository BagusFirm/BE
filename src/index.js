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
const server = Hapi.server({
  port: process.env.PORT || 4000,
  host: '0.0.0.0',
  routes: {
    cors: {
      origin: ['https://front-parent.vercel.app'],
      credentials: true // ⬅️ WAJIB agar cookie diterima
    }
  }
});

  // Logging setiap request
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
  
    {
    method: 'OPTIONS',
    path: '/{any*}',
    handler: (request, h) => {
      return h.response().code(200);
    }
  }
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

process.on('uncaughtException', (err) => {
  winston.error('Uncaught Exception: ', err);
  process.exit(1);
});

init();
