const ADMIN_POSTS_KEY = 'lostlink_usth_posts_v1';
const ADMIN_CONTACT_FEEDBACK_KEY = 'lostlink_usth_contact_feedback_v1';
const ADMIN_POST_FEEDBACK_KEY = 'lostlink_usth_feedback_v1';
const ADMIN_SESSION_KEY = 'lostlink_usth_admin_session';
const ADMIN_DEMO_EMAIL = 'admin@usth.edu.vn';
const ADMIN_DEMO_PASSWORD = 'Admin123!';

if (window.lucide) lucide.createIcons();

const esc = (v='') => String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
const loadJSON = (key) => { try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; } };
const saveJSON = (key, value) => localStorage.setItem(key, JSON.stringify(value));
const getPosts = () => loadJSON(ADMIN_POSTS_KEY);
const getContactFeedbacks = () => loadJSON(ADMIN_CONTACT_FEEDBACK_KEY);
const getPostFeedbacks = () => loadJSON(ADMIN_POST_FEEDBACK_KEY);
const fmt = (s) => { const d=new Date(s); return Number.isNaN(d.getTime())?'—':new Intl.DateTimeFormat('vi-VN',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(d); };
const rel = (s) => { const d=new Date(s); if(Number.isNaN(d.getTime())) return '—'; const min=Math.floor((Date.now()-d)/60000); if(min<1)return 'Vừa xong'; if(min<60)return `${min} phút trước`; const h=Math.floor(min/60); if(h<24)return `${h} giờ trước`; const day=Math.floor(h/24); return `${day} ngày trước`; };
const feedbackStatus = (s) => s === 'DONE' ? 'RESOLVED' : (s || 'NEW');

function isAdminPage(){ return /\/admin\//.test(location.pathname.replaceAll('\\','/')); }
function requireAdmin(){ if(!isAdminPage() || location.pathname.endsWith('/login.html')) return; if(sessionStorage.getItem(ADMIN_SESSION_KEY)!=='1') location.replace('login.html'); }
requireAdmin();

function toast(message){ let el=document.querySelector('.toast-admin'); if(!el){el=document.createElement('div');el.className='toast-admin';document.body.appendChild(el);} el.textContent=message; el.classList.add('show'); clearTimeout(window.__adminToast); window.__adminToast=setTimeout(()=>el.classList.remove('show'),1800); }

const loginForm=document.getElementById('adminLoginForm');
loginForm?.addEventListener('submit',(e)=>{
  e.preventDefault();
  const email=document.getElementById('adminEmail').value.trim();
  const pass=document.getElementById('adminPassword').value;
  const error=document.getElementById('loginError');
  if(email===ADMIN_DEMO_EMAIL && pass===ADMIN_DEMO_PASSWORD){ sessionStorage.setItem(ADMIN_SESSION_KEY,'1'); location.href='dashboard.html'; }
  else error?.classList.add('show');
});

document.querySelectorAll('[data-admin-logout]').forEach(btn=>btn.addEventListener('click',()=>{sessionStorage.removeItem(ADMIN_SESSION_KEY);location.href='login.html';}));

function stats(){
  const posts=getPosts();
  const contact=getContactFeedbacks();
  return {
    total: posts.filter(p=>p.status!=='DELETED').length,
    lost: posts.filter(p=>p.type==='LOST'&&p.status!=='DELETED').length,
    found: posts.filter(p=>p.type==='FOUND'&&p.status!=='DELETED').length,
    hidden: posts.filter(p=>p.status==='HIDDEN').length,
    feedbackNew: contact.filter(f=>(f.status||'NEW')==='NEW').length,
    feedbackTotal: contact.length,
    postFeedback: getPostFeedbacks().length
  };
}

function renderDashboard(){
  if(!document.body.dataset.adminPage || document.body.dataset.adminPage!=='dashboard') return;
  const s=stats();
  const map={adminTotalPosts:s.total,adminLostPosts:s.lost,adminFoundPosts:s.found,adminNewFeedback:s.feedbackNew};
  Object.entries(map).forEach(([id,val])=>{const el=document.getElementById(id);if(el)el.textContent=val;});
  const recent=document.getElementById('recentAdminPosts');
  const posts=getPosts().filter(p=>p.status!=='DELETED').sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0)).slice(0,5);
  if(recent) recent.innerHTML=posts.length?posts.map(p=>`<div class="recent-row"><div><strong>${esc(p.title)}</strong><span>${p.type==='FOUND'?'Nhặt được':'Thất lạc'} · ${esc(p.location||'USTH')}</span></div><div style="text-align:right"><strong>${esc(p.code||'—')}</strong><span>${rel(p.createdAt)}</span></div></div>`).join(''):`<div class="empty-admin"><i data-lucide="inbox"></i><h3>Chưa có bài người dùng tạo</h3><p>Đăng một bài từ giao diện người dùng để dữ liệu xuất hiện tại đây.</p></div>`;
  const recentFeedback=document.getElementById('recentAdminFeedback');
  const feedback=getContactFeedbacks().sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0)).slice(0,5);
  if(recentFeedback) recentFeedback.innerHTML=feedback.length?feedback.map(f=>`<div class="recent-row"><div><strong>${esc(f.subject||'Phản hồi')}</strong><span>${esc(f.name||'Ẩn danh')} · ${esc(f.email||'Không có email')}</span></div><div style="text-align:right"><span class="admin-badge ${feedbackStatus(f.status)==='NEW'?'badge-new':feedbackStatus(f.status)==='RESOLVED'?'badge-done':'badge-read'}">${feedbackStatus(f.status)==='NEW'?'Mới':feedbackStatus(f.status)==='RESOLVED'?'Đã xử lý':'Đã đọc'}</span><span>${rel(f.createdAt)}</span></div></div>`).join(''):`<div class="empty-admin"><i data-lucide="message-square"></i><h3>Chưa có phản hồi hệ thống</h3><p>Phản hồi từ trang Liên hệ sẽ xuất hiện ở đây.</p></div>`;
  lucide?.createIcons();
}

