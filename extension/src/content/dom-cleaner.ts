/**
 * DOM Cleaner — strips irrelevant nodes from the page before extraction.
 * Removes ads, scripts, styles, iframes, navs, footers, etc.
 */
export function cleanDom(root: Element): string {
  const clone = root.cloneNode(true) as Element;

  // Remove all irrelevant tags
  const removeSelectors = [
    'script', 'style', 'noscript', 'iframe', 'link', 'meta',
    'nav', 'footer', 'header',
    '[class*="banner"]', '[class*="advert"]', '[class*="popup"]',
    '[class*="cookie"]', '[class*="modal"]', '[class*="sidebar"]',
    '[id*="banner"]', '[id*="advert"]', '[id*="popup"]',
  ];

  for (const selector of removeSelectors) {
    clone.querySelectorAll(selector).forEach((el) => el.remove());
  }

  // Get cleaned text content
  const text = clone.textContent || '';
  // Collapse whitespace
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Extract specific text blocks from the page
 */
export function extractTextBlock(root: Element, selectors: string[]): string {
  for (const selector of selectors) {
    const el = root.querySelector(selector);
    if (el && el.textContent) {
      return el.textContent.replace(/\s+/g, ' ').trim();
    }
  }
  return '';
}
