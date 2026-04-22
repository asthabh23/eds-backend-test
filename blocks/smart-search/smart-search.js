/**
 * Smart Search Block — Senseforth Integration for Edge Delivery Services
 *
 * Loads the Senseforth AI-powered smart search widget (as used on icici.bank.in).
 * Renders a search bar with rotating placeholder text. On click, lazy-loads
 * the full Senseforth Vite app (React-based search overlay with AI results).
 *
 * Authoring (Google Docs / SharePoint):
 *
 *   | Smart Search                                                              |
 *   | ---                                                                       |
 *   | Instance     | icicibanksmartsearch                                       |
 *   | Placeholders | Home Loan, Car Loan, Personal Loan, Fixed Deposit          |
 */

const SENSEFORTH_BASE = 'https://smart-search.senseforth.com';

/**
 * Load an external stylesheet, returns a promise.
 * @param {string} href URL to the CSS file
 * @returns {Promise<void>}
 */
function loadStylesheet(href) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`link[href="${href}"]`)) { resolve(); return; }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.onload = resolve;
    link.onerror = reject;
    document.head.appendChild(link);
  });
}

/**
 * Load an external script as a module, returns a promise.
 * @param {string} src URL to the JS file
 * @returns {Promise<void>}
 */
function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const script = document.createElement('script');
    script.type = 'module';
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

/**
 * Auto-fill the search input and submit (for deep-linked ?search_query= support).
 * @param {string} query The search query to prefill
 */
function prefillAndSubmit(query) {
  const waitForElement = (selector, timeout = 10000) => new Promise((resolve, reject) => {
    const found = document.querySelector(selector);
    if (found) { resolve(found); return; }
    const observer = new MutationObserver(() => {
      const el = document.querySelector(selector);
      if (el) { observer.disconnect(); resolve(el); }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(() => { observer.disconnect(); reject(new Error(`Timeout: ${selector}`)); }, timeout);
  });

  waitForElement('#search-chatInput', 10000)
    .then((input) => {
      input.focus();
      const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
      if (descriptor && descriptor.set) {
        descriptor.set.call(input, query);
      } else {
        input.value = query;
      }
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));

      if (!window.sfAutoSubmitDone) {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            window.sfAutoSubmitDone = true;
            input.dispatchEvent(new KeyboardEvent('keydown', {
              key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true,
            }));
          });
        });
      }
    })
    .catch((e) => {
      // eslint-disable-next-line no-console
      console.warn('Could not prefill search:', e);
    });
}

/**
 * Load the full Senseforth Vite search app.
 * @param {string} instance Senseforth instance name
 * @param {string|null} isMicClicked Whether mic was clicked
 * @param {string|null} initialQuery Optional query to auto-fill
 */
function loadSearchApp(instance, isMicClicked = null, initialQuery = null) {
  const base = `${SENSEFORTH_BASE}/${instance}/dist`;

  const cssPromises = [
    loadStylesheet(`${base}/assets/index-C6cwdCPi.css`),
    loadStylesheet(`${base}/assets/app-BuIwO7z-.css`),
  ];
  const jsPromises = [
    loadScript(`${base}/assets/app-CxCt9Zlk.js`),
    loadScript(`${base}/assets/main-BD5LUWCb.js`),
  ];

  Promise.all([...cssPromises, ...jsPromises])
    .then(() => {
      setTimeout(() => {
        if (typeof window.handleSearch === 'function') {
          window.handleSearch(isMicClicked);
        }
        if (initialQuery && initialQuery.trim().length > 0) {
          prefillAndSubmit(initialQuery.trim());
        }
      }, 50);
    })
    .catch((e) => {
      // eslint-disable-next-line no-console
      console.error('Error loading Senseforth search app:', e);
    });
}

function searchIconSVG() {
  return '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16.1986 14.608H15.3645L15.0688 14.3231C16.3359 12.8458 16.9905 10.8304 16.6315 8.68827C16.1352 5.75477 13.6857 3.41219 10.7294 3.05342C6.26319 2.50471 2.50442 6.26128 3.05345 10.7248C3.41244 13.6794 5.75639 16.1275 8.69161 16.6235C10.835 16.9823 12.8516 16.328 14.3298 15.0618L14.6148 15.3572V16.1909L19.1021 20.6755C19.535 21.1082 20.2424 21.1082 20.6753 20.6755C21.1082 20.2429 21.1082 19.5359 20.6753 19.1032L16.1986 14.608ZM9.86358 14.608C7.23456 14.608 5.11233 12.487 5.11233 9.85956C5.11233 7.23207 7.23456 5.11109 9.86358 5.11109C12.4926 5.11109 14.6148 7.23207 14.6148 9.85956C14.6148 12.487 12.4926 14.608 9.86358 14.608Z" fill="#64789B"/></svg>';
}

