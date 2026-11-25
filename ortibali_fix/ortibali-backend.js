/* ORTIBALI Supabase backend adapter — frontend-safe (publishable key only). */
(function () {
  'use strict';
  const MODULES = Object.freeze({
    'monster-rb':'monster_rb', 'monster_rb':'monster_rb', diana:'diana',
    tatalaksana:'tatalaksana', perpustakaan:'perpustakaan', perpus:'perpustakaan',
    kelembagaan:'kelembagaan', 'pelayanan-publik':'pelayanan_publik', pelayanan_publik:'pelayanan_publik', sakip:'sakip'
  });
  const LABELS = {master:'Master Admin', admin_monster:'Admin MONSTER RB', admin_diana:'Admin DIANA', admin_tatalaksana:'Admin Tatalaksana', admin_perpus:'Admin Perpustakaan', admin_kelembagaan:'Admin Kelembagaan', admin_pelayanan:'Admin Pelayanan Publik', admin_sakip:'Admin SAKIP'};
  const bidangForUsername = {admin_monster:'monster_rb',admin_diana:'diana',admin_tatalaksana:'tatalaksana',admin_perpus:'perpustakaan',admin_kelembagaan:'kelembagaan',admin_pelayanan:'pelayanan_publik',admin_sakip:'sakip'};
  const wait = () => new Promise((resolve,reject)=>{let n=0;const t=setInterval(()=>{if(window.ORTIBALI?.supabase){clearInterval(t);resolve(window.ORTIBALI)}else if(++n>100){clearInterval(t);reject(new Error('Koneksi Supabase belum siap. Periksa internet, CDN, dan konfigurasi.'));}},50)});
  async function authLogin(username,password,expectedModule){
    const api=await wait(); const result=await api.signIn(username,password); const p=result.profile||{};
    const uname=String(username||'').trim().toLowerCase(); const expected=MODULES[expectedModule];
    const role=String(p.role||'').toLowerCase(); const bidang=String(p.bidang||'').toLowerCase();
    if(role!=='master' && role!=='admin'){await api.signOut();throw new Error('Profil Supabase tidak memiliki role admin/master.');}
    if(role==='admin' && (!expected || bidang!==expected || bidangForUsername[uname]!==expected)){await api.signOut();throw new Error('Akun ini tidak memiliki akses ke bidang '+(expected||'halaman ini')+'.');}
    if(role==='master' && uname!=='master'){await api.signOut();throw new Error('Akun Master Admin tidak sesuai.');}
    const session={user:result.user,profile:p,username:uname,role,bidang:role==='master'?'*':bidang,display:LABELS[uname]||uname};
    sessionStorage.setItem('ortibaliSupabaseSession',JSON.stringify({username:uname,role,bidang:session.bidang,display:session.display}));
    sessionStorage.setItem('ortibaliLoginUser',uname); sessionStorage.setItem('ortibaliLoginModule',session.bidang);
    window.dispatchEvent(new CustomEvent('ortibali:authenticated',{detail:session})); return session;
  }
  async function logout(){try{const api=await wait();await api.signOut();}finally{['ortibaliSupabaseSession','ortibaliLoginUser','ortibaliLoginModule','ortibaliMonsterSession','ortibaliDianaAccessRole','dianaAdminLoggedIn','ortibaliKelembagaanAccessRole'].forEach(k=>sessionStorage.removeItem(k));}}
  function client(){if(!window.ORTIBALI?.supabase)throw new Error('Supabase belum siap.');return window.ORTIBALI.supabase;}
  async function submit({bidang,title,payload={},files=[]}){
    const c=client(),{data:{user}}=await c.auth.getUser(); if(!user)throw new Error('Silakan login terlebih dahulu.');
    const b=MODULES[bidang]||bidang; const {data:profile,error:pe}=await c.from('profiles').select('role,bidang').eq('id',user.id).single();if(pe)throw pe;
    if(profile.role!=='master'&&profile.bidang!==b)throw new Error('Akses bidang tidak sesuai.');
    const {data:row,error}=await c.from('submissions').insert({bidang:b,title:String(title||'Pengajuan tanpa judul'),payload,status:'pending',created_by:user.id}).select().single();if(error)throw error;
    const uploaded=[]; for(const file of files){const safe=String(file.name).replace(/[^\w.() -]/g,'_');const path=`${user.id}/${row.id}/${Date.now()}-${safe}`;const up=await c.storage.from('ortibali-attachments').upload(path,file,{upsert:false,contentType:file.type||'application/octet-stream'});if(up.error)throw up.error;const meta=await c.from('attachments').insert({submission_id:row.id,file_name:file.name,file_path:path,file_type:file.type||null,file_size:file.size,uploaded_by:user.id});if(meta.error)throw meta.error;uploaded.push(path);}
    const hist=await c.from('verification_history').insert({submission_id:row.id,action:'submitted',note:null,performed_by:user.id});if(hist.error)throw hist.error;return row;
  }
  async function list({bidang}={}){const c=client();let q=c.from('submissions').select('*,attachments(*)').order('created_at',{ascending:false});if(bidang)q=q.eq('bidang',MODULES[bidang]||bidang);const {data,error}=await q;if(error)throw error;return data||[];}
  async function verify(id,decision,note=''){const c=client(),{data:{user}}=await c.auth.getUser();if(!user)throw new Error('Sesi login tidak ditemukan.');const {data:p,error:pe}=await c.from('profiles').select('role').eq('id',user.id).single();if(pe)throw pe;if(p.role!=='master')throw new Error('Hanya Master Admin yang dapat memverifikasi.');if(!['approved','rejected'].includes(decision))throw new Error('Keputusan tidak valid.');if(decision==='rejected'&&!String(note).trim())throw new Error('Catatan revisi wajib diisi.');const status=decision==='approved'?'approved':'rejected';const {data,error}=await c.from('submissions').update({status,reviewed_by:user.id,review_note:String(note||'').trim()||null,reviewed_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq('id',id).select().single();if(error)throw error;const h=await c.from('verification_history').insert({submission_id:id,action:status==='approved'?'approved':'rejected',note:String(note||'').trim()||null,performed_by:user.id});if(h.error)throw h.error;return data;}
  async function resubmit(id,{title,payload,files=[]}){const c=client(),{data:{user}}=await c.auth.getUser();if(!user)throw new Error('Silakan login.');const patch={status:'pending',review_note:null,reviewed_by:null,reviewed_at:null,updated_at:new Date().toISOString()};if(title!==undefined)patch.title=title;if(payload!==undefined)patch.payload=payload;const {data,error}=await c.from('submissions').update(patch).eq('id',id).eq('created_by',user.id).select().single();if(error)throw error;for(const file of files){const path=`${user.id}/${id}/${Date.now()}-${String(file.name).replace(/[^\w.() -]/g,'_')}`;const up=await c.storage.from('ortibali-attachments').upload(path,file);if(up.error)throw up.error;const m=await c.from('attachments').insert({submission_id:id,file_name:file.name,file_path:path,file_type:file.type||null,file_size:file.size,uploaded_by:user.id});if(m.error)throw m.error;}const h=await c.from('verification_history').insert({submission_id:id,action:'resubmitted',note:null,performed_by:user.id});if(h.error)throw h.error;return data;}
  window.ORTIBALI_BACKEND=Object.freeze({authLogin,logout,submit,list,verify,resubmit,modules:MODULES});
})();
