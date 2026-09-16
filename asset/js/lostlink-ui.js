// Keep Complete's tools accessible without expanding the reference navigation.
document.addEventListener('DOMContentLoaded', () => {
  const menu = document.querySelector('.utility-menu');
  const role = document.getElementById('portalRoleSwitch');
  if (role) {
    menu?.querySelector('.utility-links')?.appendChild(role);
    role.querySelector('span')?.replaceChildren(document.createTextNode(role.classList.contains('officer') ? 'Chế độ bảo vệ' : 'Chế độ sinh viên'));
  }
  document.addEventListener('click', event => {
    if (menu && !menu.contains(event.target)) menu.open = false;
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    if (menu?.open) { menu.open = false; menu.querySelector('summary').focus(); }
    document.querySelector('.main-nav')?.classList.remove('mobile-open');
    document.querySelector('.menu-btn')?.setAttribute('aria-expanded','false');
  });
  // A missing upload should use the same neutral fallback as the reference.
  document.querySelectorAll('.post-card img, .detail-main-image, .search-result-image img').forEach(img => {
    img.addEventListener('error', () => { img.src = 'asset/images/placeholder.svg'; }, {once:true});
  });
});
