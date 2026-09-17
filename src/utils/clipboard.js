/**
 * Cross-browser clipboard copy utility that works in both Secure Contexts
 * (HTTPS / localhost) and Insecure Contexts (e.g. accessing via LAN IP like http://192.168.1.57:3000).
 *
 * Modern browsers restrict `navigator.clipboard` to secure contexts (HTTPS or localhost).
 * When accessed via an IP address over HTTP, `navigator.clipboard` is undefined or throws an error.
 * This utility seamlessly falls back to `document.execCommand('copy')` using an offscreen textarea.
 *
 * @param {string} text - The text string to copy.
 * @returns {Promise<boolean>} Resolves to true if successfully copied, false otherwise.
 */
export async function copyToClipboard(text) {
  if (text === undefined || text === null) return false;
  const str = String(text);

  // 1. Try modern Clipboard API if available and running in a secure context
  if (typeof window !== 'undefined' && window.isSecureContext && navigator?.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(str);
      return true;
    } catch (err) {
      console.warn('navigator.clipboard.writeText failed, attempting execCommand fallback:', err);
    }
  }

  // 2. Fallback for insecure contexts (e.g. LAN IP over HTTP) or unsupported environments
  if (typeof document !== 'undefined') {
    try {
      const previouslyFocused = document.activeElement;
      const textArea = document.createElement('textarea');
      textArea.value = str;

      // Prevent zooming on mobile browsers
      textArea.style.fontSize = '16px';
      // Position offscreen so it's invisible to the user
      textArea.style.position = 'fixed';
      textArea.style.top = '0';
      textArea.style.left = '-9999px';
      textArea.style.width = '2em';
      textArea.style.height = '2em';
      textArea.style.padding = '0';
      textArea.style.border = 'none';
      textArea.style.outline = 'none';
      textArea.style.boxShadow = 'none';
      textArea.style.background = 'transparent';
      textArea.setAttribute('readonly', '');

      document.body.appendChild(textArea);

      // Select all content inside textarea
      textArea.focus();
      textArea.select();
      textArea.setSelectionRange(0, str.length);

      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);

      // Restore previously focused element if applicable
      if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
        previouslyFocused.focus();
      }

      if (successful) {
        return true;
      }
    } catch (fallbackErr) {
      console.error('execCommand copy fallback failed:', fallbackErr);
    }
  }

  return false;
}
