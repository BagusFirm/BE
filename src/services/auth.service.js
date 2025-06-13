const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDB } = require('../config/db');

const supabase = getDB();

const register = async (payload, h) => {
  const { namaLengkap, email, password } = payload;

  if (!namaLengkap || !email || !password) {
    return h.response({ message: 'Semua field wajib diisi' }).code(400);
  }

  const { data: existingUser, error: findError } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (existingUser) {
    return h.response({ message: 'Email sudah terdaftar' }).code(409);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const { error: insertError } = await supabase.from('users').insert([
    {
      nama_lengkap: namaLengkap,
      email,
      password: hashedPassword
    }
  ]);

  if (insertError) {
    console.error('Gagal insert user:', insertError.message);
    return h.response({ message: 'Gagal registrasi' }).code(500);
  }

  return h.response({ message: 'Registrasi berhasil' }).code(201);
};

const login = async (payload, h) => {
  try {
    const { email, password } = payload;

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return h.response({ message: 'Email tidak ditemukan' }).code(404);
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return h.response({ message: 'Password salah' }).code(401);
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // ✅ Set cookie sebagai HttpOnly
     return h
  .response({ message: 'Login sukses' })
  .state('token', token, {
    ttl: 3600000,
    isHttpOnly: true,
    isSecure: false, // ⬅️ false untuk development
    path: '/',
    sameSite: 'Lax', // ⬅️ gunakan 'Lax' atau 'None' sesuai kebutuhan
    domain: 'localhost' // ⛔ opsional, HAPUS jika tidak perlu
  })
  .code(200);
  } catch (err) {
    console.error('🔥 Login Error:', err.message);
    return h.response({ message: 'Terjadi kesalahan server' }).code(500);
  }
};

const forgotPassword = async (payload, h) => {
  const { email } = payload;

  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (!user) {
    return h.response({ message: 'Email tidak ditemukan' }).code(404);
  }

  const token = Math.random().toString(36).slice(2);
  console.log(`Link reset (simulasi): https://yourdomain.com/reset-password/${token}`);

  return h.response({ message: 'Link reset dikirim (simulasi)' }).code(200);
};

module.exports = { register, login, forgotPassword };
