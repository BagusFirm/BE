const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDB } = require('../config/db');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

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
    console.log('🔥 ENV:', process.env.NODE_ENV);
console.log('🔥 Cookie Setting:', {
  isSecure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax'
});
    // ✅ Set cookie sebagai HttpOnly
  return h.response({
  status: 'success',
  message: 'Login sukses',
  token,
  data: {
    user,
    token
  }
})
  .state('token', token, {
    ttl: 3600000,
    isHttpOnly: true,
    isSecure: true,
    isSameSite: 'None',   
    path: '/',
  })
  .code(200);
  } catch (err) {
    console.error('🔥 Login Error:', err.message);
    return h.response({ message: 'Terjadi kesalahan server' }).code(500);
  }
};

const forgotPassword = async (payload, h) => {
  const { email } = payload;

  // Cari user berdasarkan email
  const { data: user, error } = await supabase
    .from('users')
    .select('id, email')
    .eq('email', email)
    .single();

  if (!user) {
    return h.response({ message: 'Email tidak ditemukan' }).code(404);
  }

  // Generate token & expiry 1 jam
  const token = crypto.randomBytes(32).toString('hex');
  const expiredAt = new Date(Date.now() + 3600 * 1000); // 1 jam dari sekarang

  // Simpan ke tabel password_resets
  const { error: insertError } = await supabase
    .from('password_resets')
    .insert([{ user_id: user.id, token, expired_at: expiredAt }]);

  if (insertError) {
    console.error('Gagal menyimpan token reset:', insertError.message);
    return h.response({ message: 'Gagal membuat token reset' }).code(500);
  }

  // Kirim email
  const resetLink = `${process.env.BASE_FRONTEND_URL}/auth/reset-password/${token}`;


  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"ParentCare" <${process.env.MAIL_USER}>`,
    to: user.email,
    subject: 'Reset Password ParentCare',
    html: `
      <p>Halo 👋</p>
      <p>Kami menerima permintaan untuk reset password akun ParentCare kamu.</p>
      <p>Silakan klik tombol di bawah ini untuk mengganti password:</p>
      <p><a href="${resetLink}" style="display:inline-block;padding:12px 20px;background-color:#FFBFA3;color:white;text-decoration:none;border-radius:6px;">Reset Password</a></p>
      <p>Link ini akan kadaluarsa dalam 1 jam.</p>
      <p>Abaikan jika kamu tidak merasa melakukan permintaan ini.</p>
      <p><strong>Salam hangat,<br>Tim ParentCare</strong></p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return h.response({ message: 'Link reset telah dikirim ke email Anda' }).code(200);
  } catch (err) {
    console.error('Gagal mengirim email:', err.message);
    return h.response({ message: 'Gagal mengirim email reset' }).code(500);
  }
};


module.exports = { register, login, forgotPassword };
