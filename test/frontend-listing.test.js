const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const mainScript = fs.readFileSync(path.join(__dirname, '../asset/js/main.js'), 'utf8');

function makeElement(value = '', tagName = 'SELECT') {
    const listeners = {};
    return {
        value,
        tagName,
        listeners,
        addEventListener(name, handler) { listeners[name] = handler; },
        trigger(name) { listeners[name]?.(); }
    };
}

function visibleTitles(html) {
    return [...html.matchAll(/<h3 class="post-card__title">\s*<a href="[^"]+">([^<]+)<\/a>/g)]
        .map((match) => match[1]);
}

test('listing keeps search, filters, sort and reset behavior', async () => {
    const posts = [
        { id: '1', type: 'lost', title: 'Black laptop', description: 'Old device', category: 'Electronics', location: 'A21', created_at: '2026-09-14T00:00:00Z' },
        { id: '2', type: 'lost', title: 'Blue book', description: 'Study notes', category: 'Books', location: 'A11', created_at: '2026-09-16T00:00:00Z' },
        { id: '3', type: 'lost', title: 'Red laptop', description: 'New device', category: 'Electronics', location: 'A21', created_at: '2026-09-17T00:00:00Z' }
    ];
    const elements = {
        listingGrid: makeElement(),
        resultCount: makeElement(),
        emptyResults: makeElement(),
        pageSearch: makeElement('', 'INPUT'),
        categoryFilter: makeElement(),
        locationFilter: makeElement(),
        timeFilter: makeElement(),
        sortOrder: makeElement('newest'),
        resetFilters: makeElement(),
        emptyReset: makeElement()
    };
    const page = { pathname: '/lost.html', search: '' };
    const document = {
        getElementById(id) { return elements[id] || null; },
        addEventListener(name, handler) { if (name === 'DOMContentLoaded') this.ready = handler; }
    };
    const history = {
        replaceState(_state, _title, url) { page.search = ''; page.pathname = url; }
    };
    const context = {
        document,
        history,
        location: page,
        URLSearchParams,
        Date,
        window: {
            LostLink: {
                request: async () => posts,
                escapeHTML: (value) => String(value ?? ''),
                formatDateTime: () => '',
                formatRelativeTime: () => ''
            }
        }
    };

    vm.runInNewContext(mainScript, context);
    document.ready();
    await new Promise(setImmediate);

    assert.deepEqual(visibleTitles(elements.listingGrid.innerHTML), ['Red laptop', 'Blue book', 'Black laptop']);
    elements.pageSearch.value = 'laptop';
    elements.pageSearch.trigger('input');
    assert.deepEqual(visibleTitles(elements.listingGrid.innerHTML), ['Red laptop', 'Black laptop']);

    elements.categoryFilter.value = 'Electronics';
    elements.categoryFilter.trigger('change');
    elements.locationFilter.value = 'A21';
    elements.locationFilter.trigger('change');
    elements.sortOrder.value = 'oldest';
    elements.sortOrder.trigger('change');
    assert.deepEqual(visibleTitles(elements.listingGrid.innerHTML), ['Black laptop', 'Red laptop']);
    assert.equal(elements.resultCount.textContent, '2 kết quả');

    elements.resetFilters.trigger('click');
    assert.deepEqual(visibleTitles(elements.listingGrid.innerHTML), ['Red laptop', 'Blue book', 'Black laptop']);
    assert.equal(elements.pageSearch.value, '');
    assert.equal(elements.sortOrder.value, 'newest');

    elements.sortOrder.value = 'title-asc';
    elements.sortOrder.trigger('change');
    assert.deepEqual(visibleTitles(elements.listingGrid.innerHTML), ['Black laptop', 'Blue book', 'Red laptop']);

    elements.pageSearch.value = 'missing item';
    elements.pageSearch.trigger('input');
    assert.equal(elements.resultCount.textContent, '0 kết quả');
    assert.equal(elements.emptyResults.hidden, false);
    elements.emptyReset.trigger('click');
    assert.deepEqual(visibleTitles(elements.listingGrid.innerHTML), ['Red laptop', 'Blue book', 'Black laptop']);
});
