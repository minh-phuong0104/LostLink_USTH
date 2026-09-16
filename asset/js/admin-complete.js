(() => {
  'use strict';
  const K={posts:'lostlink_usth_posts_v1',claims:'lostlink_usth_claims_v1',security:'lostlink_usth_security_reports_v1',notifications:'lostlink_usth_notifications_v1'};
  const read=(k)=>{try{return JSON.parse(localStorage.getItem(k)||'[]')}catch{return[]}};
  const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const esc=(v='')=>String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  const fmt=(v)=>{const d=new Date(v);return Number.isNaN(d.getTime())?'—':new Intl.DateTimeFormat('vi-VN',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(d)};
  const toast=(m)=>{if(typeof window.toast==='function')return window.toast(m);let e=document.querySelector('.toast-admin');if(!e){e=document.createElement('div');e.className='toast-admin';document.body.appendChild(e)}e.textContent=m;e.classList.add('show');setTimeout(()=>e.classList.remove('show'),1900)};
  const notify=(title,message,href='claims.html')=>{const a=read(K.notifications);a.unshift({id:`ntf-${Date.now()}`,type:'claim',title,message,href,priority:'high',createdAt:new Date().toISOString(),read:false});write(K.notifications,a.slice(0,80))};

  function completeHandover(claim){
    if(!claim||claim.status!=='verified')return;
    if(!confirm(`Xác nhận đã bàn giao “${claim.itemTitle}” cho ${claim.claimantName} (${claim.claimantStudentId})?`))return;
    const claims=read(K.claims); const c=claims.find(x=>x.id===claim.id); if(!c)return; c.status='completed';c.completedAt=new Date().toISOString();c.updatedAt=c.completedAt;write(K.claims,claims);
    const posts=read(K.posts);const p=posts.find(x=>x.id===c.itemId);if(p){p.status='COMPLETED';p.claimState='COMPLETED';p.completedAt=c.completedAt;p.completedBy=`${c.claimantName} (${c.claimantStudentId})`;write(K.posts,posts)}
    notify('Bàn giao tài sản hoàn tất',`${c.itemTitle} đã được trao trả cho ${c.claimantName}.`,`claim-status.html?code=${encodeURIComponent(c.code)}`);toast('Đã ghi nhận bàn giao thành công');renderSecurityDesk();setTimeout(()=>location.reload(),350);
  }

  function renderSecurityDesk(){
    const host=document.getElementById('adminClaimsList'); if(!host)return;
    let desk=document.getElementById('securityDeskComplete');
    if(!desk){desk=document.createElement('section');desk.id='securityDeskComplete';desk.className='admin-security-desk';host.parentElement.insertBefore(desk,host);}
    const claims=read(K.claims);const verified=claims.filter(c=>c.status==='verified');const posts=read(K.posts).filter(p=>p.type==='FOUND'&&p.status!=='COMPLETED');
    desk.innerHTML=`<div class="security-desk-head"><div><span class="admin-feature-code">PHYSICAL HANDOVER</span><h2>Security Desk · Xác minh tại quầy</h2><p>Nhập mã nhận đồ REC-XXXXXX hoặc mã sinh viên để đối chiếu và ghi nhận bàn giao vật lý.</p></div><span class="security-desk-ready"><strong>${verified.length}</strong> sẵn sàng nhận</span></div><form id="securityDeskVerifyForm" class="security-desk-form"><div class="security-token-input"><i data-lucide="scan-line"></i><input id="securityDeskToken" class="admin-input" placeholder="REC-XXXXXX hoặc BIxx-xxx"><button class="admin-btn primary" type="submit"><i data-lucide="shield-check"></i>Xác minh</button></div></form><div id="securityDeskResult"></div><div class="security-inventory"><div class="security-inventory-head"><h3>Tài sản FOUND đang lưu giữ</h3><span>${posts.length} mục</span></div><div class="security-inventory-grid">${posts.length?posts.slice(0,8).map(p=>`<article><span class="inventory-icon"><i data-lucide="package"></i></span><div><strong>${esc(p.title)}</strong><span>${esc(p.custodyLocation||'Bàn bảo vệ A21 - Phòng 102')}</span><small>${p.isHighValue?'Tài sản giá trị cao · ':''}${esc(p.claimState||'Chưa có claim')}</small></div></article>`).join(''):'<p class="admin-feature-empty">Chưa có tài sản FOUND do người dùng đăng.</p>'}</div></div>`;
    desk.querySelector('#securityDeskVerifyForm').onsubmit=e=>{e.preventDefault();const token=desk.querySelector('#securityDeskToken').value.trim().toLowerCase();const result=desk.querySelector('#securityDeskResult');if(!token){result.innerHTML='';return}const c=claims.find(x=>x.status==='verified'&&(String(x.verificationToken||'').toLowerCase()===token||String(x.claimantStudentId||'').toLowerCase()===token));if(!c){result.innerHTML='<div class="security-verify-result error"><i data-lucide="circle-x"></i><div><strong>Không tìm thấy hồ sơ đã duyệt</strong><span>Kiểm tra mã REC hoặc mã sinh viên.</span></div></div>';if(window.lucide)lucide.createIcons();return}result.innerHTML=`<div class="security-verify-result success"><i data-lucide="badge-check"></i><div><strong>${esc(c.itemTitle)}</strong><span>${esc(c.claimantName)} · ${esc(c.claimantStudentId)} · ${esc(c.verificationToken)}</span><small>Điểm nhận: ${esc(c.pickupOffice||'A21 - Phòng 102')}</small></div><button class="admin-btn primary" type="button" id="securityDeskCompleteBtn"><i data-lucide="package-check"></i>Xác nhận bàn giao</button></div>`;result.querySelector('#securityDeskCompleteBtn').onclick=()=>completeHandover(c);if(window.lucide)lucide.createIcons();};
    if(window.lucide)lucide.createIcons();
  }

  function augmentClaimCards(){
    const root=document.getElementById('adminClaimsList');if(!root)return;const claims=read(K.claims);
    root.querySelectorAll('.admin-feature-card').forEach(card=>{
      const code=card.querySelector('.admin-feature-code')?.textContent?.trim();const claim=claims.find(c=>c.code===code);if(!claim||!claim.answers||card.querySelector('.claim-answer-audit'))return;
      const questions=Array.isArray(claim.verificationQuestions)?claim.verificationQuestions:[];
      const rows=Object.entries(claim.answers).map(([id,answer],i)=>{const q=questions.find(x=>String(x.id)===String(id));return `<div><span>Câu ${i+1}: ${esc(q?.question||id)}</span><strong>${esc(answer)}</strong>${q?.expectedAnswerHint?`<small>Gợi ý người nhặt: ${esc(q.expectedAnswerHint)}</small>`:''}</div>`}).join('');
      const box=document.createElement('div');box.className='claim-answer-audit';box.innerHTML=`<div class="claim-answer-head"><i data-lucide="lock-keyhole"></i><strong>Câu trả lời xác minh bảo mật</strong></div>${rows||'<p>Hồ sơ cũ chưa có câu trả lời theo từng câu hỏi.</p>'}`;
      const actions=card.querySelector('.admin-feature-actions');card.insertBefore(box,actions);});if(window.lucide)lucide.createIcons();
  }

  function enhanceDashboard(){
    const grid=document.querySelector('.stats-grid');if(!grid||document.getElementById('adminReturnRate'))return;const claims=read(K.claims),posts=read(K.posts),security=read(K.security);const complete=claims.filter(c=>c.status==='completed').length;const rate=claims.length?Math.round(complete/claims.length*100):0;grid.insertAdjacentHTML('beforeend',`<div class="stat-card"><div><div class="stat-label">Tỷ lệ bàn giao claim</div><div id="adminReturnRate" class="stat-value">${rate}%</div></div><div class="stat-icon"><i data-lucide="chart-no-axes-combined"></i></div></div><div class="stat-card"><div><div class="stat-label">Tài sản giá trị cao</div><div class="stat-value">${posts.filter(p=>p.isHighValue&&p.status!=='COMPLETED').length}</div></div><div class="stat-icon amber"><i data-lucide="gem"></i></div></div>`);if(window.lucide)lucide.createIcons();
  }

  document.addEventListener('DOMContentLoaded',()=>{renderSecurityDesk();setTimeout(augmentClaimCards,40);enhanceDashboard();const claimsRoot=document.getElementById('adminClaimsList');if(claimsRoot){let busy=false;new MutationObserver(()=>{if(busy)return;busy=true;setTimeout(()=>{augmentClaimCards();renderSecurityDesk();busy=false},20)}).observe(claimsRoot,{childList:true,subtree:false});}document.getElementById('adminClaimSearch')?.addEventListener('input',()=>setTimeout(augmentClaimCards,20));document.getElementById('adminClaimStatus')?.addEventListener('change',()=>setTimeout(augmentClaimCards,20));});
})();
