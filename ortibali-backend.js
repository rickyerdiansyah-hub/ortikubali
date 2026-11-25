/* ORTIBALI shared Supabase workflow service. Frontend-safe: publishable key only. */
(function () {
  'use strict';
  const MODULES = Object.freeze({
    'monster-rb':'monster_rb','monster_rb':'monster_rb',diana:'diana',
    tatalaksana:'tatalaksana',perpustakaan:'perpustakaan',perpus:'perpustakaan',
    kelembagaan:'kelembagaan','pelayanan-publik':'pelayanan_publik',pelayanan_publik:'pelayanan_publik',sakip:'sakip'
  });
  const LABELS = Object.freeze({monster_rb:'MONSTER RB',diana:'DIANA',tatalaksana:'Tatalaksana',perpustakaan:'Perpustakaan',kelembagaan:'Kelembagaan',pelayanan_publik:'Pelayanan Publik',sakip:'SAKIP'});
  const USER_BIDANG = Object.freeze({admin_monster:'monster_rb',admin_diana:'diana',admin_tatalaksana:'tatalaksana',admin_perpus:'perpustakaan',admin_kelembagaan:'kelembagaan',admin_pelayanan:'pelayanan_publik',admin_sakip:'sakip'});
  const BUCKET = 'ortibali-attachments';
  const MAX_FILE = 50 * 1024 * 1024;
  const ALLOWED = new Set(['application/pdf','application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','text/csv','application/octet-stream']);
  const wait = () => new Promise((resolve,reject)=>{let n=0;const t=setInterval(()=>{if(window.ORTIBALI?.supabase){clearInterval(t);resolve(window.ORTIBALI)}else if(++n>160){clearInterval(t);reject(new Error('Koneksi Supabase belum siap. Periksa koneksi internet dan konfigurasi.'));}},50)});
  const client = () => { if(!window.ORTIBALI?.supabase) throw new Error('Supabase belum siap.'); return window.ORTIBALI.supabase; };
  const normalize = v => MODULES[String(v||'').trim().toLowerCase()] || String(v||'').trim().toLowerCase();
  async function current(){const api=await wait();return api.getCurrentUser();}
  async function authLogin(username,password,expectedModule){
    const api=await wait();const result=await api.signIn(username,password);const p=result.profile||{};
    const uname=String(username||'').trim().toLowerCase(),expected=expectedModule?normalize(expectedModule):null;
    const role=String(p.role||'').toLowerCase(),bidang=normalize(p.bidang);
    if(!['master','admin'].includes(role)){await api.signOut();throw new Error('Profil Supabase tidak memiliki role admin/master.');}
    if(role==='admin' && (!bidang || USER_BIDANG[uname]!==bidang || (expected&&bidang!==expected))){await api.signOut();throw new Error('Akun ini tidak memiliki akses ke bidang '+(expected?LABELS[expected]||expected:'yang diminta')+'.');}
    if(role==='master' && uname!=='master'){await api.signOut();throw new Error('Username Master Admin tidak sesuai.');}
    const session={user:result.user,profile:p,username:uname,role,bidang:role==='master'?'*':bidang,display:uname==='master'?'Master Admin':(LABELS[bidang]||bidang)};
    try{sessionStorage.setItem('ortibaliSupabaseSession',JSON.stringify({username:uname,role,bidang:session.bidang,display:session.display}));sessionStorage.setItem('ortibaliLoginUser',uname);sessionStorage.setItem('ortibaliLoginModule',session.bidang);}catch{}
    window.dispatchEvent(new CustomEvent('ortibali:authenticated',{detail:session}));return session;
  }
  async function logout(){try{const api=await wait();await api.signOut();}finally{['ortibaliSupabaseSession','ortibaliLoginUser','ortibaliLoginModule','ortibaliMonsterSession','ortibaliDianaAccessRole','dianaAdminLoggedIn','ortibaliKelembagaanAccessRole'].forEach(k=>{try{sessionStorage.removeItem(k)}catch{}});window.dispatchEvent(new Event('ortibali:logout'));}}
  async function assertAccess(bidang,{masterAllowed=true}={}){const c=client(),{data:{user},error}=await c.auth.getUser();if(error)throw error;if(!user)throw new Error('Silakan login terlebih dahulu.');const {data:profile,error:pe}=await c.from('profiles').select('role,bidang').eq('id',user.id).single();if(pe)throw pe;const b=normalize(bidang);if(profile.role==='master'&&masterAllowed)return {user,profile};if(profile.role!=='admin'||normalize(profile.bidang)!==b)throw new Error('Akses akun tidak sesuai dengan bidang ini.');return {user,profile};}
  async function submit({bidang,title,payload={},files=[]}){
    const b=normalize(bidang);if(!LABELS[b])throw new Error('Bidang pengajuan tidak dikenal.');const {user}=await assertAccess(b);
    if(!String(title||'').trim())throw new Error('Judul pengajuan wajib diisi.');if(!payload||typeof payload!=='object'||Array.isArray(payload))throw new Error('Isi pengajuan harus berupa objek data.');
    const selected=Array.from(files||[]);for(const f of selected){if(f.size>MAX_FILE)throw new Error(`File ${f.name} melebihi batas 50 MB.`);if(f.type&&!ALLOWED.has(f.type)&&!(/\.(pdf|xls|xlsx|csv)$/i).test(f.name))throw new Error(`Format file ${f.name} tidak didukung. Gunakan PDF, XLS, XLSX, atau CSV.`);}
    const c=client();const {data:row,error}=await c.from('submissions').insert({bidang:b,title:String(title).trim(),payload,status:'pending',created_by:user.id}).select().single();if(error)throw error;
    const uploaded=[];
    try{
      for(const file of selected){const safe=String(file.name).replace(/[^\w.() -]/g,'_');const path=`${user.id}/${row.id}/${Date.now()}-${safe}`;const up=await c.storage.from(BUCKET).upload(path,file,{upsert:false,contentType:file.type||'application/octet-stream'});if(up.error)throw up.error;uploaded.push(path);const meta=await c.from('attachments').insert({submission_id:row.id,file_name:file.name,file_path:path,file_type:file.type||null,file_size:file.size,uploaded_by:user.id});if(meta.error)throw meta.error;}
      const hist=await c.from('verification_history').insert({submission_id:row.id,action:'submitted',note:null,performed_by:user.id});if(hist.error)throw hist.error;
      return row;
    }catch(err){if(uploaded.length)await c.storage.from(BUCKET).remove(uploaded).catch(()=>{});await c.from('attachments').delete().eq('submission_id',row.id);await c.from('submissions').delete().eq('id',row.id);throw err;}
  }
  async function list({bidang,scope='all',status}={}){
    const c=client();let q=c.from('submissions').select('*,attachments(*)').order('created_at',{ascending:false});if(bidang)q=q.eq('bidang',normalize(bidang));if(status)q=q.eq('status',status);
    if(scope==='mine'){const {user}=await assertAccess(bidang||'');q=q.eq('created_by',user.id);}const {data,error}=await q;if(error)throw error;return data||[];
  }
  async function listMine(){const c=client(),{data:{user},error:ue}=await c.auth.getUser();if(ue)throw ue;if(!user)throw new Error('Silakan login.');const {data,error}=await c.from('submissions').select('*,attachments(*)').eq('created_by',user.id).order('created_at',{ascending:false});if(error)throw error;return data||[];}
  async function listPending(){const c=client(),{user}=await assertAccess('monster_rb');const {data:p,error:pe}=await c.from('profiles').select('role').eq('id',user.id).single();if(pe)throw pe;if(p.role!=='master')throw new Error('Hanya Master Admin yang dapat melihat antrean verifikasi.');const {data,error}=await c.from('submissions').select('*,attachments(*)').eq('status','pending').order('created_at',{ascending:true});if(error)throw error;return data||[];}
  async function listApproved({bidang}={}){const c=client();let q=c.from('submissions').select('*,attachments(*)').eq('status','approved').is('deleted_at',null).order('reviewed_at',{ascending:false});if(bidang)q=q.eq('bidang',normalize(bidang));const {data,error}=await q; if(error)throw error;return data||[];}
  async function removePublic(id){const c=client(),{user}=await assertAccess('monster_rb');const {data:p,error:pe}=await c.from('profiles').select('role').eq('id',user.id).single();if(pe)throw pe;if(p.role!=='master')throw new Error('Hanya Master Admin yang dapat menghapus data dari publik.');const now=new Date().toISOString();const {data,error}=await c.from('submissions').update({deleted_at:now,deleted_by:user.id,updated_at:now}).eq('id',id).eq('status','approved').is('deleted_at',null).select().single();if(error)throw error;const audit=await c.from('public_removal_audit').insert({submission_id:id,removed_by:user.id,removed_at:now});if(audit.error)throw new Error('Data sudah disembunyikan, tetapi pencatatan audit gagal: '+audit.error.message);return data;}
  async function verify(id,decision,note=''){
    const c=client(),{user}=await assertAccess('monster_rb');const {data:p,error:pe}=await c.from('profiles').select('role').eq('id',user.id).single();if(pe)throw pe;if(p.role!=='master')throw new Error('Hanya Master Admin yang dapat memverifikasi.');
    if(!['approved','rejected'].includes(decision))throw new Error('Keputusan tidak valid.');const clean=String(note||'').trim();if(decision==='rejected'&&!clean)throw new Error('Catatan revisi wajib diisi.');
    const {data:old,error:oe}=await c.from('submissions').select('id,status').eq('id',id).single();if(oe)throw oe;if(old.status!=='pending')throw new Error('Pengajuan ini sudah diproses atau tidak lagi menunggu verifikasi.');
    const status=decision,now=new Date().toISOString();const {data,error}=await c.from('submissions').update({status,reviewed_by:user.id,review_note:clean||null,reviewed_at:now,updated_at:now}).eq('id',id).eq('status','pending').select().single();if(error)throw error;
    const h=await c.from('verification_history').insert({submission_id:id,action:status,note:clean||null,performed_by:user.id});if(h.error){await c.from('submissions').update({status:'pending',reviewed_by:null,review_note:null,reviewed_at:null,updated_at:new Date().toISOString()}).eq('id',id).eq('reviewed_by',user.id);throw new Error('Status tersimpan tetapi riwayat gagal dicatat. Status dikembalikan ke pending. Detail: '+h.error.message);}
    return data;
  }
  async function resubmit(id,{title,payload,files=[]}={}){
    const c=client(),{data:{user},error:ue}=await c.auth.getUser();if(ue)throw ue;if(!user)throw new Error('Silakan login.');const {data:old,error:oe}=await c.from('submissions').select('id,status,bidang,created_by').eq('id',id).single();if(oe)throw oe;if(old.created_by!==user.id)throw new Error('Pengajuan ini bukan milik akun kamu.');if(old.status!=='rejected')throw new Error('Hanya pengajuan yang ditolak yang dapat dikirim ulang.');await assertAccess(old.bidang);
    const patch={status:'pending',review_note:null,reviewed_by:null,reviewed_at:null,updated_at:new Date().toISOString()};if(title!==undefined&&String(title).trim())patch.title=String(title).trim();if(payload!==undefined)patch.payload=payload;
    const {data,error}=await c.from('submissions').update(patch).eq('id',id).eq('created_by',user.id).eq('status','rejected').select().single();if(error)throw error;
    const uploaded=[];try{for(const file of Array.from(files||[])){if(file.size>MAX_FILE)throw new Error(`File ${file.name} melebihi 50 MB.`);const path=`${user.id}/${id}/${Date.now()}-${String(file.name).replace(/[^\w.() -]/g,'_')}`;const up=await c.storage.from(BUCKET).upload(path,file,{upsert:false,contentType:file.type||'application/octet-stream'});if(up.error)throw up.error;uploaded.push(path);const m=await c.from('attachments').insert({submission_id:id,file_name:file.name,file_path:path,file_type:file.type||null,file_size:file.size,uploaded_by:user.id});if(m.error)throw m.error;}
      const h=await c.from('verification_history').insert({submission_id:id,action:'resubmitted',note:null,performed_by:user.id});if(h.error)throw h.error;return data;
    }catch(err){if(uploaded.length)await c.storage.from(BUCKET).remove(uploaded).catch(()=>{});await c.from('submissions').update({status:'rejected',review_note:old.review_note||null,updated_at:new Date().toISOString()}).eq('id',id).eq('created_by',user.id);throw err;}
  }
  async function attachmentUrl(filePath,{expiresIn=300,download=false}={}){const c=client();const {data,error}=await c.storage.from(BUCKET).createSignedUrl(filePath,expiresIn,download?{download:true}:{});if(error)throw error;return data.signedUrl;}
  async function history(id){const c=client();const {data,error}=await c.from('verification_history').select('*').eq('submission_id',id).order('created_at',{ascending:true});if(error)throw error;return data||[];}
  window.ORTIBALI_BACKEND=Object.freeze({authLogin,logout,current,submit,list,listMine,listPending,listApproved,verify,resubmit,removePublic,attachmentUrl,history,modules:MODULES,labels:LABELS});
})();
