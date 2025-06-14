const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('SUPABASE_URL dan SUPABASE_KEY harus didefinisikan di .env');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function getDB() {
  return supabase;
}

async function initDB() {
  try {
    console.log('🚀 Menghubungkan ke Supabase...');
    const { data, error } = await supabase.from('forum_posts').select().limit(1);
    
    if (error) throw error;

    console.log('✅ Koneksi Supabase berhasil. Data dummy:', data);
  } catch (err) {
    console.error('❌ Gagal koneksi ke Supabase:', err.message);
    throw err;
  }
}


module.exports = {
  getDB,
  initDB
};
