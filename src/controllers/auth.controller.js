const jwt = require('jsonwebtoken');
const { getDB } = require('../config/db');
const supabase = getDB();
const path = require('path');
const fs = require('fs'); // Ini juga kamu butuh buat `fs.createWriteStream` dan `fs.existsSync`

const AuthService = require('../services/auth.service');

const register = async (request, h) => {
  const payload = request.payload;
  console.log('[REGISTER] Payload:', payload);
  return AuthService.register(payload, h);
};

const login = async (request, h) => {
  const payload = request.payload;
  console.log('[LOGIN] Payload:', payload);
  return AuthService.login(payload, h);
};

const checkAuth = async (request, h) => {
  try {
    const token = request.state.token;
    console.log('[CHECK AUTH] Token:', token);

    if (!token) {
      return h.response({ isLoggedIn: false }).code(200);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('[CHECK AUTH] Decoded:', decoded);

    const { data: user, error } = await supabase
      .from('users')
      .select('id, nama_lengkap as name, email')
      .eq('id', decoded.id)
      .single();

    console.log('[CHECK AUTH] DB Response:', { user, error });

    if (error || !user) {
      return h.response({ isLoggedIn: false }).code(200);
    }

    return h.response({ isLoggedIn: true, user }).code(200);
  } catch (err) {
    console.error('[CHECK AUTH ERROR]', err);
    return h.response({ isLoggedIn: false }).code(200);
  }
};

const getCurrentUser = async (request, h) => {
  const token = request.state.token;
  console.log('[GET CURRENT USER] Token:', token);

  if (!token) {
    return h.response({ isLoggedIn: false, user: null }).code(200);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { id } = decoded;
    console.log('[GET CURRENT USER] Decoded:', decoded);

    const { data: user, error } = await supabase
      .from('users')
      .select('id, nama_lengkap, email, avatar')
      .eq('id', id)
      .single();

    console.log('[GET CURRENT USER] DB Response:', { user, error });

    if (error || !user) {
      return h.response({ isLoggedIn: false, user: null }).code(200);
    }

    return h.response({ isLoggedIn: true, user }).code(200);
  } catch (err) {
    console.error('[GET CURRENT USER ERROR]', err);
    return h.response({ isLoggedIn: false, user: null }).code(200);
  }
};

const forgotPassword = async (request, h) => {
  const payload = request.payload;
  console.log('[FORGOT PASSWORD] Payload:', payload);
  return AuthService.forgotPassword(payload, h);
};

const logout = async (request, h) => {
  console.log('[LOGOUT] Clearing token');
  return h
    .response({ message: 'Logout berhasil' })
    .unstate('token')
    .code(200);
};

const updateProfile = async (request, h) => {
  try {
    const token = request.state.token;
    console.log('[UPDATE PROFILE] Token:', token);

    if (!token) {
      return h.response({ message: 'Token tidak ditemukan' }).code(401);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { id } = decoded;
    console.log('[UPDATE PROFILE] Decoded:', decoded);

    const { namaLengkap, email } = request.payload;

    if (!namaLengkap || !email) {
      return h.response({ message: 'Nama lengkap dan email harus diisi' }).code(400);
    }

    const { data: user, error } = await supabase
      .from('users')
      .update({ 
        nama_lengkap: namaLengkap, 
        email,
        updated_at: new Date() 
      })
      .eq('id', id)
      .select('id, nama_lengkap, email')
      .single();

    console.log('[UPDATE PROFILE] DB Response:', { user, error });

    if (error) {
      console.error('Update error:', error);
      return h.response({ message: 'Gagal memperbarui profil' }).code(500);
    }

    return h.response({ message: 'Profil berhasil diperbarui', user }).code(200);
  } catch (err) {
    console.error('[UPDATE PROFILE ERROR]', err);
    return h.response({ message: 'Token tidak valid atau kedaluwarsa' }).code(401);
  }
};

const uploadAvatar = async (request, h) => {
  try {
    const token = request.state.token;
    if (!token) return h.response({ message: 'Token tidak ditemukan' }).code(401);

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;
    const file = request.payload.avatar;

    if (!file || !file.hapi) return h.response({ message: 'File tidak valid' }).code(400);

    // Folder tujuan (pastikan folder ini ada dan bisa diakses)
    const uploadDir = path.join(__dirname, '..', '..', 'public', 'uploads', 'avatars');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    // Simpan file ke folder
    const fileExt = path.extname(file.hapi.filename);
    const fileName = `${userId}_${Date.now()}${fileExt}`;
    const filePath = path.join(uploadDir, fileName);

    const fileStream = fs.createWriteStream(filePath);
    await new Promise((resolve, reject) => {
      file.pipe(fileStream);
      file.on('end', resolve);
      file.on('error', reject);
    });

    // Buat URL publik (misal: http://localhost:3000/uploads/avatars/...)
    const publicUrl = `/uploads/avatars/${fileName}`;
    const fullUrl = `${process.env.BASE_URL || 'https://be-production-0885.up.railway.app'}${publicUrl}`;
    console.log('📁 Simpan file ke:', path.join(__dirname, 'public', 'uploads', 'avatars', fileName));
    console.log('[UPLOAD AVATAR] Public URL:', fullUrl);
    const { data: user, error: updateError } = await supabase
      .from('users')
      .update({ avatar: publicUrl })
      .eq('id', userId)
      .select('id, nama_lengkap, email, avatar')
      .single();

    if (updateError) {
      console.error('Update avatar URL error:', updateError);
      return h.response({ message: 'Gagal simpan URL avatar' }).code(500);
    }

    return h.response({ message: 'Avatar berhasil diperbarui', user }).code(200);
  } catch (err) {
    console.error('[UPLOAD AVATAR ERROR]', err.message);
    return h.response({ message: 'Terjadi kesalahan saat upload avatar' }).code(500);
  }
};

module.exports = {
  register,
  login,
  forgotPassword,
  logout,
  checkAuth,
  getCurrentUser,
  updateProfile,
  uploadAvatar
};
