(() => {
  'use strict';
  const K = {
    posts:'lostlink_usth_posts_v1',
    claims:'lostlink_usth_claims_v1',
    security:'lostlink_usth_security_reports_v1',
    notifications:'lostlink_usth_notifications_v1'
  };
  const read = (key) => { try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; } };
  const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const esc = (v='') => String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  const fmt = (value) => { const d=new Date(value); return Number.isNaN(d.getTime())?'—':new Intl.DateTimeFormat('vi-VN',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(d); };
  const code = (prefix) => { const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s=''; for(let i=0;i<6;i++)s+=chars[Math.floor(Math.random()*chars.length)]; return `${prefix}-${s}`; };
  const notify = (title,message,href='claim-status.html',type='claim',priority='high') => {
    const list=read(K.notifications); list.unshift({id:`ntf-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,title,message,href,type,priority,createdAt:new Date().toISOString(),read:false}); write(K.notifications,list.slice(0,80));
  };
  const adminToast = (message) => { if (typeof window.toast === 'function') return window.toast(message); let el=document.querySelector('.toast-admin'); if(!el){el=document.createElement('div');el.className='toast-admin';document.body.appendChild(el);} el.textContent=message;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),1800); };

  function injectAdminNav(){
    const nav=document.querySelector('.admin-nav'); if(!nav)return;
    if(!nav.querySelector('a[href="claims.html"]')){
      const feedback=nav.querySelector('a[href="feedback.html"]');
      const claim=document.createElement('a'); claim.href='claims.html'; claim.innerHTML='<i data-lucide="badge-check"></i><span>Yêu cầu nhận đồ</span>';
      const sec=document.createElement('a'); sec.href='security.html'; sec.innerHTML='<i data-lucide="shield-alert"></i><span>Báo cáo an ninh</span>';
      if(feedback){nav.insertBefore(claim,feedback);nav.insertBefore(sec,feedback);}else{nav.append(claim,sec);}
    }
    const page=(location.pathname.split('/').pop()||'').toLowerCase();
    nav.querySelectorAll('a').forEach(a=>a.classList.toggle('active',a.getAttribute('href')===page));
  }

  function enhanceDashboard(){
    const grid=document.querySelector('.stats-grid'); if(!grid || document.getElementById('adminPendingClaims'))return;
    const claims=read(K.claims); const security=read(K.security);
    const pending=claims.filter(c=>c.status==='pending_review').length;
    const urgent=security.filter(r=>r.status!=='resolved' && r.urgency==='urgent').length;
    grid.insertAdjacentHTML('beforeend',`<div class="stat-card"><div><div class="stat-label">Yêu cầu chờ duyệt</div><div id="adminPendingClaims" class="stat-value">${pending}</div></div><div class="stat-icon"><i data-lucide="badge-check"></i></div></div><div class="stat-card"><div><div class="stat-label">Cảnh báo an ninh</div><div id="adminSecurityAlerts" class="stat-value">${urgent}</div></div><div class="stat-icon amber"><i data-lucide="shield-alert"></i></div></div>`);
  }

  function claimLabel(status){return ({pending_review:'Chờ xác minh',verified:'Đã duyệt',rejected:'Từ chối',completed:'Đã bàn giao'})[status]||status;}
  function renderClaims(){
    const root=document.getElementById('adminClaimsList'); if(!root)return;
    const filter=document.getElementById('adminClaimStatus')?.value||'ALL';
    const q=(document.getElementById('adminClaimSearch')?.value||'').trim().toLowerCase();
    const list=read(K.claims).filter(c=>(filter==='ALL'||c.status===filter)&&(!q||[c.code,c.itemTitle,c.claimantName,c.claimantStudentId].join(' ').toLowerCase().includes(q))).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
    root.innerHTML=list.length?list.map(c=>`<article class="admin-feature-card"><div class="admin-feature-card__top"><div><span class="admin-feature-code">${esc(c.code)}</span><h3>${esc(c.itemTitle)}</h3><p>${esc(c.claimantName)} · ${esc(c.claimantStudentId)} · ${esc(c.claimantContact)}</p></div><span class="admin-feature-status ${esc(c.status)}">${claimLabel(c.status)}</span></div><div class="admin-feature-grid"><div><span>Đặc điểm riêng</span><strong>${esc(c.privateFeature)}</strong></div><div><span>Bằng chứng sở hữu</span><strong>${esc(c.proof)}</strong></div><div><span>Gửi lúc</span><strong>${fmt(c.createdAt)}</strong></div><div><span>Mã nhận đồ</span><strong>${esc(c.verificationToken||'Chưa cấp')}</strong></div></div>${c.adminNote?`<div class="admin-feature-note">${esc(c.adminNote)}</div>`:''}<div class="admin-feature-actions">${c.status==='pending_review'?`<button class="admin-btn primary" data-claim-approve="${esc(c.id)}"><i data-lucide="check"></i>Duyệt & cấp mã</button><button class="admin-btn danger" data-claim-reject="${esc(c.id)}"><i data-lucide="x"></i>Từ chối</button>`:''}${c.status==='verified'?`<button class="admin-btn primary" data-claim-complete="${esc(c.id)}"><i data-lucide="package-check"></i>Xác nhận bàn giao</button>`:''}<a class="admin-btn" href="../claim-status.html?code=${encodeURIComponent(c.code)}" target="_blank"><i data-lucide="external-link"></i>Xem tra cứu</a></div></article>`).join(''):'<div class="admin-feature-empty"><i data-lucide="badge-check"></i><h3>Chưa có yêu cầu phù hợp</h3><p>Khi người dùng yêu cầu nhận lại đồ, hồ sơ sẽ xuất hiện ở đây.</p></div>';
    bindClaimActions(); if(window.lucide)lucide.createIcons();
  }

  function bindClaimActions(){
    document.querySelectorAll('[data-claim-approve]').forEach(btn=>btn.addEventListener('click',()=>{
      const claims=read(K.claims); const c=claims.find(x=>x.id===btn.dataset.claimApprove); if(!c)return;
      const note=prompt('Ghi chú xác minh (có thể để trống):',c.adminNote||'Thông tin đối chiếu phù hợp.') ?? c.adminNote ?? '';
      c.status='verified'; c.verificationToken=c.verificationToken||code('REC'); c.adminNote=note; c.updatedAt=new Date().toISOString(); write(K.claims,claims);
      const posts=read(K.posts); const p=posts.find(x=>x.id===c.itemId); if(p){p.claimState='VERIFIED_READY';p.updatedAt=new Date().toISOString();write(K.posts,posts);}
      notify('Yêu cầu nhận đồ đã được duyệt',`${c.itemTitle} · Mã nhận đồ ${c.verificationToken}`,`claim-status.html?code=${encodeURIComponent(c.code)}`,'claim','high'); adminToast('Đã duyệt hồ sơ và cấp mã nhận đồ'); renderClaims();
    }));
    document.querySelectorAll('[data-claim-reject]').forEach(btn=>btn.addEventListener('click',()=>{
      const claims=read(K.claims); const c=claims.find(x=>x.id===btn.dataset.claimReject); if(!c)return;
      const reason=prompt('Lý do từ chối / cần bổ sung:','Thông tin xác minh chưa đủ khớp.'); if(reason===null)return;
      c.status='rejected';c.adminNote=reason;c.updatedAt=new Date().toISOString();write(K.claims,claims);
      const posts=read(K.posts); const p=posts.find(x=>x.id===c.itemId); if(p){p.claimState='REJECTED';write(K.posts,posts);}
      notify('Yêu cầu nhận đồ cần bổ sung',`${c.itemTitle} · xem ghi chú từ bàn trực`,`claim-status.html?code=${encodeURIComponent(c.code)}`,'claim','high'); adminToast('Đã cập nhật trạng thái từ chối');renderClaims();
    }));
    document.querySelectorAll('[data-claim-complete]').forEach(btn=>btn.addEventListener('click',()=>{
      const claims=read(K.claims); const c=claims.find(x=>x.id===btn.dataset.claimComplete); if(!c)return;
      if(!confirm(`Xác nhận đã bàn giao “${c.itemTitle}” cho ${c.claimantName}?`))return;
      c.status='completed';c.updatedAt=new Date().toISOString();c.completedAt=new Date().toISOString();write(K.claims,claims);
      const posts=read(K.posts); const p=posts.find(x=>x.id===c.itemId); if(p){p.status='COMPLETED';p.claimState='COMPLETED';p.completedAt=new Date().toISOString();p.completedBy=`${c.claimantName} (${c.claimantStudentId})`;write(K.posts,posts);}
      notify('Bàn giao tài sản hoàn tất',`${c.itemTitle} đã được ghi nhận trao trả thành công.`,`claim-status.html?code=${encodeURIComponent(c.code)}`,'claim','normal'); adminToast('Đã ghi nhận bàn giao hoàn tất');renderClaims();
    }));
  }

  function securityLabel(status){return ({investigating:'Đang điều tra',patrol_dispatched:'Đã cử tuần tra',resolved:'Đã xử lý'})[status]||status;}
  function renderSecurity(){
    const root=document.getElementById('adminSecurityList'); if(!root)return;
    const filter=document.getElementById('adminSecurityStatus')?.value||'ALL';
    const list=read(K.security).filter(r=>filter==='ALL'||r.status===filter).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
    root.innerHTML=list.length?list.map(r=>`<article class="admin-feature-card ${r.urgency==='urgent'?'urgent':''}"><div class="admin-feature-card__top"><div><span class="admin-feature-code">${esc(r.code)}</span><h3>${esc(r.category.replaceAll('_',' '))}</h3><p>${esc(r.location)}${r.specificLocation?` · ${esc(r.specificLocation)}`:''}</p></div><div class="admin-feature-status-stack"><span class="admin-feature-status ${esc(r.status)}">${securityLabel(r.status)}</span>${r.urgency==='urgent'?'<span class="admin-urgent-chip">KHẨN</span>':''}</div></div><div class="admin-feature-description">${esc(r.description)}</div><div class="admin-feature-grid"><div><span>Người báo</span><strong>${r.anonymous?'Ẩn danh':esc(r.reporterName||'—')}</strong></div><div><span>Liên hệ</span><strong>${r.anonymous?'Ẩn danh':esc(r.reporterContact||'—')}</strong></div><div><span>Thời gian</span><strong>${fmt(r.createdAt)}</strong></div><div><span>Ghi chú</span><strong>${esc(r.adminNote||'Chưa có')}</strong></div></div><div class="admin-feature-actions">${r.status!=='investigating'?`<button class="admin-btn" data-sec-status="investigating" data-sec-id="${esc(r.id)}">Đang điều tra</button>`:''}${r.status!=='patrol_dispatched'?`<button class="admin-btn" data-sec-status="patrol_dispatched" data-sec-id="${esc(r.id)}">Cử tuần tra</button>`:''}${r.status!=='resolved'?`<button class="admin-btn primary" data-sec-status="resolved" data-sec-id="${esc(r.id)}">Đánh dấu đã xử lý</button>`:''}</div></article>`).join(''):'<div class="admin-feature-empty"><i data-lucide="shield-check"></i><h3>Chưa có báo cáo</h3><p>Các báo cáo an ninh từ người dùng sẽ xuất hiện tại đây.</p></div>';
    document.querySelectorAll('[data-sec-status]').forEach(btn=>btn.addEventListener('click',()=>{
      const arr=read(K.security);const item=arr.find(x=>x.id===btn.dataset.secId);if(!item)return;const next=btn.dataset.secStatus;const note=prompt('Ghi chú xử lý (có thể để trống):',item.adminNote||'') ;if(note===null)return;item.status=next;item.adminNote=note;item.updatedAt=new Date().toISOString();write(K.security,arr);notify('Cập nhật báo cáo an ninh',`${item.code} · ${securityLabel(next)}`,'security-report.html','security',next==='patrol_dispatched'?'urgent':'normal');adminToast('Đã cập nhật báo cáo an ninh');renderSecurity();
    }));
    if(window.lucide)lucide.createIcons();
  }

  document.addEventListener('DOMContentLoaded',()=>{
    injectAdminNav();enhanceDashboard();renderClaims();renderSecurity();
    document.getElementById('adminClaimStatus')?.addEventListener('change',renderClaims);
    document.getElementById('adminClaimSearch')?.addEventListener('input',renderClaims);
    document.getElementById('adminSecurityStatus')?.addEventListener('change',renderSecurity);
    if(window.lucide)lucide.createIcons();
  });
})();
