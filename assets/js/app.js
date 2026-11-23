(() => {
  'use strict';

  const icons = {
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>',
    arrowUp: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="18 15 12 9 6 15"></polyline></svg>',
  };

  function getCurrentPage() {
    const file = (window.location.pathname || '').split(/[/\\]/).pop();
    return file && file.includes('.html') ? file.toLowerCase() : 'index.html';
  }

  function initNavigation() {
    const page = getCurrentPage();
    let activeTopLink = page;
    if (page.startsWith('html-')) activeTopLink = 'html-intro.html';
    else if (page.startsWith('css-')) activeTopLink = 'css-intro.html';

    document.querySelectorAll('.main-nav a').forEach((link) => {
      const match = (link.getAttribute('href') || '').toLowerCase() === activeTopLink;
      link.classList.toggle('active', match);
      match ? link.setAttribute('aria-current', 'page') : link.removeAttribute('aria-current');
    });

    document.querySelectorAll('.sidebar-links a').forEach((link) => {
      const match = (link.getAttribute('href') || '').toLowerCase() === page;
      link.classList.toggle('active', match);
      match ? link.setAttribute('aria-current', 'page') : link.removeAttribute('aria-current');
    });

    const toggleBtn = document.querySelector('.nav-toggle');
    const mainNav = document.querySelector('.main-nav');
    if (!toggleBtn || !mainNav) return;

    const setOpen = (open) => {
      mainNav.classList.toggle('is-open', open);
      toggleBtn.setAttribute('aria-expanded', String(open));
      toggleBtn.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
      toggleBtn.innerHTML = open ? icons.close : icons.menu;
    };

    // Stop propagation because replacing the icon SVG detaches event.target before bubbling to document
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      setOpen(!mainNav.classList.contains('is-open'));
    });

    mainNav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => setOpen(false));
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mainNav.classList.contains('is-open')) {
        setOpen(false);
        toggleBtn.focus();
      }
    });

    document.addEventListener('click', (e) => {
      if (mainNav.classList.contains('is-open') && !mainNav.contains(e.target) && !toggleBtn.contains(e.target)) {
        setOpen(false);
      }
    });
  }

  function initScrollToTop() {
    let btn = document.querySelector('.scroll-top-btn');
    if (!btn) {
      btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'scroll-top-btn';
      btn.setAttribute('aria-label', 'Scroll back to top');
      btn.innerHTML = icons.arrowUp;
      document.body.appendChild(btn);
    }

    const onScroll = () => btn.classList.toggle('is-visible', window.scrollY > 300);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  async function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }

    // Fallback for non-HTTPS or local file:// previews
    const temp = document.createElement('textarea');
    temp.value = text;
    temp.setAttribute('readonly', '');
    temp.style.cssText = 'position:fixed;opacity:0;pointer-events:none;';
    document.body.appendChild(temp);
    temp.select();
    document.execCommand('copy');
    temp.remove();
  }

  function extractSnippetText(pre) {
    const codeEl = pre.querySelector('code');
    if (codeEl) {
      return codeEl.textContent.replace(/^\n+|\n+$/g, '');
    }

    const clone = pre.cloneNode(true);
    clone.querySelectorAll('button').forEach((btn) => btn.remove());
    return clone.textContent.replace(/^\n+|\n+$/g, '');
  }

  function initCodeCopyButtons() {
    document.querySelectorAll('pre').forEach((pre) => {
      let card = pre.closest('.code-card');
      if (!card) {
        card = document.createElement('div');
        card.className = 'code-card';
        pre.parentNode.insertBefore(card, pre);
        card.appendChild(pre);
      }

      let header = card.querySelector('.code-card-header');
      if (!header) {
        const lang = pre.dataset.lang || card.dataset.lang || 'Code';
        header = document.createElement('div');
        header.className = 'code-card-header';
        header.innerHTML =
          '<div class="code-card-meta">' +
          '<span class="code-window-dots" aria-hidden="true"><span></span><span></span><span></span></span>' +
          '<span class="code-lang"></span>' +
          '</div>';
        header.querySelector('.code-lang').textContent = lang;
        card.insertBefore(header, pre);
      }

      if (header.querySelector('.code-copy-btn')) return;

      const copyBtn = document.createElement('button');
      copyBtn.type = 'button';
      copyBtn.className = 'code-copy-btn';
      copyBtn.setAttribute('aria-label', 'Copy code snippet');
      copyBtn.innerHTML = icons.copy + '<span>Copy</span>';

      let timer = null;
      const resetButton = () => {
        copyBtn.classList.remove('is-copied');
        copyBtn.innerHTML = icons.copy + '<span>Copy</span>';
      };

      copyBtn.addEventListener('click', async () => {
        const code = extractSnippetText(pre);
        try {
          await copyToClipboard(code);
          copyBtn.classList.add('is-copied');
          copyBtn.innerHTML = icons.check + '<span>Copied!</span>';
        } catch {
          copyBtn.classList.remove('is-copied');
          copyBtn.innerHTML = '<span>Copy failed</span>';
        }

        clearTimeout(timer);
        timer = setTimeout(resetButton, 2000);
      });

      header.appendChild(copyBtn);
    });
  }

  function initExercises() {
    const root = document.querySelector('[data-quiz-root]');
    if (!root) return;

    const cards = [...root.querySelectorAll('.quiz-card')];
    if (!cards.length) return;

    const scoreEl = root.querySelector('#quiz-score');
    const answeredEl = root.querySelector('#quiz-answered');
    const accuracyEl = root.querySelector('#quiz-accuracy');
    const progressFill = root.querySelector('#quiz-progress-fill');
    const banner = root.querySelector('#quiz-completion-banner');
    const bannerText = root.querySelector('#quiz-completion-text');
    const resetBtn = root.querySelector('#quiz-reset-btn');
    const bannerResetBtn = root.querySelector('#quiz-completion-reset');
    const filterButtons = [...root.querySelectorAll('[data-quiz-filter]')];

    const results = new Map(cards.map((card) => [card, { answered: false, correct: false }]));

    function updateScoreboard() {
      const total = cards.length;
      let answered = 0;
      let correct = 0;

      results.forEach((entry) => {
        if (entry.answered) answered++;
        if (entry.correct) correct++;
      });

      const accuracy = answered ? Math.round((correct / answered) * 100) : 0;
      if (scoreEl) scoreEl.textContent = `${correct} / ${total}`;
      if (answeredEl) answeredEl.textContent = `${answered} / ${total}`;
      if (accuracyEl) accuracyEl.textContent = `${accuracy}%`;
      if (progressFill) progressFill.style.width = `${Math.round((answered / total) * 100)}%`;

      if (banner && bannerText) {
        const done = answered === total;
        banner.classList.toggle('is-visible', done);
        if (done) {
          bannerText.textContent =
            correct === total
              ? `Perfect score! You got all ${total} exercises right.`
              : `You answered all ${total} exercises with ${correct} correct (${accuracy}% accuracy). Review any red cards and retry to hit 100%!`;
        }
      }
    }

    cards.forEach((card) => {
      const options = [...card.querySelectorAll('.quiz-option')];
      const checkBtn = card.querySelector('[data-action="check"]');
      const hintBtn = card.querySelector('[data-action="hint"]');
      const hintBox = card.querySelector('.quiz-hint-box');
      const feedback = card.querySelector('.quiz-feedback');
      const answer = card.dataset.answer;
      const rightMsg = card.dataset.feedbackCorrect || 'Correct! Great job.';
      const wrongMsg = card.dataset.feedbackWrong || 'Not quite. Review the hint and try again.';

      options.forEach((label) => {
        const radio = label.querySelector('input[type="radio"]');
        if (!radio) return;

        radio.addEventListener('change', () => {
          options.forEach((opt) => opt.classList.remove('is-selected', 'is-right', 'is-wrong'));
          label.classList.add('is-selected');
          if (card.classList.contains('is-incorrect')) {
            card.classList.remove('is-incorrect');
            if (feedback) feedback.className = 'quiz-feedback';
          }
        });
      });

      if (hintBtn && hintBox) {
        hintBtn.addEventListener('click', () => {
          const open = hintBox.classList.toggle('is-visible');
          hintBtn.textContent = open ? 'Hide Hint' : 'Show Hint';
          hintBtn.setAttribute('aria-expanded', String(open));
        });
      }

      if (checkBtn) {
        checkBtn.addEventListener('click', () => {
          const checked = card.querySelector('input[type="radio"]:checked');
          if (!checked) {
            if (feedback) {
              feedback.className = 'quiz-feedback is-visible is-warning';
              feedback.textContent = 'Select an option above before checking your answer.';
            }
            return;
          }

          const isCorrect = checked.value === answer;
          options.forEach((opt) => opt.classList.remove('is-right', 'is-wrong'));
          card.classList.toggle('is-correct', isCorrect);
          card.classList.toggle('is-incorrect', !isCorrect);

          const chosenLabel = checked.closest('.quiz-option');
          if (chosenLabel) chosenLabel.classList.add(isCorrect ? 'is-right' : 'is-wrong');

          if (feedback) {
            feedback.className = `quiz-feedback is-visible ${isCorrect ? 'is-correct' : 'is-incorrect'}`;
            feedback.textContent = isCorrect ? rightMsg : wrongMsg;
          }

          results.set(card, { answered: true, correct: isCorrect });
          updateScoreboard();
        });
      }
    });

    filterButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const category = btn.dataset.quizFilter || 'all';
        filterButtons.forEach((b) => {
          const active = b === btn;
          b.classList.toggle('is-active', active);
          b.setAttribute('aria-pressed', String(active));
        });

        cards.forEach((card) => {
          const show = category === 'all' || card.dataset.category === category;
          card.classList.toggle('is-hidden', !show);
        });
      });
    });

    function resetQuiz() {
      cards.forEach((card) => {
        card.classList.remove('is-correct', 'is-incorrect');
        card.querySelectorAll('input[type="radio"]').forEach((input) => {
          input.checked = false;
        });
        card.querySelectorAll('.quiz-option').forEach((opt) => {
          opt.classList.remove('is-selected', 'is-right', 'is-wrong');
        });
        const feedback = card.querySelector('.quiz-feedback');
        if (feedback) {
          feedback.className = 'quiz-feedback';
          feedback.textContent = '';
        }
        const hintBox = card.querySelector('.quiz-hint-box');
        const hintBtn = card.querySelector('[data-action="hint"]');
        if (hintBox) hintBox.classList.remove('is-visible');
        if (hintBtn) {
          hintBtn.textContent = 'Show Hint';
          hintBtn.setAttribute('aria-expanded', 'false');
        }
        results.set(card, { answered: false, correct: false });
      });

      updateScoreboard();
    }

    if (resetBtn) resetBtn.addEventListener('click', resetQuiz);
    if (bannerResetBtn) bannerResetBtn.addEventListener('click', resetQuiz);
    updateScoreboard();
  }

  function initCheatsheetFilter() {
    const root = document.querySelector('[data-cheatsheet-root]');
    if (!root) return;

    const searchInput = root.querySelector('#cheatsheet-search');
    const clearBtn = root.querySelector('#cheatsheet-search-clear');
    const filterButtons = [...root.querySelectorAll('[data-filter-category]')];
    const sections = [...root.querySelectorAll('[data-cheat-section]')];
    const statusEl = root.querySelector('#cheatsheet-status');
    const emptyEl = root.querySelector('#cheatsheet-empty');
    const emptyResetBtn = root.querySelector('#cheatsheet-reset-empty');

    // Index searchable text while ignoring injected copy button labels
    const indexedItems = new Map();
    sections.forEach((section) => {
      section.querySelectorAll('[data-cheat-item]').forEach((item) => {
        const clone = item.cloneNode(true);
        clone.querySelectorAll('.code-copy-btn').forEach((btn) => btn.remove());
        const text = `${clone.textContent} ${item.dataset.keywords || ''}`.toLowerCase();
        indexedItems.set(item, text);
      });
    });

    let activeCategory = 'all';

    function applyFilter() {
      const query = (searchInput ? searchInput.value : '').trim().toLowerCase();
      if (clearBtn) clearBtn.classList.toggle('is-visible', query.length > 0);

      let total = 0;
      let visible = 0;

      sections.forEach((section) => {
        const categoryMatch = activeCategory === 'all' || section.dataset.category === activeCategory;
        let sectionHits = 0;

        section.querySelectorAll('[data-cheat-item]').forEach((item) => {
          total++;
          const text = indexedItems.get(item) || '';
          const show = categoryMatch && (!query || text.includes(query));
          item.classList.toggle('is-hidden', !show);
          if (show) {
            sectionHits++;
            visible++;
          }
        });

        section.classList.toggle('is-hidden', !categoryMatch || sectionHits === 0);
      });

      if (statusEl) {
        const label = activeCategory === 'all' ? 'all categories' : activeCategory.toUpperCase();
        statusEl.textContent = query
          ? `Showing ${visible} of ${total} references matching "${query}" in ${label}`
          : `Showing ${visible} of ${total} references in ${label}`;
      }

      if (emptyEl) emptyEl.classList.toggle('is-visible', visible === 0);
    }

    if (searchInput) {
      searchInput.addEventListener('input', applyFilter);
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && searchInput.value) {
          searchInput.value = '';
          applyFilter();
        }
      });
    }

    if (clearBtn && searchInput) {
      clearBtn.addEventListener('click', () => {
        searchInput.value = '';
        applyFilter();
        searchInput.focus();
      });
    }

    filterButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        activeCategory = btn.dataset.filterCategory || 'all';
        filterButtons.forEach((b) => {
          const active = b === btn;
          b.classList.toggle('is-active', active);
          b.setAttribute('aria-pressed', String(active));
        });
        applyFilter();
      });
    });

    if (emptyResetBtn) {
      emptyResetBtn.addEventListener('click', () => {
        activeCategory = 'all';
        if (searchInput) searchInput.value = '';
        filterButtons.forEach((b) => {
          const isAll = b.dataset.filterCategory === 'all';
          b.classList.toggle('is-active', isAll);
          b.setAttribute('aria-pressed', String(isAll));
        });
        applyFilter();
      });
    }

    document.addEventListener('keydown', (e) => {
      const focused = document.activeElement;
      const inField = focused && /INPUT|TEXTAREA|SELECT/.test(focused.tagName);
      if (e.key === '/' && searchInput && !inField) {
        e.preventDefault();
        searchInput.focus();
      }
    });

    applyFilter();
  }

  function initBoxModelVisualizer() {
    const root = document.querySelector('[data-boxmodel-visualizer]');
    if (!root) return;

    const sliders = {
      width: root.querySelector('#bm-width'),
      padding: root.querySelector('#bm-padding'),
      border: root.querySelector('#bm-border'),
      margin: root.querySelector('#bm-margin'),
    };
    const values = {
      width: root.querySelector('#bm-width-val'),
      padding: root.querySelector('#bm-padding-val'),
      border: root.querySelector('#bm-border-val'),
      margin: root.querySelector('#bm-margin-val'),
    };
    const layers = {
      margin: root.querySelector('#bm-layer-margin'),
      border: root.querySelector('#bm-layer-border'),
      padding: root.querySelector('#bm-layer-padding'),
      content: root.querySelector('#bm-layer-content'),
    };
    const labels = {
      margin: root.querySelector('#bm-label-margin'),
      border: root.querySelector('#bm-label-border'),
      padding: root.querySelector('#bm-label-padding'),
      dims: root.querySelector('#bm-content-dims'),
    };

    const elementMetric = root.querySelector('#bm-metric-element');
    const totalMetric = root.querySelector('#bm-metric-total');
    const liveCode = root.querySelector('#bm-live-code');
    const modeButtons = [...root.querySelectorAll('[data-box-sizing]')];
    const resetBtn = root.querySelector('#bm-reset');

    if (
      !sliders.width || !sliders.padding || !sliders.border || !sliders.margin ||
      !layers.margin || !layers.border || !layers.padding || !layers.content
    ) {
      return;
    }

    let boxSizing = 'content-box';

    function render() {
      const width = Number(sliders.width.value);
      const padding = Number(sliders.padding.value);
      const border = Number(sliders.border.value);
      const margin = Number(sliders.margin.value);

      if (values.width) values.width.textContent = `${width}px`;
      if (values.padding) values.padding.textContent = `${padding}px`;
      if (values.border) values.border.textContent = `${border}px`;
      if (values.margin) values.margin.textContent = `${margin}px`;

      const extras = padding * 2 + border * 2;
      // Under border-box, content width shrinks to fit inside declared width (clamped at 0px)
      const contentWidth = boxSizing === 'border-box' ? Math.max(0, width - extras) : width;
      const elementWidth = boxSizing === 'border-box' ? Math.max(width, extras) : width + extras;
      const totalSpace = elementWidth + margin * 2;

      layers.margin.style.padding = `${Math.max(margin, margin > 0 ? 18 : 6)}px ${margin}px ${margin}px`;
      layers.border.style.padding = `${Math.max(border, border > 0 ? 16 : 4)}px ${border}px ${border}px`;
      layers.padding.style.padding = `${Math.max(padding, padding > 0 ? 18 : 6)}px ${padding}px ${padding}px`;
      layers.content.style.width = `${Math.max(88, contentWidth)}px`;

      if (labels.margin) labels.margin.textContent = `margin: ${margin}px`;
      if (labels.border) labels.border.textContent = `border: ${border}px`;
      if (labels.padding) labels.padding.textContent = `padding: ${padding}px`;
      if (labels.dims) labels.dims.textContent = `${contentWidth}px × 80px`;

      if (elementMetric) {
        elementMetric.textContent =
          boxSizing === 'content-box'
            ? `${elementWidth}px (${width} + ${padding * 2} + ${border * 2})`
            : `${elementWidth}px (includes padding & border)`;
      }
      if (totalMetric) {
        totalMetric.textContent = `${totalSpace}px (box + ${margin * 2}px margin)`;
      }
      if (liveCode) {
        liveCode.textContent =
          `.box {\n` +
          `  box-sizing: ${boxSizing};\n` +
          `  width: ${width}px;\n` +
          `  padding: ${padding}px;\n` +
          `  border: ${border}px solid #0f172a;\n` +
          `  margin: ${margin}px;\n` +
          `}`;
      }
    }

    Object.values(sliders).forEach((slider) => slider.addEventListener('input', render));

    modeButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        boxSizing = btn.dataset.boxSizing || 'content-box';
        modeButtons.forEach((b) => b.classList.toggle('is-active', b === btn));
        render();
      });
    });

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        sliders.width.value = '200';
        sliders.padding.value = '20';
        sliders.border.value = '5';
        sliders.margin.value = '30';
        boxSizing = 'content-box';
        modeButtons.forEach((b) => b.classList.toggle('is-active', b.dataset.boxSizing === 'content-box'));
        render();
      });
    }

    render();
  }

  function initFormPreviews() {
    document.querySelectorAll('form[data-demo-form]').forEach((form) => {
      const feedback = form.querySelector('.form-feedback');

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!feedback) return;

        const entries = [];
        new FormData(form).forEach((val, key) => {
          entries.push(`${key}="${String(val).trim() || '(empty)'}"`);
        });

        feedback.textContent = entries.length
          ? `Form submitted! Payload sent: ${entries.join(', ')}`
          : 'Form submitted, but no named fields were included in the payload.';
        feedback.classList.add('is-visible');
      });

      form.addEventListener('reset', () => {
        if (!feedback) return;
        feedback.classList.remove('is-visible');
        feedback.textContent = '';
      });
    });
  }

  function initFlexPlayground() {
    const root = document.querySelector('[data-flex-playground]');
    if (!root) return;

    const stage = root.querySelector('#flex-demo-stage');
    const codeEl = root.querySelector('#flex-demo-code');
    const chips = [...root.querySelectorAll('[data-justify]')];

    chips.forEach((chip) => {
      chip.addEventListener('click', () => {
        const value = chip.dataset.justify || 'space-around';
        chips.forEach((c) => {
          const active = c === chip;
          c.classList.toggle('is-active', active);
          c.setAttribute('aria-pressed', String(active));
        });

        if (stage) stage.style.justifyContent = value;
        if (codeEl) {
          codeEl.textContent = `.container {\n  display: flex;\n  justify-content: ${value};\n}`;
        }
      });
    });
  }

  function initDemoButtons() {
    document.querySelectorAll('[data-demo-click]').forEach((btn) => {
      let clicks = 0;
      btn.addEventListener('click', () => {
        clicks++;
        const target = document.getElementById(btn.dataset.demoClick);
        if (target) {
          target.textContent = `Button clicked ${clicks} ${clicks === 1 ? 'time' : 'times'}!`;
          target.classList.add('is-visible');
        }
      });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initScrollToTop();
    initCodeCopyButtons();
    initExercises();
    initCheatsheetFilter();
    initBoxModelVisualizer();
    initFormPreviews();
    initFlexPlayground();
    initDemoButtons();
  });
})();
