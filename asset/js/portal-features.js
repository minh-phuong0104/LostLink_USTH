(() => {
  'use strict';

  const PF_KEYS = {
    posts: 'lostlink_usth_posts_v1',
    claims: 'lostlink_usth_claims_v1',
    security: 'lostlink_usth_security_reports_v1',
    notifications: 'lostlink_usth_notifications_v1',
    preferences: 'lostlink_usth_ui_preferences_v1'
  };

  const readJSON = (key, fallback = []) => {
    try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
    catch { return fallback; }
  };
  const writeJSON = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const esc = (v = '') => String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  const fmt = (value) => {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return new Intl.DateTimeFormat('vi-VN', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }).format(d);
  };
  const rel = (value) => {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return 'Vừa xong';
    const mins = Math.max(0, Math.floor((Date.now() - d.getTime()) / 60000));
    if (mins < 1) return 'Vừa xong';
    if (mins < 60) return `${mins} phút trước`;
    const h = Math.floor(mins / 60);
    if (h < 24) return `${h} giờ trước`;
    return `${Math.floor(h / 24)} ngày trước`;
  };
  const makeCode = (prefix) => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let token = '';
    for (let i = 0; i < 6; i++) token += chars[Math.floor(Math.random() * chars.length)];
    return `${prefix}-${token}`;
  };

  function addPortalNotification(payload) {
    const items = readJSON(PF_KEYS.notifications);
    const notification = {
      id: `ntf-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
      type: payload?.type || 'info',
      title: payload?.title || 'Thông báo',
      message: payload?.message || '',
      href: payload?.href || '',
      priority: payload?.priority || 'normal',
      createdAt: new Date().toISOString(),
      read: false
    };
    items.unshift(notification);
    writeJSON(PF_KEYS.notifications, items.slice(0, 80));
    renderNotificationCenter();
    return notification;
  }
  window.addPortalNotification = addPortalNotification;

  function ensureWelcomeNotification() {
    const items = readJSON(PF_KEYS.notifications);
    if (items.length) return;
    addPortalNotification({
      type: 'system',
      title: 'Trung tâm Lost & Found đã sẵn sàng',
      message: 'Bạn có thể theo dõi yêu cầu nhận đồ, cảnh báo an ninh và cập nhật trạng thái ngay tại đây.',
      href: 'Index.html'
    });
  }

  function injectMapNav() {
    const nav = document.querySelector('.main-nav');
    if (!nav || nav.querySelector('a[href="campus-map.html"]')) return;
    const contact = nav.querySelector('a[href="contact.html"]');
    const a = document.createElement('a');
    a.href = 'campus-map.html';
    a.dataset.nav = 'map';
    a.textContent = 'Bản đồ';
    if (contact) nav.insertBefore(a, contact); else nav.appendChild(a);

    const page = (location.pathname.split('/').pop() || 'Index.html').toLowerCase();
    if (page === 'campus-map.html') {
      nav.querySelectorAll('a').forEach(x => x.classList.remove('active'));
      a.classList.add('active');
    }
  }

  function notificationIcon(type) {
    if (type === 'claim') return 'badge-check';
    if (type === 'security') return 'shield-alert';
    if (type === 'post') return 'file-plus-2';
    return 'bell';
  }

  function injectNotificationCenter() {
    const actions = document.querySelector('.header-actions');
    if (!actions || document.getElementById('portalNotifButton')) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'icon-btn portal-notif-button';
    btn.id = 'portalNotifButton';
    btn.setAttribute('aria-label', 'Thông báo');
    btn.innerHTML = '<i data-lucide="bell"></i><span class="portal-notif-badge" id="portalNotifBadge" hidden>0</span>';
    actions.insertBefore(btn, actions.firstChild);

    const panel = document.createElement('aside');
    panel.id = 'portalNotifPanel';
    panel.className = 'portal-notif-panel';
    panel.hidden = true;
    panel.innerHTML = `
      <div class="portal-notif-head">
        <div><span class="portal-kicker">CẬP NHẬT THỜI GIAN THỰC</span><h3>Thông báo</h3></div>
        <button type="button" class="portal-icon-plain" id="portalNotifClose" aria-label="Đóng"><i data-lucide="x"></i></button>
      </div>
      <div class="portal-notif-actions"><button type="button" id="portalMarkAllRead">Đánh dấu đã đọc</button></div>
      <div id="portalNotifList" class="portal-notif-list"></div>`;
    document.body.appendChild(panel);

    btn.addEventListener('click', () => {
      panel.hidden = !panel.hidden;
      if (!panel.hidden) renderNotificationCenter();
    });
    document.getElementById('portalNotifClose')?.addEventListener('click', () => panel.hidden = true);
    document.getElementById('portalMarkAllRead')?.addEventListener('click', () => {
      const items = readJSON(PF_KEYS.notifications).map(n => ({ ...n, read: true }));
      writeJSON(PF_KEYS.notifications, items);
      renderNotificationCenter();
    });
    document.addEventListener('click', (event) => {
      if (panel.hidden) return;
      if (panel.contains(event.target) || btn.contains(event.target)) return;
      panel.hidden = true;
    });
  }

  function renderNotificationCenter() {
    const badge = document.getElementById('portalNotifBadge');
    const list = document.getElementById('portalNotifList');
    const items = readJSON(PF_KEYS.notifications);
    const unread = items.filter(n => !n.read).length;
    if (badge) {
      badge.textContent = unread > 9 ? '9+' : String(unread);
      badge.hidden = unread === 0;
    }
    if (!list) return;
    list.innerHTML = items.length ? items.slice(0, 10).map(n => `
      <a class="portal-notif-item ${n.read ? '' : 'is-unread'} ${n.priority === 'urgent' ? 'is-urgent' : ''}" href="${esc(n.href || '#') }" data-notif-id="${esc(n.id)}">
        <span class="portal-notif-icon"><i data-lucide="${notificationIcon(n.type)}"></i></span>
        <span class="portal-notif-copy"><strong>${esc(n.title)}</strong><span>${esc(n.message)}</span><small>${rel(n.createdAt)}</small></span>
      </a>`).join('') : '<div class="portal-empty-mini">Chưa có thông báo.</div>';
    list.querySelectorAll('[data-notif-id]').forEach(link => link.addEventListener('click', () => {
      const id = link.dataset.notifId;
      writeJSON(PF_KEYS.notifications, readJSON(PF_KEYS.notifications).map(n => n.id === id ? { ...n, read: true } : n));
    }));
    if (window.lucide) lucide.createIcons();
  }

  function applyUIPreferences() {
    const pref = readJSON(PF_KEYS.preferences, { theme:'azure', clarity:'clear' });
    document.body.dataset.portalTheme = pref.theme || 'azure';
    document.body.dataset.portalClarity = pref.clarity || 'clear';
  }

  function injectAppearanceSettings() {
    if (document.querySelector('.admin-shell') || document.getElementById('portalAppearanceButton')) return;
    const wrap = document.createElement('div');
    wrap.className = 'portal-appearance';
    wrap.innerHTML = `
      <button class="portal-appearance-button" id="portalAppearanceButton" type="button" aria-label="Tùy chỉnh giao diện"><i data-lucide="sliders-horizontal"></i></button>
      <div class="portal-appearance-panel" id="portalAppearancePanel" hidden>
        <strong>Tùy chỉnh giao diện</strong>
        <label>Màu ánh sáng
          <select id="portalThemeSelect"><option value="azure">Azure</option><option value="indigo">Indigo</option><option value="teal">Teal</option></select>
        </label>
        <label>Độ trong của glass
          <select id="portalClaritySelect"><option value="clear">Trong</option><option value="soft">Mềm</option></select>
        </label>
      </div>`;
    document.body.appendChild(wrap);
    const pref = readJSON(PF_KEYS.preferences, { theme:'azure', clarity:'clear' });
    const theme = document.getElementById('portalThemeSelect');
    const clarity = document.getElementById('portalClaritySelect');
    if (theme) theme.value = pref.theme || 'azure';
    if (clarity) clarity.value = pref.clarity || 'clear';
    const panel = document.getElementById('portalAppearancePanel');
    document.getElementById('portalAppearanceButton')?.addEventListener('click', () => panel.hidden = !panel.hidden);
    [theme, clarity].forEach(el => el?.addEventListener('change', () => {
      const next = { theme: theme.value, clarity: clarity.value };
      writeJSON(PF_KEYS.preferences, next);
      applyUIPreferences();
    }));
  }

  function renderStatusOverview() {
    const root = document.getElementById('portalStatusOverview');
    if (!root) return;
    const posts = readJSON(PF_KEYS.posts).filter(p => p.status !== 'DELETED');
    const claims = readJSON(PF_KEYS.claims);
    const security = readJSON(PF_KEYS.security);
    const activeLost = 6 + posts.filter(p => p.status === 'ACTIVE' && p.type === 'LOST').length;
    const activeFound = 6 + posts.filter(p => p.status === 'ACTIVE' && p.type === 'FOUND').length;
    const pending = claims.filter(c => c.status === 'pending_review').length;
    const ready = claims.filter(c => c.status === 'verified').length;
    const alerts = security.filter(r => r.status !== 'resolved' && r.urgency === 'urgent').length;
    const values = { portalLostCount: activeLost, portalFoundCount: activeFound, portalPendingClaims: pending, portalReadyClaims: ready, portalSecurityAlerts: alerts };
    Object.entries(values).forEach(([id, value]) => { const el = document.getElementById(id); if (el) el.textContent = value; });
  }

  function claimStatusLabel(status) {
    return ({
      pending_review: ['Đang chờ xác minh','pending','Hồ sơ đã được gửi tới bàn trực USTH.'],
      verified: ['Đã xác minh · Sẵn sàng nhận','verified','Mang mã nhận đồ và thẻ sinh viên tới bàn trực để nhận tài sản.'],
      rejected: ['Chưa xác minh được','rejected','Thông tin đối chiếu chưa đủ khớp. Bạn có thể liên hệ bàn trực để bổ sung.'],
      completed: ['Đã bàn giao','completed','Tài sản đã được ghi nhận bàn giao cho người nhận.']
    })[status] || ['Đang xử lý','pending','Yêu cầu đang được xử lý.'];
  }

  function openClaimModal(post) {
    let modal = document.getElementById('secureClaimModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'secureClaimModal';
      modal.className = 'portal-modal';
      modal.hidden = true;
      modal.innerHTML = `
        <div class="portal-modal-backdrop" data-claim-close></div>
        <section class="portal-dialog" role="dialog" aria-modal="true">
          <button class="portal-dialog-close" type="button" data-claim-close><i data-lucide="x"></i></button>
          <div class="portal-dialog-head"><span class="portal-dialog-icon"><i data-lucide="shield-check"></i></span><div><span class="portal-kicker">XÁC MINH QUYỀN SỞ HỮU</span><h2>Yêu cầu nhận lại đồ</h2><p id="claimTargetText"></p></div></div>
          <form id="secureClaimForm" class="portal-form-grid">
            <label><span>Họ và tên *</span><input class="form-control" id="claimantName" required maxlength="80"></label>
            <label><span>Mã sinh viên *</span><input class="form-control" id="claimantStudentId" required maxlength="30" placeholder="BI... / BA..."></label>
            <label><span>Email / Số điện thoại *</span><input class="form-control" id="claimantContact" required maxlength="120"></label>
            <label><span>Đặc điểm chỉ chủ sở hữu biết *</span><input class="form-control" id="claimPrivateFeature" required minlength="4" maxlength="180" placeholder="Vết xước, sticker, vật bên trong..."></label>
            <label class="full"><span>Mô tả bằng chứng sở hữu *</span><textarea class="form-textarea" id="claimProof" required minlength="20" maxlength="700" placeholder="Mô tả chi tiết giúp bảo vệ đối chiếu quyền sở hữu..."></textarea></label>
            <div class="portal-security-note full"><i data-lucide="lock-keyhole"></i><span>Thông tin xác minh không hiển thị công khai. Admin/Security Desk dùng dữ liệu này để duyệt yêu cầu.</span></div>
            <div class="portal-dialog-actions full"><button class="btn btn-secondary" type="button" data-claim-close>Hủy</button><button class="btn btn-primary" type="submit"><i data-lucide="send"></i>Gửi yêu cầu</button></div>
          </form>
          <div id="claimSuccess" class="portal-success-state" hidden></div>
        </section>`;
      document.body.appendChild(modal);
      modal.querySelectorAll('[data-claim-close]').forEach(el => el.addEventListener('click', () => { modal.hidden = true; document.body.classList.remove('modal-open'); }));
    }
    document.getElementById('claimTargetText').textContent = `Tài sản: “${post.title}”. Hãy cung cấp thông tin chỉ chủ sở hữu thật sự có thể biết.`;
    const form = document.getElementById('secureClaimForm');
    const success = document.getElementById('claimSuccess');
    form.hidden = false;
    success.hidden = true;
    form.reset();
    form.onsubmit = (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const claims = readJSON(PF_KEYS.claims);
      let code;
      do { code = makeCode('CLM'); } while (claims.some(c => c.code === code));
      const item = {
        id: `claim-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
        code,
        itemId: post.id || 'sample-detail',
        itemTitle: post.title,
        postCode: post.code || '',
        claimantName: document.getElementById('claimantName').value.trim(),
        claimantStudentId: document.getElementById('claimantStudentId').value.trim(),
        claimantContact: document.getElementById('claimantContact').value.trim(),
        privateFeature: document.getElementById('claimPrivateFeature').value.trim(),
        proof: document.getElementById('claimProof').value.trim(),
        status: 'pending_review',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        verificationToken: ''
      };
      claims.unshift(item);
      writeJSON(PF_KEYS.claims, claims);
      const posts = readJSON(PF_KEYS.posts);
      const pIndex = posts.findIndex(p => p.id === item.itemId);
      if (pIndex >= 0) {
        posts[pIndex] = { ...posts[pIndex], claimState: 'PENDING', updatedAt: new Date().toISOString() };
        writeJSON(PF_KEYS.posts, posts);
      }
      addPortalNotification({ type:'claim', title:'Đã gửi yêu cầu nhận lại đồ', message:`${item.itemTitle} · Mã hồ sơ ${code}`, href:`claim-status.html?code=${encodeURIComponent(code)}`, priority:'high' });
      form.hidden = true;
      success.hidden = false;
      success.innerHTML = `<span class="portal-success-icon"><i data-lucide="circle-check-big"></i></span><h3>Đã gửi hồ sơ xác minh</h3><p>Mã theo dõi yêu cầu của bạn:</p><div class="portal-code-box">${esc(code)}</div><p>Hãy lưu mã này để xem kết quả duyệt và mã nhận đồ.</p><div class="portal-dialog-actions"><button class="btn btn-secondary" type="button" id="copyClaimCode">Sao chép mã</button><a class="btn btn-primary" href="claim-status.html?code=${encodeURIComponent(code)}">Theo dõi trạng thái</a></div>`;
      document.getElementById('copyClaimCode')?.addEventListener('click', async () => { try { await navigator.clipboard.writeText(code); } catch { prompt('Sao chép mã:', code); } });
      if (window.lucide) lucide.createIcons();
      renderStatusOverview();
    };
    modal.hidden = false;
    document.body.classList.add('modal-open');
    if (window.lucide) lucide.createIcons();
  }

  function setupSecureClaimOnDetail() {
    const detailActions = document.querySelector('.detail-actions');
    if (!detailActions || document.getElementById('secureClaimBtn')) return;
    const url = new URLSearchParams(location.search);
    const id = url.get('id');
    let post = readJSON(PF_KEYS.posts).find(p => p.id === id);
    if (!post) {
      const badge = document.getElementById('detailTypeBadge');
      if (!badge || !badge.classList.contains('found')) return;
      post = { id:'sample-detail', type:'FOUND', title: document.getElementById('detailTitle')?.textContent?.trim() || 'Tài sản nhặt được', code:'' };
    }
    if (post.type !== 'FOUND') return;
    const btn = document.createElement('button');
    btn.id = 'secureClaimBtn';
    btn.className = 'btn btn-secure-claim';
    btn.type = 'button';
    btn.innerHTML = '<i data-lucide="shield-check"></i>Yêu cầu nhận lại đồ';
    detailActions.prepend(btn);
    btn.addEventListener('click', () => openClaimModal(post));
  }

  function renderClaimLookup(code) {
    const result = document.getElementById('claimLookupResult');
    if (!result) return;
    const normalized = String(code || '').trim().toUpperCase();
    if (!normalized) { result.innerHTML = '<div class="portal-empty-state"><i data-lucide="scan-search"></i><h3>Nhập mã yêu cầu</h3><p>Mã có dạng CLM-XXXXXX.</p></div>'; return; }
    const claim = readJSON(PF_KEYS.claims).find(c => String(c.code || '').toUpperCase() === normalized);
    if (!claim) { result.innerHTML = '<div class="portal-empty-state is-error"><i data-lucide="circle-x"></i><h3>Không tìm thấy hồ sơ</h3><p>Kiểm tra lại mã CLM-XXXXXX.</p></div>'; if (window.lucide) lucide.createIcons(); return; }
    const [label, cls, note] = claimStatusLabel(claim.status);
    result.innerHTML = `
      <article class="claim-result-card">
        <div class="claim-result-top"><div><span class="portal-kicker">HỒ SƠ ${esc(claim.code)}</span><h2>${esc(claim.itemTitle)}</h2></div><span class="claim-status ${cls}">${label}</span></div>
        <div class="claim-result-grid"><div><span>Người yêu cầu</span><strong>${esc(claim.claimantName)}</strong></div><div><span>Mã sinh viên</span><strong>${esc(claim.claimantStudentId)}</strong></div><div><span>Gửi lúc</span><strong>${fmt(claim.createdAt)}</strong></div><div><span>Cập nhật</span><strong>${fmt(claim.updatedAt)}</strong></div></div>
        <div class="claim-status-note"><i data-lucide="info"></i><span>${esc(note)}</span></div>
        ${claim.status === 'verified' ? `<div class="verification-token"><span>MÃ NHẬN ĐỒ</span><strong>${esc(claim.verificationToken || 'Đang cấp mã')}</strong><small>Xuất trình mã này cùng thẻ sinh viên tại bàn trực.</small></div>` : ''}
        ${claim.adminNote ? `<div class="portal-admin-note"><strong>Ghi chú từ bàn trực</strong><p>${esc(claim.adminNote)}</p></div>` : ''}
      </article>`;
    if (window.lucide) lucide.createIcons();
  }

  function setupClaimStatusPage() {
    const form = document.getElementById('claimLookupForm');
    const input = document.getElementById('claimLookupCode');
    if (!form || !input) return;
    const param = new URLSearchParams(location.search).get('code') || '';
    if (param) { input.value = param.toUpperCase(); renderClaimLookup(param); }
    else renderClaimLookup('');
    form.addEventListener('submit', (e) => { e.preventDefault(); renderClaimLookup(input.value); });
  }

  const campusBuildings = [
    { id:'main', name:'Khu A · Tòa nhà chính', aliases:['khu a','tòa nhà chính','sảnh tòa a'], x:22, y:28 },
    { id:'library', name:'Thư viện USTH', aliases:['thư viện'], x:48, y:23 },
    { id:'a21', name:'Tòa / Phòng A21', aliases:['a21','phòng a21'], x:72, y:30 },
    { id:'canteen', name:'Căng tin USTH', aliases:['căng tin'], x:61, y:63 },
    { id:'parking', name:'Bãi xe', aliases:['bãi xe'], x:24, y:72 },
    { id:'a10', name:'Tòa A10', aliases:['a10'], x:82, y:67 }
  ];
  const sampleItems = [
    { id:'sample-lost-card', type:'LOST', title:'Mất thẻ sinh viên USTH', location:'Khu A - Tòa nhà chính', category:'Giấy tờ tùy thân', status:'ACTIVE', href:'detail.html' },
    { id:'sample-found-airpods', type:'FOUND', title:'Nhặt được tai nghe AirPods', location:'Thư viện USTH', category:'Thiết bị điện tử', status:'ACTIVE', href:'detail.html' },
    { id:'sample-lost-wallet', type:'LOST', title:'Mất ví da màu đen', location:'Căng tin USTH', category:'Ví, tiền bạc', status:'ACTIVE', href:'detail.html' },
    { id:'sample-found-casio', type:'FOUND', title:'Nhặt được máy tính Casio', location:'Phòng A21', category:'Thiết bị điện tử', status:'ACTIVE', href:'detail.html' },
    { id:'sample-lost-key', type:'LOST', title:'Mất chùm chìa khóa', location:'Bãi xe', category:'Phụ kiện', status:'ACTIVE', href:'detail.html' },
    { id:'sample-lost-box', type:'LOST', title:'Mất hộp đồ cá nhân', location:'Tòa A10', category:'Khác', status:'ACTIVE', href:'detail.html' }
  ];

  function buildingForLocation(locationText = '') {
    const t = locationText.toLowerCase();
    return campusBuildings.find(b => b.aliases.some(a => t.includes(a))) || null;
  }

  function setupCampusMap() {
    const map = document.getElementById('campusMapCanvas');
    const list = document.getElementById('campusMapItems');
    if (!map || !list) return;
    let selectedBuilding = 'all';
    let selectedType = 'ALL';
    const dynamic = readJSON(PF_KEYS.posts).filter(p => p.status === 'ACTIVE').map(p => ({ ...p, href:`detail.html?id=${encodeURIComponent(p.id)}` }));
    const all = [...dynamic, ...sampleItems];

    map.querySelectorAll('[data-building]').forEach(pin => {
      pin.addEventListener('click', () => {
        const id = pin.dataset.building;
        selectedBuilding = selectedBuilding === id ? 'all' : id;
        map.querySelectorAll('[data-building]').forEach(x => x.classList.toggle('active', x.dataset.building === selectedBuilding));
        render();
      });
    });
    document.querySelectorAll('[data-map-type]').forEach(btn => btn.addEventListener('click', () => {
      selectedType = btn.dataset.mapType;
      document.querySelectorAll('[data-map-type]').forEach(x => x.classList.toggle('active', x.dataset.mapType === selectedType));
      render();
    }));
    document.getElementById('mapReset')?.addEventListener('click', () => {
      selectedBuilding = 'all'; selectedType = 'ALL';
      map.querySelectorAll('[data-building]').forEach(x => x.classList.remove('active'));
      document.querySelectorAll('[data-map-type]').forEach(x => x.classList.toggle('active', x.dataset.mapType === 'ALL'));
      render();
    });

    function render() {
      const filtered = all.filter(item => {
        const building = buildingForLocation(item.location);
        const okBuilding = selectedBuilding === 'all' || building?.id === selectedBuilding;
        const okType = selectedType === 'ALL' || item.type === selectedType;
        return okBuilding && okType;
      });
      document.getElementById('mapResultCount').textContent = `${filtered.length} tài sản`;
      const byBuilding = Object.fromEntries(campusBuildings.map(b => [b.id, 0]));
      all.forEach(item => { const b = buildingForLocation(item.location); if (b) byBuilding[b.id]++; });
      map.querySelectorAll('[data-building]').forEach(pin => {
        const count = pin.querySelector('.campus-pin-count');
        if (count) count.textContent = byBuilding[pin.dataset.building] || 0;
      });
      list.innerHTML = filtered.length ? filtered.map(item => `
        <a class="campus-item-card" href="${esc(item.href)}">
          <span class="campus-item-type ${item.type === 'FOUND' ? 'found' : 'lost'}">${item.type === 'FOUND' ? 'Nhặt được' : 'Thất lạc'}</span>
          <div><strong>${esc(item.title)}</strong><span><i data-lucide="map-pin"></i>${esc(item.location)}</span><small>${esc(item.category || 'Khác')}</small></div>
          <i data-lucide="chevron-right"></i>
        </a>`).join('') : '<div class="portal-empty-state"><i data-lucide="map-pinned"></i><h3>Không có tài sản phù hợp</h3><p>Chọn khu vực hoặc trạng thái khác.</p></div>';
      if (window.lucide) lucide.createIcons();
    }
    render();
  }

  function setupSecurityReportPage() {
    const form = document.getElementById('securityReportForm');
    if (!form) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      const reports = readJSON(PF_KEYS.security);
      let code;
      do { code = makeCode('SEC'); } while (reports.some(r => r.code === code));
      const anonymous = document.getElementById('securityAnonymous').checked;
      const urgency = document.querySelector('input[name="securityUrgency"]:checked')?.value || 'normal';
      const item = {
        id:`sec-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
        code,
        category:document.getElementById('securityCategory').value,
        urgency,
        location:document.getElementById('securityLocation').value,
        specificLocation:document.getElementById('securitySpecificLocation').value.trim(),
        description:document.getElementById('securityDescription').value.trim(),
        anonymous,
        reporterName:anonymous ? '' : document.getElementById('securityReporterName').value.trim(),
        reporterContact:anonymous ? '' : document.getElementById('securityReporterContact').value.trim(),
        status:urgency === 'urgent' ? 'patrol_dispatched' : 'investigating',
        createdAt:new Date().toISOString(),
        updatedAt:new Date().toISOString(),
        adminNote:''
      };
      reports.unshift(item);
      writeJSON(PF_KEYS.security, reports);
      addPortalNotification({ type:'security', title:'Đã chuyển báo cáo tới bàn trực', message:`${code} · ${item.location}`, href:'security-report.html', priority:urgency === 'urgent' ? 'urgent' : 'high' });
      const result = document.getElementById('securityReportSuccess');
      result.hidden = false;
      result.innerHTML = `<i data-lucide="shield-check"></i><div><strong>Đã ghi nhận ${esc(code)}</strong><span>${urgency === 'urgent' ? 'Báo cáo được đánh dấu khẩn và chuyển tới bàn trực.' : 'Bàn trực sẽ kiểm tra và cập nhật trạng thái xử lý.'}</span></div>`;
      form.reset();
      document.getElementById('securityReporterFields').hidden = false;
      if (window.lucide) lucide.createIcons();
      renderStatusOverview();
    });
    document.getElementById('securityAnonymous')?.addEventListener('change', (e) => {
      const fields = document.getElementById('securityReporterFields');
      fields.hidden = e.target.checked;
      fields.querySelectorAll('input').forEach(input => input.required = !e.target.checked);
    });
  }

  function patchPostEvents() {
    const postForm = document.getElementById('postForm');
    if (postForm) {
      postForm.addEventListener('submit', () => {
        if (!postForm.checkValidity()) return;
        setTimeout(() => addPortalNotification({ type:'post', title:'Bài đăng đã được gửi', message:'Bài mới sẽ xuất hiện trên danh sách sau khi lưu thành công.', href:'my-posts.html' }), 0);
      }, { once:true });
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    // Shared LostLink navigation and theme.
    ensureWelcomeNotification();
    injectNotificationCenter();

    renderNotificationCenter();
    renderStatusOverview();
    setupSecureClaimOnDetail();
    setupClaimStatusPage();
    setupCampusMap();
    setupSecurityReportPage();
    patchPostEvents();
    if (window.lucide) lucide.createIcons();
  });
})();
