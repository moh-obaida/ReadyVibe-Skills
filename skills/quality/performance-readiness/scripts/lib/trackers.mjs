// Host-based vendor classification for observed network requests and script tags.
// This is a HEURISTIC catalog of well-known hosts. A category describes what the vendor is generally
// used for; it is not a legal classification and says nothing about consent requirements.
// `tracking: true` marks categories that commonly involve profiling/measurement of visitors and are the
// usual subject of consent rules in some jurisdictions. Applicability must come from rule context.

const V = (id, name, category, tracking, ...hosts) => ({ id, name, category, tracking, hosts });

export const VENDORS = [
  V("google-tag-manager", "Google Tag Manager", "TAG_MANAGER", true, "googletagmanager.com"),
  V("google-analytics", "Google Analytics", "ANALYTICS", true, "google-analytics.com", "analytics.google.com", "stats.g.doubleclick.net"),
  V("google-ads", "Google Ads / DoubleClick", "ADVERTISING", true, "doubleclick.net", "googlesyndication.com", "googleadservices.com", "adservice.google.com"),
  V("meta-pixel", "Meta Pixel", "ADVERTISING", true, "connect.facebook.net", "facebook.com/tr", "graph.facebook.com"),
  V("tiktok-pixel", "TikTok Pixel", "ADVERTISING", true, "analytics.tiktok.com", "business-api.tiktok.com"),
  V("linkedin-insight", "LinkedIn Insight", "ADVERTISING", true, "snap.licdn.com", "px.ads.linkedin.com"),
  V("x-pixel", "X/Twitter pixel", "ADVERTISING", true, "static.ads-twitter.com", "analytics.twitter.com", "t.co/i/adsct"),
  V("pinterest-tag", "Pinterest Tag", "ADVERTISING", true, "ct.pinterest.com", "s.pinimg.com/ct"),
  V("reddit-pixel", "Reddit Pixel", "ADVERTISING", true, "alb.reddit.com", "events.reddit.com"),
  V("hotjar", "Hotjar", "SESSION_REPLAY", true, "hotjar.com", "hotjar.io"),
  V("microsoft-clarity", "Microsoft Clarity", "SESSION_REPLAY", true, "clarity.ms"),
  V("fullstory", "FullStory", "SESSION_REPLAY", true, "fullstory.com", "edge.fullstory.com"),
  V("logrocket", "LogRocket", "SESSION_REPLAY", true, "logrocket.com", "lr-ingest.io", "lr-in.com", "logr-ingest.com"),
  V("mouseflow", "Mouseflow", "SESSION_REPLAY", true, "mouseflow.com"),
  V("posthog", "PostHog", "ANALYTICS", true, "posthog.com", "i.posthog.com", "us.i.posthog.com", "eu.i.posthog.com", "app.posthog.com"),
  V("segment", "Segment", "ANALYTICS", true, "segment.com", "segment.io", "cdn.segment.com"),
  V("mixpanel", "Mixpanel", "ANALYTICS", true, "mixpanel.com", "mxpnl.com"),
  V("amplitude", "Amplitude", "ANALYTICS", true, "amplitude.com"),
  V("heap", "Heap", "ANALYTICS", true, "heapanalytics.com"),
  V("plausible", "Plausible", "ANALYTICS", true, "plausible.io"),
  V("fathom", "Fathom", "ANALYTICS", true, "usefathom.com"),
  V("matomo", "Matomo (cloud)", "ANALYTICS", true, "matomo.cloud"),
  V("vercel-analytics", "Vercel Analytics", "ANALYTICS", true, "va.vercel-scripts.com", "vitals.vercel-insights.com", "vercel-insights.com"),
  V("cloudflare-analytics", "Cloudflare Web Analytics", "ANALYTICS", true, "cloudflareinsights.com"),
  V("hubspot", "HubSpot", "CRM_MARKETING", true, "hs-scripts.com", "hs-analytics.net", "hsforms.com", "hubspot.com", "hs-banner.com"),
  V("intercom", "Intercom", "CHAT_SUPPORT", false, "intercom.io", "intercomcdn.com"),
  V("crisp", "Crisp", "CHAT_SUPPORT", false, "crisp.chat"),
  V("drift", "Drift", "CHAT_SUPPORT", false, "drift.com", "driftt.com"),
  V("sentry", "Sentry", "ERROR_MONITORING", false, "sentry.io", "ingest.sentry.io"),
  V("datadog-rum", "Datadog RUM", "ERROR_MONITORING", false, "datadoghq.com", "datadoghq-browser-agent.com"),
  V("stripe", "Stripe", "PAYMENTS", false, "js.stripe.com", "m.stripe.network", "stripe.com", "m.stripe.com", "q.stripe.com"),
  V("paypal", "PayPal", "PAYMENTS", false, "paypal.com", "paypalobjects.com"),
  V("google-fonts", "Google Fonts", "FONTS", false, "fonts.googleapis.com", "fonts.gstatic.com"),
  V("adobe-fonts", "Adobe Fonts", "FONTS", false, "use.typekit.net", "p.typekit.net"),
  V("google-maps", "Google Maps", "MAPS", false, "maps.googleapis.com", "maps.gstatic.com"),
  V("mapbox", "Mapbox", "MAPS", false, "api.mapbox.com", "events.mapbox.com"),
  V("youtube", "YouTube embed", "VIDEO_EMBED", false, "youtube.com", "youtube-nocookie.com", "ytimg.com", "googlevideo.com"),
  V("vimeo", "Vimeo embed", "VIDEO_EMBED", false, "vimeo.com", "vimeocdn.com"),
  V("recaptcha", "Google reCAPTCHA", "CAPTCHA", false, "google.com/recaptcha", "recaptcha.net", "gstatic.com/recaptcha"),
  V("hcaptcha", "hCaptcha", "CAPTCHA", false, "hcaptcha.com"),
  V("turnstile", "Cloudflare Turnstile", "CAPTCHA", false, "challenges.cloudflare.com"),
  V("calendly", "Calendly", "SCHEDULING_EMBED", false, "calendly.com"),
  V("typeform", "Typeform", "FORM_EMBED", false, "typeform.com"),
  V("twitter-widgets", "X/Twitter widgets", "SOCIAL_WIDGET", true, "platform.twitter.com", "syndication.twitter.com"),
  V("facebook-widgets", "Facebook widgets", "SOCIAL_WIDGET", true, "facebook.com/plugins", "facebook.net"),
  V("cdn-jsdelivr", "jsDelivr CDN", "CDN", false, "cdn.jsdelivr.net"),
  V("cdn-unpkg", "unpkg CDN", "CDN", false, "unpkg.com"),
  V("cdn-cdnjs", "cdnjs", "CDN", false, "cdnjs.cloudflare.com"),
];

