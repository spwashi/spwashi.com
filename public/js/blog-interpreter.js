const SAMPLE_TEXT = `A blog can be a reason to notice before I know what the notice means.

Sometimes the input is a Spw operator, sometimes it is a strange phrase, sometimes it is wonder that has not become language yet.

The useful first step is synthesis: what shape is here, what question should stay alive, and what sentence would make the thought readable?`;

const STOP_WORDS = new Set([
    'about', 'after', 'again', 'also', 'because', 'before', 'being', 'between',
    'could', 'every', 'first', 'from', 'have', 'into', 'just', 'like', 'more',
    'only', 'over', 'should', 'that', 'their', 'there', 'these', 'thing', 'this',
    'sometimes', 'through', 'what', 'when', 'where', 'which', 'while', 'with',
    'without', 'would', 'your'
]);

const DOMAIN_TAGS = [
    ['spw', ['spw', 'operator', 'grammar', 'syntax', 'frame', 'sigil']],
    ['wonder', ['wonder', 'curious', 'curiosity', 'strange', 'alive', 'attention']],
    ['language', ['language', 'prose', 'sentence', 'readable', 'voice']],
    ['software', ['code', 'runtime', 'parser', 'tooling', 'interface']],
    ['local-first', ['local', 'browser', 'offline', 'private', 'files']],
    ['writing', ['blog', 'draft', 'note', 'post', 'reader', 'writing']],
    ['play', ['rpg', 'session', 'game', 'table', 'cast', 'world']],
    ['design', ['design', 'surface', 'layout', 'interaction', 'visual']]
];

const $ = (root, selector) => root.querySelector(selector);

const splitLines = (text) => text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

const splitSentences = (text) => {
    const matches = text
        .replace(/\s+/g, ' ')
        .match(/[^.!?]+[.!?]+|[^.!?]+$/g);
    return (matches || [])
        .map((sentence) => sentence.trim())
        .filter(Boolean);
};

