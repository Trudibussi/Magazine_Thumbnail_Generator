import './style.css'
import { fetchUrlContent } from './api/firecrawl.js'
import { generateYamlPlan, generateImages, adjustYamlPlan } from './api/gemini.js'
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
  tabs: document.querySelectorAll('.tab'),
  urlInput: document.getElementById('url-input'),
  fileInput: document.getElementById('file-input'),
  textInput: document.getElementById('text-input'),

  // Input fields
  urlField: document.getElementById('url-field'),
  fileField: document.getElementById('file-field'),
  fileDropZone: document.getElementById('file-drop-zone'),
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
  yamlLineNumbers: document.getElementById('yaml-line-numbers'),
  modButtons: document.querySelectorAll('.btn-mod'),

  // Loading
  loading: document.getElementById('loading'),
  loadingText: document.getElementById('loading-text'),

  // Gallery
  gallerySection: document.getElementById('gallery-section'),
  gallery: document.getElementById('gallery'),
  resultCount: document.getElementById('result-count'),
}

// State
let currentTab = 'url'
let fileContent = null

// Initialize
function init() {
  loadSavedKeys()
  setupEventListeners()
  updateYamlLineNumbers()
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
  elements.tabs.forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab))
  })

  // File input with drag and drop
  elements.fileField.addEventListener('change', handleFileSelect)
  setupDragAndDrop()

  // Generation count slider
  elements.generationCount.addEventListener('input', (e) => {
    elements.countValue.textContent = e.target.value
  })

  // Generate button
  elements.generateBtn.addEventListener('click', handleGenerate)
  elements.regenerateBtn.addEventListener('click', handleRegenerate)

  // YAML editor line numbers
  elements.yamlEditor.addEventListener('input', updateYamlLineNumbers)
  elements.yamlEditor.addEventListener('scroll', syncYamlScroll)

  // Modification gacha buttons
  elements.modButtons.forEach(btn => {
    btn.addEventListener('click', () => handleModification(btn.dataset.mod))
  })
}

function setupDragAndDrop() {
  const dropZone = elements.fileDropZone

  ;['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault()
      e.stopPropagation()
    })
  })

  ;['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => {
      dropZone.classList.add('dragover')
    })
  })

  ;['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => {
      dropZone.classList.remove('dragover')
    })
  })

  dropZone.addEventListener('drop', (e) => {
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileLoad(files[0])
    }
  })
}

function handleSaveKeys() {
  saveApiKeys({
    firecrawl: elements.firecrawlKey.value,
    gemini: elements.geminiKey.value,
  })
  showNotification('APIキーを保存しました')
}