let postFilter='ALL';
function renderPosts(){
  const tbody=document.getElementById('adminPostsBody'); if(!tbody)return;
  const q=(document.getElementById('adminPostSearch')?.value||'').trim().toLowerCase();
  const type=document.getElementById('adminPostType')?.value||'ALL';
  const status=document.getElementById('adminPostStatus')?.value||'ALL';
  let posts=getPosts().filter(p=>p.status!=='DELETED');
  if(q) posts=posts.filter(p=>`${p.title||''} ${p.location||''} ${p.category||''} ${p.code||''}`.toLowerCase().includes(q));
  if(type!=='ALL') posts=posts.filter(p=>p.type===type);
  if(status!=='ALL') posts=posts.filter(p=>(p.status||'ACTIVE')===status);
  posts.sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0));
  tbody.innerHTML=posts.length?posts.map(p=>`<tr>
    <td class="admin-title-cell"><strong>${esc(p.title)}</strong><span>${esc(p.location||'USTH')} · ${esc(p.category||'Khác')}</span></td>
    <td><span class="admin-badge ${p.type==='FOUND'?'badge-found':'badge-lost'}">${p.type==='FOUND'?'FOUND':'LOST'}</span></td>
    <td><span class="admin-badge ${(p.status||'ACTIVE')==='HIDDEN'?'badge-hidden':'badge-active'}">${esc(p.status||'ACTIVE')}</span></td>
    <td><span class="management-code">${esc(p.code||'—')}<button class="copy-mini" type="button" data-copy-code="${esc(p.code||'')}" title="Sao chép mã"><i data-lucide="copy"></i></button></span></td>
    <td>${fmt(p.createdAt)}</td>
    <td><div class="admin-actions"><button class="admin-btn" type="button" data-view-post="${esc(p.id)}"><i data-lucide="eye"></i>Xem</button><button class="admin-btn warning" type="button" data-toggle-post="${esc(p.id)}"><i data-lucide="${(p.status||'ACTIVE')==='HIDDEN'?'eye':'eye-off'}"></i>${(p.status||'ACTIVE')==='HIDDEN'?'Hiện':'Ẩn'}</button><button class="admin-btn danger" type="button" data-delete-post="${esc(p.id)}"><i data-lucide="trash-2"></i>Xóa</button></div></td>
  </tr>`).join(''):`<tr><td colspan="6"><div class="empty-admin"><i data-lucide="inbox"></i><h3>Không có bài đăng phù hợp</h3><p>Bài do người dùng đăng sẽ hiển thị tại đây cùng mã quản lý.</p></div></td></tr>`;
  bindPostActions(); lucide?.createIcons();
}

