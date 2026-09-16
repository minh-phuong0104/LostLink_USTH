if (window.lucide) lucide.createIcons();

/* =========================
   Lost&Found USTH - Frontend demo storage
   Bài đăng do người dùng tạo được lưu trong localStorage.
   ========================= */
const STORAGE_KEY = 'lostlink_usth_posts_v1';
const LAST_CODE_KEY = 'lostlink_usth_last_code';
const FEEDBACK_KEY = 'lostlink_usth_feedback_v1';
const WINDOW_BRIDGE_PREFIX = 'LOSTLINK_PENDING_POST:';

/*
 * Bridge dữ liệu khi người dùng mở các file HTML trực tiếp bằng file://.
 * Một số trình duyệt tách localStorage theo từng file, vì vậy post.html có thể
 * lưu được bài nhưng Index.html không nhìn thấy. window.name tồn tại qua lần
 * chuyển trang trong cùng tab, nên ta dùng nó để chuyển bài vừa đăng sang
 * trang chủ rồi lưu lại tại đó. Khi chạy qua http://localhost, cơ chế này vẫn
 * hoạt động bình thường và chỉ đóng vai trò dự phòng.
 */
function putPendingPostInWindow(post) {
  try {
    window.name = WINDOW_BRIDGE_PREFIX + JSON.stringify(post);
  } catch (error) {
    console.warn('Không thể tạo dữ liệu chuyển trang:', error);
  }
}

function takePendingPostFromWindow() {
  try {
    if (!window.name || !window.name.startsWith(WINDOW_BRIDGE_PREFIX)) return null;
    const raw = window.name.slice(WINDOW_BRIDGE_PREFIX.length);
    window.name = '';
    return JSON.parse(raw);
  } catch (error) {
    console.warn('Không thể đọc dữ liệu chuyển trang:', error);
    window.name = '';
    return null;
  }
}

function loadPosts() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch (error) {
    console.error('Không đọc được dữ liệu bài đăng:', error);
    return [];
  }
}

function savePosts(posts) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
}

function loadFeedbacks() {
  try {
    return JSON.parse(localStorage.getItem(FEEDBACK_KEY) || '[]');
  } catch (error) {
    console.error('Không đọc được dữ liệu phản hồi:', error);
    return [];
  }
}

function saveFeedbacks(feedbacks) {
  localStorage.setItem(FEEDBACK_KEY, JSON.stringify(feedbacks));
}

function makeFeedbackId() {
  if (window.crypto?.randomUUID) return `fb-${window.crypto.randomUUID()}`;
  return `fb-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function deleteFeedbacksForPost(postId) {
  if (!postId) return;
  saveFeedbacks(loadFeedbacks().filter(item => item.postId !== postId));
}

function escapeHTML(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function makeManagementCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let token = '';
  for (let i = 0; i < 6; i++) token += chars[Math.floor(Math.random() * chars.length)];
  return `LL-${token}`;
}

function formatRelativeTime(dateString) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return 'Vừa đăng';
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return 'Vừa đăng';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ngày trước`;
  return date.toLocaleDateString('vi-VN');
}

function formatDateTime(dateString) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return 'Chưa xác định';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  }).format(date);
}

function typeLabel(type) {
  return type === 'FOUND' ? 'Nhặt được' : 'Thất lạc';
}

function fallbackImage(post) {
  return post.image || 'asset/images/placeholder.svg';
}

function demoPostHref(post) {
  return 'detail.html?' + new URLSearchParams({demo:'1', type:post.type, title:post.title,
    location:post.location, category:post.category, desc:post.description,
    image:fallbackImage(post), author:post.author?.name || 'Sinh viên USTH', createdAt:post.createdAt || ''});
}

function postCardHTML(post) {
  const image = escapeHTML(fallbackImage(post));
  const href = escapeHTML(post.demo ? demoPostHref(post) : `detail.html?id=${encodeURIComponent(post.id)}`);
  const name = post.author?.name || post.name || 'Sinh viên USTH';
  const initials = name.split(/\s+/).slice(-2).map(word => word[0]).join('').toUpperCase();
  return `<article class="post-card ${post.demo ? 'demo-post' : 'dynamic-post'}" data-card
    data-created-at="${escapeHTML(post.createdAt || '')}" data-title="${escapeHTML(post.title || '')}"
    data-location="${escapeHTML(post.location || '')}" data-category="${escapeHTML(post.category || '')}">
    <img class="post-card__background" src="${image}" alt="" aria-hidden="true">
    <div class="post-card__paper"><span class="post-card__pin" aria-hidden="true"></span>
      <a class="post-card__media" href="${href}" tabindex="-1" aria-hidden="true"><img class="post-card__image ${image.endsWith('placeholder.svg') ? 'is-fallback' : ''}" src="${image}" alt="${escapeHTML(post.title)}" loading="lazy"></a>
      <div class="post-card__content">
        <div class="post-card__meta"><span class="badge ${post.type === 'FOUND' ? 'found' : 'lost'}">${typeLabel(post.type)}</span><span class="post-time time">${formatRelativeTime(post.createdAt)}</span></div>
        <h3 class="post-card__title"><a href="${href}">${escapeHTML(post.title)}</a></h3>
        <p class="post-location"><i data-lucide="map-pin"></i><span>${escapeHTML(post.location || 'USTH')}</span></p>
        <p class="post-description">${escapeHTML(post.description || '')}</p>
        <div class="post-card__footer"><div class="author"><span class="author-avatar-fallback">${escapeHTML(initials)}</span><span class="author-name">${escapeHTML(name)}</span></div><a class="details-link" href="${href}">Xem chi tiết <i data-lucide="arrow-right"></i></a></div>
      </div>
    </div>
  </article>`;
}

function injectDemoPosts() {
  const samples = window.LOSTLINK_POSTS || [];
  const page = location.pathname.split('/').pop().toLowerCase();
  const listing = document.getElementById('listingGrid');
  if (listing) listing.innerHTML = samples.filter(p => p.type === (page === 'found.html' ? 'FOUND' : 'LOST')).map(postCardHTML).join('');
  const home = document.getElementById('homePostGrid');
  if (home) home.innerHTML = samples.filter(p => p.type === 'LOST').slice(0,4).map(postCardHTML).join('');
  document.querySelectorAll('.suggestions .post-grid').forEach(grid => {
    grid.innerHTML = samples.filter(p => p.type === 'FOUND').slice(0,4).map(postCardHTML).join('');
  });
}

