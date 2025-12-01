/**
 * Local storage utilities for API keys
 * Keys are stored only in the browser's localStorage
 */

const STORAGE_KEY = 'magazine_thumbnail_generator_keys'

/**
 * Save API keys to localStorage
 * @param {Object} keys - Object containing API keys
 * @param {string} keys.firecrawl - Firecrawl API key
 * @param {string} keys.gemini - Gemini API key
 */
export function saveApiKeys(keys) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(keys))
  } catch (error) {
    console.error('Failed to save API keys:', error)
  }
}

/**
 * Load API keys from localStorage
 * @returns {Object} - Object containing API keys
 */
export function loadApiKeys() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error('Failed to load API keys:', error)
  }
  return {}
}

/**
 * Clear API keys from localStorage
 */
export function clearApiKeys() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('Failed to clear API keys:', error)
  }
}
