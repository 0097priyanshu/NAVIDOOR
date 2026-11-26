/**
 * Phone number normalization helpers for consistent User & Family lookup.
 */

function normalizePhone(rawPhone) {
  if (!rawPhone || typeof rawPhone !== 'string') return '';
  return rawPhone.replace(/[\s\-\(\)]/g, '').trim();
}

module.exports = { normalizePhone };
