import './style.css'
import { fetchUrlContent } from './api/firecrawl.js'
import { generateYamlPlan, generateImages, adjustYamlPlan, convertToVerticalYaml } from './api/gemini.js'
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
  clearGalleryBtn: document.getElementById('clear-gallery-btn'),
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

  // Clear gallery button
  elements.clearGalleryBtn.addEventListener('click', handleClearGallery)
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

let persistentNotification = null

function showNotification(message, persistent = false) {
  // If there's a persistent notification, update it
  if (persistent && persistentNotification) {
    persistentNotification.textContent = message
    return persistentNotification
  }
  
  // Remove existing persistent notification if creating a new one
  if (persistent && persistentNotification) {
    persistentNotification.remove()
  }
  
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

  if (persistent) {
    persistentNotification = notification
    return notification
  }

  setTimeout(() => {
    notification.style.animation = 'fadeOut 0.3s ease forwards'
    setTimeout(() => notification.remove(), 300)
  }, 2000)
}

function hideNotification() {
  if (persistentNotification) {
    persistentNotification.style.animation = 'fadeOut 0.3s ease forwards'
    setTimeout(() => {
      if (persistentNotification) {
        persistentNotification.remove()
        persistentNotification = null
      }
    }, 300)
  }
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

    showNotification('URLからコンテンツを取得中...')
    try {
      content = await fetchUrlContent(url, firecrawlKey)
      showNotification('URLからコンテンツを取得しました')
    } catch (error) {
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
  showNotification('YAMLプランを生成中...')
  try {
    const yamlPlan = await generateYamlPlan(content, geminiKey)
    elements.yamlEditor.value = yamlPlan
    elements.yamlSection.classList.remove('hidden')
    updateYamlLineNumbers()
    showNotification('YAMLプランを生成しました')
  } catch (error) {
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

async function handleVerticalVersion() {
  const yamlContent = elements.yamlEditor.value.trim()
  
  if (!yamlContent) {
    showNotification('先にYAMLプランを生成してください')
    return
  }
  
  const geminiKey = elements.geminiKey.value
  if (!geminiKey) {
    showNotification('Gemini APIキーを設定してください')
    return
  }
  
  showNotification('📱 縦書き版YAMLを生成中...', true)
  
  try {
    const verticalYaml = await convertToVerticalYaml(yamlContent, geminiKey)
    elements.yamlEditor.value = verticalYaml
    hideNotification()
    showNotification('縦書き版YAMLを生成しました！「再生成」をクリックして画像を生成してください')
  } catch (error) {
    hideNotification()
    showNotification(`縦書き変換失敗: ${error.message}`)
  }
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
  showNotification(`${modName}に調整中...`)

  try {
    const adjustedYaml = await adjustYamlPlan(currentYaml, modificationType, geminiKey)
    elements.yamlEditor.value = adjustedYaml
    updateYamlLineNumbers()
    showNotification(`${modName}に調整しました！ 「再生成」で画像を更新してください`)
  } catch (error) {
    showNotification(`調整失敗: ${error.message}`)
  }

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

  showNotification(`画像を生成中... (0/${count})`, true)
  elements.gallerySection.classList.remove('hidden')
  // Don't clear gallery - keep previous generations for comparison

  try {
    const images = await generateImages(yamlContent, aspectRatio, count, geminiKey, (current) => {
      showNotification(`画像を生成中... (${current}/${count})`, true)
    })

    hideNotification()
    displayImages(images)
    showNotification(`${count}枚の画像を生成しました！`)
    // Count is updated by displayImages -> updateGalleryCount
  } catch (error) {
    hideNotification()
    showNotification(`画像生成失敗: ${error.message}`)
  }
}

let generationCounter = 0

function displayImages(images) {
  // Don't clear gallery - append new images instead
  generationCounter++
  
  // Create a group container for this generation
  const groupDiv = document.createElement('div')
  groupDiv.className = 'gallery-group'
  groupDiv.dataset.generation = generationCounter
  
  // Add group header
  const groupHeader = document.createElement('div')
  groupHeader.className = 'gallery-group-header'
  groupHeader.innerHTML = `
    <span class="gallery-group-label">生成 #${generationCounter}</span>
    <span class="gallery-group-count">${images.length}枚</span>
  `
  groupDiv.appendChild(groupHeader)
  
  // Create grid for this group
  const groupGrid = document.createElement('div')
  groupGrid.className = 'gallery-grid-inner'

  images.forEach((imageData, index) => {
    const div = document.createElement('div')
    div.className = 'gallery-item'

    const img = document.createElement('img')
    img.src = imageData
    img.alt = `Generation ${generationCounter} - Image ${index + 1}`
    img.loading = 'lazy'

    const overlay = document.createElement('div')
    overlay.className = 'gallery-item-overlay'

    const downloadBtn = document.createElement('button')
    downloadBtn.className = 'gallery-download-btn'
    downloadBtn.textContent = 'ダウンロード'
    downloadBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      downloadImage(imageData, `gen${generationCounter}-img${index + 1}.png`)
    })

    const verticalBtn = document.createElement('button')
    verticalBtn.className = 'gallery-vertical-btn'
    verticalBtn.textContent = '📱 縦バージョンを作る'
    verticalBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      handleVerticalVersion()
    })

    overlay.appendChild(downloadBtn)
    overlay.appendChild(verticalBtn)
    div.appendChild(img)
    div.appendChild(overlay)
    groupGrid.appendChild(div)
  })
  
  groupDiv.appendChild(groupGrid)
  elements.gallery.appendChild(groupDiv)
  
  // Update total count
  updateGalleryCount()
}

function updateGalleryCount() {
  const totalImages = elements.gallery.querySelectorAll('.gallery-item').length
  elements.resultCount.textContent = `合計 ${totalImages}枚 (生成 ${generationCounter}回)`
}

function handleClearGallery() {
  if (elements.gallery.children.length === 0) {
    return
  }
  
  if (confirm('すべての画像をクリアしますか？')) {
    elements.gallery.innerHTML = ''
    generationCounter = 0
    elements.resultCount.textContent = ''
    showNotification('ギャラリーをクリアしました')
  }
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