function importPendingPostOnHome() {
  const page = (location.pathname.split('/').pop() || 'Index.html').toLowerCase();
  if (page !== 'index.html' && page !== '') return null;

  const pending = takePendingPostFromWindow();
  if (!pending || !pending.id) return null;

  const posts = loadPosts();
  if (!posts.some(p => p.id === pending.id)) {
    posts.unshift(pending);
    try {
      savePosts(posts);
    } catch (error) {
      // Nếu ảnh khiến localStorage đầy, vẫn hiển thị bài trong phiên này bằng
      // cách thử lại không lưu ảnh.
      console.warn('localStorage đầy, thử lưu bài không kèm ảnh:', error);
      const withoutImage = { ...pending, image: '' };
      const compact = posts.filter(p => p.id !== pending.id);
      compact.unshift(withoutImage);
      try { savePosts(compact); } catch (_) {}
      return withoutImage;
    }
  }
  return pending;
}

const bridgedPost = importPendingPostOnHome();

function injectCreatedPosts() {
  const page = (location.pathname.split('/').pop() || 'Index.html').toLowerCase();
  const posts = loadPosts()
    .filter(p => p.status !== 'DELETED')
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  if (page === 'index.html' || page === '') {
    const grid = document.getElementById('homePostGrid') || document.querySelector('.recent-posts .post-grid');
    if (grid) {
      // Render một lần theo thứ tự createdAt giảm dần để bài mới nhất luôn đứng đầu.
      const html = posts
        .filter(p => p.status === 'ACTIVE')
        .slice(0, 4)
        .map(postCardHTML)
        .join('');
      grid.insertAdjacentHTML('afterbegin', html);
    }
  }

  if (page === 'lost.html' || page === 'found.html') {
    const targetType = page === 'lost.html' ? 'LOST' : 'FOUND';
    const grid = document.getElementById('listingGrid');
    if (grid) {
      const html = posts
        .filter(p => p.type === targetType && p.status === 'ACTIVE')
        .map(postCardHTML)
        .join('');
      grid.insertAdjacentHTML('afterbegin', html);
    }
  }
}

/* Sắp xếp card theo thời gian.
   - Bài do người dùng tạo có data-created-at / createdAt thật.
   - Bài mẫu dùng chuỗi tương đối như "2 giờ trước", "1 ngày trước".
   - Select #sortOrder cho phép đổi giữa Mới nhất và Cũ nhất mà không làm mất bộ lọc. */
function cardTimestamp(card, fallbackIndex = 0, baseNow = Date.now()) {
  const raw = card.dataset.createdAt;
  if (raw) {
    const parsed = new Date(raw).getTime();
    if (!Number.isNaN(parsed)) return parsed;
  }

  const text = (card.querySelector('.time')?.textContent || '').trim().toLowerCase();
  const number = Number((text.match(/\d+/) || [0])[0]);
  let timestamp;

  if (!text || text.includes('vừa')) timestamp = baseNow;
  else if (text.includes('phút')) timestamp = baseNow - number * 60 * 1000;
  else if (text.includes('giờ')) timestamp = baseNow - number * 60 * 60 * 1000;
  else if (text.includes('ngày')) timestamp = baseNow - number * 24 * 60 * 60 * 1000;
  else timestamp = baseNow - 365 * 24 * 60 * 60 * 1000;

  // Giữ thứ tự ổn định khi 2 bài có cùng nhãn thời gian, ví dụ cùng "1 ngày trước".
  return timestamp - fallbackIndex;
}

function sortGridByTime(grid, direction = 'newest') {
  if (!grid) return;
  const baseNow = Date.now();
  const cards = [...grid.children].filter(el => el.classList?.contains('post-card'));
  const sorted = cards
    .map((card, index) => ({ card, ts: cardTimestamp(card, index, baseNow), index }))
    .sort((a, b) => {
      if (a.ts === b.ts) return a.index - b.index;
      return direction === 'oldest' ? a.ts - b.ts : b.ts - a.ts;
    });

  sorted.forEach(({ card }) => grid.appendChild(card));
}

function sortPostGridsNewestFirst() {
  document.querySelectorAll('.post-grid, #listingGrid').forEach(grid => {
    sortGridByTime(grid, 'newest');
  });
}

function applySelectedSort() {
  const sortSelect = document.getElementById('sortOrder');
  const grid = document.getElementById('listingGrid');
  if (!sortSelect || !grid) return;
  if (sortSelect.value === 'title-asc') {
    [...grid.children].sort((a,b) => (a.dataset.title || '').localeCompare(b.dataset.title || '', 'vi')).forEach(card => grid.appendChild(card));
  } else sortGridByTime(grid, sortSelect.value === 'oldest' ? 'oldest' : 'newest');
}

injectDemoPosts();
injectCreatedPosts();
// Include locations and categories from both reference and user-created posts.
if (document.getElementById('listingGrid')) {
  for (const [id, key] of [['categoryFilter','category'],['locationFilter','location']]) {
    const select = document.getElementById(id);
    if (!select) continue;
    const existing = new Set([...select.options].map(option => option.value.toLowerCase()));
    document.querySelectorAll('#listingGrid [data-card]').forEach(card => {
      const value = card.dataset[key];
      if (value && !existing.has(value.toLowerCase())) { select.add(new Option(value,value)); existing.add(value.toLowerCase()); }
    });
  }
}
sortPostGridsNewestFirst();

// Cho phép người dùng đổi thứ tự ngay lập tức trên lost.html / found.html.
const sortOrder = document.getElementById('sortOrder');
sortOrder?.addEventListener('change', applySelectedSort);
applySelectedSort();

if (window.lucide) lucide.createIcons();