function bindPostActions(){
  document.querySelectorAll('[data-copy-code]').forEach(btn=>btn.addEventListener('click',async()=>{const code=btn.dataset.copyCode;if(!code)return;try{await navigator.clipboard.writeText(code);toast(`Đã sao chép ${code}`);}catch{prompt('Sao chép mã quản lý:',code);}}));
  document.querySelectorAll('[data-view-post]').forEach(btn=>btn.addEventListener('click',()=>openPostModal(btn.dataset.viewPost)));
  document.querySelectorAll('[data-toggle-post]').forEach(btn=>btn.addEventListener('click',()=>{const posts=getPosts();const p=posts.find(x=>x.id===btn.dataset.togglePost);if(!p)return;p.status=(p.status||'ACTIVE')==='HIDDEN'?'ACTIVE':'HIDDEN';saveJSON(ADMIN_POSTS_KEY,posts);renderPosts();toast(p.status==='HIDDEN'?'Đã ẩn bài khỏi danh sách':'Đã hiển thị lại bài');}));
  document.querySelectorAll('[data-delete-post]').forEach(btn=>btn.addEventListener('click',()=>{const posts=getPosts();const p=posts.find(x=>x.id===btn.dataset.deletePost);if(!p)return;if(!confirm(`Xóa bài “${p.title}”?`))return;p.status='DELETED';saveJSON(ADMIN_POSTS_KEY,posts);renderPosts();toast('Đã xóa bài đăng');}));
}

function openPostModal(id){
  const p=getPosts().find(x=>x.id===id); if(!p)return;
  const modal=document.getElementById('postDetailModal'); const body=document.getElementById('postDetailBody'); if(!modal||!body)return;
  body.innerHTML=`<dl class="detail-grid">
    <dt>ID bài</dt><dd>${esc(p.id)}</dd>
    <dt>Tiêu đề</dt><dd>${esc(p.title)}</dd>
    <dt>Loại</dt><dd>${p.type==='FOUND'?'FOUND · Nhặt được':'LOST · Thất lạc'}</dd>
    <dt>Trạng thái</dt><dd>${esc(p.status||'ACTIVE')}</dd>
    <dt>Danh mục</dt><dd>${esc(p.category||'—')}</dd>
    <dt>Địa điểm</dt><dd>${esc(p.location||'—')}</dd>
    <dt>Thời gian sự kiện</dt><dd>${fmt(p.eventTime)}</dd>
    <dt>Ngày đăng</dt><dd>${fmt(p.createdAt)}</dd>
    <dt>Mã quản lý</dt><dd><span class="detail-code">${esc(p.code||'—')}</span> <button class="admin-btn" type="button" id="modalCopyCode"><i data-lucide="copy"></i>Sao chép</button></dd>
    <dt>Liên hệ</dt><dd>${esc(p.phone||p.contactPhone||'—')} ${p.email?`· ${esc(p.email)}`:''}</dd>
    <dt>Mô tả</dt><dd>${esc(p.description||'—')}</dd>
  </dl>`;
  modal.classList.add('show');
  document.getElementById('modalCopyCode')?.addEventListener('click',async()=>{const code=p.code||'';try{await navigator.clipboard.writeText(code);toast(`Đã sao chép ${code}`);}catch{prompt('Sao chép mã quản lý:',code);}});
  lucide?.createIcons();
}

document.querySelectorAll('[data-close-modal]').forEach(btn=>btn.addEventListener('click',()=>btn.closest('.admin-modal')?.classList.remove('show')));
document.querySelectorAll('.admin-modal').forEach(modal=>modal.addEventListener('click',e=>{if(e.target===modal)modal.classList.remove('show');}));
['adminPostSearch','adminPostType','adminPostStatus'].forEach(id=>document.getElementById(id)?.addEventListener(id==='adminPostSearch'?'input':'change',renderPosts));

