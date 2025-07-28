/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @fileoverview Advanced string manipulation utilities with Unicode support
 * @module @/lib/utils/string
 * @description Comprehensive string processing utilities including encoding,
 * sanitization, transformation, and pattern matching with full Unicode support
 */

/**
 * String case transformation options
 */
export enum StringCase {
  LOWER = "lower",
  UPPER = "upper",
  TITLE = "title",
  SENTENCE = "sentence",
  CAMEL = "camel",
  PASCAL = "pascal",
  SNAKE = "snake",
  KEBAB = "kebab",
  CONSTANT = "constant",
}

/**
 * Convert string to specified case
 * @param str - Input string
 * @param caseType - Target case type
 * @returns Transformed string
 */
export const toCase = (str: string, caseType: StringCase): string => {
  switch (caseType) {
    case StringCase.LOWER:
      return str.toLowerCase();

    case StringCase.UPPER:
      return str.toUpperCase();

    case StringCase.TITLE:
      return str.replace(
        /\w\S*/g,
        (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
      );

    case StringCase.SENTENCE:
      return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

    case StringCase.CAMEL:
      return str
        .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
          index === 0 ? word.toLowerCase() : word.toUpperCase()
        )
        .replace(/\s+/g, "");

    case StringCase.PASCAL:
      return str
        .replace(/(?:^\w|[A-Z]|\b\w)/g, (word) => word.toUpperCase())
        .replace(/\s+/g, "");

    case StringCase.SNAKE:
      return str
        .replace(/\W+/g, " ")
        .split(/ |\B(?=[A-Z])/)
        .map((word) => word.toLowerCase())
        .join("_");

    case StringCase.KEBAB:
      return str
        .replace(/\W+/g, " ")
        .split(/ |\B(?=[A-Z])/)
        .map((word) => word.toLowerCase())
        .join("-");

    case StringCase.CONSTANT:
      return str
        .replace(/\W+/g, " ")
        .split(/ |\B(?=[A-Z])/)
        .map((word) => word.toUpperCase())
        .join("_");

    default:
      return str;
  }
};

/**
 * Truncate string with custom ellipsis and word boundary respect
 * @param str - String to truncate
 * @param length - Maximum length
 * @param options - Truncation options
 * @returns Truncated string
 */
export interface TruncateOptions {
  ellipsis?: string;
  respectWordBoundary?: boolean;
  position?: "end" | "middle" | "start";
}

export const truncate = (
  str: string,
  length: number,
  options: TruncateOptions = {}
): string => {
  const {
    ellipsis = "...",
    respectWordBoundary = true,
    position = "end",
  } = options;

  if (str.length <= length) return str;

  const truncLength = length - ellipsis.length;

  switch (position) {
    case "start":
      return ellipsis + str.slice(-truncLength);

    case "middle": {
      const startLength = Math.ceil(truncLength / 2);
      const endLength = Math.floor(truncLength / 2);
      return str.slice(0, startLength) + ellipsis + str.slice(-endLength);
    }

    case "end":
    default: {
      let truncated = str.slice(0, truncLength);

      if (respectWordBoundary) {
        const lastSpace = truncated.lastIndexOf(" ");
        if (lastSpace > 0) {
          truncated = truncated.slice(0, lastSpace);
        }
      }

      return truncated + ellipsis;
    }
  }
};

/**
 * Slugify string for URL-safe format
 * @param str - String to slugify
 * @param options - Slugification options
 * @returns URL-safe slug
 */
export interface SlugifyOptions {
  separator?: string;
  lowercase?: boolean;
  strict?: boolean;
  locale?: string;
}

