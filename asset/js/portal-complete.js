(() => {
  'use strict';

  const K = {
    posts: 'lostlink_usth_posts_v1',
    claims: 'lostlink_usth_claims_v1',
    security: 'lostlink_usth_security_reports_v1',
    notifications: 'lostlink_usth_notifications_v1',
    preferences: 'lostlink_usth_ui_preferences_v1',
    role: 'lostlink_usth_role_v1'
  };
  const read = (key, fallback = []) => { try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; } };
  const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const esc = (v='') => String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  const fmt = (value) => { const d = new Date(value); return Number.isNaN(d.getTime()) ? '—' : new Intl.DateTimeFormat('vi-VN',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(d); };
  const rel = (value) => { const d=new Date(value); if(Number.isNaN(d.getTime()))return 'Vừa xong'; const m=Math.max(0,Math.floor((Date.now()-d)/60000)); if(m<1)return 'Vừa xong'; if(m<60)return `${m} phút trước`; const h=Math.floor(m/60); if(h<24)return `${h} giờ trước`; return `${Math.floor(h/24)} ngày trước`; };
  const makeCode = (prefix) => { const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s=''; for(let i=0;i<6;i++)s+=chars[Math.floor(Math.random()*chars.length)]; return `${prefix}-${s}`; };

  const sampleItems = (window.LOSTLINK_POSTS || []).map(p => ({...p, href: demoPostHref(p)}));

  const addNotification = (payload) => {
    if (typeof window.addPortalNotification === 'function') return window.addPortalNotification(payload);
    const list=read(K.notifications); list.unshift({id:`ntf-${Date.now()}`,createdAt:new Date().toISOString(),read:false,priority:'normal',...payload}); write(K.notifications,list.slice(0,80));
  };

  function injectExtendedNavigation(){
    document.querySelectorAll('.main-nav').forEach(nav => {
      const insertBefore = nav.querySelector('a[href="contact.html"]') || nav.lastElementChild;
      const add = (href,label,key) => {
        if(nav.querySelector(`a[href="${href}"]`)) return;
        const a=document.createElement('a'); a.href=href; a.dataset.nav=key; a.textContent=label;
        if(insertBefore) nav.insertBefore(a,insertBefore); else nav.appendChild(a);
      };
      add('search.html','Tra cứu','search');
      if(!nav.querySelector('a[href="campus-map.html"]')) add('campus-map.html','Bản đồ','map');
    });
    document.querySelectorAll('.header-actions [aria-label="Tìm kiếm"]').forEach(el=>{if(el.tagName==='A')el.setAttribute('href','search.html');else el.onclick=()=>location.href='search.html';});
    const page=(location.pathname.split('/').pop()||'Index.html').toLowerCase();
    const map={ 'search.html':'search','campus-map.html':'map','claims.html':'claims','security-center.html':'security' };
    if(map[page]) document.querySelectorAll('.main-nav a').forEach(a=>a.classList.toggle('active',a.dataset.nav===map[page]));
  }

  function injectRoleSwitcher(){
    const actions=document.querySelector('.header-actions');
    if(!actions || document.getElementById('portalRoleSwitch')) return;
    const role=localStorage.getItem(K.role)||'student';
    const btn=document.createElement('button');
    btn.type='button'; btn.id='portalRoleSwitch'; btn.className=`portal-role-switch ${role==='officer'?'officer':''}`;
    const paint=()=>{ const r=localStorage.getItem(K.role)||'student'; btn.classList.toggle('officer',r==='officer'); btn.innerHTML=r==='officer'?'<i data-lucide="shield"></i><span>Security</span>':'<i data-lucide="user"></i><span>Student</span>'; btn.title=r==='officer'?'Mở khu vực Security/Admin':'Chuyển sang chế độ Security'; if(window.lucide)lucide.createIcons(); };
    paint();
    btn.addEventListener('click',()=>{
      const r=localStorage.getItem(K.role)||'student';
      if(r==='student') { localStorage.setItem(K.role,'officer'); paint(); if(confirm('Đã chuyển sang chế độ Security. Mở Security Desk?')) location.href='admin/claims.html'; }
      else { localStorage.setItem(K.role,'student'); paint(); }
    });
    const primary=actions.querySelector('.btn-header'); actions.insertBefore(btn,primary||actions.firstChild);
  }

  function enhanceAppearanceSettings(){
    const old=document.querySelector('.portal-appearance'); if(old) old.remove();
    if(document.querySelector('.admin-shell')) return;
    const pref=read(K.preferences,{theme:'azure',clarity:'ultra_clear',wallpaper:'campus',customWallpaperUrl:'',dimming:10,blur:0,showBlobs:true});
    const wrap=document.createElement('div'); wrap.className='portal-appearance portal-appearance-complete';
    wrap.innerHTML=`<button class="portal-appearance-button" id="portalAppearanceButton" type="button" aria-label="Tùy chỉnh giao diện"><i data-lucide="sliders-horizontal"></i></button>
    <div class="portal-appearance-panel portal-appearance-panel-full" id="portalAppearancePanel" hidden>
      <div class="appearance-head"><div><span class="portal-kicker">LIQUID GLASS</span><strong>Ảnh nền & Kính</strong></div><button type="button" id="appearanceClose"><i data-lucide="x"></i></button></div>
      <label>Sắc thái nền<select id="portalThemeSelect"><option value="azure">Azure</option><option value="indigo">Indigo</option><option value="teal">Teal</option><option value="violet">Violet</option></select></label>
      <label>Độ trong của kính<select id="portalClaritySelect"><option value="ultra_clear">Ultra clear · 90%</option><option value="crystal_glass">Crystal · 80%</option><option value="frosted_glass">Frosted · 65%</option></select></label>
      <label>Ảnh nền<select id="portalWallpaperSelect"><option value="campus">Campus USTH</option><option value="clean">Sáng tối giản</option><option value="twilight">Twilight</option><option value="custom">Ảnh tùy chỉnh</option></select></label>
      <label class="appearance-upload" id="customWallpaperRow">Chọn ảnh nền riêng<input id="portalCustomWallpaper" type="file" accept="image/*"></label>
      <label>Độ tối <output id="dimmingOutput">${Number(pref.dimming||0)}%</output><input id="portalDimming" type="range" min="0" max="55" value="${Number(pref.dimming||0)}"></label>
      <label>Độ blur <output id="blurOutput">${Number(pref.blur||0)}px</output><input id="portalBlur" type="range" min="0" max="18" value="${Number(pref.blur||0)}"></label>
      <label class="portal-toggle-row"><input id="portalBlobs" type="checkbox" ${pref.showBlobs!==false?'checked':''}><span>Hiệu ứng liquid blobs</span></label>
      <div class="appearance-actions"><button type="button" class="btn btn-secondary" id="appearanceReset">Khôi phục mặc định</button></div>
    </div>`;
    document.body.appendChild(wrap);
    const panel=wrap.querySelector('#portalAppearancePanel');
    const getPref=()=>read(K.preferences,{theme:'azure',clarity:'ultra_clear',wallpaper:'campus',customWallpaperUrl:'',dimming:10,blur:0,showBlobs:true});
    const savePref=(partial)=>{ const next={...getPref(),...partial}; write(K.preferences,next); applyFullPreferences(next); sync(); };
    const sync=()=>{ const p=getPref(); wrap.querySelector('#portalThemeSelect').value=p.theme||'azure'; wrap.querySelector('#portalClaritySelect').value=p.clarity||'ultra_clear'; wrap.querySelector('#portalWallpaperSelect').value=p.wallpaper||'campus'; wrap.querySelector('#portalDimming').value=Number(p.dimming||0); wrap.querySelector('#portalBlur').value=Number(p.blur||0); wrap.querySelector('#portalBlobs').checked=p.showBlobs!==false; wrap.querySelector('#dimmingOutput').textContent=`${Number(p.dimming||0)}%`; wrap.querySelector('#blurOutput').textContent=`${Number(p.blur||0)}px`; wrap.querySelector('#customWallpaperRow').hidden=(p.wallpaper||'campus')!=='custom'; };
    wrap.querySelector('#portalAppearanceButton').onclick=()=>panel.hidden=!panel.hidden;
    wrap.querySelector('#appearanceClose').onclick=()=>panel.hidden=true;
    wrap.querySelector('#portalThemeSelect').onchange=e=>savePref({theme:e.target.value});
    wrap.querySelector('#portalClaritySelect').onchange=e=>savePref({clarity:e.target.value});
    wrap.querySelector('#portalWallpaperSelect').onchange=e=>savePref({wallpaper:e.target.value});
    wrap.querySelector('#portalDimming').oninput=e=>savePref({dimming:Number(e.target.value)});
    wrap.querySelector('#portalBlur').oninput=e=>savePref({blur:Number(e.target.value)});
    wrap.querySelector('#portalBlobs').onchange=e=>savePref({showBlobs:e.target.checked});
    wrap.querySelector('#portalCustomWallpaper').onchange=e=>{
      const file=e.target.files?.[0]; if(!file)return; if(!file.type.startsWith('image/')) return alert('Vui lòng chọn tệp ảnh.'); if(file.size>2*1024*1024)return alert('Ảnh nền demo nên nhỏ hơn 2MB.');
      const reader=new FileReader(); reader.onload=()=>savePref({wallpaper:'custom',customWallpaperUrl:reader.result}); reader.readAsDataURL(file);
    };
    wrap.querySelector('#appearanceReset').onclick=()=>{ const d={theme:'azure',clarity:'ultra_clear',wallpaper:'campus',customWallpaperUrl:'',dimming:10,blur:0,showBlobs:true}; write(K.preferences,d); applyFullPreferences(d); sync(); };
    sync(); if(window.lucide)lucide.createIcons();
  }

  function applyFullPreferences(pref=read(K.preferences,{})){
    const p={theme:'azure',clarity:'ultra_clear',wallpaper:'campus',customWallpaperUrl:'',dimming:10,blur:0,showBlobs:true,...pref};
    document.body.dataset.portalTheme=p.theme; document.body.dataset.portalClarity=p.clarity;
    document.documentElement.style.setProperty('--portal-dimming',String(Number(p.dimming||0)/100));
    document.documentElement.style.setProperty('--portal-wall-blur',`${Number(p.blur||0)}px`);
    document.body.dataset.wallpaper=p.wallpaper;
    if(p.wallpaper==='custom'&&p.customWallpaperUrl) document.documentElement.style.setProperty('--portal-custom-wallpaper',`url("${String(p.customWallpaperUrl).replaceAll('"','%22')}")`); else document.documentElement.style.removeProperty('--portal-custom-wallpaper');
    document.body.classList.toggle('portal-no-blobs',p.showBlobs===false);
  }


  function renderDemoDetail(){
    if(!document.getElementById('detailTitle')) return null;
    const q=new URLSearchParams(location.search); if(q.get('demo')!=='1') return null;
    const item={id:`demo-${Date.now()}`,type:q.get('type')||'LOST',title:q.get('title')||'Tài sản USTH',location:q.get('location')||'USTH',category:q.get('category')||'Khác',description:q.get('desc')||'',image:q.get('image')||'',status:'ACTIVE',isHighValue:(q.get('category')||'').toLowerCase().includes('điện tử'),custodyLocation:'Bàn bảo vệ A21 - Phòng 102',verificationChallenges:[{id:'demo-q1',question:'Mô tả một đặc điểm riêng chỉ chủ sở hữu biết',required:true},{id:'demo-q2',question:'Tài sản có phụ kiện, nội dung hoặc dấu hiệu nào đặc biệt?',required:false}]};
    document.getElementById('detailTitle').textContent=item.title; document.title=`${item.title} | Lost&Found USTH`;
    const img=document.getElementById('detailImage'); if(img&&item.image){img.src=item.image;img.alt=item.title} document.querySelectorAll('.thumb img').forEach(x=>{if(item.image)x.src=item.image;x.alt=item.title});
    const badge=document.getElementById('detailTypeBadge'); if(badge){badge.textContent=item.type==='FOUND'?'Nhặt được':'Thất lạc';badge.className=`badge ${item.type==='FOUND'?'found':'lost'}`}
    const meta=document.querySelectorAll('.detail-meta .meta-box'); if(meta[0])meta[0].querySelector('div').innerHTML=`<strong>Danh mục</strong><br>${esc(item.category)}`; if(meta[1])meta[1].querySelector('div').innerHTML=`<strong>Địa điểm</strong><br>${esc(item.location)}`; if(meta[3])meta[3].querySelector('div').innerHTML='<strong>Trạng thái</strong><br>Đang hoạt động';
    const date=q.get('createdAt');
    if (date) {
      document.getElementById('detailTime').textContent=rel(date);
      if(meta[2]) meta[2].querySelector('div').innerHTML=`<strong>Thời gian</strong><br>${esc(fmt(date))}`;
    }
    const desc=document.querySelector('.detail-description p'); if(desc)desc.textContent=item.description;
    const crumbs=document.querySelectorAll('.breadcrumbs a'); if(crumbs[1]){crumbs[1].textContent=item.type==='FOUND'?'Tin nhặt được':'Tin thất lạc';crumbs[1].href=item.type==='FOUND'?'found.html':'lost.html'}
    if(item.type==='FOUND'){
      const actions=document.querySelector('.detail-actions'); if(actions&&!document.getElementById('secureClaimBtn')){const b=document.createElement('button');b.id='secureClaimBtn';b.className='btn btn-secure-claim';b.type='button';b.innerHTML='<i data-lucide="shield-check"></i>Yêu cầu nhận lại đồ';actions.prepend(b);b.onclick=()=>openEnhancedClaim(item)}
    }
    if(window.lucide)lucide.createIcons(); return item;
  }

  function setupFoundSecurityForm(){
    const form=document.getElementById('postForm'); const section=document.getElementById('foundSecuritySection'); if(!form||!section)return;
    const sync=()=>{ const found=form.querySelector('input[name="type"]:checked')?.value==='FOUND'; section.hidden=!found; section.querySelectorAll('[data-found-required]').forEach(el=>el.required=found); };
    form.querySelectorAll('input[name="type"]').forEach(r=>r.addEventListener('change',sync)); sync();
  }

  function getItemForDetail(){
    const id=new URLSearchParams(location.search).get('id');
    return read(K.posts).find(p=>p.id===id) || null;
  }

  function openEnhancedClaim(post){
    let modal=document.getElementById('secureClaimModalComplete');
    if(!modal){
      modal=document.createElement('div'); modal.id='secureClaimModalComplete'; modal.className='portal-modal'; modal.hidden=true;
      modal.innerHTML=`<div class="portal-modal-backdrop" data-x></div><section class="portal-dialog portal-dialog-wide" role="dialog" aria-modal="true"><button class="portal-dialog-close" type="button" data-x><i data-lucide="x"></i></button><div class="portal-dialog-head"><span class="portal-dialog-icon"><i data-lucide="shield-check"></i></span><div><span class="portal-kicker">SECURE PROPERTY RECLAIM</span><h2>Xác minh quyền sở hữu</h2><p id="completeClaimTarget"></p></div></div><form id="completeClaimForm" class="portal-form-grid"><label><span>Họ và tên *</span><input class="form-control" id="ccName" required maxlength="80"></label><label><span>Mã sinh viên *</span><input class="form-control" id="ccStudent" required maxlength="30" placeholder="BI... / BA..."></label><label><span>Email *</span><input type="email" class="form-control" id="ccEmail" required></label><label><span>Số điện thoại *</span><input class="form-control" id="ccPhone" required></label><label class="full"><span>Khoa / Chương trình</span><input class="form-control" id="ccDepartment" placeholder="ICT, MCB, WEO..."></label><div id="ccChallenges" class="full portal-challenges"></div><label class="full"><span>Bằng chứng bổ sung *</span><textarea class="form-textarea" id="ccProof" required minlength="15" maxlength="800" placeholder="Biên lai, thời điểm mua, nội dung bên trong, ảnh cũ của tài sản..."></textarea></label><div class="portal-security-note full"><i data-lucide="lock-keyhole"></i><span>Câu trả lời chỉ hiển thị cho Security Desk. Không công khai trên bài đăng.</span></div><div class="portal-dialog-actions full"><button class="btn btn-secondary" type="button" data-x>Hủy</button><button class="btn btn-primary" type="submit"><i data-lucide="send"></i>Gửi hồ sơ xác minh</button></div></form><div id="completeClaimSuccess" class="portal-success-state" hidden></div></section>`;
      document.body.appendChild(modal); modal.querySelectorAll('[data-x]').forEach(x=>x.onclick=()=>{modal.hidden=true;document.body.classList.remove('modal-open');});
    }
    modal.querySelector('#completeClaimTarget').textContent=`Tài sản: “${post.title}”${post.custodyLocation?` · Lưu tại ${post.custodyLocation}`:''}`;
    const challenges=(Array.isArray(post.verificationChallenges)&&post.verificationChallenges.length?post.verificationChallenges:[{id:'generic-1',question:'Mô tả một đặc điểm chỉ chủ sở hữu thật sự biết',required:true},{id:'generic-2',question:'Tài sản có dấu hiệu, vật bên trong hoặc serial nào đặc biệt?',required:false}]);
    modal.querySelector('#ccChallenges').innerHTML=`<div class="challenge-head"><strong>Câu hỏi bí mật của người nhặt</strong><span>${challenges.length} câu đối chiếu</span></div>`+challenges.map((c,i)=>`<label><span>${i+1}. ${esc(c.question)} ${c.required!==false?'*':''}</span><input class="form-control" data-challenge-id="${esc(c.id||`challenge-${i+1}`)}" ${c.required!==false?'required':''} maxlength="240" placeholder="Nhập câu trả lời của bạn"></label>`).join('');
    const form=modal.querySelector('#completeClaimForm'), success=modal.querySelector('#completeClaimSuccess'); form.hidden=false; success.hidden=true; form.reset();
    form.onsubmit=e=>{
      e.preventDefault(); if(!form.reportValidity())return;
      const list=read(K.claims); let code; do{code=makeCode('CLM')}while(list.some(x=>x.code===code));
      const answers={}; modal.querySelectorAll('[data-challenge-id]').forEach(el=>answers[el.dataset.challengeId]=el.value.trim());
      const claim={id:`claim-${Date.now()}`,code,itemId:post.id||'sample',itemTitle:post.title,postCode:post.code||'',claimantName:modal.querySelector('#ccName').value.trim(),claimantStudentId:modal.querySelector('#ccStudent').value.trim(),claimantEmail:modal.querySelector('#ccEmail').value.trim(),claimantPhone:modal.querySelector('#ccPhone').value.trim(),claimantContact:`${modal.querySelector('#ccEmail').value.trim()} · ${modal.querySelector('#ccPhone').value.trim()}`,department:modal.querySelector('#ccDepartment').value.trim(),answers,verificationQuestions:challenges.map(c=>({id:c.id,question:c.question,expectedAnswerHint:c.expectedAnswerHint||''})),proof:modal.querySelector('#ccProof').value.trim(),status:'pending_review',pickupOffice:post.custodyLocation||'Bàn bảo vệ A21 - Phòng 102',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),verificationToken:''};
      list.unshift(claim); write(K.claims,list);
      const posts=read(K.posts); const p=posts.find(x=>x.id===post.id); if(p){p.claimState='PENDING';p.updatedAt=new Date().toISOString();write(K.posts,posts);}
      addNotification({type:'claim',title:'Đã gửi hồ sơ nhận lại đồ',message:`${post.title} · ${code}`,href:`claims.html?code=${encodeURIComponent(code)}`,priority:'high'});
      form.hidden=true; success.hidden=false; success.innerHTML=`<span class="portal-success-icon"><i data-lucide="circle-check-big"></i></span><h3>Hồ sơ đã gửi tới Security Desk</h3><p>Mã hồ sơ của bạn:</p><div class="portal-code-box">${esc(code)}</div><p>Hệ thống sẽ cấp mã nhận đồ sau khi xác minh.</p><div class="portal-dialog-actions"><a class="btn btn-secondary" href="claim-status.html?code=${encodeURIComponent(code)}">Tra cứu bằng mã</a><a class="btn btn-primary" href="claims.html">Hồ sơ của tôi</a></div>`; if(window.lucide)lucide.createIcons();
    };
    modal.hidden=false; document.body.classList.add('modal-open'); if(window.lucide)lucide.createIcons();
  }

  function replaceClaimButton(){
    const old=document.getElementById('secureClaimBtn'); if(!old)return;
    const post=getItemForDetail(); if(!post||post.type!=='FOUND')return;
    const fresh=old.cloneNode(true); old.replaceWith(fresh); fresh.addEventListener('click',()=>openEnhancedClaim(post));
    const details=document.querySelector('.detail-card');
    if(details && post.isHighValue && !document.getElementById('highValueNotice')){
      const note=document.createElement('div'); note.id='highValueNotice'; note.className='high-value-notice'; note.innerHTML='<i data-lucide="gem"></i><div><strong>Tài sản giá trị cao</strong><span>Quy trình nhận lại yêu cầu Security Desk xác minh trước khi bàn giao.</span></div>'; details.insertBefore(note,details.querySelector('.detail-actions')); if(window.lucide)lucide.createIcons();
    }
  }

  function setupSearchPage(){
    const root=document.getElementById('completeSearchResults'); if(!root)return;
    const dynamic=read(K.posts).filter(p=>p.status!=='DELETED').map(p=>({...p,href:`detail.html?id=${encodeURIComponent(p.id)}`})); const items=[...dynamic,...sampleItems];
    const q=document.getElementById('completeSearchQuery'),cat=document.getElementById('completeSearchCategory'),loc=document.getElementById('completeSearchLocation'),status=document.getElementById('completeSearchStatus'),high=document.getElementById('completeSearchHigh'),sort=document.getElementById('completeSearchSort'),count=document.getElementById('completeSearchCount');
    for (const [select,key] of [[cat,'category'],[loc,'location']]) {
      const values = [...new Set(items.map(item => item[key]).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'vi'));
      select.replaceChildren(new Option(key === 'category' ? 'Tất cả danh mục' : 'Tất cả địa điểm',''), ...values.map(value=>new Option(value,value)));
    }
    const render=()=>{
      let list=items.filter(item=>{ const text=[item.title,item.description,item.category,item.location,item.locationDetail,item.code].join(' ').toLowerCase(); const query=(q.value||'').trim().toLowerCase(); return (!query||text.includes(query))&&(!cat.value||item.category===cat.value)&&(!loc.value||String(item.location).toLowerCase().includes(loc.value.toLowerCase()))&&(!status.value||item.type===status.value)&&(!high.checked||item.isHighValue); });
      list.sort((a,b)=>sort.value==='oldest'?new Date(a.createdAt)-new Date(b.createdAt):sort.value==='code'?String(a.code||a.id).localeCompare(String(b.code||b.id)):new Date(b.createdAt)-new Date(a.createdAt));
      count.textContent=`${list.length} tài sản`;
      root.innerHTML=list.length?list.map(item=>`<article class="search-result-card ${item.isHighValue?'high-value':''}"><a class="search-result-image" href="${esc(item.href||'#')}"><img src="${esc(item.image|| 'asset/images/placeholder.svg')}" alt="${esc(item.title)}"></a><div class="search-result-body"><div class="search-result-tags"><span class="badge ${item.type==='FOUND'?'found':'lost'}">${item.type==='FOUND'?'Nhặt được':'Thất lạc'}</span>${item.isHighValue?'<span class="value-chip"><i data-lucide="gem"></i>Giá trị cao</span>':''}<span class="search-code">${esc(item.code||item.id)}</span></div><h3><a href="${esc(item.href||'#')}">${esc(item.title)}</a></h3><p>${esc(item.description||'')}</p><div class="search-result-meta"><span><i data-lucide="map-pin"></i>${esc(item.location||'')}</span><span><i data-lucide="tag"></i>${esc(item.category||'Khác')}</span><span><i data-lucide="clock-3"></i>${rel(item.createdAt)}</span></div></div><div class="search-result-actions"><a class="btn btn-secondary" href="campus-map.html"><i data-lucide="map"></i>Bản đồ</a><a class="btn btn-primary" href="${esc(item.href||'#')}">Chi tiết</a></div></article>`).join(''):'<div class="portal-empty-state"><i data-lucide="scan-search"></i><h3>Không có kết quả phù hợp</h3><p>Thử bỏ bớt bộ lọc hoặc dùng từ khóa khác.</p></div>'; if(window.lucide)lucide.createIcons();
    };
    [q,cat,loc,status,sort].forEach(el=>el?.addEventListener('input',render)); high?.addEventListener('change',render); document.getElementById('completeSearchReset')?.addEventListener('click',()=>{q.value='';cat.value='';loc.value='';status.value='';high.checked=false;sort.value='newest';render();}); render();
  }

  function claimStatus(status){ return ({pending_review:['Đang duyệt','pending'],verified:['Đã xác minh','verified'],rejected:['Từ chối','rejected'],completed:['Đã bàn giao','completed']})[status]||['Đang xử lý','pending']; }
  function setupClaimsPage(){
    const root=document.getElementById('claimsTrackingList'); if(!root)return; const list=read(K.claims).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)); const codeParam=new URLSearchParams(location.search).get('code');
    root.innerHTML=list.length?list.map(c=>{const [label,cls]=claimStatus(c.status); return `<article class="claim-track-card ${codeParam===c.code?'highlight':''}"><div class="claim-track-main"><div class="claim-track-top"><span class="admin-feature-code">${esc(c.code)}</span><span class="claim-status ${cls}">${label}</span></div><h3>${esc(c.itemTitle)}</h3><p>${esc(c.claimantName)} · ${esc(c.claimantStudentId)} · gửi ${fmt(c.createdAt)}</p><span class="claim-pickup"><i data-lucide="map-pin"></i>${esc(c.pickupOffice||'Bàn bảo vệ A21 - Phòng 102')}</span>${c.adminNote?`<div class="portal-admin-note"><strong>Ghi chú Security Desk</strong><p>${esc(c.adminNote)}</p></div>`:''}</div><div class="claim-track-actions">${c.verificationToken&&c.status==='verified'?`<button class="btn btn-primary" data-pass-id="${esc(c.id)}"><i data-lucide="qr-code"></i>Xem thẻ nhận đồ</button>`:''}<a class="btn btn-secondary" href="claim-status.html?code=${encodeURIComponent(c.code)}">Tra cứu chi tiết</a></div></article>`}).join(''):'<div class="portal-empty-state"><i data-lucide="badge-check"></i><h3>Chưa có hồ sơ nhận đồ</h3><p>Mở một tin FOUND và chọn “Yêu cầu nhận lại đồ” để tạo hồ sơ.</p><a class="btn btn-primary" href="found.html">Xem đồ nhặt được</a></div>';
    root.querySelectorAll('[data-pass-id]').forEach(btn=>btn.onclick=()=>openPickupPass(list.find(c=>c.id===btn.dataset.passId))); if(window.lucide)lucide.createIcons();
  }

  function openPickupPass(claim){
    if(!claim)return; let modal=document.getElementById('pickupPassModal'); if(!modal){modal=document.createElement('div');modal.id='pickupPassModal';modal.className='portal-modal';modal.innerHTML='<div class="portal-modal-backdrop" data-close-pass></div><section class="pickup-pass"><button data-close-pass class="pickup-pass-close"><i data-lucide="x"></i></button><div id="pickupPassContent"></div></section>';document.body.appendChild(modal);modal.querySelectorAll('[data-close-pass]').forEach(x=>x.onclick=()=>modal.hidden=true);} const content=modal.querySelector('#pickupPassContent'); content.innerHTML=`<span class="pickup-pass-icon"><i data-lucide="shield-check"></i></span><span class="portal-kicker">THẺ TIẾP NHẬN TÀI SẢN USTH</span><h2>${esc(claim.itemTitle)}</h2><div class="fake-qr" aria-label="QR demo"><i data-lucide="qr-code"></i></div><span class="pickup-label">MÃ TIẾP NHẬN XÁC THỰC</span><strong class="pickup-token">${esc(claim.verificationToken)}</strong><div class="pickup-info"><div>Người nhận <strong>${esc(claim.claimantName)}</strong></div><div>Mã SV <strong>${esc(claim.claimantStudentId)}</strong></div><div>Điểm nhận <strong>${esc(claim.pickupOffice||'A21 - Phòng 102')}</strong></div></div><p>Xuất trình thẻ này cùng thẻ sinh viên vật lý cho cán bộ trực.</p>`; modal.hidden=false;if(window.lucide)lucide.createIcons();
  }

  function setupSecurityCenter(){
    const root=document.getElementById('securityTimeline'); if(!root)return; const filter=document.getElementById('securityCenterFilter');
    const render=()=>{const all=read(K.security).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)); const list=all.filter(r=>!filter.value|| (filter.value==='active' ? ['investigating','patrol_dispatched'].includes(r.status) : ['resolved','dismissed'].includes(r.status))); root.innerHTML=list.length?list.map(r=>`<article class="security-timeline-card ${r.urgency==='urgent'?'urgent':''}"><div class="security-timeline-icon"><i data-lucide="${r.status==='resolved'?'shield-check':'shield-alert'}"></i></div><div><div class="security-timeline-top"><span class="admin-feature-code">${esc(r.code)}</span><span class="security-state ${esc(r.status)}">${({investigating:'Đang điều tra',patrol_dispatched:'Đã cử tuần tra',resolved:'Đã xử lý',dismissed:'Đã đóng'})[r.status]||r.status}</span></div><h3>${esc((r.category||'other').replaceAll('_',' '))}</h3><p>${esc(r.description||'')}</p><div class="search-result-meta"><span><i data-lucide="map-pin"></i>${esc(r.location||'')}${r.specificLocation?` · ${esc(r.specificLocation)}`:''}</span><span><i data-lucide="clock-3"></i>${fmt(r.updatedAt||r.createdAt)}</span></div>${r.adminNote?`<div class="portal-admin-note"><strong>Cập nhật từ Security Desk</strong><p>${esc(r.adminNote)}</p></div>`:''}</div></article>`).join(''):'<div class="portal-empty-state"><i data-lucide="shield-check"></i><h3>Chưa có báo cáo</h3><p>Các sự việc bạn gửi từ biểu mẫu an ninh sẽ xuất hiện tại đây.</p></div>'; if(window.lucide)lucide.createIcons();}; filter?.addEventListener('change',render);render();
  }

  function enhanceCampusMap(){
    const canvas=document.getElementById('campusMapCanvas'); if(!canvas||document.getElementById('mapZoomControls'))return;
    const toolbar=canvas.parentElement.querySelector('.campus-map-toolbar');
    const filters=toolbar?.querySelector('.campus-map-filters');
    if(filters&&!document.getElementById('mapCategoryFilter')){const select=document.createElement('select');select.id='mapCategoryFilter';select.className='map-category-filter';select.innerHTML='<option value="">Tất cả danh mục</option><option>Giấy tờ tùy thân</option><option>Thiết bị điện tử</option><option>Ví, tiền bạc</option><option>Phụ kiện</option><option>Khác</option>';filters.insertBefore(select,filters.lastElementChild);const list=document.getElementById('campusMapItems');const applyCategory=()=>{const q=select.value.toLowerCase();let visible=0;list?.querySelectorAll('.campus-item-card').forEach(card=>{const ok=!q||card.textContent.toLowerCase().includes(q);card.style.display=ok?'':'none';if(ok)visible++;});const count=document.getElementById('mapResultCount');if(count&&q)count.textContent=`${visible} tài sản`;};select.onchange=applyCategory;if(list)new MutationObserver(applyCategory).observe(list,{childList:true});}
    const controls=document.createElement('div');controls.id='mapZoomControls';controls.className='map-zoom-controls';controls.innerHTML='<button type="button" data-zoom="in"><i data-lucide="zoom-in"></i></button><button type="button" data-zoom="out"><i data-lucide="zoom-out"></i></button><button type="button" data-zoom="reset"><i data-lucide="rotate-ccw"></i></button>';
    toolbar?.appendChild(controls); let zoom=1;
    const apply=()=>{canvas.style.setProperty('--map-zoom',zoom);canvas.classList.toggle('is-zoomed',zoom!==1);};
    controls.querySelector('[data-zoom="in"]').onclick=()=>{zoom=Math.min(1.5,zoom+.1);apply()}; controls.querySelector('[data-zoom="out"]').onclick=()=>{zoom=Math.max(.8,zoom-.1);apply()}; controls.querySelector('[data-zoom="reset"]').onclick=()=>{zoom=1;apply()}; if(window.lucide)lucide.createIcons();
  }

  function renderOverviewExtra(){
    const root=document.getElementById('portalStatusOverview'); if(!root)return;
    const claims=read(K.claims),security=read(K.security),posts=read(K.posts);
    const completed=claims.filter(c=>c.status==='completed').length; const total=Math.max(1,claims.length); const rate=Math.round(completed/total*100);
    if(!document.getElementById('portalReturnRate')){ const extra=document.createElement('div');extra.className='portal-overview-bottom';extra.innerHTML=`<div class="return-rate-card"><div><span>Tỷ lệ bàn giao trên hồ sơ demo</span><strong id="portalReturnRate">${rate}%</strong></div><div class="rate-track"><span style="width:${rate}%"></span></div></div><div class="overview-mini-links"><a href="security-report.html"><i data-lucide="shield-alert"></i>Báo cáo an ninh</a><a href="security-center.html"><i data-lucide="radio"></i>Theo dõi sự việc</a><a href="admin/login.html"><i data-lucide="shield"></i>Security Desk</a></div>`;root.querySelector('.container')?.appendChild(extra);if(window.lucide)lucide.createIcons();}
  }

  document.addEventListener('DOMContentLoaded',()=>{
    injectRoleSwitcher(); setupFoundSecurityForm(); renderDemoDetail();
    setTimeout(replaceClaimButton,0); setupSearchPage(); setupClaimsPage(); setupSecurityCenter(); enhanceCampusMap(); renderOverviewExtra();
    if(window.lucide)lucide.createIcons();
  });
})();
