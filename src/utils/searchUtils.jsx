import React from 'react';

/**
 * Escapes special regex characters in a query string.
 */
export function escapeRegExp(string = '') {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Checks whether any word in a string starts with the given prefix (case-insensitive).
 * Words are delimited by whitespace, hyphens, slashes, ampersands, or parentheses.
 */
export function stringMatchesPrefix(str = '', prefix = '') {
  if (!str || !prefix) return false;
  const cleanPrefix = prefix.trim().toLowerCase();
  if (!cleanPrefix) return false;

  const cleanStr = str.trim().toLowerCase();
  
  // 1. Exact start of entire string
  if (cleanStr.startsWith(cleanPrefix)) {
    return true;
  }

  // 2. Exact start of any word inside the string (e.g. "Deep Cleaning", "Short Circuit")
  const words = cleanStr.split(/[\s\-_/&(),.:;]+/);
  return words.some(word => word.startsWith(cleanPrefix));
}

/**
 * Checks whether a service strictly matches the search prefix in its title, category,
 * tags, subCategories, badge, or workerName.
 */
export function matchesStrictPrefix(service, query = '') {
  if (!service) return false;
  const prefix = (query || '').trim().toLowerCase();
  if (!prefix) return true; // If no query, all allowed (handled by caller)

  // 1. Check title
  if (stringMatchesPrefix(service.title, prefix)) return true;

  // 2. Check category name
  if (stringMatchesPrefix(service.categoryName, prefix)) return true;

  // 3. Check badge (e.g. "Licensed Electrician", "AquaFlow Drain Specialists")
  if (stringMatchesPrefix(service.badge, prefix)) return true;

  // 4. Check tags array
  if (Array.isArray(service.tags)) {
    const hasTagMatch = service.tags.some(tag => stringMatchesPrefix(tag, prefix));
    if (hasTagMatch) return true;
  }

  // 5. Check subCategories array
  if (Array.isArray(service.subCategories)) {
    const hasSubCatMatch = service.subCategories.some(sub => stringMatchesPrefix(sub, prefix));
    if (hasSubCatMatch) return true;
  }

  // 6. Check workerName if applicable
  if (stringMatchesPrefix(service.workerName, prefix)) return true;

  return false;
}

/**
 * Returns information about which specific tag or subcategory matched the prefix,
 * so the UI can explain and display it with highlighting.
 */
export function getMatchedSnippet(service, query = '') {
  if (!service) return null;
  const prefix = (query || '').trim().toLowerCase();
  if (!prefix) return null;

  // If title or categoryName matched, return null (title is already rendered with highlight)
  if (stringMatchesPrefix(service.title, prefix) || stringMatchesPrefix(service.categoryName, prefix)) {
    return null;
  }

  // Check tags
  if (Array.isArray(service.tags)) {
    const matchedTag = service.tags.find(tag => stringMatchesPrefix(tag, prefix));
    if (matchedTag) {
      return { type: 'tag', text: matchedTag, label: matchedTag };
    }
  }

  // Check subCategories
  if (Array.isArray(service.subCategories)) {
    const matchedSub = service.subCategories.find(sub => stringMatchesPrefix(sub, prefix));
    if (matchedSub) {
      return { type: 'subCategory', text: matchedSub, label: matchedSub };
    }
  }

  // Check badge
  if (stringMatchesPrefix(service.badge, prefix)) {
    return { type: 'badge', text: service.badge, label: service.badge };
  }

  return null;
}

/**
 * Highlights prefix occurrences in words within a text string.
 * Returns React nodes with the matching prefixes wrapped in high-contrast styled spans.
 */
export function highlightPrefix(text = '', query = '', options = {}) {
  if (!text) return '';
  const prefix = (query || '').trim();
  if (!prefix) return text;

  const {
    highlightClassName = 'font-black text-[#00A3E0] underline decoration-[#00A3E0]/40',
    normalClassName = ''
  } = options;

  // Match words starting with the prefix: (\b prefix)
  const escaped = escapeRegExp(prefix);
  const regex = new RegExp(`(^|\\b|[\\s\\-_/&(),.:;]+)(${escaped})`, 'gi');

  // If there's no match, return original text
  if (!regex.test(text)) {
    return text;
  }

  // Reset lastIndex for string traversal
  regex.lastIndex = 0;

  const elements = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const delimiter = match[1]; // Leading boundary/punctuation/space
    const matchedPrefix = match[2]; // The matched characters
    const matchStart = match.index;
    const prefixStart = matchStart + delimiter.length;
    const prefixEnd = prefixStart + matchedPrefix.length;

    // Push text before this match
    if (prefixStart > lastIndex) {
      elements.push(
        <span key={`text-${lastIndex}`} className={normalClassName}>
          {text.slice(lastIndex, prefixStart)}
        </span>
      );
    }

    // Push highlighted prefix
    elements.push(
      <strong key={`match-${prefixStart}`} className={highlightClassName}>
        {matchedPrefix}
      </strong>
    );

    lastIndex = prefixEnd;
  }

  // Push any remaining text
  if (lastIndex < text.length) {
    elements.push(
      <span key={`tail-${lastIndex}`} className={normalClassName}>
        {text.slice(lastIndex)}
      </span>
    );
  }

  return <>{elements}</>;
}