/* Thông báo sau khi đăng tin mới và cuộn tới bài vừa tạo */
(function showPostedSuccessOnHome() {
  const currentPage = (location.pathname.split('/').pop() || 'Index.html').toLowerCase();
  const query = new URLSearchParams(location.search);
  if (currentPage !== 'index.html' && currentPage !== '') return;
  if (query.get('posted') !== '1') return;

  const id = query.get('id');
  const code = query.get('code') || localStorage.getItem(LAST_CODE_KEY) || '';
  const post = loadPosts().find(p => p.id === id);

  const toast = document.createElement('div');
  toast.className = 'post-success-toast';
  toast.innerHTML = `
    <div class="post-success-toast__icon"><i data-lucide="circle-check-big"></i></div>
    <div class="post-success-toast__content">
      <strong>Đăng tin thành công!</strong>
      <span>${post ? escapeHTML(post.title) : 'Bài đăng mới'} đã xuất hiện trên trang chủ.${code ? ` Mã quản lý: <b>${escapeHTML(code)}</b>` : ''}</span>
    </div>
    <button class="post-success-toast__close" type="button" aria-label="Đóng"><i data-lucide="x"></i></button>`;
  document.body.appendChild(toast);
  if (window.lucide) lucide.createIcons();
  requestAnimationFrame(() => toast.classList.add('show'));

  toast.querySelector('.post-success-toast__close')?.addEventListener('click', () => toast.remove());
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 250);
  }, 6500);

  // Đánh dấu bài vừa đăng để dễ nhận biết.
  if (id) {
    const link = document.querySelector(`a[href="detail.html?id=${CSS.escape(id)}"]`);
    const card = link?.closest('.post-card');
    if (card) {
      card.classList.add('just-posted');
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  // Làm sạch URL để reload không hiện thông báo lần nữa.
  history.replaceState({}, '', 'Index.html');
})();

/* Thông báo sau khi bài được hoàn tất và xóa */
(function showRemovedToastOnHome() {
  const page = (location.pathname.split('/').pop() || 'Index.html').toLowerCase();
  const query = new URLSearchParams(location.search);
  if ((page !== 'index.html' && page !== '') || query.get('removed') !== '1') return;
  const toast = document.createElement('div');
  toast.className = 'post-success-toast';
  toast.innerHTML = `<div class="post-success-toast__icon"><i data-lucide="circle-check-big"></i></div><div class="post-success-toast__content"><strong>Đã hoàn tất!</strong><span>Bài đăng đã được xóa và không còn hiển thị trong danh sách.</span></div><button class="post-success-toast__close" type="button" aria-label="Đóng"><i data-lucide="x"></i></button>`;
  document.body.appendChild(toast);
  if (window.lucide) lucide.createIcons();
  requestAnimationFrame(() => toast.classList.add('show'));
  toast.querySelector('.post-success-toast__close')?.addEventListener('click', () => toast.remove());
  setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 250); }, 5000);
  history.replaceState({}, '', 'Index.html');
})();

/* Menu mobile */
const menuBtn = document.querySelector('.menu-btn');
const nav = document.querySelector('.main-nav');
if (menuBtn && nav) menuBtn.addEventListener('click', () => {
  const open = nav.classList.toggle('mobile-open');
  menuBtn.setAttribute('aria-expanded', String(open));
});

/* Tìm kiếm / lọc ở trang danh sách */
const search = document.getElementById('pageSearch');
const category = document.getElementById('categoryFilter');
const locationFilter = document.getElementById('locationFilter');
const reset = document.getElementById('resetFilters');
const count = document.getElementById('resultCount');
const empty = document.getElementById('emptyResults');

function getCards() {
  return [...document.querySelectorAll('[data-card]')];
}

let listingPage = 1;
const timeFilter = document.getElementById('timeFilter');
const normalizeSearch = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g,'d').toLowerCase();

function filterCards() {
  const cards = getCards();
  const q = normalizeSearch(search?.value).trim();
  const c = normalizeSearch(category?.value);
  const l = normalizeSearch(locationFilter?.value);
  const time = timeFilter?.value || '';
  const now = Date.now();
  const startToday = new Date().setHours(0,0,0,0);
  const days = {'3days':3,'7days':7,'30days':30};
  const filtered = cards.filter(card => {
    const timestamp = cardTimestamp(card);
    return (!q || normalizeSearch(card.textContent).includes(q)) &&
      (!c || normalizeSearch(card.dataset.category).includes(c)) &&
      (!l || normalizeSearch(card.dataset.location).includes(l)) &&
      (!time || (timestamp <= now && timestamp >= (time === 'today' ? startToday : now - days[time]*86400000)));
  });
  const paginated = !!document.getElementById('pagination');
  const pageSize = paginated ? 8 : Math.max(1,filtered.length);
  const pages = Math.max(1, Math.ceil(filtered.length/pageSize));
  listingPage = Math.min(listingPage,pages);
  const visible = new Set(filtered.slice((listingPage-1)*pageSize,listingPage*pageSize));
  cards.forEach(card => card.hidden = !visible.has(card));
  if (count) count.textContent = `${filtered.length} tin ${location.pathname.endsWith('found.html') ? 'nhặt được' : 'thất lạc'} được tìm thấy`;
  if (empty) empty.hidden = filtered.length !== 0;
  const pagination = document.getElementById('pagination');
  if (pagination) {
    pagination.innerHTML = pages <= 1 ? '' : `<button class="page-button" data-page="${listingPage-1}" ${listingPage===1?'disabled':''} aria-label="Trang trước">‹</button>` +
      Array.from({length:pages},(_,i)=>`<button class="page-button ${i+1===listingPage?'active':''}" data-page="${i+1}" ${i+1===listingPage?'aria-current="page"':''}>${i+1}</button>`).join('') +
      `<button class="page-button" data-page="${listingPage+1}" ${listingPage===pages?'disabled':''} aria-label="Trang sau">›</button>`;
  }
}
function resetListingFilters() {
  [search,category,locationFilter,timeFilter].forEach(el => { if(el) el.value=''; });
  if (sortOrder) sortOrder.value='newest';
  applySelectedSort(); listingPage=1; filterCards();
}
[search,category,locationFilter,timeFilter].forEach(el => el?.addEventListener('input',()=>{listingPage=1;filterCards();}));
reset?.addEventListener('click', resetListingFilters);
document.getElementById('emptyReset')?.addEventListener('click',resetListingFilters);
sortOrder?.addEventListener('change',()=>{listingPage=1;filterCards();});
document.getElementById('pagination')?.addEventListener('click',event=>{
  const button=event.target.closest('[data-page]');
  if(!button || button.disabled) return;
  listingPage=Number(button.dataset.page);filterCards();
  document.getElementById('resultCount')?.scrollIntoView({block:'start',behavior:'smooth'});
});
if (category) {
  const initialCategory = new URLSearchParams(location.search).get('category');
  if (initialCategory && [...category.options].some(option => option.value === initialCategory)) category.value = initialCategory;
}
if (count) filterCards();

