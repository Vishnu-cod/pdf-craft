declare global {
  interface Window {
    dataLayer: any[];
    gtag?: (...args: any[]) => void;
    GA_MEASUREMENT_ID?: string;
  }
}

/**
 * Enterprise GA4 Event Tracker
 */
export function trackEvent(action: string, category: string, label?: string, value?: number) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
  if (import.meta.env.DEV) {
    console.log(`[Analytics Event] ${category} -> ${action}:`, label, value);
  }
}

/**
 * Tracks when a user selects or opens a specific tool
 */
export function trackToolUsage(toolName: string) {
  trackEvent('tool_opened', 'Tools', toolName);
}

/**
 * Tracks document compression or processing completion
 */
export function trackPdfProcess(toolName: string, inputBytes: number, outputBytes: number) {
  const reductionPercent = inputBytes > 0 ? Math.round(((inputBytes - outputBytes) / inputBytes) * 100) : 0;
  trackEvent('pdf_processed', 'Processing', `${toolName} (${reductionPercent}% reduced)`, outputBytes);
}

/**
 * Tracks file export/download conversions
 */
export function trackDownload(toolName: string) {
  trackEvent('pdf_downloaded', 'Conversion', toolName);
}

/**
 * Tracks when a user runs the client-side privacy leak audit
 */
export function trackPrivacyAudit() {
  trackEvent('privacy_verified', 'Security', 'F12 Zero-Leak Verification Passed');
}
