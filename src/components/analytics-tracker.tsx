"use client";

import { useEffect } from "react";
import Script from "next/script";
import { usePathname } from "@/i18n/navigation";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const VISITOR_KEY = "wc26:analytics:visitor";
const SESSION_KEY = "wc26:analytics:session";
const STARTED_KEY = "wc26:analytics:started";
const PAGE_VIEWS_KEY = "wc26:analytics:page-views";

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;

function storageGet(storage: Storage, key: string) {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function storageSet(storage: Storage, key: string, value: string) {
  try {
    storage.setItem(key, value);
  } catch {
    // Storage can be unavailable in private modes.
  }
}

function makeId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (char) =>
    (
      Number(char) ^
      (Math.random() * 16) >> (Number(char) / 4)
    ).toString(16)
  );
}

function getVisitorId() {
  const existing = storageGet(window.localStorage, VISITOR_KEY);
  if (existing) return existing;
  const id = makeId();
  storageSet(window.localStorage, VISITOR_KEY, id);
  return id;
}

function getSessionId() {
  const existing = storageGet(window.sessionStorage, SESSION_KEY);
  if (existing) return existing;
  const id = makeId();
  storageSet(window.sessionStorage, SESSION_KEY, id);
  storageSet(window.sessionStorage, STARTED_KEY, String(Date.now()));
  storageSet(window.sessionStorage, PAGE_VIEWS_KEY, "0");
  return id;
}

function sessionDurationSeconds() {
  const started = Number(storageGet(window.sessionStorage, STARTED_KEY) ?? Date.now());
  if (!Number.isFinite(started)) return 0;
  return Math.max(0, Math.round((Date.now() - started) / 1000));
}

function incrementPageViews() {
  const next = Number(storageGet(window.sessionStorage, PAGE_VIEWS_KEY) ?? "0") + 1;
  storageSet(window.sessionStorage, PAGE_VIEWS_KEY, String(next));
  return next;
}

function pageViews() {
  const value = Number(storageGet(window.sessionStorage, PAGE_VIEWS_KEY) ?? "1");
  return Number.isFinite(value) ? Math.max(1, value) : 1;
}

function deviceType() {
  const width = window.innerWidth;
  if (width < 768) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
}

function browserName() {
  const ua = navigator.userAgent;
  if (ua.includes("Edg/")) return "Edge";
  if (ua.includes("Chrome/")) return "Chrome";
  if (ua.includes("Firefox/")) return "Firefox";
  if (ua.includes("Safari/")) return "Safari";
  return "unknown";
}

function sendAnalytics(eventName: string, path: string, views: number, metadata: Record<string, unknown>, beacon = false) {
  const payload = {
    sessionId: getSessionId(),
    visitorId: getVisitorId(),
    eventName,
    path,
    referrer: document.referrer || null,
    language: navigator.language || document.documentElement.lang || null,
    deviceType: deviceType(),
    browser: browserName(),
    durationSeconds: sessionDurationSeconds(),
    pageViews: views,
    metadata,
  };
  const body = JSON.stringify(payload);

  if (beacon && navigator.sendBeacon) {
    navigator.sendBeacon("/api/analytics/track", new Blob([body], { type: "application/json" }));
    return;
  }

  fetch("/api/analytics/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: beacon,
  }).catch(() => null);
}

export function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    const path = `${window.location.pathname}${window.location.search}`;
    const views = incrementPageViews();
    sendAnalytics("page_view", path, views, { title: document.title });

    if (GA_ID && window.gtag) {
      window.gtag("config", GA_ID, { page_path: path, page_title: document.title });
    }

    if (GTM_ID) {
      window.dataLayer = window.dataLayer ?? [];
      window.dataLayer.push({ event: "page_view", page_path: path, page_title: document.title });
    }
  }, [pathname]);

  useEffect(() => {
    const sendHeartbeat = () => {
      sendAnalytics("session_heartbeat", window.location.pathname, pageViews(), { visibilityState: document.visibilityState }, true);
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        sendAnalytics("visibility_hidden", window.location.pathname, pageViews(), {}, true);
      }
    };

    const interval = window.setInterval(sendHeartbeat, 60000);
    window.addEventListener("beforeunload", sendHeartbeat);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("beforeunload", sendHeartbeat);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  return (
    <>
      {GA_ID && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
          <Script id="ga4-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){window.dataLayer.push(arguments);}
              window.gtag = gtag;
              gtag('js', new Date());
              gtag('config', '${GA_ID}', { send_page_view: false });
            `}
          </Script>
        </>
      )}
      {GTM_ID && (
        <Script id="gtm-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            window.dataLayer.push({'gtm.start': new Date().getTime(), event: 'gtm.js'});
            var firstScript = document.getElementsByTagName('script')[0];
            var script = document.createElement('script');
            script.async = true;
            script.src = 'https://www.googletagmanager.com/gtm.js?id=${GTM_ID}';
            firstScript.parentNode.insertBefore(script, firstScript);
          `}
        </Script>
      )}
    </>
  );
}
