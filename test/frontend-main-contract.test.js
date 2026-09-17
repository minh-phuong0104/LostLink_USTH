const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const mainPath = process.env.MAIN_JS_PATH || path.join(process.cwd(), 'asset/js/main.js');
const source = fs.readFileSync(mainPath, 'utf8');

test('main.js keeps critical frontend API and navigation contracts', () => {
    const requiredSnippets = [
        "request('/api/uploads'",
        "request('/api/posts'",
        "request('/api/posts/mine'",
        "method: 'PUT'",
        "method: 'PATCH'",
        "method: 'DELETE'",
        "sessionStorage.setItem(codeKey(createdPost.id), createdPost.management_code)",
        "new URLSearchParams(location.search).get('edit')",
        "new URLSearchParams(location.search).get('id')",
        "location.href = `success.html?id=${encodeURIComponent(createdPost.id)}`",
        "window.dispatchEvent(new CustomEvent('lostlink:detail-loaded'"
    ];

    for (const snippet of requiredSnippets) {
        assert.ok(source.includes(snippet), `Missing contract: ${snippet}`);
    }
});

test('DOMContentLoaded keeps page setup calls', () => {
    const requiredSetupCalls = [
        'setupCatalog();',
        'loadHomePosts();',
        'loadListingPosts();',
        'setupListingFilters();',
        'setupPostForm();',
        'loadDetailPost();',
        'setupShareButton();',
        'setupFeedbackModal();',
        'setupMyPostsPage();',
        'setupSuccessPage();',
        'setupSystemFeedback();',
        'setupFeedbackLookup();'
    ];

    for (const call of requiredSetupCalls) {
        assert.ok(source.includes(call), `Missing setup call: ${call}`);
    }
});