/* Upload + preview ảnh */
let pendingImageData = '';
const imageInput = document.getElementById('imageInput');
const imagePreview = document.getElementById('imagePreview');

function compressImage(file, maxWidth = 1100, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const ratio = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * ratio);
        canvas.height = Math.round(img.height * ratio);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

imageInput?.addEventListener('change', async e => {
  const file = e.target.files?.[0];
  if (!file || !imagePreview) return;
  if (!file.type.startsWith('image/')) {
    alert('Vui lòng chọn tệp ảnh JPG, PNG hoặc WEBP.');
    imageInput.value = '';
    return;
  }
  try {
    pendingImageData = await compressImage(file);
    imagePreview.src = pendingImageData;
    imagePreview.style.display = 'block';
  } catch (error) {
    console.error(error);
    alert('Không thể đọc ảnh này. Vui lòng chọn ảnh khác.');
  }
});

/* Form Đăng tin / Chỉnh sửa tin */
const postForm = document.getElementById('postForm');
const params = new URLSearchParams(location.search);
const editId = params.get('edit');
const editCode = params.get('code');
let editingPost = null;

function setRadioValue(name, value) {
  const radio = document.querySelector(`input[name="${name}"][value="${value}"]`);
  if (radio) radio.checked = true;
}

if (postForm && editId && editCode) {
  editingPost = loadPosts().find(p => p.id === editId && p.code.toUpperCase() === editCode.toUpperCase());
  if (editingPost) {
    setRadioValue('type', editingPost.type);
    document.getElementById('postTitle').value = editingPost.title || '';
    document.getElementById('postCategory').value = editingPost.category || '';
    document.getElementById('postLocation').value = editingPost.location || '';
    document.getElementById('postEventTime').value = editingPost.eventTime || '';
    document.getElementById('postLocationDetail').value = editingPost.locationDetail || '';
    document.getElementById('postDescription').value = editingPost.description || '';
    document.getElementById('postPhone').value = editingPost.phone || '';
    document.getElementById('postEmail').value = editingPost.email || '';
    const custodyEl = document.getElementById('postCustodyLocation');
    const reporterEl = document.getElementById('postReporterName');
    const reporterRoleEl = document.getElementById('postReporterRole');
    const highValueEl = document.getElementById('postHighValue');
    if (custodyEl) custodyEl.value = editingPost.custodyLocation || '';
    if (reporterEl) reporterEl.value = editingPost.reporterName || '';
    if (reporterRoleEl) reporterRoleEl.value = editingPost.reporterRole || 'student';
    if (highValueEl) highValueEl.checked = !!editingPost.isHighValue;
    const challenges = Array.isArray(editingPost.verificationChallenges) ? editingPost.verificationChallenges : [];
    ['postChallenge1','postChallenge2','postChallenge3'].forEach((id, index) => {
      const el = document.getElementById(id); if (el) el.value = challenges[index]?.question || '';
    });
    const challengeHint = document.getElementById('postChallengeHint1');
    if (challengeHint) challengeHint.value = challenges[0]?.expectedAnswerHint || '';
    pendingImageData = editingPost.image || '';
    if (pendingImageData && imagePreview) {
      imagePreview.src = pendingImageData;
      imagePreview.style.display = 'block';
    }
    const heading = postForm.querySelector('h2');
    if (heading) heading.textContent = 'Chỉnh sửa bài đăng';
    const submitText = document.getElementById('postSubmitText');
    if (submitText) submitText.textContent = 'Lưu thay đổi';
  } else {
    alert('Mã quản lý không đúng hoặc bài đăng không tồn tại.');
    location.href = 'my-posts.html';
  }
}

postForm?.addEventListener('submit', async e => {
  e.preventDefault();
  if (!postForm.reportValidity()) return;

  const submitBtn = document.getElementById('postSubmitBtn');
  const submitText = document.getElementById('postSubmitText');
  if (submitBtn) submitBtn.disabled = true;
  if (submitText) submitText.textContent = editingPost ? 'Đang lưu...' : 'Đang đăng...';

  const type = document.querySelector('input[name="type"]:checked')?.value || 'LOST';
  const data = {
    type,
    title: document.getElementById('postTitle').value.trim(),
    category: document.getElementById('postCategory').value,
    location: document.getElementById('postLocation').value,
    eventTime: document.getElementById('postEventTime').value,
    locationDetail: document.getElementById('postLocationDetail').value.trim(),
    description: document.getElementById('postDescription').value.trim(),
    phone: document.getElementById('postPhone').value.trim(),
    email: document.getElementById('postEmail').value.trim(),
    image: pendingImageData,
    custodyLocation: document.getElementById('postCustodyLocation')?.value.trim() || '',
    reporterName: document.getElementById('postReporterName')?.value.trim() || '',
    reporterRole: document.getElementById('postReporterRole')?.value || 'student',
    isHighValue: !!document.getElementById('postHighValue')?.checked,
    verificationChallenges: [
      { id:'challenge-1', question: document.getElementById('postChallenge1')?.value.trim() || '', expectedAnswerHint: document.getElementById('postChallengeHint1')?.value.trim() || '', required:true },
      { id:'challenge-2', question: document.getElementById('postChallenge2')?.value.trim() || '', expectedAnswerHint:'', required:false },
      { id:'challenge-3', question: document.getElementById('postChallenge3')?.value.trim() || '', expectedAnswerHint:'', required:false }
    ].filter(item => item.question)
  };

  const posts = loadPosts();
  let savedPost;
  if (editingPost) {
    const index = posts.findIndex(p => p.id === editingPost.id);
    savedPost = { ...editingPost, ...data, updatedAt: new Date().toISOString() };
    posts[index] = savedPost;
  } else {
    let code;
    do code = makeManagementCode(); while (posts.some(p => p.code === code));
    savedPost = {
      id: `post_${Date.now()}`,
      code,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data
    };
    posts.unshift(savedPost);
  }

  try {
    savePosts(posts);
    try { localStorage.setItem(LAST_CODE_KEY, savedPost.code); } catch (_) {}
  } catch (error) {
    console.warn('Không thể lưu localStorage tại trang hiện tại:', error);
    // Không chặn việc đăng tin: dữ liệu vẫn được chuyển trực tiếp sang Index.html
    // bằng window.name và sẽ được lưu lại ở trang chủ nếu trình duyệt cho phép.
  }

  if (!editingPost) {
    // Giữ dữ liệu dự phòng cho trường hợp trình duyệt hạn chế localStorage khi mở file trực tiếp.
    putPendingPostInWindow(savedPost);
    // Không chuyển thẳng về Trang chủ nữa. Hiển thị trang thành công cố định để
    // người đăng có đủ thời gian lưu mã quản lý trước khi tiếp tục.
    location.href = `success.html?code=${encodeURIComponent(savedPost.code)}&id=${encodeURIComponent(savedPost.id)}`;
  } else {
    location.href = `success.html?code=${encodeURIComponent(savedPost.code)}&id=${encodeURIComponent(savedPost.id)}&edited=1`;
  }
});

