const AuthController = require('../controllers/auth.controller');
const path = require('path');
const fs = require('fs');

module.exports = [
  
  {
    method: 'POST',
    path: '/api/model/upload',
    options: {
      payload: {
        output: 'stream',
        parse: true,
        allow: ['multipart/form-data'],
        multipart: true,
        maxBytes: 10 * 1024 * 1024
      }
    },
    handler: async (request, h) => {
      const { label_model, main_model } = request.payload;

      const modelDir = path.join(__dirname, '..', 'ml');

      if (!fs.existsSync(modelDir)) {
        fs.mkdirSync(modelDir);
      }

      const labelPath = path.join(modelDir, 'label_parenting_match_model.pkl');
      const mainPath = path.join(modelDir, 'parenting_match_model.pkl');

      const saveFile = (fileStream, filePath) =>
        new Promise((resolve, reject) => {
          const writeStream = fs.createWriteStream(filePath);
          fileStream.pipe(writeStream);
          fileStream.on('end', resolve);
          fileStream.on('error', reject);
        });

      try {
        await Promise.all([
          saveFile(label_model, labelPath),
          saveFile(main_model, mainPath)
        ]);

        return h.response({ message: 'Model berhasil disimpan di /src/ml' }).code(200);
      } catch (err) {
        console.error('Upload error:', err);
        return h.response({ message: 'Gagal menyimpan model' }).code(500);
      }
    }
  },
  {
    method: 'POST',
    path: '/api/auth/register',
    handler: AuthController.register
  },
  {
    method: 'POST',
    path: '/api/auth/login',
    handler: AuthController.login
  },
  {
  method: 'POST',
  path: '/api/auth/reset-password',
  handler: AuthController.resetPassword
},
  {
    method: 'POST',
    path: '/api/auth/forgot-password',
    handler: AuthController.forgotPassword
  },
  {
  method: 'GET',
  path: '/api/auth/check',
  handler: AuthController.checkAuth
},
{
  method: 'GET',
  path: '/api/auth/me',
  handler: AuthController.getCurrentUser
},
  {
    method: 'POST',
    path: '/api/auth/logout',
    handler: AuthController.logout
  },
  {
  method: 'PUT',
  path: '/api/auth/me',
  handler: AuthController.updateProfile
},
{
  method: 'POST',
  path: '/api/auth/upload-avatar',
  options: {
    payload: {
      output: 'stream',
      parse: true,
      allow: ['multipart/form-data'],
      multipart: true,
      maxBytes: 3 * 1024 * 1024
    }
  },
  handler: AuthController.uploadAvatar
}
];