function micIconSVG() {
  return '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.9998 3C10.3429 3 8.99976 4.34315 8.99976 6V10C8.99976 11.6569 10.3429 13 11.9998 13C13.6566 13 14.9998 11.6569 14.9998 10V6C14.9998 4.34315 13.6566 3 11.9998 3ZM11.9998 1C14.7612 1 16.9998 3.23858 16.9998 6V10C16.9998 12.7614 14.7612 15 11.9998 15C9.23833 15 6.99976 12.7614 6.99976 10V6C6.99976 3.23858 9.23833 1 11.9998 1ZM3.05469 11H5.07065C5.55588 14.3923 8.47329 17 11.9998 17C15.5262 17 18.4436 14.3923 18.9289 11H20.9448C20.4837 15.1716 17.1714 18.4839 12.9998 18.9451V23H10.9998V18.9451C6.82814 18.4839 3.51584 15.1716 3.05469 11Z" fill="#64789B"/></svg>';
}

/**
 * Parse block configuration from authored table rows.
 * @param {Element} block The block element
 * @returns {{ instance: string, placeholders: string[] }}
 */
function readConfig(block) {
  const config = {
    instance: 'icicibanksmartsearch',
    placeholders: ['Home Loan', 'Car Loan', 'Personal Loan', 'Fixed Deposit', 'Credit Card', 'Savings Account'],
  };

  [...block.children].forEach((row) => {
    const cells = [...row.children];
    if (cells.length >= 2) {
      const key = cells[0].textContent.trim().toLowerCase();
      const value = cells[1].textContent.trim();
      if (key === 'instance' && value) config.instance = value;
      if (key === 'placeholders' && value) {
        config.placeholders = value.split(',').map((p) => p.trim()).filter(Boolean);
      }
    }
  });

  return config;
}

/**
 * Decorates the smart-search block.
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const config = readConfig(block);

  // Clear authored content
  block.textContent = '';

  // Build search widget DOM
  const wrapper = document.createElement('div');
  wrapper.classList.add('ff-search-wrapper');

  const searchIcon = document.createElement('div');
  searchIcon.classList.add('search-icon');

  const inputDiv = document.createElement('div');
  inputDiv.classList.add('search-input-div');
  inputDiv.innerHTML = `${searchIconSVG()}<div class="input-content animate-scroll">Search for &ldquo;${config.placeholders[0]}&rdquo;</div>`;

  const micDiv = document.createElement('div');
  micDiv.classList.add('mic-action-div');
  micDiv.innerHTML = micIconSVG();

  searchIcon.append(inputDiv);
  searchIcon.append(micDiv);
  wrapper.append(searchIcon);
  block.append(wrapper);

  // Rotating placeholder animation
  let placeholderIndex = 0;
  const inputContent = wrapper.querySelector('.input-content');

  setInterval(() => {
    if (!inputContent) return;
    inputContent.classList.add('animate-scroll');
    setTimeout(() => {
      placeholderIndex = (placeholderIndex + 1) % config.placeholders.length;
      inputContent.textContent = `Search for \u201c${config.placeholders[placeholderIndex]}\u201d`;
      inputContent.classList.remove('animate-scroll');
    }, 300);
  }, 2500);

  // Click handler — lazy-load the full Senseforth app
  searchIcon.addEventListener('click', (event) => {
    const isMic = event.target.closest('.mic-action-div');
    loadSearchApp(config.instance, isMic ? 'mic-clicked' : null);
  });

  // Load the base Senseforth index CSS (placeholder styles)
  loadStylesheet(`${SENSEFORTH_BASE}/${config.instance}/dist/assets/index-C6cwdCPi.css`);

  // Support ?search_query= URL parameter for deep-linked searches
  try {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('search_query');
    if (q && q.trim().length > 0) {
      loadSearchApp(config.instance, null, decodeURIComponent(q.replace(/\+/g, ' ')));
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('Error parsing search_query:', err);
  }
}
