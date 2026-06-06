patterns = [
    ('static section', 'static-category-strip'),
    ('search results', '<section v-if="storeSearchQuery'),
]
with open('src/pages/HomePage.vue', 'r', encoding='utf-8') as f:
    for idx, line in enumerate(f, 1):
        for label, token in patterns:
            if token in line:
                print(label, idx)
