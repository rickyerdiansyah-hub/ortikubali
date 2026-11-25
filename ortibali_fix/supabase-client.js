/* Koneksi bersama Supabase untuk ORTIBALI (HTML/CSS/JavaScript biasa).
   Memerlukan supabase-config.js dan CDN supabase-js v2 sebelum file ini. */
(function () {
  'use strict';
  const cfg = window.ORTIBALI_SUPABASE_CONFIG;
  if (!cfg || !cfg.url || !cfg.publishableKey) {
    console.error('[ORTIBALI] Konfigurasi Supabase belum lengkap.'); return;
  }
  if (!window.supabase || typeof window.supabase.createClient !== 'function') {
    console.error('[ORTIBALI] Supabase JS belum dimuat.'); return;
  }
  const client = window.supabase.createClient(cfg.url, cfg.publishableKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });
  const USERNAMES = Object.freeze({
    master: 'master@ortibali.test',
    admin_monster: 'admin_monster@ortibali.test',
    admin_diana: 'admin_diana@ortibali.test',
    admin_tatalaksana: 'admin_tatalaksana@ortibali.test',
    admin_perpus: 'admin_perpus@ortibali.test',
    admin_kelembagaan: 'admin_kelembagaan@ortibali.test',
    admin_pelayanan: 'admin_pelayanan@ortibali.test',
    admin_sakip: 'admin_sakip@ortibali.test'
  });
  function normalizeUsername(value) { return String(value || '').trim().toLowerCase(); }
  async function signIn(username, password) {
    const name = normalizeUsername(username);
    const email = USERNAMES[name] || (name.includes('@') ? name : null);
    if (!email) throw new Error('Username tidak terdaftar pada konfigurasi ORTIBALI.');
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    const { data: profile, error: profileError } = await client
      .from('profiles').select('*').eq('id', data.user.id).maybeSingle();
    if (profileError) throw profileError;
    if (!profile) {
      await client.auth.signOut();
      throw new Error('Profil akun belum terdaftar. Hubungi Master Admin.');
    }
    return { user: data.user, profile };
  }
  async function signOut() { const { error } = await client.auth.signOut(); if (error) throw error; }
  async function getCurrentUser() {
    const { data: { user }, error } = await client.auth.getUser();
    if (error) throw error;
    if (!user) return null;
    const { data: profile, error: profileError } = await client
      .from('profiles').select('*').eq('id', user.id).maybeSingle();
    if (profileError) throw profileError;
    return profile ? { user, profile } : null;
  }
  window.ORTIBALI = Object.freeze({ supabase: client, signIn, signOut, getCurrentUser, usernameMap: USERNAMES });
})();