export const TRACKING_COOKIE_HINT = /^(_ga|_gid|_gat|_gcl_|_fbp|_fbc|_ttp|_tt_|_pin_|_uet|_clck|_clsk|_hj|hjSession|ajs_|amp_|mp_|__hs|hubspotutk|_hstc|_li_|IDE|test_cookie|_scid|_rdt_|ph_|mixpanel|_vwo|_dc_gtm|__utm)/i;
export const NON_ESSENTIAL_CATEGORIES = new Set(["ANALYTICS", "ADVERTISING", "SESSION_REPLAY", "TAG_MANAGER", "SOCIAL_WIDGET", "CRM_MARKETING"]);

export function classifyUrl(rawUrl) {
  let u;
  try {
    u = new URL(rawUrl);
  } catch {
    return null;
  }
  const hostPath = `${u.hostname}${u.pathname}`;
  for (const vendor of VENDORS) {
    for (const h of vendor.hosts) {
      const [host, ...rest] = h.split("/");
      const hostMatch = u.hostname === host || u.hostname.endsWith(`.${host}`);
      if (!hostMatch) continue;
      if (rest.length && !hostPath.includes(h)) continue;
      return { id: vendor.id, name: vendor.name, category: vendor.category, tracking: vendor.tracking };
    }
  }
  return null;
}