/* Trang thành công */
const managementCodeEl = document.getElementById('managementCode');
if (managementCodeEl) {
  const code = params.get('code') || localStorage.getItem(LAST_CODE_KEY) || 'LL-XXXXXX';
  const id = params.get('id');
  const edited = params.get('edited') === '1';
  managementCodeEl.textContent = code;
  if (edited) {
    const heading = document.getElementById('successHeading');
    if (heading) heading.textContent = 'Cập nhật tin thành công!';
  }
  const view = document.getElementById('viewCreatedPost');
  const manage = document.getElementById('manageCreatedPost');
  const home = document.getElementById('goHomeAfterPost');
  if (view && id) view.href = `detail.html?id=${encodeURIComponent(id)}`;
  if (manage) manage.href = `my-posts.html?code=${encodeURIComponent(code)}`;
  if (home) {
    home.href = id
      ? `Index.html?posted=1&id=${encodeURIComponent(id)}&code=${encodeURIComponent(code)}`
      : 'Index.html';
  }

  document.getElementById('copyCodeBtn')?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(code);
      const btn = document.getElementById('copyCodeBtn');
      btn.classList.add('copied');
      btn.title = 'Đã sao chép';
      const copyStatus = document.getElementById('copyCodeStatus');
      if (copyStatus) copyStatus.textContent = 'Đã sao chép mã vào clipboard ✓';
      setTimeout(() => {
        btn.classList.remove('copied');
        if (copyStatus) copyStatus.textContent = 'Mã này sẽ luôn cần khi bạn muốn sửa, hoàn tất hoặc xóa bài.';
      }, 2500);
    } catch {
      prompt('Sao chép mã quản lý:', code);
    }
  });
}


/* Khi chủ bài xác nhận đã tìm lại/trao trả đồ, bài sẽ bị xóa ngay.
   Website không thể tự biết đồ đã được tìm thấy ngoài đời, nên người dùng
   chỉ cần bấm nút xác nhận; sau bước đó không cần bấm nút Xóa lần nữa. */
function resolveAndDeletePost(post) {
  if (!post?.id) return false;
  const remaining = loadPosts().filter(p => p.id !== post.id);
  savePosts(remaining);
  deleteFeedbacksForPost(post.id);
  try {
    if (localStorage.getItem(LAST_CODE_KEY) === post.code) {
      localStorage.removeItem(LAST_CODE_KEY);
    }
  } catch (_) {}
  return true;
}

/* Trang Tin của tôi */
const manageCodeInput = document.getElementById('manageCode');
const manageList = document.getElementById('manageList');
const showManagedPost = document.getElementById('showManagedPost');

