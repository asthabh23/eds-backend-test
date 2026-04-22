// add delayed functionality here

import { loadScript } from './aem.js';

// ============================================================
// Adobe Launch + Web SDK (Alloy)
// ============================================================
//
// ACTION REQUIRED: Complete these steps to activate Adobe Analytics
//
// 1. Set ADOBE_LAUNCH_URL below to your Launch container URL
//    → Get from: Adobe Experience Platform → Data Collection → Tags →
//      Your Property → Environments → Production → Install
//    → Format: https://assets.adobedtm.com/{PROPERTY_ID}/launch-{HASH}.min.js
//
// 2. Set ANALYTICS_CHANNEL to your site's channel name
//    → Must match the XDM field mapping in your Launch container
//    → Example: 'wknd-website'
//
// 3. (Optional) If using a consent management platform (OneTrust, etc.):
//    → Ensure it sets 'analytics_storage=denied' cookie when consent is denied
//    → Or modify the consent check below to match your CMP's cookie format
//
// 4. Deploy to production domain to verify:
//    → Open DevTools → Network tab
//    → Confirm Launch script loads ~3s after page load
//    → Confirm analytics beacon fires to edge.adobedc.net or your analytics endpoint
//
// NOTE: Analytics is automatically skipped on localhost, .aem.page, and .aem.live
//       to avoid polluting production data during development.
//
// ============================================================

const ADOBE_LAUNCH_URL = ''; // ← ACTION: Set your Launch container URL
const ANALYTICS_CHANNEL = ''; // ← ACTION: Set your channel name (e.g., 'wknd-website')

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