function showNotification(message) {
  // Simple notification - could be enhanced with a toast component
  const notification = document.createElement('div')
  notification.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    background: #0a0a0a;
    color: #ffd700;
    padding: 12px 24px;
    font-weight: 700;
    border: 2px solid #0a0a0a;
    box-shadow: 4px 4px 0 #0a0a0a;
    z-index: 1000;
    animation: slideIn 0.3s ease;
  `
  notification.textContent = message
  document.body.appendChild(notification)

  setTimeout(() => {
    notification.style.animation = 'fadeOut 0.3s ease forwards'
    setTimeout(() => notification.remove(), 300)
  }, 2000)
}

function toggleApiKeysVisibility() {
  const form = elements.apiKeysForm
  const btn = elements.toggleApiKeys
  const isHidden = form.classList.toggle('hidden')
  btn.setAttribute('aria-expanded', !isHidden)
}

function switchTab(tab) {
  currentTab = tab

  // Update tab styles
  elements.tabs.forEach(t => {
    const isActive = t.dataset.tab === tab
    t.classList.toggle('active', isActive)
    t.setAttribute('aria-selected', isActive)
  })

  // Show/hide content
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active')
  })
  document.getElementById(`${tab}-input`).classList.add('active')
}

function handleFileSelect(e) {
  const file = e.target.files[0]
  if (file) {
    handleFileLoad(file)
  }
}

function handleFileLoad(file) {
  // Validate file type
  if (!file.name.match(/\.(txt|md)$/i)) {
    showNotification('対応形式: .txt, .md')
    return
  }

  elements.fileName.textContent = `選択: ${file.name}`
  const reader = new FileReader()
  reader.onload = (event) => {
    fileContent = event.target.result
  }
  reader.readAsText(file)
}

function updateYamlLineNumbers() {
  const lines = elements.yamlEditor.value.split('\n').length
  const lineNumbers = Array.from({ length: lines }, (_, i) => i + 1).join('\n')
  elements.yamlLineNumbers.textContent = lineNumbers
}

function syncYamlScroll() {
  elements.yamlLineNumbers.scrollTop = elements.yamlEditor.scrollTop
}

async function handleGenerate() {
  const geminiKey = elements.geminiKey.value
  if (!geminiKey) {
    showNotification('Gemini APIキーを入力してください')
    return
  }

  let content = ''

  // Get content based on current tab
  if (currentTab === 'url') {
    const url = elements.urlField.value
    if (!url) {
      showNotification('URLを入力してください')
      return
    }
    const firecrawlKey = elements.firecrawlKey.value
    if (!firecrawlKey) {
      showNotification('Firecrawl APIキーを入力してください')
      return
    }

    showLoading('URLからコンテンツを取得中...')
    try {
      content = await fetchUrlContent(url, firecrawlKey)
    } catch (error) {
      hideLoading()
      showNotification(`取得失敗: ${error.message}`)
      return
    }
  } else if (currentTab === 'file') {
    if (!fileContent) {
      showNotification('ファイルを選択してください')
      return
    }
    content = fileContent
  } else if (currentTab === 'text') {
    content = elements.textField.value
    if (!content) {
      showNotification('テキストを入力してください')
      return
    }
  }

  // Generate YAML plan
  showLoading('YAMLプランを生成中...')
  try {
    const yamlPlan = await generateYamlPlan(content, geminiKey)
    elements.yamlEditor.value = yamlPlan
    elements.yamlSection.classList.remove('hidden')
    updateYamlLineNumbers()
  } catch (error) {
    hideLoading()
    showNotification(`YAML生成失敗: ${error.message}`)
    return
  }

  // Generate images
  await generateImagesFromYaml()
}

async function handleRegenerate() {
  const geminiKey = elements.geminiKey.value
  if (!geminiKey) {
    showNotification('Gemini APIキーを入力してください')
    return
  }

  await generateImagesFromYaml()
}

async function handleModification(modificationType) {
  const geminiKey = elements.geminiKey.value
  if (!geminiKey) {
    showNotification('Gemini APIキーを入力してください')
    return
  }

  const currentYaml = elements.yamlEditor.value
  if (!currentYaml) {
    showNotification('まずYAMLプランを生成してください')
    return
  }

  // Disable all modification buttons during processing
  elements.modButtons.forEach(btn => btn.disabled = true)

  const modificationNames = {
    'blue': '🔵 青系',
    'green': '🟢 緑系',
    'yellow': '🟡 黄色系',
    'purple': '🟣 紫系',
    'red': '🔴 赤系',
    'monochrome': '⚫ モノクロ',
    'font_bold': '💪 超極太',
    'font_modern': '✨ モダン',
    'font_handwritten': '✍️ 手書き',
    'text_shorter': '⚡ 短く',
    'text_dramatic': '🔥 ドラマチック',
    'text_formal': '👔 フォーマル',
    'layout_compact': '📦 コンパクト',
    'layout_simple': '🌿 シンプル',
    'random': '🎰 ランダム'
  }

  const modName = modificationNames[modificationType] || modificationType
  showLoading(`${modName}に調整中...`)

  try {
    const adjustedYaml = await adjustYamlPlan(currentYaml, modificationType, geminiKey)
    elements.yamlEditor.value = adjustedYaml
    updateYamlLineNumbers()
    showNotification(`${modName}に調整しました！ 「再生成」で画像を更新してください`)
  } catch (error) {
    showNotification(`調整失敗: ${error.message}`)
  }

  hideLoading()
  // Re-enable all modification buttons
  elements.modButtons.forEach(btn => btn.disabled = false)
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
    showNotification(`YAML形式エラー: ${error.message}`)
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
    elements.resultCount.textContent = `${images.length}枚生成`
  } catch (error) {
    showNotification(`画像生成失敗: ${error.message}`)
  }

  hideLoading()
}

function displayImages(images) {
  elements.gallery.innerHTML = ''

  images.forEach((imageData, index) => {
    const div = document.createElement('div')
    div.className = 'gallery-item'

    const img = document.createElement('img')
    img.src = imageData
    img.alt = `Generated thumbnail ${index + 1}`
    img.loading = 'lazy'

    const overlay = document.createElement('div')
    overlay.className = 'gallery-item-overlay'

    const downloadBtn = document.createElement('button')
    downloadBtn.className = 'gallery-download-btn'
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

// Add animation keyframes dynamically
const style = document.createElement('style')
style.textContent = `
  @keyframes slideIn {
    from { opacity: 0; transform: translateX(20px); }
    to { opacity: 1; transform: translateX(0); }
  }
  @keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
  }
`
document.head.appendChild(style)

// Start the app
init()