function renderManagedPost(code) {
  if (!manageList) return;
  const normalized = (code || '').trim().toUpperCase();
  const post = loadPosts().find(p => p.code.toUpperCase() === normalized);
  if (!post) {
    manageList.innerHTML = `<div class="manage-placeholder error"><i data-lucide="circle-alert"></i><h3>Không tìm thấy bài đăng</h3><p>Kiểm tra lại mã quản lý rồi thử lại.</p></div>`;
    if (window.lucide) lucide.createIcons();
    return;
  }
  const statusText = post.status === 'COMPLETED' ? 'Đã hoàn tất' : 'Đang hoạt động';
  const typeText = typeLabel(post.type);
  const feedbacks = loadFeedbacks()
    .filter(item => item.postId === post.id)
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  const feedbackHTML = feedbacks.length
    ? feedbacks.map(item => `
        <article class="feedback-inbox__item">
          <div class="feedback-inbox__top">
            <div><strong>${escapeHTML(item.senderName || 'Người gửi')}</strong><span>${formatRelativeTime(item.createdAt)}</span></div>
            <button class="feedback-delete-btn" type="button" data-delete-feedback-id="${escapeHTML(item.id)}" title="Xóa phản hồi"><i data-lucide="trash-2"></i></button>
          </div>
          <a class="feedback-contact" href="${String(item.senderContact || '').includes('@') ? `mailto:${escapeHTML(item.senderContact)}` : `tel:${escapeHTML(String(item.senderContact || '').replace(/\s+/g, ''))}`}"><i data-lucide="contact"></i>${escapeHTML(item.senderContact || 'Không có liên hệ')}</a>
          <p>${escapeHTML(item.message || '')}</p>
        </article>`).join('')
    : `<div class="feedback-inbox__empty"><i data-lucide="message-circle-more"></i><span>Chưa có phản hồi nào cho bài đăng này.</span></div>`;
  manageList.innerHTML = `
    <article class="manage-item">
      <img src="${escapeHTML(fallbackImage(post))}" alt="${escapeHTML(post.title)}">
      <div>
        <h3><a href="detail.html?id=${encodeURIComponent(post.id)}">${escapeHTML(post.title)}</a></h3>
        <p>${typeText} · ${escapeHTML(post.location)} · ${formatRelativeTime(post.createdAt)}</p>
        <span class="status-pill ${post.status === 'COMPLETED' ? 'completed' : ''}">${statusText}</span>
        <div class="manage-code-small">Mã: <strong>${escapeHTML(post.code)}</strong></div>
      </div>
      <div class="manage-actions">
        <a class="btn btn-secondary" href="post.html?edit=${encodeURIComponent(post.id)}&code=${encodeURIComponent(post.code)}"><i data-lucide="pencil"></i>Chỉnh sửa</a>
        ${post.status !== 'COMPLETED' ? `<button class="btn btn-received" data-received-id="${escapeHTML(post.id)}"><i data-lucide="package-check"></i>${post.type === 'LOST' ? 'Đã tìm thấy đồ · Xóa bài' : 'Đã trao trả đồ · Xóa bài'}</button>` : ''}
        <button class="btn btn-danger" data-delete-id="${escapeHTML(post.id)}"><i data-lucide="trash-2"></i>Xóa</button>
      </div>
    </article>
    <section class="feedback-inbox">
      <div class="feedback-inbox__header">
        <div><span class="feedback-inbox__eyebrow">PHẢN HỒI NHẬN ĐƯỢC</span><h3>Phản hồi cho bài đăng</h3></div>
        <span class="feedback-count">${feedbacks.length}</span>
      </div>
      <div class="feedback-inbox__list">${feedbackHTML}</div>
    </section>`;
  if (window.lucide) lucide.createIcons();

  manageList.querySelectorAll('[data-delete-feedback-id]').forEach(button => {
    button.addEventListener('click', () => {
      const feedbackId = button.dataset.deleteFeedbackId;
      if (!confirm('Xóa phản hồi này khỏi danh sách?')) return;
      saveFeedbacks(loadFeedbacks().filter(item => item.id !== feedbackId));
      renderManagedPost(post.code);
    });
  });

  manageList.querySelector('[data-received-id]')?.addEventListener('click', () => {
    const actionText = post.type === 'LOST' ? 'đã nhận lại được đồ' : 'đã trao trả đồ cho chủ sở hữu';
    if (!confirm(`Xác nhận bạn ${actionText}? Sau khi xác nhận, bài đăng sẽ được xóa khỏi Trang chủ và danh sách tìm kiếm.`)) return;
    resolveAndDeletePost(post);
    manageList.innerHTML = `<div class="manage-placeholder success"><i data-lucide="circle-check-big"></i><h3>Đã tìm thấy đồ và tự động xóa bài</h3><p>Bài đăng đã được xóa ngay và không còn xuất hiện trên Trang chủ, Tin thất lạc hoặc Tin nhặt được.</p><a class="btn btn-primary" href="Index.html?removed=1">Về Trang chủ</a></div>`;
    if (window.lucide) lucide.createIcons();
  });

  manageList.querySelector('[data-delete-id]')?.addEventListener('click', () => {
    if (!confirm('Bạn có chắc chắn muốn xóa bài đăng này? Hành động này không thể hoàn tác.')) return;
    const posts = loadPosts().filter(p => p.id !== post.id);
    savePosts(posts);
    deleteFeedbacksForPost(post.id);
    manageList.innerHTML = `<div class="manage-placeholder"><i data-lucide="trash-2"></i><h3>Đã xóa bài đăng</h3><p>Bài đăng và các phản hồi liên quan đã được xóa khỏi trình duyệt này.</p></div>`;
    if (window.lucide) lucide.createIcons();
  });
}

showManagedPost?.addEventListener('click', () => renderManagedPost(manageCodeInput?.value));
manageCodeInput?.addEventListener('keydown', e => {
  if (e.key === 'Enter') renderManagedPost(manageCodeInput.value);
});
if (manageCodeInput) {
  const codeFromUrl = params.get('code');
  if (codeFromUrl) {
    manageCodeInput.value = codeFromUrl;
    renderManagedPost(codeFromUrl);
  }
}

/* Trang chi tiết cho bài do người dùng vừa đăng */
function renderDynamicDetail() {
  const id = params.get('id');
  if (!id) return;
  const post = loadPosts().find(p => p.id === id);
  if (!post) return;

  const image = document.getElementById('detailImage');
  if (image) {
    image.src = fallbackImage(post);
    image.alt = post.title;
  }
  document.querySelectorAll('.thumb img').forEach(img => { img.src = fallbackImage(post); img.alt = post.title; });

  const title = document.getElementById('detailTitle');
  if (title) title.textContent = post.title;
  document.title = `${post.title} | Lost&Found USTH`;

  const badge = document.getElementById('detailTypeBadge');
  if (badge) {
    badge.textContent = typeLabel(post.type);
    badge.className = `badge ${post.type === 'FOUND' ? 'found' : 'lost'}`;
  }
  const time = document.getElementById('detailTime');
  if (time) time.textContent = formatRelativeTime(post.createdAt);

  const meta = document.querySelectorAll('.detail-meta .meta-box');
  if (meta[0]) meta[0].querySelector('div').innerHTML = `<strong>Danh mục</strong><br>${escapeHTML(post.category)}`;
  if (meta[1]) meta[1].querySelector('div').innerHTML = `<strong>Địa điểm</strong><br>${escapeHTML(post.location)}${post.locationDetail ? ` · ${escapeHTML(post.locationDetail)}` : ''}`;
  if (meta[2]) meta[2].querySelector('div').innerHTML = `<strong>Thời gian</strong><br>${formatDateTime(post.eventTime)}`;
  if (meta[3]) meta[3].querySelector('div').innerHTML = `<strong>Trạng thái</strong><br>${post.status === 'COMPLETED' ? 'Đã hoàn tất' : 'Đang hoạt động'}`;

  const description = document.querySelector('.detail-description p');
  if (description) description.textContent = post.description;

  const contactLines = document.querySelectorAll('#detailContact .contact-line span');
  if (contactLines[0]) contactLines[0].textContent = post.phone || 'Không có số điện thoại';
  if (contactLines[1]) contactLines[1].textContent = post.email || 'Không cung cấp email';

  const breadcrumbLinks = document.querySelectorAll('.breadcrumbs a');
  if (breadcrumbLinks[1]) {
    breadcrumbLinks[1].textContent = post.type === 'FOUND' ? 'Tin nhặt được' : 'Tin thất lạc';
    breadcrumbLinks[1].href = post.type === 'FOUND' ? 'found.html' : 'lost.html';
  }
}
renderDynamicDetail();

/* Chủ bài có thể xác nhận đã nhận/trao trả đồ ngay trên trang chi tiết.
   Để tránh người khác xóa nhầm, hệ thống yêu cầu mã quản lý của bài đăng. */
