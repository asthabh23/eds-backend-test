// add delayed functionality here

import { loadScript } from './aem.js';

// ============================================================
// Adobe Launch + Web SDK (Alloy)
// ============================================================
// SETUP: Verify ADOBE_LAUNCH_URL below matches your production container.
// Get from: Adobe Experience Platform → Data Collection → Tags →
//           Your Property → Environments → Production → Install
//
// ANALYTICS_CHANNEL: Set this to your site's channel name for analytics.
//   Must match the XDM field mapping configured in your Launch container.
//
// NOTE: Skipped on localhost and .aem.page/.aem.live preview domains
//   to avoid polluting production analytics during development.
// ============================================================

const ADOBE_LAUNCH_URL = ''; // ← Set your Launch container URL (e.g., from audit: https://assets.adobedtm.com/8435ef3ee65b/ba907718de70/launch-23f8357258bd.min.js)
const ANALYTICS_CHANNEL = ''; // ← Set your channel name (e.g., 'wknd-website')

function loadAdobeLaunch() {
  if (!ADOBE_LAUNCH_URL) {
    // eslint-disable-next-line no-console
    console.warn('Adobe Launch: Set ADOBE_LAUNCH_URL in delayed.js');
    return;
  }

  const { hostname } = window.location;
  if (hostname.includes('localhost') || hostname.includes('.aem.page') || hostname.includes('.aem.live')) {
    // eslint-disable-next-line no-console
    console.log('Adobe Launch: skipped (local/preview environment)');
    return;
  }

  if (document.cookie.includes('analytics_storage=denied')) {
    // eslint-disable-next-line no-console
    console.log('Adobe Launch: skipped (consent denied)');
    return;
  }

  // Initialize Adobe Client Data Layer
  window.adobeDataLayer = window.adobeDataLayer || [];

  // Build page view event from page metadata
  const screenName = (document.querySelector('h1')?.innerText || document.title)
    .replace(/<[^>]*>/g, '').toLowerCase().trim();

  window.adobeDataLayer.push({
    event: 'pageView',
    web: {
      webPageDetails: {
        pageViews: { value: 1 },
        name: screenName,
        URL: window.location.href,
        isErrorPage: false,
      },
    },
    _custom: {
      channelInfo: { name: ANALYTICS_CHANNEL || 'website', version: 'Edge Delivery Services' },
      pageInfo: {
        pageType: document.querySelector('meta[name="pagetype"]')?.content || 'Content Page',
        language: document.documentElement.lang || 'en',
      },
    },
  });

  loadScript(ADOBE_LAUNCH_URL, { async: true });
}

loadAdobeLaunch();
