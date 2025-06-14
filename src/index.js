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
      credentials: true, // ⬅️ WAJIB agar cookie diterima
      additionalHeaders: ['cache-control', 'x-requested-with']
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
    return h
      .response('OK')
      .code(200)
      .header('Access-Control-Allow-Origin', 'https://front-parent.vercel.app')
      .header('Access-Control-Allow-Credentials', 'true')
      .header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
      .header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  }
}]);
  // Global CORS handler (termantap)
server.ext('onPreResponse', (request, h) => {
  const response = request.response;

  // Tambahkan CORS headers secara manual
  const headers = {
    'Access-Control-Allow-Origin': 'https://front-parent.vercel.app',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization',
  };

  // Jika response adalah error (Boom)
  if (response.isBoom) {
    Object.entries(headers).forEach(([key, value]) => {
      response.output.headers[key] = value;
    });
    return h.continue;
  }

  winston.info(`🔧 CORS headers added for ${request.path}`);

  // Untuk response biasa
  Object.entries(headers).forEach(([key, value]) => {
    response.header(key, value);
  });

  return h.continue;
});


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