const wordsFrom = (text) => (
    text
        .toLowerCase()
        .match(/[a-z0-9][a-z0-9'-]{2,}/g) || []
);

const titleCase = (text) => text
    .replace(/^#+\s*/, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const clip = (text, limit) => {
    if (text.length <= limit) return text;
    const shortened = text.slice(0, limit - 1);
    const lastSpace = shortened.lastIndexOf(' ');
    return `${shortened.slice(0, lastSpace > 40 ? lastSpace : shortened.length).trim()}.`;
};

const chooseTitle = (text, lines, sentences, keywords) => {
    const heading = lines.find((line) => /^#{1,3}\s+\S/.test(line));
    if (heading) return titleCase(heading);

    const shortLine = lines.find((line) => line.length >= 12 && line.length <= 72 && !/[.!?]$/.test(line));
    if (shortLine) return titleCase(shortLine);

    if (keywords.length >= 2) {
        return titleCase(`${keywords[0]} and ${keywords[1]}`);
    }

    return titleCase(clip(sentences[0] || text || 'Untitled draft', 58));
};

const summarize = (sentences) => {
    if (!sentences.length) return 'Paste text and run the interpreter to produce a local reading.';
    return clip(sentences.slice(0, 2).join(' '), 280);
};

const extractKeywords = (words) => {
    const counts = new Map();
    words.forEach((word) => {
        if (STOP_WORDS.has(word) || word.length < 4) return;
        counts.set(word, (counts.get(word) || 0) + 1);
    });

    return [...counts.entries()]
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .slice(0, 8)
        .map(([word]) => word);
};

const detectTags = (words, keywords) => {
    const wordSet = new Set(words);
    const tags = DOMAIN_TAGS
        .filter(([, terms]) => terms.some((term) => wordSet.has(term)))
        .map(([tag]) => tag);

    keywords.slice(0, 4).forEach((keyword) => {
        if (!tags.includes(keyword)) tags.push(keyword);
    });

    return tags.length ? tags.slice(0, 7) : ['draft'];
};

const detectTone = (text, words) => {
    const lower = text.toLowerCase();
    const signals = [
        ['technical', ['parser', 'runtime', 'code', 'system', 'tool', 'api']],
        ['wondering', ['wonder', 'curious', 'strange', 'alive', 'attention']],
        ['reflective', ['meaning', 'attention', 'memory', 'reader', 'language']],
        ['playful', ['play', 'game', 'rpg', 'magic', 'weird']],
        ['practical', ['should', 'need', 'useful', 'step', 'work']]
    ];

    const [tone, score] = signals
        .map(([name, terms]) => [name, terms.filter((term) => lower.includes(term)).length])
        .sort((a, b) => b[1] - a[1])[0];

    if (words.length < 40) return 'seed';
    return score > 0 ? tone : 'quiet';
};

const buildQuestions = (text, sentences, keywords) => {
    const direct = sentences.filter((sentence) => sentence.endsWith('?')).slice(0, 3);
    const generated = [];
    const lower = text.toLowerCase();

    generated.push('What wonder is worth keeping in ordinary language?');
    if (lower.includes('spw') || lower.includes('operator') || lower.includes('sigil')) {
        generated.push('Which Spw shape gives this thought a useful frame?');
    }
    if (keywords[0]) generated.push(`What should a reader understand about ${keywords[0]}?`);
    if (keywords[1]) generated.push(`What changes when ${keywords[1]} becomes visible?`);
    generated.push('What sentence would make the next section easier to follow?');

    return [...direct, ...generated].slice(0, 4);
};

const detectLens = (text, words) => {
    const lower = text.toLowerCase();
    const hasSpwShape = /#>|#:[\w-]+|\^["[]|@\w|~["\w]|\?\["|\$\w/.test(text);
    if (lower.includes('spw') || lower.includes('operator') || lower.includes('sigil') || hasSpwShape) {
        return 'spw_to_language';
    }
    if (words.some((word) => ['wonder', 'curious', 'curiosity', 'strange', 'alive', 'attention'].includes(word))) {
        return 'wonder_to_language';
    }
    return 'draft_to_post';
};

const buildOutline = (text, lines, sentences) => {
    const headings = lines
        .filter((line) => /^#{1,3}\s+\S/.test(line))
        .map((line) => titleCase(line));

    if (headings.length) return headings.slice(0, 6);

    const paragraphs = text
        .split(/\n\s*\n/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean);

    if (paragraphs.length > 1) {
        return paragraphs.slice(0, 5).map((paragraph, index) => {
            const firstSentence = splitSentences(paragraph)[0] || paragraph;
            return `${index + 1}. ${clip(firstSentence, 88)}`;
        });
    }

    return sentences.slice(0, 4).map((sentence, index) => `${index + 1}. ${clip(sentence, 88)}`);
};

const escapeSeedValue = (value) => value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

const buildSeed = ({ title, summary, tags, questions, lens }) => {
    const tagText = tags.map((tag) => `"${escapeSeedValue(tag)}"`).join(', ');
    const questionText = questions.map((question) => `  "${escapeSeedValue(question)}"`).join('\n');

    return `#>blog_note
#:layer #!draft

^"summary"{
 title: "${escapeSeedValue(title)}"
 lens: "${escapeSeedValue(lens)}"
 claim: "${escapeSeedValue(summary)}"
 tags: [${tagText}]
}

?["open_questions"]{
${questionText}
}`;
};

const EMPTY_RESULT = Object.freeze({
    title: 'Untitled draft',
    summary: 'Paste text and run the interpreter to turn a note toward language.',
    tags: ['draft'],
    questions: ['What should this piece help a reader understand next?'],
    outline: ['Paste a draft to reveal likely sections.'],
    words: 0,
    readingTime: '0 min',
    tone: 'quiet',
    lens: 'wonder_to_language'
});

const chargeKeyFor = (value) => value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const setList = (node, items, ordered = false, options = {}) => {
    node.replaceChildren();
    items.forEach((item) => {
        const li = document.createElement('li');
        li.textContent = item;
        if (options.chargeable) {
            li.dataset.spwChargeKey = chargeKeyFor(item);
            li.dataset.spwChargeLabel = item;
        }
        node.appendChild(li);
    });
    node.dataset.count = String(items.length);
    if (ordered) node.setAttribute('aria-label', `${items.length} interpreted items`);
};

const interpret = (text) => {
    const trimmed = text.trim();
    const lines = splitLines(trimmed);
    const sentences = splitSentences(trimmed);
    const words = wordsFrom(trimmed);
    const keywords = extractKeywords(words);
    const tags = detectTags(words, keywords);
    const title = chooseTitle(trimmed, lines, sentences, keywords);
    const summary = summarize(sentences);
    const questions = buildQuestions(trimmed, sentences, keywords);
    const outline = buildOutline(trimmed, lines, sentences);

    return {
        title,
        summary,
        tags,
        questions,
        outline,
        words: words.length,
        readingTime: `${Math.max(1, Math.ceil(words.length / 220))} min`,
        tone: detectTone(trimmed, words),
        lens: detectLens(trimmed, words)
    };
};

const renderResult = (root, result) => {
    $('[data-blog-title]', root).textContent = result.title;
    $('[data-blog-summary]', root).textContent = result.summary;
    $('[data-blog-words]', root).textContent = String(result.words);
    $('[data-blog-reading-time]', root).textContent = result.readingTime;
    $('[data-blog-tone]', root).textContent = result.tone;
    $('[data-blog-lens]', root).textContent = result.lens.replace(/_/g, ' ');
    setList($('[data-blog-tags]', root), result.tags, false, { chargeable: true });
    setList($('[data-blog-questions]', root), result.questions, true);
    setList($('[data-blog-outline]', root), result.outline, true);
    $('[data-blog-seed]', root).textContent = buildSeed(result);
};

const setInterpreterState = (root, input, output, state, result = EMPTY_RESULT) => {
    root.dataset.blogState = state;
    root.dataset.blogLens = result.lens;
    root.dataset.blogTone = result.tone;
    input.setAttribute('aria-invalid', state === 'needs-input' ? 'true' : 'false');
    output.setAttribute('aria-busy', state === 'interpreting' ? 'true' : 'false');
};

export const initBlogInterpreter = () => {
    const root = document.querySelector('[data-blog-interpreter]');
    if (!root) return null;

    const form = $('[data-blog-input-form]', root);
    const input = $('[data-blog-input]', root);
    const output = $('[data-blog-output]', root);
    const status = $('[data-blog-status]', root);

    const run = () => {
        const text = input.value.trim();
        if (!text) {
            setInterpreterState(root, input, output, 'needs-input');
            status.textContent = 'Paste a draft before interpreting.';
            input.focus();
            return;
        }

        setInterpreterState(root, input, output, 'interpreting');
        const result = interpret(text);
        renderResult(root, result);
        setInterpreterState(root, input, output, 'interpreted', result);
        status.textContent = 'Interpreted locally.';
    };

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        run();
    });

    $('[data-blog-sample]', root).addEventListener('click', () => {
        input.value = SAMPLE_TEXT;
        run();
    });

    $('[data-blog-clear]', root).addEventListener('click', () => {
        input.value = '';
        renderResult(root, EMPTY_RESULT);
        setInterpreterState(root, input, output, 'empty');
        status.textContent = 'Cleared.';
        input.focus();
    });

    renderResult(root, EMPTY_RESULT);
    setInterpreterState(root, input, output, 'empty');

    return { interpret: run };
};