function setupResolvedDeleteOnDetail() {
  const id = params.get('id');
  if (!id) return;
  const post = loadPosts().find(p => p.id === id);
  if (!post) return;
  const actions = document.querySelector('.detail-actions');
  if (!actions || document.getElementById('resolvedDeleteBtn')) return;

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.id = 'resolvedDeleteBtn';
  btn.className = 'btn btn-received';
  btn.innerHTML = `<i data-lucide="package-check"></i>${post.type === 'LOST' ? 'Đã tìm thấy đồ · Xóa bài' : 'Đã trao trả đồ · Xóa bài'}`;
  actions.insertAdjacentElement('afterend', btn);

  const hint = document.createElement('p');
  hint.className = 'owner-action-hint';
  hint.textContent = 'Chỉ chủ bài đăng mới có thể dùng chức năng này bằng mã quản lý.';
  btn.insertAdjacentElement('afterend', hint);
  if (window.lucide) lucide.createIcons();

  btn.addEventListener('click', () => {
    const entered = prompt('Nhập mã quản lý bài đăng để xác nhận:');
    if (!entered) return;
    if (entered.trim().toUpperCase() !== String(post.code || '').toUpperCase()) {
      alert('Mã quản lý không đúng. Bài đăng chưa bị xóa.');
      return;
    }
    const message = post.type === 'LOST'
      ? 'Bạn đã nhận lại được đồ? Bài đăng sẽ được xóa khỏi hệ thống trên trình duyệt này.'
      : 'Bạn đã trao trả đồ cho chủ sở hữu? Bài đăng sẽ được xóa khỏi hệ thống trên trình duyệt này.';
    if (!confirm(message)) return;
    resolveAndDeletePost(post);
    location.href = 'Index.html?removed=1';
  });
}
setupResolvedDeleteOnDetail();

/* Gửi phản hồi cho một bài đăng */
(function setupPostFeedback() {
  const openBtn = document.getElementById('feedbackBtn');
  const modal = document.getElementById('feedbackModal');
  const form = document.getElementById('feedbackForm');
  const success = document.getElementById('feedbackSuccess');
  if (!openBtn || !modal || !form) return;

  const postId = params.get('id') || 'sample-detail';
  const dynamicPost = loadPosts().find(post => post.id === postId);
  const postTitle = dynamicPost?.title || document.getElementById('detailTitle')?.textContent?.trim() || 'bài đăng này';
  const target = document.getElementById('feedbackTargetTitle');
  if (target) target.textContent = `Bạn đang phản hồi về: “${postTitle}”.`;

  function openFeedbackModal() {
    form.hidden = false;
    if (success) success.hidden = true;
    modal.hidden = false;
    document.body.classList.add('modal-open');
    setTimeout(() => document.getElementById('feedbackName')?.focus(), 30);
  }

  function closeFeedbackModal() {
    modal.hidden = true;
    document.body.classList.remove('modal-open');
  }

  openBtn.addEventListener('click', openFeedbackModal);
  modal.querySelectorAll('[data-feedback-close]').forEach(button => button.addEventListener('click', closeFeedbackModal));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !modal.hidden) closeFeedbackModal();
  });

  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const senderName = document.getElementById('feedbackName')?.value.trim() || '';
    const senderContact = document.getElementById('feedbackContact')?.value.trim() || '';
    const message = document.getElementById('feedbackMessage')?.value.trim() || '';
    if (message.length < 10) {
      alert('Nội dung phản hồi cần ít nhất 10 ký tự.');
      return;
    }

    const feedbacks = loadFeedbacks();
    feedbacks.unshift({
      id: makeFeedbackId(),
      postId,
      postTitle,
      senderName,
      senderContact,
      message,
      createdAt: new Date().toISOString()
    });
    saveFeedbacks(feedbacks);
    form.reset();
    form.hidden = true;
    if (success) success.hidden = false;
    if (window.lucide) lucide.createIcons();
  });
})();

/* Nút chia sẻ trên trang chi tiết */
document.getElementById('sharePostBtn')?.addEventListener('click', async () => {
  try {
    if (navigator.share) await navigator.share({ title: document.title, url: location.href });
    else {
      await navigator.clipboard.writeText(location.href);
      alert('Đã sao chép liên kết bài đăng.');
    }
  } catch (_) {}
});

/* =========================
   Phản hồi hệ thống từ contact.html -> Admin + mã tra cứu
   ========================= */
const SYSTEM_FEEDBACK_KEY = 'lostlink_usth_contact_feedback_v1';

function loadSystemFeedbacks() {
  try { return JSON.parse(localStorage.getItem(SYSTEM_FEEDBACK_KEY) || '[]'); }
  catch { return []; }
}

function saveSystemFeedbacks(items) {
  localStorage.setItem(SYSTEM_FEEDBACK_KEY, JSON.stringify(items));
}

function generateFeedbackTrackingCode(existing = []) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const used = new Set(existing.map(item => String(item.trackingCode || '').toUpperCase()));
  let code = '';
  do {
    let body = '';
    for (let i = 0; i < 6; i += 1) body += chars[Math.floor(Math.random() * chars.length)];
    code = `FB-${body}`;
  } while (used.has(code));
  return code;
}

function normalizeFeedbackStatus(status) {
  return status === 'DONE' ? 'RESOLVED' : (status || 'NEW');
}

function formatFeedbackDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }).format(date);
}

async function copyTextSafe(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (_) {
    window.prompt('Sao chép mã:', text);
    return false;
  }
}