export const slugify = (str: string, options: SlugifyOptions = {}): string => {
  const {
    separator = "-",
    lowercase = true,
    strict = false,
    locale = "en",
  } = options;

  let slug = str
    .normalize("NFD") // Normalize to decomposed form
    .replace(/[\u0300-\u036f]/g, ""); // Remove diacritics

  if (strict) {
    // Strict mode: only alphanumeric and separator
    slug = slug.replace(/[^a-zA-Z0-9\s]/g, "");
  } else {
    // Replace common symbols
    slug = slug.replace(/[·/_,:;]/g, separator).replace(/[^a-zA-Z0-9\s-]/g, "");
  }

  // Replace spaces with separator
  slug = slug
    .trim()
    .replace(/\s+/g, separator)
    .replace(new RegExp(`\\${separator}+`, "g"), separator);

  if (lowercase) {
    slug = slug.toLocaleLowerCase(locale);
  }

  return slug;
};

/**
 * Escape HTML entities to prevent XSS
 * @param str - String to escape
 * @returns Escaped string
 */
export const escapeHtml = (str: string): string => {
  const htmlEntities: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
    "/": "&#x2F;",
  };

  return str.replace(/[&<>"'\/]/g, (char) => htmlEntities[char]);
};

/**
 * Unescape HTML entities
 * @param str - String to unescape
 * @returns Unescaped string
 */
export const unescapeHtml = (str: string): string => {
  const htmlEntities: Record<string, string> = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#39;": "'",
    "&#x2F;": "/",
  };

  return str.replace(
    /&(?:amp|lt|gt|quot|#39|#x2F);/g,
    (entity) => htmlEntities[entity]
  );
};

/**
 * Escape regular expression special characters
 * @param str - String to escape
 * @returns Escaped string safe for RegExp
 */
export const escapeRegExp = (str: string): string => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

/**
 * Generate random string with custom character set
 * @param length - Length of string
 * @param options - Generation options
 * @returns Random string
 */
export interface RandomStringOptions {
  uppercase?: boolean;
  lowercase?: boolean;
  numbers?: boolean;
  symbols?: boolean;
  customChars?: string;
  excludeAmbiguous?: boolean;
}

export const randomString = (
  length: number,
  options: RandomStringOptions = {}
): string => {
  const {
    uppercase = true,
    lowercase = true,
    numbers = true,
    symbols = false,
    customChars,
    excludeAmbiguous = false,
  } = options;

  let charset = "";

  if (customChars) {
    charset = customChars;
  } else {
    if (uppercase) charset += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if (lowercase) charset += "abcdefghijklmnopqrstuvwxyz";
    if (numbers) charset += "0123456789";
    if (symbols) charset += "!@#$%^&*()_+-=[]{}|;:,.<>?";

    if (excludeAmbiguous) {
      // Remove ambiguous characters
      charset = charset.replace(/[0OIl1]/g, "");
    }
  }

  if (!charset) {
    throw new Error("No character set specified for random string generation");
  }

  const array = new Uint32Array(length);
  crypto.getRandomValues(array);

  return Array.from(array, (value) => charset[value % charset.length]).join("");
};

/**
 * Word wrap text to specified line length
 * @param str - String to wrap
 * @param width - Maximum line width
 * @param options - Wrap options
 * @returns Wrapped string
 */
export interface WordWrapOptions {
  break?: boolean;
  indent?: string;
  cut?: boolean;
}

export const wordWrap = (
  str: string,
  width: number,
  options: WordWrapOptions = {}
): string => {
  const { break: breakWord = true, indent = "", cut = false } = options;

  if (width <= 0) return str;

  const lines: string[] = [];
  const words = str.split(/\s+/);
  let currentLine = indent;

  for (const word of words) {
    if (currentLine.length + word.length + 1 > width) {
      if (currentLine.length > indent.length) {
        lines.push(currentLine.trim());
        currentLine = indent;
      }

      if (word.length > width - indent.length) {
        if (cut || breakWord) {
          // Break long words
          let remainingWord = word;
          while (remainingWord.length > width - currentLine.length) {
            const chunkSize = width - currentLine.length;
            lines.push(currentLine + remainingWord.slice(0, chunkSize));
            remainingWord = remainingWord.slice(chunkSize);
            currentLine = indent;
          }
          currentLine += remainingWord + " ";
        } else {
          // Don't break words
          lines.push(currentLine.trim());
          currentLine = indent + word + " ";
        }
      } else {
        currentLine += word + " ";
      }
    } else {
      currentLine += word + " ";
    }
  }

  if (currentLine.length > indent.length) {
    lines.push(currentLine.trim());
  }

  return lines.join("\n");
};

/**
 * Count occurrences of substring
 * @param str - String to search in
 * @param substring - Substring to count
 * @param caseSensitive - Case sensitivity flag
 * @returns Number of occurrences
 */
export const countOccurrences = (
  str: string,
  substring: string,
  caseSensitive = true
): number => {
  if (!substring) return 0;

  const flags = caseSensitive ? "g" : "gi";
  const regex = new RegExp(escapeRegExp(substring), flags);
  const matches = str.match(regex);

  return matches ? matches.length : 0;
};

/**
 * Highlight text matches with custom wrapper
 * @param text - Text to search in
 * @param query - Search query
 * @param wrapper - Wrapper function for matches
 * @returns Text with highlighted matches
 */
export const highlightText = (
  text: string,
  query: string,
  wrapper: (match: string) => string = (match) => `<mark>${match}</mark>`
): string => {
  if (!query) return text;

  const regex = new RegExp(`(${escapeRegExp(query)})`, "gi");
  return text.replace(regex, wrapper);
};

/**
 * Remove accents/diacritics from string
 * @param str - String with accents
 * @returns String without accents
 */
export const removeAccents = (str: string): string => {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

/**
 * Reverse string with proper Unicode support
 * @param str - String to reverse
 * @returns Reversed string
 */
export const reverseString = (str: string): string => {
  // Handle Unicode properly using spread operator
  return [...str].reverse().join("");
};

/**
 * Check if string is palindrome
 * @param str - String to check
 * @param ignoreCase - Ignore case flag
 * @param ignoreSpaces - Ignore spaces flag
 * @returns Boolean indicating if palindrome
 */
export const isPalindrome = (
  str: string,
  ignoreCase = true,
  ignoreSpaces = true
): boolean => {
  let cleaned = str;

  if (ignoreSpaces) {
    cleaned = cleaned.replace(/\s/g, "");
  }

  if (ignoreCase) {
    cleaned = cleaned.toLowerCase();
  }

  const reversed = reverseString(cleaned);
  return cleaned === reversed;
};

/**
 * Extract URLs from text
 * @param text - Text to extract URLs from
 * @returns Array of URLs found
 */
export const extractUrls = (text: string): string[] => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const matches = text.match(urlRegex);
  return matches || [];
};

/**
 * Extract email addresses from text
 * @param text - Text to extract emails from
 * @returns Array of email addresses found
 */
export const extractEmails = (text: string): string[] => {
  const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/g;
  const matches = text.match(emailRegex);
  return matches || [];
};

/**
 * Convert string to title case with smart word handling
 * @param str - String to convert
 * @param options - Title case options
 * @returns Title cased string
 */
export interface TitleCaseOptions {
  minorWords?: string[];
  forceCase?: boolean;
}

export const toTitleCase = (
  str: string,
  options: TitleCaseOptions = {}
): string => {
  const {
    minorWords = [
      "a",
      "an",
      "the",
      "and",
      "but",
      "or",
      "for",
      "nor",
      "on",
      "at",
      "to",
      "by",
      "of",
      "in",
    ],
    forceCase = true,
  } = options;

  const minorWordsSet = new Set(minorWords.map((w) => w.toLowerCase()));

  return str
    .split(/\s+/)
    .map((word, index) => {
      const lowerWord = word.toLowerCase();

      // Always capitalize first and last word
      if (index === 0 || index === str.split(/\s+/).length - 1) {
        return (
          word.charAt(0).toUpperCase() +
          (forceCase ? lowerWord.slice(1) : word.slice(1))
        );
      }

      // Check if minor word
      if (minorWordsSet.has(lowerWord)) {
        return forceCase ? lowerWord : word;
      }

      // Capitalize major words
      return (
        word.charAt(0).toUpperCase() +
        (forceCase ? lowerWord.slice(1) : word.slice(1))
      );
    })
    .join(" ");
};

/**
 * Levenshtein distance between two strings
 * @param str1 - First string
 * @param str2 - Second string
 * @returns Edit distance
 */
export const levenshteinDistance = (str1: string, str2: string): number => {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // deletion
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
};

/**
 * Calculate string similarity percentage
 * @param str1 - First string
 * @param str2 - Second string
 * @returns Similarity percentage (0-100)
 */
export const stringSimilarity = (str1: string, str2: string): number => {
  const maxLength = Math.max(str1.length, str2.length);
  if (maxLength === 0) return 100;

  const distance = levenshteinDistance(str1, str2);
  return ((maxLength - distance) / maxLength) * 100;
};

/**
 * Parse CSV line with proper quote handling
 * @param line - CSV line to parse
 * @param delimiter - Field delimiter
 * @returns Array of field values
 */
export const parseCsvLine = (line: string, delimiter = ","): string[] => {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      // Field separator
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  // Add last field
  result.push(current);

  return result;
};

/**
 * Format template string with values
 * @param template - Template string with placeholders
 * @param values - Values to replace placeholders
 * @returns Formatted string
 */
export const formatTemplate = (
  template: string,
  values: Record<string, any>
): string => {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return values[key] !== undefined ? String(values[key]) : match;
  });
};

