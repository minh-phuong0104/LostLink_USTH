(function () {
    'use strict';

    if (!window.LostLink) {
        console.error('LostLink API helper is missing.');
        return;
    }

    const {
        request,
        getToken,
        getStoredUser,
        requireLogin,
        escapeHTML,
        formatDateTime,
        formatRelativeTime
    } = window.LostLink;

    const state = {
        listingPosts: [],
        currentDetailPost: null,
        currentEditPost: null
    };

    function typeLabel(type) {
        return type === 'found' ? 'Nhặt được' : 'Thất lạc';
    }

    function statusLabel(status) {
        const labels = {
            active: 'Đang hoạt động',
            resolved: 'Đã giải quyết',
            closed: 'Đã đóng',
            hidden: 'Đã ẩn'
        };

        return labels[status] || status || 'Không rõ';
    }

    function fallbackImage(post) {
        return post.image_url || 'asset/images/placeholder.svg';
    }

    function postCardHTML(post) {
        const image = escapeHTML(fallbackImage(post));
        const href = `detail.html?id=${encodeURIComponent(post.id)}`;
        const name = post.author_name || 'Sinh viên USTH';
        const initials = name
            .split(/\s+/)
            .slice(-2)
            .map((word) => word[0])
            .join('')
            .toUpperCase();

        return `
            <article
                class="post-card"
                data-card
                data-created-at="${escapeHTML(post.created_at || '')}"
                data-title="${escapeHTML(post.title || '')}"
                data-location="${escapeHTML(post.location || '')}"
                data-category="${escapeHTML(post.category || '')}"
            >
                <img class="post-card__background" src="${image}" alt="" aria-hidden="true">
                <div class="post-card__paper">
                    <span class="post-card__pin" aria-hidden="true"></span>
                    <a class="post-card__media" href="${href}" tabindex="-1" aria-hidden="true">
                        <img class="post-card__image" src="${image}" alt="${escapeHTML(post.title)}" loading="lazy">
                    </a>
                    <div class="post-card__content">
                        <div class="post-card__meta">
                            <span class="badge ${post.type === 'found' ? 'found' : 'lost'}">${typeLabel(post.type)}</span>
                            <span class="post-time time">${formatRelativeTime(post.created_at)}</span>
                        </div>
                        <h3 class="post-card__title">
                            <a href="${href}">${escapeHTML(post.title)}</a>
                        </h3>
                        <p class="post-location">
                            <i data-lucide="map-pin"></i>
                            <span>${escapeHTML(post.location || 'USTH')}</span>
                        </p>
                        <p class="post-description">${escapeHTML(post.description || '')}</p>
                        <div class="post-card__footer">
                            <div class="author">
                                <span class="author-avatar-fallback">${escapeHTML(initials)}</span>
                                <span class="author-name">${escapeHTML(name)}</span>
                            </div>
                            <a class="details-link" href="${href}">
                                Xem chi tiết <i data-lucide="arrow-right"></i>
                            </a>
                        </div>
                    </div>
                </div>
            </article>
        `;
    }

    function showEmptyState(grid, message = 'Chưa có dữ liệu.') {
        if (!grid) return;

        grid.innerHTML = `
            <div class="manage-placeholder" style="grid-column:1/-1">
                <i data-lucide="inbox"></i>
                <h3>${escapeHTML(message)}</h3>
            </div>
        `;
    }

    async function loadHomePosts() {
        const grid = document.getElementById('homePostGrid');
        if (!grid) return;

        try {
            const posts = await request('/api/posts?status=active&sort=newest');
            const newest = posts.slice(0, 4);

            if (newest.length === 0) {
                showEmptyState(grid, 'Chưa có bài đăng nào.');
                return;
            }

            grid.innerHTML = newest.map(postCardHTML).join('');
            window.lucide?.createIcons();
        } catch (error) {
            showEmptyState(grid, 'Không thể tải bài đăng. Hãy kiểm tra backend.');
        }
    }

    function selectedListingType() {
        const page = location.pathname.split('/').pop().toLowerCase();
        return page === 'found.html' ? 'found' : 'lost';
    }

    async function loadListingPosts() {
        const grid = document.getElementById('listingGrid');
        if (!grid) return;

        const type = selectedListingType();

        try {
            state.listingPosts = await request(`/api/posts?type=${type}&status=active&sort=newest`);
            renderListingPosts();
        } catch (error) {
            state.listingPosts = [];
            renderListingPosts();
        }
    }

    function timeFilterMatches(post, filterValue) {
        if (!filterValue) return true;

        const createdAt = new Date(post.created_at).getTime();
        if (Number.isNaN(createdAt)) return true;

        const day = 24 * 60 * 60 * 1000;
        const now = Date.now();

        if (filterValue === 'today') return now - createdAt <= day;
        if (filterValue === '3days') return now - createdAt <= 3 * day;
        if (filterValue === '7days') return now - createdAt <= 7 * day;
        if (filterValue === '30days') return now - createdAt <= 30 * day;

        return true;
    }

    function renderListingPosts() {
        const grid = document.getElementById('listingGrid');
        if (!grid) return;

        const search = (document.getElementById('pageSearch')?.value || '').trim().toLowerCase();
        const category = document.getElementById('categoryFilter')?.value || '';
        const locationValue = document.getElementById('locationFilter')?.value || '';
        const time = document.getElementById('timeFilter')?.value || '';
        const sort = document.getElementById('sortOrder')?.value || 'newest';

        let posts = [...state.listingPosts];

        if (search) {
            posts = posts.filter((post) => {
                const text = `${post.title} ${post.description} ${post.location} ${post.category}`.toLowerCase();
                return text.includes(search);
            });
        }

        if (category) {
            posts = posts.filter((post) => post.category === category);
        }

        if (locationValue) {
            posts = posts.filter((post) => post.location === locationValue);
        }

        if (time) {
            posts = posts.filter((post) => timeFilterMatches(post, time));
        }

        posts.sort((a, b) => {
            if (sort === 'oldest') {
                return new Date(a.created_at) - new Date(b.created_at);
            }

            if (sort === 'title-asc') {
                return a.title.localeCompare(b.title, 'vi');
            }

            return new Date(b.created_at) - new Date(a.created_at);
        });

        const resultCount = document.getElementById('resultCount');
        if (resultCount) {
            resultCount.textContent = `${posts.length} kết quả`;
        }

        const empty = document.getElementById('emptyResults');
        if (empty) {
            empty.hidden = posts.length > 0;
        }

        grid.innerHTML = posts.map(postCardHTML).join('');
        window.lucide?.createIcons();
    }

    function setupListingFilters() {
        const ids = [
            'pageSearch',
            'categoryFilter',
            'locationFilter',
            'timeFilter',
            'sortOrder'
        ];

        ids.forEach((id) => {
            const element = document.getElementById(id);
            if (!element) return;

            const eventName = element.tagName === 'INPUT' ? 'input' : 'change';
            element.addEventListener(eventName, renderListingPosts);
        });

        const reset = () => {
            const search = document.getElementById('pageSearch');
            const category = document.getElementById('categoryFilter');
            const locationSelect = document.getElementById('locationFilter');
            const time = document.getElementById('timeFilter');
            const sort = document.getElementById('sortOrder');

            if (search) search.value = '';
            if (category) category.value = '';
            if (locationSelect) locationSelect.value = '';
            if (time) time.value = '';
            if (sort) sort.value = 'newest';

            renderListingPosts();
        };

        document.getElementById('resetFilters')?.addEventListener('click', reset);
        document.getElementById('emptyReset')?.addEventListener('click', reset);
    }

    function readVerificationQuestionsFromForm() {
        const questions = [];

        for (let number = 1; number <= 3; number += 1) {
            const questionElement = document.getElementById(`postChallenge${number}`);
            if (!questionElement) continue;

            const question = questionElement.value.trim();
            if (!question) continue;

            const hintElement = document.getElementById(`postChallengeHint${number}`);

            questions.push({
                id: `q${number}`,
                question,
                hint: hintElement?.value.trim() || '',
                required: number === 1
            });
        }

        return questions;
    }

    async function uploadSelectedImage() {
        const input = document.getElementById('imageInput');
        const file = input?.files?.[0];

        if (!file) {
            return null;
        }

        const formData = new FormData();
        formData.append('image', file);

        const data = await request('/api/uploads', {
            method: 'POST',
            body: formData
        });

        return data.imageUrl;
    }

    function getPostFormData(imageUrl) {
        const checkedType = document.querySelector('input[name="type"]:checked')?.value || 'LOST';

        return {
            type: checkedType.toLowerCase(),
            title: document.getElementById('postTitle').value.trim(),
            category: document.getElementById('postCategory').value,
            location: document.getElementById('postLocation').value,
            eventDate: document.getElementById('postEventTime').value,
            locationDetail: document.getElementById('postLocationDetail').value.trim(),
            description: document.getElementById('postDescription').value.trim(),
            imageUrl: imageUrl || state.currentEditPost?.image_url || '',
            phone: document.getElementById('postPhone').value.trim(),
            email: document.getElementById('postEmail').value.trim(),
            highValue: Boolean(document.getElementById('postHighValue')?.checked),
            custodyLocation: document.getElementById('postCustodyLocation')?.value.trim() || '',
            reporterName: document.getElementById('postReporterName')?.value.trim() || '',
            reporterRole: document.getElementById('postReporterRole')?.value || '',
            verificationQuestions: readVerificationQuestionsFromForm()
        };
    }

    function syncFoundSecuritySection() {
        const section = document.getElementById('foundSecuritySection');
        if (!section) return;

        const type = document.querySelector('input[name="type"]:checked')?.value;
        const isFound = type === 'FOUND';

        section.hidden = !isFound;

        section.querySelectorAll('[data-found-required]').forEach((element) => {
            element.required = isFound;
        });
    }

    async function populateEditForm(postId) {
        try {
            const managementCode = new URLSearchParams(location.search).get('code') || '';
            const posts = await request(`/api/posts/mine?code=${encodeURIComponent(managementCode)}`);
            const post = posts.find((item) => item.id === postId);

            if (!post) {
                alert('Không tìm thấy bài của bạn để sửa.');
                return;
            }

            state.currentEditPost = post;

            const typeValue = String(post.type).toUpperCase();
            const typeInput = document.querySelector(`input[name="type"][value="${typeValue}"]`);
            if (typeInput) typeInput.checked = true;

            document.getElementById('postTitle').value = post.title || '';
            document.getElementById('postCategory').value = post.category || '';
            document.getElementById('postLocation').value = post.location || '';
            document.getElementById('postLocationDetail').value = post.location_detail || '';
            document.getElementById('postDescription').value = post.description || '';
            document.getElementById('postPhone').value = post.phone || '';
            document.getElementById('postEmail').value = post.email || '';
            document.getElementById('postEventTime').value = post.event_date
                ? new Date(post.event_date).toISOString().slice(0, 16)
                : '';

            if (document.getElementById('postHighValue')) {
                document.getElementById('postHighValue').checked = Boolean(post.high_value);
            }

            if (document.getElementById('postCustodyLocation')) {
                document.getElementById('postCustodyLocation').value = post.custody_location || '';
            }

            if (document.getElementById('postReporterName')) {
                document.getElementById('postReporterName').value = post.reporter_name || '';
            }

            if (document.getElementById('postReporterRole')) {
                document.getElementById('postReporterRole').value = post.reporter_role || 'student';
            }

            const questions = Array.isArray(post.verification_questions)
                ? post.verification_questions
                : [];

            questions.slice(0, 3).forEach((item, index) => {
                const number = index + 1;
                const question = document.getElementById(`postChallenge${number}`);
                const hint = document.getElementById(`postChallengeHint${number}`);

                if (question) question.value = item.question || '';
                if (hint) hint.value = item.hint || '';
            });

            syncFoundSecuritySection();

            const heading = document.querySelector('.form-card > h2');
            if (heading) heading.textContent = 'Chỉnh sửa bài đăng';

            const submitText = document.getElementById('postSubmitText');
            if (submitText) submitText.textContent = 'Lưu thay đổi';
        } catch (error) {
            alert(error.message);
        }
    }

    async function handlePostSubmit(event) {
        event.preventDefault();

        if (!requireLogin(location.href)) {
            return;
        }

        const form = event.currentTarget;
        if (!form.reportValidity()) return;

        const submitButton = document.getElementById('postSubmitBtn');
        if (submitButton) submitButton.disabled = true;

        try {
            let imageUrl = null;

            if (document.getElementById('imageInput')?.files?.[0]) {
                imageUrl = await uploadSelectedImage();
            }

            const body = getPostFormData(imageUrl);
            const params = new URLSearchParams(location.search);
            const editId = params.get('edit');
            const managementCode = params.get('code') || '';

            if (editId) {
                body.managementCode = managementCode;
                const updatedPost = await request(`/api/posts/${encodeURIComponent(editId)}`, {
                    method: 'PUT',
                    body
                });

                location.href = `detail.html?id=${encodeURIComponent(updatedPost.id)}`;
                return;
            }

            const createdPost = await request('/api/posts', {
                method: 'POST',
                body
            });

            const successParams = new URLSearchParams({
                id: createdPost.id,
                code: createdPost.management_code
            });

            location.href = `success.html?${successParams.toString()}`;

            location.href = `success.html?${params.toString()}`;
        } catch (error) {
            alert(`Không thể lưu bài: ${error.message}`);
        } finally {
            if (submitButton) submitButton.disabled = false;
        }
    }

    function setupPostForm() {
        const form = document.getElementById('postForm');
        if (!form) return;

        document.querySelectorAll('input[name="type"]').forEach((input) => {
            input.addEventListener('change', syncFoundSecuritySection);
        });

        syncFoundSecuritySection();
        form.addEventListener('submit', handlePostSubmit);

        const editId = new URLSearchParams(location.search).get('edit');
        if (editId) {
            if (!requireLogin(location.href)) return;
            populateEditForm(editId);
        }

        const imageInput = document.getElementById('imageInput');
        const preview = document.getElementById('imagePreview');

        imageInput?.addEventListener('change', () => {
            const file = imageInput.files?.[0];
            if (!file || !preview) return;

            preview.src = URL.createObjectURL(file);
            preview.style.display = 'block';
        });
    }

    function setDetailMeta(post) {
        const metaBoxes = document.querySelectorAll('.detail-meta .meta-box');

        if (metaBoxes[0]) {
            metaBoxes[0].querySelector('div').innerHTML = `<strong>Danh mục</strong><br>${escapeHTML(post.category || 'Khác')}`;
        }

        if (metaBoxes[1]) {
            metaBoxes[1].querySelector('div').innerHTML = `<strong>Địa điểm</strong><br>${escapeHTML(post.location || 'USTH')}`;
        }

        if (metaBoxes[2]) {
            metaBoxes[2].querySelector('div').innerHTML = `<strong>Thời gian</strong><br>${escapeHTML(formatDateTime(post.event_date))}`;
        }

        if (metaBoxes[3]) {
            metaBoxes[3].querySelector('div').innerHTML = `<strong>Trạng thái</strong><br>${escapeHTML(statusLabel(post.status))}`;
        }
    }

    function renderDetailContact(post) {
        const contact = document.getElementById('detailContact');
        if (!contact) return;

        const phone = post.phone
            ? `<div class="contact-line"><i data-lucide="phone"></i><span>${escapeHTML(post.phone)}</span></div>`
            : '';

        const email = post.email
            ? `<div class="contact-line"><i data-lucide="mail"></i><span>${escapeHTML(post.email)}</span></div>`
            : '';

        contact.innerHTML = `
            <h3>Thông tin liên hệ</h3>
            ${phone}
            ${email}
            ${!phone && !email ? '<p>Người đăng chưa cung cấp thông tin liên hệ công khai.</p>' : ''}
        `;
    }

    async function loadDetailPost() {
        const title = document.getElementById('detailTitle');
        if (!title) return;

        const postId = new URLSearchParams(location.search).get('id');

        if (!postId) {
            title.textContent = 'Không tìm thấy bài đăng';
            return;
        }

        try {
            const post = await request(`/api/posts/${encodeURIComponent(postId)}`);
            state.currentDetailPost = post;

            document.title = `${post.title} | Lost&Found USTH`;
            title.textContent = post.title;

            const image = document.getElementById('detailImage');
            if (image) {
                image.src = fallbackImage(post);
                image.alt = post.title;
            }

            document.querySelectorAll('.thumb img').forEach((thumb) => {
                thumb.src = fallbackImage(post);
                thumb.alt = post.title;
            });

            const badge = document.getElementById('detailTypeBadge');
            if (badge) {
                badge.textContent = typeLabel(post.type);
                badge.className = `badge ${post.type === 'found' ? 'found' : 'lost'}`;
            }

            const time = document.getElementById('detailTime');
            if (time) time.textContent = formatRelativeTime(post.created_at);

            const description = document.querySelector('.detail-description p');
            if (description) description.textContent = post.description;

            renderDetailContact(post);
            setDetailMeta(post);

            const crumbs = document.querySelectorAll('.breadcrumbs a');
            if (crumbs[1]) {
                crumbs[1].textContent = post.type === 'found' ? 'Tin nhặt được' : 'Tin thất lạc';
                crumbs[1].href = post.type === 'found' ? 'found.html' : 'lost.html';
            }

            await loadSuggestions(post);
            window.dispatchEvent(new CustomEvent('lostlink:detail-loaded', { detail: post }));
            window.lucide?.createIcons();
        } catch (error) {
            title.textContent = 'Không thể tải bài đăng';
        }
    }

    async function loadSuggestions(currentPost) {
        const grid = document.querySelector('.suggestions .post-grid');
        if (!grid) return;

        try {
            const oppositeType = currentPost.type === 'lost' ? 'found' : 'lost';
            const posts = await request(`/api/posts?type=${oppositeType}&status=active&sort=newest`);
            const suggestions = posts.filter((post) => post.id !== currentPost.id).slice(0, 4);
            grid.innerHTML = suggestions.map(postCardHTML).join('');
        } catch (error) {
            grid.innerHTML = '';
        }
    }

    function setupShareButton() {
        document.getElementById('sharePostBtn')?.addEventListener('click', async () => {
            try {
                if (navigator.share) {
                    await navigator.share({
                        title: document.title,
                        url: location.href
                    });
                } else {
                    await navigator.clipboard.writeText(location.href);
                    alert('Đã sao chép link bài đăng.');
                }
            } catch (error) {
                // User may cancel the native share dialog. No action is needed.
            }
        });
    }

    function setupFeedbackModal() {
        const button = document.getElementById('feedbackBtn');
        const modal = document.getElementById('feedbackModal');
        const form = document.getElementById('feedbackForm');

        if (!button || !modal || !form) return;

        button.addEventListener('click', () => {
            modal.hidden = false;
            const target = document.getElementById('feedbackTargetTitle');
            if (target && state.currentDetailPost) {
                target.textContent = `Gửi thông tin về “${state.currentDetailPost.title}”.`;
            }
        });

        modal.querySelectorAll('[data-feedback-close]').forEach((element) => {
            element.addEventListener('click', () => {
                modal.hidden = true;
            });
        });

        form.addEventListener('submit', async (event) => {
            event.preventDefault();

            if (!state.currentDetailPost) return;

            const contact = document.getElementById('feedbackContact').value.trim();
            const body = {
                name: document.getElementById('feedbackName').value.trim(),
                email: contact.includes('@') ? contact : 'no-email@lostlink.local',
                subject: `Phản hồi bài: ${state.currentDetailPost.title}`,
                message: `${document.getElementById('feedbackMessage').value.trim()}\n\nLiên hệ: ${contact}`,
                postId: state.currentDetailPost.id
            };

            try {
                const data = await request('/api/feedback', {
                    method: 'POST',
                    body
                });

                form.hidden = true;
                const success = document.getElementById('feedbackSuccess');
                success.hidden = false;
                success.querySelector('p').textContent = `Đã gửi phản hồi. Mã theo dõi: ${data.tracking_code}`;
            } catch (error) {
                alert(error.message);
            }
        });
    }

    async function loadMyPostsAndFindByCode(code) {
        const normalized = String(code || '').trim().toUpperCase();
        const list = document.getElementById('manageList');
        if (!list) return;

        try {
            const posts = await request(`/api/posts/mine?code=${encodeURIComponent(normalized)}`);
            const post = posts.find((item) => String(item.management_code).toUpperCase() === normalized);

            if (!post) {
                list.innerHTML = `
                    <div class="manage-placeholder">
                        <i data-lucide="circle-x"></i>
                        <h3>Không tìm thấy bài với mã này</h3>
                        <p>Hãy kiểm tra lại mã quản lý của tài khoản đang đăng nhập.</p>
                    </div>
                `;
                window.lucide?.createIcons();
                return;
            }

            list.innerHTML = `
                <article class="manage-card">
                    <div>
                        <span class="badge ${post.type === 'found' ? 'found' : 'lost'}">${typeLabel(post.type)}</span>
                        <h3>${escapeHTML(post.title)}</h3>
                        <p>${escapeHTML(post.location || '')}</p>
                        <small>${escapeHTML(post.management_code)} · ${escapeHTML(statusLabel(post.status))}</small>
                    </div>
                    <div class="manage-actions">
                        <a class="btn btn-secondary" href="detail.html?id=${encodeURIComponent(post.id)}">Xem</a>
                        <a class="btn btn-secondary" href="post.html?edit=${encodeURIComponent(post.id)}&code=${encodeURIComponent(normalized)}">Sửa</a>
                        <button class="btn btn-primary" type="button" data-resolve-post="${escapeHTML(post.id)}">Đã tìm thấy</button>
                        <button class="btn btn-secondary" type="button" data-delete-post="${escapeHTML(post.id)}">Xóa</button>
                    </div>
                </article>
            `;

            list.querySelector('[data-resolve-post]')?.addEventListener('click', async () => {
                try {
                    await request(`/api/posts/${post.id}/status`, {
                        method: 'PATCH',
                        body: { status: 'resolved', managementCode: normalized }
                    });
                    loadMyPostsAndFindByCode(normalized);
                } catch (error) {
                    alert(error.message);
                }
            });

            list.querySelector('[data-delete-post]')?.addEventListener('click', async () => {
                if (!confirm('Bạn chắc chắn muốn xóa bài này?')) return;

                try {
                    await request(`/api/posts/${post.id}`, {
                        method: 'DELETE',
                        body: { managementCode: normalized }
                    });
                    list.innerHTML = '<div class="manage-placeholder"><h3>Đã xóa bài đăng.</h3></div>';
                } catch (error) {
                    alert(error.message);
                }
            });
        } catch (error) {
            list.innerHTML = `<div class="manage-placeholder"><h3>${escapeHTML(error.message)}</h3></div>`;
        }

        window.lucide?.createIcons();
    }

    function setupMyPostsPage() {
        const button = document.getElementById('showManagedPost');
        const input = document.getElementById('manageCode');

        if (!button || !input) return;

        button.addEventListener('click', () => {
            loadMyPostsAndFindByCode(input.value);
        });

        const codeFromUrl = new URLSearchParams(location.search).get('code');
        if (codeFromUrl) {
            input.value = codeFromUrl;
            loadMyPostsAndFindByCode(codeFromUrl);
        }
    }

    function setupSuccessPage() {
        const codeElement = document.getElementById('managementCode');
        if (!codeElement) return;

        const params = new URLSearchParams(location.search);
        const code = params.get('code') || 'LL-XXXXXX';
        const id = params.get('id');

        codeElement.textContent = code;

        const view = document.getElementById('viewCreatedPost');
        if (view && id) view.href = `detail.html?id=${encodeURIComponent(id)}`;

        const manage = document.getElementById('manageCreatedPost');
        if (manage) manage.href = `my-posts.html?code=${encodeURIComponent(code)}`;

        document.getElementById('copyCodeBtn')?.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(code);
                document.getElementById('copyCodeStatus').textContent = 'Đã sao chép mã quản lý.';
            } catch (error) {
                prompt('Sao chép mã quản lý:', code);
            }
        });
    }

    function setupSystemFeedback() {
        const form = document.getElementById('systemFeedbackForm');
        if (!form) return;

        form.addEventListener('submit', async (event) => {
            event.preventDefault();

            const status = document.getElementById('systemFeedbackStatus');

            try {
                const data = await request('/api/feedback', {
                    method: 'POST',
                    body: {
                        name: document.getElementById('systemFeedbackName').value.trim(),
                        email: document.getElementById('systemFeedbackEmail').value.trim(),
                        subject: document.getElementById('systemFeedbackSubject').value,
                        message: document.getElementById('systemFeedbackMessage').value.trim()
                    }
                });

                status.style.display = 'block';
                status.innerHTML = `Đã gửi phản hồi. Mã theo dõi: <strong>${escapeHTML(data.tracking_code)}</strong>`;
                form.reset();
            } catch (error) {
                status.style.display = 'block';
                status.textContent = error.message;
            }
        });
    }

    function feedbackStatusLabel(status) {
        const labels = {
            new: 'Mới',
            read: 'Đã đọc',
            resolved: 'Đã xử lý'
        };

        return labels[status] || status;
    }

    function setupFeedbackLookup() {
        const form = document.getElementById('feedbackLookupForm');
        const input = document.getElementById('feedbackLookupCode');
        const result = document.getElementById('feedbackLookupResult');

        if (!form || !input || !result) return;

        form.addEventListener('submit', async (event) => {
            event.preventDefault();

            const code = input.value.trim().toUpperCase();
            if (!code) return;

            try {
                const item = await request(`/api/feedback/track/${encodeURIComponent(code)}`);

                result.innerHTML = `
                    <article class="feedback-status-result">
                        <h3>${escapeHTML(item.subject)}</h3>
                        <p><strong>Mã:</strong> ${escapeHTML(item.tracking_code)}</p>
                        <p><strong>Trạng thái:</strong> ${escapeHTML(feedbackStatusLabel(item.status))}</p>
                        <p><strong>Cập nhật:</strong> ${escapeHTML(formatDateTime(item.updated_at))}</p>
                        ${item.admin_reply ? `<div class="portal-admin-note"><strong>Phản hồi từ Admin</strong><p>${escapeHTML(item.admin_reply)}</p></div>` : ''}
                    </article>
                `;
            } catch (error) {
                result.innerHTML = `<p>${escapeHTML(error.message)}</p>`;
            }
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        loadHomePosts();
        loadListingPosts();
        setupListingFilters();
        setupPostForm();
        loadDetailPost();
        setupShareButton();
        setupFeedbackModal();
        setupMyPostsPage();
        setupSuccessPage();
        setupSystemFeedback();
        setupFeedbackLookup();
        window.lucide?.createIcons();
    });
})();
