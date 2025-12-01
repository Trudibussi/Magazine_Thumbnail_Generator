/**
 * Firecrawl API module
 * Fetches content from URLs using the Firecrawl API
 */

const FIRECRAWL_API_URL = 'https://api.firecrawl.dev/v1/scrape'

/**
 * Fetch content from a URL using Firecrawl API
 * @param {string} url - The URL to fetch content from
 * @param {string} apiKey - Firecrawl API key
 * @returns {Promise<string>} - The extracted markdown content
 */
export async function fetchUrlContent(url, apiKey) {
  const response = await fetch(FIRECRAWL_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      url: url,
      formats: ['markdown'],
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`)
  }

  const data = await response.json()

  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch URL content')
  }

  // Return markdown content
  return data.data?.markdown || data.data?.content || ''
}