/**
 * Normalize whitespace in string
 * @param str - String to normalize
 * @param preserveNewlines - Whether to preserve newlines
 * @returns Normalized string
 */
export const normalizeWhitespace = (
  str: string,
  preserveNewlines = false
): string => {
  if (preserveNewlines) {
    // Normalize spaces within lines but preserve line breaks
    return str
      .split("\n")
      .map((line) => line.trim().replace(/\s+/g, " "))
      .join("\n");
  }

  // Normalize all whitespace to single spaces
  return str.trim().replace(/\s+/g, " ");
};

/**
 * Convert string to binary representation
 * @param str - String to convert
 * @returns Binary string
 */
export const stringToBinary = (str: string): string => {
  return str
    .split("")
    .map((char) => char.charCodeAt(0).toString(2).padStart(8, "0"))
    .join(" ");
};

/**
 * Convert binary to string
 * @param binary - Binary string
 * @returns Decoded string
 */
export const binaryToString = (binary: string): string => {
  return binary
    .split(" ")
    .map((bin) => String.fromCharCode(parseInt(bin, 2)))
    .join("");
};

/**
 * Generate Lorem Ipsum text
 * @param wordCount - Number of words to generate
 * @returns Lorem Ipsum text
 */
export const generateLoremIpsum = (wordCount: number): string => {
  const words = [
    "lorem",
    "ipsum",
    "dolor",
    "sit",
    "amet",
    "consectetur",
    "adipiscing",
    "elit",
    "sed",
    "do",
    "eiusmod",
    "tempor",
    "incididunt",
    "ut",
    "labore",
    "et",
    "dolore",
    "magna",
    "aliqua",
    "enim",
    "ad",
    "minim",
    "veniam",
    "quis",
    "nostrud",
    "exercitation",
    "ullamco",
    "laboris",
    "nisi",
    "aliquip",
    "ex",
    "ea",
    "commodo",
    "consequat",
    "duis",
    "aute",
    "irure",
    "in",
    "reprehenderit",
    "voluptate",
    "velit",
    "esse",
    "cillum",
    "fugiat",
    "nulla",
    "pariatur",
  ];

  const result: string[] = [];

  for (let i = 0; i < wordCount; i++) {
    result.push(words[i % words.length]);
  }

  return result.join(" ");
};