const systemFeedbackForm = document.getElementById('systemFeedbackForm');
systemFeedbackForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const name = document.getElementById('systemFeedbackName')?.value.trim() || '';
  const email = document.getElementById('systemFeedbackEmail')?.value.trim() || '';
  const subject = document.getElementById('systemFeedbackSubject')?.value || '';
  const message = document.getElementById('systemFeedbackMessage')?.value.trim() || '';
  const statusEl = document.getElementById('systemFeedbackStatus');

  if (!name || !email || !subject || !message) {
    if (statusEl) {
      statusEl.style.display = 'block';
      statusEl.innerHTML = '<div class="feedback-form-error">Vui lòng điền đầy đủ thông tin trước khi gửi.</div>';
    }
    return;
  }

  const feedbacks = loadSystemFeedbacks();
  const trackingCode = generateFeedbackTrackingCode(feedbacks);
  const now = new Date().toISOString();
  feedbacks.unshift({
    id: `sysfb-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    trackingCode,
    name,
    email,
    subject,
    message,
    status: 'NEW',
    adminReply: '',
    createdAt: now,
    readAt: null,
    resolvedAt: null
  });
  saveSystemFeedbacks(feedbacks);
  systemFeedbackForm.reset();

  if (statusEl) {
    statusEl.style.display = 'block';
    statusEl.innerHTML = `
      <div class="feedback-submit-success">
        <div class="feedback-submit-icon"><i data-lucide="circle-check-big"></i></div>
        <div class="feedback-submit-copy">
          <strong>Phản hồi đã được gửi thành công</strong>
          <p>Hãy lưu mã dưới đây để kiểm tra khi Admin đã đọc hoặc xử lý phản hồi.</p>
          <div class="feedback-tracking-code-row">
            <code>${escapeHTML(trackingCode)}</code>
            <button type="button" class="feedback-copy-code" id="copyFeedbackTrackingCode"><i data-lucide="copy"></i>Sao chép</button>
          </div>
          <div class="feedback-submit-actions">
            <a class="btn btn-primary" href="feedback-status.html?code=${encodeURIComponent(trackingCode)}"><i data-lucide="search-check"></i>Kiểm tra trạng thái</a>
          </div>
          <small>Không chia sẻ mã này nếu phản hồi có thông tin riêng tư.</small>
        </div>
      </div>`;
    document.getElementById('copyFeedbackTrackingCode')?.addEventListener('click', async () => {
      await copyTextSafe(trackingCode);
      const btn = document.getElementById('copyFeedbackTrackingCode');
      if (btn) btn.innerHTML = '<i data-lucide="check"></i>Đã sao chép';
      if (window.lucide) lucide.createIcons();
    });
  }
  if (window.lucide) lucide.createIcons();
});

/* =========================
   Tra cứu trạng thái phản hồi
   ========================= */
function renderFeedbackLookup(code) {
  const result = document.getElementById('feedbackLookupResult');
  if (!result) return;
  const normalizedCode = String(code || '').trim().toUpperCase();
  if (!normalizedCode) {
    result.innerHTML = '';
    return;
  }
  const item = loadSystemFeedbacks().find(f => String(f.trackingCode || '').toUpperCase() === normalizedCode);
  if (!item) {
    result.innerHTML = `
      <div class="feedback-not-found">
        <i data-lucide="circle-alert"></i>
        <div><strong>Không tìm thấy mã phản hồi</strong><p>Kiểm tra lại mã FB-XXXXXX hoặc đảm bảo bạn đang dùng đúng trình duyệt đã gửi phản hồi.</p></div>
      </div>`;
    if (window.lucide) lucide.createIcons();
    return;
  }

  const status = normalizeFeedbackStatus(item.status);
  const isRead = status === 'READ' || status === 'RESOLVED';
  const isResolved = status === 'RESOLVED';
  result.innerHTML = `
    <article class="feedback-ticket">
      <div class="feedback-ticket-head">
        <div>
          <span class="feedback-ticket-label">MÃ PHẢN HỒI</span>
          <div class="feedback-ticket-code">${escapeHTML(item.trackingCode || normalizedCode)}</div>
        </div>
        <span class="feedback-public-status ${status.toLowerCase()}">${isResolved ? 'Đã xử lý' : isRead ? 'Đã đọc' : 'Đã gửi'}</span>
      </div>

      <div class="feedback-progress">
        <div class="feedback-progress-step done">
          <span><i data-lucide="send"></i></span><div><strong>Đã gửi</strong><small>${formatFeedbackDate(item.createdAt)}</small></div>
        </div>
        <div class="feedback-progress-line ${isRead ? 'done' : ''}"></div>
        <div class="feedback-progress-step ${isRead ? 'done' : ''}">
          <span><i data-lucide="eye"></i></span><div><strong>Đã đọc</strong><small>${item.readAt ? formatFeedbackDate(item.readAt) : 'Đang chờ Admin tiếp nhận'}</small></div>
        </div>
        <div class="feedback-progress-line ${isResolved ? 'done' : ''}"></div>
        <div class="feedback-progress-step ${isResolved ? 'done' : ''}">
          <span><i data-lucide="badge-check"></i></span><div><strong>Đã xử lý</strong><small>${item.resolvedAt ? formatFeedbackDate(item.resolvedAt) : 'Chưa hoàn tất'}</small></div>
        </div>
      </div>

      <div class="feedback-ticket-grid">
        <div><span>Chủ đề</span><strong>${escapeHTML(item.subject || 'Phản hồi hệ thống')}</strong></div>
        <div><span>Người gửi</span><strong>${escapeHTML(item.name || 'Ẩn danh')}</strong></div>
        <div class="full"><span>Nội dung đã gửi</span><p>${escapeHTML(item.message || item.content || '')}</p></div>
      </div>

      <div class="feedback-admin-reply ${item.adminReply ? 'has-reply' : ''}">
        <div class="feedback-admin-reply-title"><i data-lucide="message-square-reply"></i><strong>Phản hồi từ LostLink USTH</strong></div>
        ${item.adminReply
          ? `<p>${escapeHTML(item.adminReply)}</p>`
          : `<p>${isResolved ? 'Admin đã xử lý phản hồi nhưng chưa để lại nội dung trả lời.' : 'Chưa có nội dung trả lời từ Admin.'}</p>`}
      </div>
    </article>`;
  if (window.lucide) lucide.createIcons();
}

const feedbackLookupForm = document.getElementById('feedbackLookupForm');
const feedbackLookupInput = document.getElementById('feedbackLookupCode');
if (feedbackLookupForm && feedbackLookupInput) {
  const paramCode = new URLSearchParams(location.search).get('code') || '';
  if (paramCode) {
    feedbackLookupInput.value = paramCode.toUpperCase();
    renderFeedbackLookup(paramCode);
  }
  feedbackLookupInput.addEventListener('input', () => {
    feedbackLookupInput.value = feedbackLookupInput.value.toUpperCase().replace(/\s+/g, '');
  });
  feedbackLookupForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const code = feedbackLookupInput.value.trim().toUpperCase();
    if (!code) return;
    history.replaceState(null, '', `feedback-status.html?code=${encodeURIComponent(code)}`);
    renderFeedbackLookup(code);
  });
}
