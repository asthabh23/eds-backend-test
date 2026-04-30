// Stryker Martech Migration - Delayed Phase
// Migrated from: https://www.stryker.com/us/en/
// Stack: Adobe Launch + AppMeasurement + OneTrust

import { loadScript } from './aem.js';

// ============================================================
// CONFIGURATION - Set these values before deploying
// ============================================================

// OneTrust Domain Script ID
// Found at: cdn.cookielaw.org/scripttemplates/otSDKStub.js data-domain-script attribute
// From source site: Extract from the data-domain-script attribute
const ONETRUST_DOMAIN_SCRIPT_ID = 'd75729a5-75c8-4a38-8aae-707548537e37';

// Adobe Launch Container URL
// From source site: https://assets.adobedtm.com/136dae5be016/c16268248032/launch-b7b98bbdd10a.min.js
const ADOBE_LAUNCH_URL = 'https://assets.adobedtm.com/136dae5be016/c16268248032/launch-b7b98bbdd10a.min.js';

// Analytics Channel Name (for data layer)
const ANALYTICS_CHANNEL = 'stryker-website';

// ============================================================
// CONSENT MANAGEMENT - OneTrust
// ============================================================
// OneTrust Consent Groups detected on source site:
// - C0001: Strictly Necessary (always enabled)
// - C0002: Performance (Analytics) - gates Adobe Analytics
// - C0003: Functional
// - C0004: Targeting (Ads/Marketing)
// ============================================================

/**
 * Checks whether a specific OneTrust consent group is allowed.
 * @param {string} group - The consent group code (e.g. 'C0002', 'C0004')
 * @returns {boolean} True if the user has consented to this group
 */
function isConsentGroupAllowed(group) {
  const cookie = document.cookie.split(';').find((c) => c.trim().startsWith('OptanonConsent='));
  if (!cookie) return false;
  const groups = decodeURIComponent(cookie.split('=')[1]).match(/groups=([^&]*)/);
  return groups ? groups[1].includes(`${group}:1`) : false;
}

function isPerformanceAllowed() {
  return isConsentGroupAllowed('C0002');
}

// ============================================================
// ADOBE DATA LAYER
// ============================================================
// Stryker uses both 'digitalData' and 'adobeDataLayer' on their source site.
// We initialize adobeDataLayer for EDS compatibility with Launch ACDL extension.
// ============================================================

function initializeDataLayer() {
  window.adobeDataLayer = window.adobeDataLayer || [];

  // Build page view event from page metadata (matching Stryker's schema)
  const pageTitle = document.querySelector('h1')?.innerText
    || document.title
    || 'Untitled Page';

  const pageName = pageTitle.replace(/<[^>]*>/g, '').toLowerCase().trim();

  window.adobeDataLayer.push({
    event: 'pageView',
    page: {
      pageInfo: {
        pageName,
        pageTitle: document.title,
        pageURL: window.location.href,
        pageType: document.querySelector('meta[name="pagetype"]')?.content || 'Content Page',
        language: document.documentElement.lang || 'en',
        country: 'us',
        siteSection: window.location.pathname.split('/')[3] || 'home',
      },
      category: {
        primaryCategory: document.querySelector('meta[name="category"]')?.content || 'general',
      },
    },
    web: {
      webPageDetails: {
        pageViews: { value: 1 },
        name: pageName,
        URL: window.location.href,
        isErrorPage: document.querySelector('meta[name="error-page"]')?.content === 'true',
      },
    },
    _stryker: {
      channelInfo: {
        name: ANALYTICS_CHANNEL,
        version: 'Edge Delivery Services',
      },
    },
  });
}

// ============================================================
// ADOBE LAUNCH CONTAINER
// ============================================================
// The Launch container handles:
// - AppMeasurement (Adobe Analytics)
// - ActivityMap
// - All remaining tags from source site
//
// Extracted from source: assets.adobedtm.com/136dae5be016/c16268248032/launch-b7b98bbdd10a.min.js
// ============================================================

function loadAdobeLaunch() {
  if (!ADOBE_LAUNCH_URL) {
    // eslint-disable-next-line no-console
    console.warn('Adobe Launch: ADOBE_LAUNCH_URL not configured');
    return;
  }

  const { hostname } = window.location;
  if (
    hostname.includes('localhost')
    || hostname.includes('.aem.page')
    || hostname.includes('.aem.live')
  ) {
    // eslint-disable-next-line no-console
    console.log('Adobe Launch: skipped (local/preview environment)');
    return;
  }

  // Check OneTrust consent for Performance cookies (C0002)
  // If OneTrust is not configured, fall back to checking analytics_storage cookie
  if (ONETRUST_DOMAIN_SCRIPT_ID) {
    if (!isPerformanceAllowed()) {
      // eslint-disable-next-line no-console
      console.log('Adobe Launch: skipped (performance consent C0002 not granted)');
      return;
    }
  } else if (document.cookie.includes('analytics_storage=denied')) {
    // eslint-disable-next-line no-console
    console.log('Adobe Launch: skipped (analytics_storage denied)');
    return;
  }

  // Initialize data layer before loading Launch
  initializeDataLayer();

  loadScript(ADOBE_LAUNCH_URL, { async: true });

  // eslint-disable-next-line no-console
  console.log('Adobe Launch: loaded', ADOBE_LAUNCH_URL);
}

/**
 * Loads OneTrust consent banner.
 * Must load FIRST before any analytics or tracking scripts.
 */
async function loadOneTrust() {
  if (!ONETRUST_DOMAIN_SCRIPT_ID) {
    // eslint-disable-next-line no-console
    console.warn('OneTrust: ONETRUST_DOMAIN_SCRIPT_ID not configured - consent banner skipped');
    return;
  }

  const { hostname } = window.location;
  if (
    hostname.includes('localhost')
    || hostname.includes('.aem.page')
    || hostname.includes('.aem.live')
  ) {
    // eslint-disable-next-line no-console
    console.log('OneTrust: skipped (local/preview environment)');
    return;
  }

  // Must be assigned BEFORE loadScript - OneTrust calls OptanonWrapper immediately on load
  window.OptanonWrapper = () => {
    document.dispatchEvent(new CustomEvent('consent-updated'));

    // Re-check consent and load scripts if now allowed
    if (isPerformanceAllowed()) {
      loadAdobeLaunch();
    }
  };

  await loadScript('https://cdn.cookielaw.org/scripttemplates/otSDKStub.js', {
    type: 'text/javascript',
    charset: 'UTF-8',
    'data-domain-script': ONETRUST_DOMAIN_SCRIPT_ID,
  });
}

// ============================================================
// INITIALIZATION
// ============================================================
// Load order is critical:
// 1. OneTrust (consent) - must load first
// 2. Adobe Launch (analytics) - gated on consent
// ============================================================

async function initDelayed() {
  // Step 1: Load OneTrust consent management
  await loadOneTrust();

  // Step 2: Load Adobe Launch if consent is already granted
  // (If consent is pending, Launch will load via OptanonWrapper callback)
  if (!ONETRUST_DOMAIN_SCRIPT_ID || isPerformanceAllowed()) {
    loadAdobeLaunch();
  }
}

initDelayed();
