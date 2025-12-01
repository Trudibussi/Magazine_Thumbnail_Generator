import './style.css'
import { fetchUrlContent } from './api/firecrawl.js'
import { generateYamlPlan, generateImages } from './api/gemini.js'
import { saveApiKeys, loadApiKeys } from './utils/storage.js'
import * as yaml from 'js-yaml'

// DOM Elements
const elements = {
  // API Keys
  firecrawlKey: document.getElementById('firecrawl-key'),
  geminiKey: document.getElementById('gemini-key'),
  saveKeysBtn: document.getElementById('save-keys'),
  toggleApiKeys: document.getElementById('toggle-api-keys'),
  apiKeysForm: document.getElementById('api-keys-form'),

  // Input tabs
  inputTabs: document.querySelectorAll('.input-tab'),
  urlInput: document.getElementById('url-input'),
  fileInput: document.getElementById('file-input'),
  textInput: document.getElementById('text-input'),

  // Input fields
  urlField: document.getElementById('url-field'),
  fileField: document.getElementById('file-field'),
  fileName: document.getElementById('file-name'),
  textField: document.getElementById('text-field'),

  // Options
  aspectRatio: document.getElementById('aspect-ratio'),
  generationCount: document.getElementById('generation-count'),
  countValue: document.getElementById('count-value'),

  // Actions
  generateBtn: document.getElementById('generate-btn'),
  regenerateBtn: document.getElementById('regenerate-btn'),

  // YAML
  yamlSection: document.getElementById('yaml-section'),
  yamlEditor: document.getElementById('yaml-editor'),

  // Loading
  loading: document.getElementById('loading'),
  loadingText: document.getElementById('loading-text'),

  // Gallery
  gallerySection: document.getElementById('gallery-section'),
  gallery: document.getElementById('gallery'),
}

// State
let currentTab = 'url'
let fileContent = null

// Initialize
function init() {
  loadSavedKeys()
  setupEventListeners()
}

function loadSavedKeys() {
  const keys = loadApiKeys()
  if (keys.firecrawl) elements.firecrawlKey.value = keys.firecrawl
  if (keys.gemini) elements.geminiKey.value = keys.gemini
}

function setupEventListeners() {
  // API Keys
  elements.saveKeysBtn.addEventListener('click', handleSaveKeys)
  elements.toggleApiKeys.addEventListener('click', toggleApiKeysVisibility)

  // Input tabs
  elements.inputTabs.forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab))
  })

  // File input
  elements.fileField.addEventListener('change', handleFileSelect)

  // Generation count slider
  elements.generationCount.addEventListener('input', (e) => {
    elements.countValue.textContent = e.target.value
  })

  // Generate button
  elements.generateBtn.addEventListener('click', handleGenerate)
  elements.regenerateBtn.addEventListener('click', handleRegenerate)
}

function handleSaveKeys() {
  saveApiKeys({
    firecrawl: elements.firecrawlKey.value,
    gemini: elements.geminiKey.value,
  })
  alert('APIキーを保存しました')
}

function toggleApiKeysVisibility() {
  const form = elements.apiKeysForm
  form.classList.toggle('hidden')
}

function switchTab(tab) {
  currentTab = tab

  // Update tab styles
  elements.inputTabs.forEach(t => {
    t.classList.toggle('active', t.dataset.tab === tab)
    t.classList.toggle('text-gray-500', t.dataset.tab !== tab)
    t.classList.toggle('text-blue-600', t.dataset.tab === tab)
    t.classList.toggle('border-blue-500', t.dataset.tab === tab)
    t.classList.toggle('border-transparent', t.dataset.tab !== tab)
  })

  // Show/hide content
  elements.urlInput.classList.toggle('hidden', tab !== 'url')
  elements.fileInput.classList.toggle('hidden', tab !== 'file')
  elements.textInput.classList.toggle('hidden', tab !== 'text')
}

function handleFileSelect(e) {
  const file = e.target.files[0]
  if (file) {
    elements.fileName.textContent = file.name
    const reader = new FileReader()
    reader.onload = (event) => {
      fileContent = event.target.result
    }
    reader.readAsText(file)
  }
}