function renderContactFeedback(){
  const list=document.getElementById('adminFeedbackList'); if(!list)return;
  const filter=document.getElementById('feedbackStatus')?.value||'ALL';
  let data=getContactFeedbacks().sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0));
  if(filter!=='ALL')data=data.filter(x=>feedbackStatus(x.status)===filter);
  list.innerHTML=data.length?data.map(f=>{
    const status=feedbackStatus(f.status);
    const code=f.trackingCode||'Chưa có mã';
    return `<article class="feedback-card ${status==='NEW'?'new':''}" data-admin-feedback-card="${esc(f.id)}">
      <div class="feedback-head">
        <div>
          <div class="feedback-code-line"><span class="management-code">${esc(code)}</span>${f.trackingCode?`<button class="copy-mini" type="button" data-copy-feedback-code="${esc(f.trackingCode)}" title="Sao chép mã"><i data-lucide="copy"></i></button>`:''}</div>
          <h4>${esc(f.subject||'Phản hồi hệ thống')}</h4>
          <div class="feedback-meta">${esc(f.name||'Ẩn danh')} · ${esc(f.email||'Không có email')} · ${fmt(f.createdAt)}</div>
        </div>
        <span class="admin-badge ${status==='NEW'?'badge-new':status==='RESOLVED'?'badge-done':'badge-read'}">${status==='RESOLVED'?'Đã xử lý':status==='READ'?'Đã đọc':'Mới'}</span>
      </div>
      <div class="feedback-message">${esc(f.message||f.content||'')}</div>
      <div class="feedback-timeline-admin">
        <span>Gửi: ${fmt(f.createdAt)}</span>
        ${f.readAt?`<span>Đọc: ${fmt(f.readAt)}</span>`:''}
        ${f.resolvedAt?`<span>Xử lý: ${fmt(f.resolvedAt)}</span>`:''}
      </div>
      <div class="admin-reply-box">
        <label for="reply-${esc(f.id)}">Phản hồi của Admin</label>
        <textarea id="reply-${esc(f.id)}" data-admin-reply-input="${esc(f.id)}" placeholder="Nhập nội dung trả lời để người gửi xem bằng mã ${esc(code)}...">${esc(f.adminReply||'')}</textarea>
      </div>
      <div class="feedback-footer">
        <span>${f.phone?`Liên hệ: ${esc(f.phone)}`:`Người gửi tra cứu bằng mã ${esc(code)}`}</span>
        <div class="admin-actions">
          <button class="admin-btn" data-save-feedback-reply="${esc(f.id)}"><i data-lucide="save"></i>Lưu trả lời</button>
          <button class="admin-btn" data-feedback-status="READ" data-feedback-id="${esc(f.id)}"><i data-lucide="eye"></i>Đã đọc</button>
          <button class="admin-btn primary" data-feedback-status="RESOLVED" data-feedback-id="${esc(f.id)}"><i data-lucide="badge-check"></i>Đã xử lý</button>
          <button class="admin-btn danger" data-feedback-delete="${esc(f.id)}"><i data-lucide="trash-2"></i>Xóa</button>
        </div>
      </div>
    </article>`;
  }).join(''):`<div class="empty-admin"><i data-lucide="message-square"></i><h3>Chưa có phản hồi</h3><p>Phản hồi gửi từ trang Liên hệ sẽ hiển thị tại đây.</p></div>`;

  list.querySelectorAll('[data-copy-feedback-code]').forEach(btn=>btn.addEventListener('click',async()=>{
    const code=btn.dataset.copyFeedbackCode;
    try{await navigator.clipboard.writeText(code);toast(`Đã sao chép ${code}`);}catch{prompt('Sao chép mã phản hồi:',code);}
  }));

  list.querySelectorAll('[data-save-feedback-reply]').forEach(btn=>btn.addEventListener('click',()=>{
    const id=btn.dataset.saveFeedbackReply;
    const arr=getContactFeedbacks();
    const item=arr.find(x=>x.id===id); if(!item)return;
    item.adminReply=list.querySelector(`[data-admin-reply-input="${CSS.escape(id)}"]`)?.value.trim()||'';
    saveJSON(ADMIN_CONTACT_FEEDBACK_KEY,arr);
    toast('Đã lưu nội dung trả lời');
  }));

  list.querySelectorAll('[data-feedback-status]').forEach(btn=>btn.addEventListener('click',()=>{
    const arr=getContactFeedbacks();
    const item=arr.find(x=>x.id===btn.dataset.feedbackId); if(!item)return;
    const now=new Date().toISOString();
    const next=btn.dataset.feedbackStatus;
    const reply=list.querySelector(`[data-admin-reply-input="${CSS.escape(item.id)}"]`)?.value.trim()||'';
    item.adminReply=reply;
    item.status=next;
    if(next==='READ' && !item.readAt) item.readAt=now;
    if(next==='RESOLVED'){
      if(!item.readAt)item.readAt=now;
      item.resolvedAt=now;
    }
    saveJSON(ADMIN_CONTACT_FEEDBACK_KEY,arr);
    renderContactFeedback();
    renderDashboard();
    toast(next==='RESOLVED'?'Đã xử lý phản hồi':'Đã đánh dấu đã đọc');
  }));

  list.querySelectorAll('[data-feedback-delete]').forEach(btn=>btn.addEventListener('click',()=>{
    if(!confirm('Xóa phản hồi này? Người gửi sẽ không thể tra cứu mã phản hồi sau khi xóa.'))return;
    saveJSON(ADMIN_CONTACT_FEEDBACK_KEY,getContactFeedbacks().filter(x=>x.id!==btn.dataset.feedbackDelete));
    renderContactFeedback(); renderDashboard(); toast('Đã xóa phản hồi');
  }));
  lucide?.createIcons();
}
document.getElementById('feedbackStatus')?.addEventListener('change',renderContactFeedback);

renderDashboard();
renderPosts();
renderContactFeedback();
