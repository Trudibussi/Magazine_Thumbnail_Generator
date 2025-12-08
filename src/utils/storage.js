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

/**
 * Preset management for modification combinations
 */

const PRESET_STORAGE_KEY = 'magazine_thumbnail_generator_presets'

/**
 * Save a new preset
 * @param {string} name - Preset name
 * @param {Array<string>} modifications - Array of modification types
 * @returns {boolean} - Success status
 */
export function savePreset(name, modifications) {
  try {
    const presets = loadPresets()
    const newPreset = {
      id: Date.now().toString(),
      name: name,
      modifications: modifications,
      createdAt: new Date().toISOString()
    }
    presets.push(newPreset)
    localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(presets))
    return true
  } catch (error) {
    console.error('Failed to save preset:', error)
    return false
  }
}

/**
 * Load all presets from localStorage
 * @returns {Array} - Array of preset objects
 */
export function loadPresets() {
  try {
    const stored = localStorage.getItem(PRESET_STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error('Failed to load presets:', error)
  }
  return []
}

/**
 * Delete a preset by ID
 * @param {string} id - Preset ID
 * @returns {boolean} - Success status
 */
export function deletePreset(id) {
  try {
    const presets = loadPresets()
    const filtered = presets.filter(preset => preset.id !== id)
    localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(filtered))
    return true
  } catch (error) {
    console.error('Failed to delete preset:', error)
    return false
  }
}

/**
 * Get a preset by ID
 * @param {string} id - Preset ID
 * @returns {Object|null} - Preset object or null
 */
export function getPreset(id) {
  try {
    const presets = loadPresets()
    return presets.find(preset => preset.id === id) || null
  } catch (error) {
    console.error('Failed to get preset:', error)
    return null
  }
}