async function handleGenerate() {
  const geminiKey = elements.geminiKey.value
  if (!geminiKey) {
    alert('Gemini APIキーを入力してください')
    return
  }

  let content = ''

  // Get content based on current tab
  if (currentTab === 'url') {
    const url = elements.urlField.value
    if (!url) {
      alert('URLを入力してください')
      return
    }
    const firecrawlKey = elements.firecrawlKey.value
    if (!firecrawlKey) {
      alert('Firecrawl APIキーを入力してください')
      return
    }

    showLoading('URLからコンテンツを取得中...')
    try {
      content = await fetchUrlContent(url, firecrawlKey)
    } catch (error) {
      hideLoading()
      alert(`URLの取得に失敗しました: ${error.message}`)
      return
    }
  } else if (currentTab === 'file') {
    if (!fileContent) {
      alert('ファイルを選択してください')
      return
    }
    content = fileContent
  } else if (currentTab === 'text') {
    content = elements.textField.value
    if (!content) {
      alert('テキストを入力してください')
      return
    }
  }

  // Generate YAML plan
  showLoading('YAMLプランを生成中...')
  try {
    const yamlPlan = await generateYamlPlan(content, geminiKey)
    elements.yamlEditor.value = yamlPlan
    elements.yamlSection.classList.remove('hidden')
  } catch (error) {
    hideLoading()
    alert(`YAMLプランの生成に失敗しました: ${error.message}`)
    return
  }

  // Generate images
  await generateImagesFromYaml()
}

async function handleRegenerate() {
  const geminiKey = elements.geminiKey.value
  if (!geminiKey) {
    alert('Gemini APIキーを入力してください')
    return
  }

  await generateImagesFromYaml()
}

async function generateImagesFromYaml() {
  const geminiKey = elements.geminiKey.value
  const yamlContent = elements.yamlEditor.value
  const aspectRatio = elements.aspectRatio.value
  const count = parseInt(elements.generationCount.value)

  // Validate YAML
  try {
    yaml.load(yamlContent)
  } catch (error) {
    alert(`YAMLの形式が正しくありません: ${error.message}`)
    return
  }

  showLoading(`画像を生成中... (0/${count})`)
  elements.gallerySection.classList.remove('hidden')
  elements.gallery.innerHTML = ''

  try {
    const images = await generateImages(yamlContent, aspectRatio, count, geminiKey, (current) => {
      elements.loadingText.textContent = `画像を生成中... (${current}/${count})`
    })

    displayImages(images)
  } catch (error) {
    alert(`画像の生成に失敗しました: ${error.message}`)
  }

  hideLoading()
}

function displayImages(images) {
  elements.gallery.innerHTML = ''

  images.forEach((imageData, index) => {
    const div = document.createElement('div')
    div.className = 'gallery-item relative rounded-lg overflow-hidden shadow-md'

    const img = document.createElement('img')
    img.src = imageData
    img.alt = `Generated thumbnail ${index + 1}`
    img.className = 'w-full h-auto'

    const overlay = document.createElement('div')
    overlay.className = 'absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all flex items-center justify-center opacity-0 hover:opacity-100'

    const downloadBtn = document.createElement('button')
    downloadBtn.className = 'bg-white text-gray-800 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition'
    downloadBtn.textContent = 'ダウンロード'
    downloadBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      downloadImage(imageData, `thumbnail-${index + 1}.png`)
    })

    overlay.appendChild(downloadBtn)
    div.appendChild(img)
    div.appendChild(overlay)
    elements.gallery.appendChild(div)
  })
}

function downloadImage(dataUrl, filename) {
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

function showLoading(text) {
  elements.loading.classList.remove('hidden')
  elements.loadingText.textContent = text
  elements.generateBtn.disabled = true
  elements.regenerateBtn.disabled = true
}

function hideLoading() {
  elements.loading.classList.add('hidden')
  elements.generateBtn.disabled = false
  elements.regenerateBtn.disabled = false
}

// Start the app
init()
