const jwt = require('jsonwebtoken');
const { getDB } = require('../config/db'); // pastikan path benar
const supabase = getDB();

const AuthService = require('../services/auth.service');

const register = async (request, h) => {
  const payload = request.payload;
  return AuthService.register(payload, h);
};

const login = async (request, h) => {
  const payload = request.payload;
  return AuthService.login(payload, h);
};

const checkAuth = async (request, h) => {
  try {
    const token = request.state.token;
    
    if (!token) {
      return h.response({ isLoggedIn: false }).code(200);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const { data: user, error } = await supabase
      .from('users')
      .select('id, nama_lengkap as name, email')
      .eq('id', decoded.id)
      .single();

    if (error || !user) {
      return h.response({ isLoggedIn: false }).code(200);
    }

    return h.response({ 
      isLoggedIn: true,
      user 
    }).code(200);
  } catch (err) {
    return h.response({ isLoggedIn: false }).code(200);
  }
};

const getCurrentUser = async (request, h) => {
  const token = request.state.token;

  if (!token) {
    return h.response({ isLoggedIn: false, user: null }).code(200);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { id } = decoded;

    const { data: user, error } = await supabase
      .from('users')
      .select('id, nama_lengkap, email')
      .eq('id', id)
      .single();

    if (error || !user) {
      return h.response({ isLoggedIn: false, user: null }).code(200);
    }

    return h.response({ isLoggedIn: true, user }).code(200);
  } catch (err) {
    return h.response({ isLoggedIn: false, user: null }).code(200);
  }
};

const forgotPassword = async (request, h) => {
  const payload = request.payload;
  return AuthService.forgotPassword(payload, h);
};

const logout = async (request, h) => {
  return h
    .response({ message: 'Logout berhasil' })
    .unstate('token') // hapus cookie
    .code(200);
};

const updateProfile = async (request, h) => {
  try {
    // Get token from cookie
    const token = request.state.token;
    
    if (!token) {
      return h.response({ message: 'Token tidak ditemukan' }).code(401);
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { id } = decoded;

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

    if (error) {
      console.error('Update error:', error);
      return h.response({ message: 'Gagal memperbarui profil' }).code(500);
    }

    return h.response({ 
      message: 'Profil berhasil diperbarui',
      user 
    }).code(200);
  } catch (err) {
    console.error('Update profile error:', err);
    return h.response({ message: 'Token tidak valid atau kedaluwarsa' }).code(401);
  }
};


module.exports = { register, login, forgotPassword, logout, checkAuth, getCurrentUser, updateProfile };

