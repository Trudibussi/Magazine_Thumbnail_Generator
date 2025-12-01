/**
 * Gemini API module
 * Handles YAML plan generation and image generation
 */

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models'

// System prompt for YAML generation (based on the provided Gem prompt)
const YAML_SYSTEM_PROMPT = `あなたは「ニュース要約図解デザイナー」です。
複雑なニュースやテキストを、YouTubeサムネイルやSNSで一目で伝わる「高可読性インフォグラフィック」に変換します。
週刊誌の中吊り広告、またはニュースバラエティ番組のフリップ風のデザインを目指します。

## ルール

### 1. コンテンツ分析
- 入力された情報を分析し、最も重要な「4〜6つのポイント」を抽出する
- 全体を統括する「メインタイトル（上部）」と「結論/煽り（下部）」を決定する

### 2. テキストフォーマット
- 【重要】句読点（。、）は絶対に使用しない。改行やスペースでリズムを作る
- 文末は体言止め（名詞終わり）を基本とし、短く言い切る
- 強調したいキーワード（数字、ネガティブワード、強い名詞）を選定する

### 3. ビジュアルレイアウト構造
- Background: 薄いクリーム色や紙のテクスチャ（情報の視認性を妨げないもの）
- Header (Top): 黒背景に金色または黄色の極太文字
- Body (Middle): 「2行×2〜3列」のグリッド配置。各カードは異なる背景色（黒、黄、赤、白など）
- Footer (Bottom): 結論や煽り文句
- 各カードには【タグ】と本文を配置

### 4. タイポグラフィ
- Font: 極太のゴシック体（Sans-serif bold）
- Color: 基本は黒文字または白文字（背景による）。強調キーワードのみ「赤」を使用

## 出力形式
以下のYAML形式で出力してください：

\`\`\`yaml
layout:
  background: "cream_paper_texture"

header:
  main_title: "【大特集】メインタイトルをここに"
  sub_title: "サブタイトルや補足情報"
  style:
    bg_color: "black"
    text_color: "gold"

cards:
  - position: 1
    tag: "タグ名"
    lines:
      - text: "1行目のテキスト"
        highlight: false
      - text: "強調テキスト"
        highlight: true
    bg_color: "black"
    text_color: "white"
  - position: 2
    tag: "タグ名"
    lines:
      - text: "テキスト"
        highlight: false
    bg_color: "yellow"
    text_color: "black"
  # ... 4〜6枚のカード

footer:
  text: "結論や煽り文句をここに"
  highlight_words: ["強調したい単語"]
  style:
    bg_color: "white"
    text_color: "black"
\`\`\`

入力されたテキストを分析し、上記のYAML形式で週刊誌風サムネイルのプランを出力してください。`

/**
 * Generate YAML plan from content using Gemini 3 Pro
 * @param {string} content - The content to analyze
 * @param {string} apiKey - Gemini API key
 * @returns {Promise<string>} - The generated YAML plan
 */
export async function generateYamlPlan(content, apiKey) {
  const response = await fetch(
    `${GEMINI_API_URL}/gemini-3-pro-preview:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              { text: YAML_SYSTEM_PROMPT },
              { text: `\n\n以下のコンテンツを分析して、週刊誌風サムネイルのYAMLプランを生成してください：\n\n${content}` }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096,
        }
      }),
    }
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error?.message || `HTTP ${response.status}: ${response.statusText}`)
  }

  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

  // Extract YAML from markdown code block if present
  const yamlMatch = text.match(/```yaml\n([\s\S]*?)```/)
  if (yamlMatch) {
    return yamlMatch[1].trim()
  }

  // Try to extract YAML without code block markers
  const yamlStart = text.indexOf('layout:')
  if (yamlStart !== -1) {
    return text.slice(yamlStart).trim()
  }

  return text.trim()
}

/**
 * Adjust YAML plan with various modifications using Gemini 3 Pro
 * @param {string} yamlContent - The current YAML plan
 * @param {string} modificationType - Type of modification (color, font, text, etc.)
 * @param {string} apiKey - Gemini API key
 * @returns {Promise<string>} - The adjusted YAML plan
 */
export async function adjustYamlPlan(yamlContent, modificationType, apiKey) {
  const modificationPrompts = {
    'blue': 'カラースキームを青系に変更してください。黒、青、深いネイビー、白、ライトブルーを使用。強調色は明るい青。',
    'green': 'カラースキームをライトグリーン系に変更してください。黒、ライムグリーン、深い緑、白、明るい黄緑を使用。強調色は鮮やかな緑。',
    'yellow': 'カラースキームを黄色系に変更してください。黒、黄色、オレンジ、白、ゴールドを使用。強調色は濃いオレンジ。',
    'purple': 'カラースキームを紫系に変更してください。黒、紫、深いパープル、白、ラベンダーを使用。強調色は鮮やかなピンク。',
    'red': 'カラースキームを赤系に変更してください。黒、赤、深いワインレッド、白、黄色を使用。強調色は鮮烈な赤。',
    'monochrome': 'カラースキームをモノクロ系に変更してください。黒、白、グレーのみを使用。強調色は濃いグレー。',
    'font_bold': 'フォントスタイルを「超極太ゴシック体」に変更してください。インパクトを最大化。',
    'font_modern': 'フォントスタイルを「モダンなサンセリフ体」に変更してください。洗練された印象に。',
    'font_handwritten': 'フォントスタイルを「手書き風」に変更してください。親しみやすい印象に。',
    'text_shorter': 'テキストをより短く、パンチのある表現に変更してください。各カードのテキストを1行にまとめる。',
    'text_dramatic': 'テキストをよりドラマチックで煙り立てる表現に変更してください。週刊誌の中吊り広告らしく。',
    'text_formal': 'テキストをよりフォーマルで落ち着いた表現に変更してください。ビジネス向けの印象に。',
    'layout_compact': 'レイアウトをよりコンパクトにして、カード数を増やしてください（最大6枚）。',
    'layout_simple': 'レイアウトをよりシンプルにして、カード数を減らしてください（3枚程度）。',
    'random': 'ランダムに創意的な変更を加えてください。カラー、フォント、テキスト、レイアウトのいずれかを変更。'
  }

  const modificationInstruction = modificationPrompts[modificationType] || modificationPrompts['random']

  const systemPrompt = `あなたはYAMLプランの調整エキスパートです。
与えられたYAMLプランに対して、指定された修正を加えてください。

## 重要なルール
- YAMLの構造を維持すること
- 必ず全体のYAMLを出力すること（一部だけではない）
- マークダウンのコードブロックで囲むこと（\`\`\`yaml ... \`\`\`）
- 句読点は使用しないこと
- カラー名は英語で指定すること（black, white, red, yellow, blue, green, purple, orange, gold, grayなど）

以下の修正指示に従って、YAMLを調整してください。`

  const response = await fetch(
    `${GEMINI_API_URL}/gemini-3-pro-preview:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              { text: systemPrompt },
              { text: `\n\n## 修正指示\n${modificationInstruction}` },
              { text: `\n\n## 現在のYAML\n\`\`\`yaml\n${yamlContent}\n\`\`\`` }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.9,
          maxOutputTokens: 4096,
        }
      }),
    }
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error?.message || `HTTP ${response.status}: ${response.statusText}`)
  }

  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

  // Extract YAML from markdown code block
  const yamlMatch = text.match(/```yaml\n([\s\S]*?)```/)
  if (yamlMatch) {
    return yamlMatch[1].trim()
  }

  // Try to extract YAML without code block markers
  const yamlStart = text.indexOf('layout:')
  if (yamlStart !== -1) {
    return text.slice(yamlStart).trim()
  }

  return text.trim()
}

/**
 * Build image generation prompt from YAML plan
 * @param {string} yamlContent - The YAML plan
 * @returns {string} - The image generation prompt
 */
function buildImagePrompt(yamlContent) {
  return `あなたは週刊誌の中吊り広告デザイナーです。以下のYAML仕様に基づいて、日本の週刊誌の中吊り広告風のインフォグラフィック画像を生成してください。

## 重要な指示
- 日本語テキストを正確に配置すること
- 極太ゴシック体（Sans-serif bold）を使用
- 句読点は使用しない
- 強調キーワードは赤色で表示
- 背景は薄いクリーム色の紙テクスチャ
- 上部は黒背景に金/黄色文字のヘッダー
- 中央は2行×2〜3列のカードグリッド配置
- 各カードは指定された背景色で塗りつぶし
- プロフェッショナルなグラフィックデザイン品質

## セーフティエリア設定（重要）
- この画像は16:9で生成されますが、X（Twitter）やnoteのOGP画像（1:1.91）でトリミングされる可能性があります
- **上下に各10%のセーフティマージン（背景のみのエリア）を確保してください**
- 重要なテキストやカードは画像の中央80%のエリア内に配置すること
- 上下のマージンエリアには背景テクスチャのみを配置し、文字やカードを配置しないこと
- これにより、1:1.91にトリミングされても全ての情報が視認可能になります

## YAML仕様
${yamlContent}

この仕様に従って、高品質な週刊誌風サムネイル画像を生成してください。テキストは全て日本語で、読みやすく配置してください。`
}

/**
 * Generate images using Gemini 3 Pro Image Preview
 * @param {string} yamlContent - The YAML plan
 * @param {string} aspectRatio - The aspect ratio (e.g., "16:9")
 * @param {number} count - Number of images to generate
 * @param {string} apiKey - Gemini API key
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<string[]>} - Array of base64 image data URLs
 */
export async function generateImages(yamlContent, aspectRatio, count, apiKey, onProgress) {
  const images = []
  const prompt = buildImagePrompt(yamlContent)

  // Generate images sequentially (API may have rate limits)
  for (let i = 0; i < count; i++) {
    onProgress?.(i + 1)

    try {
      const imageData = await generateSingleImage(prompt, aspectRatio, apiKey, i)
      if (imageData) {
        images.push(imageData)
      }
    } catch (error) {
      console.error(`Failed to generate image ${i + 1}:`, error)
      // Continue generating other images even if one fails
    }

    // Small delay between requests to avoid rate limiting
    if (i < count - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  if (images.length === 0) {
    throw new Error('No images were generated successfully')
  }

  return images
}

/**
 * Generate a single image using Gemini 3 Pro Image Preview
 * Based on official Google example: https://ai.google.dev/gemini-api/docs/image-generation
 * @param {string} prompt - The image generation prompt
 * @param {string} aspectRatio - The aspect ratio
 * @param {string} apiKey - Gemini API key
 * @param {number} seed - Seed for variation
 * @returns {Promise<string>} - Base64 image data URL
 */
async function generateSingleImage(prompt, aspectRatio, apiKey, seed) {
  // Add variation to the prompt
  const variedPrompt = `${prompt}\n\n[バリエーション ${seed + 1}: 色使いやレイアウトの微調整を加えてください]`

  console.log(`Generating image ${seed + 1} with aspect ratio: ${aspectRatio}`)

  // Build request body following official JavaScript SDK structure
  // Based on: chat.sendMessage({message})
  const requestBody = {
    contents: [
      {
        parts: [{ text: variedPrompt }]
      }
    ],
    generationConfig: {
      responseModalities: ['TEXT', 'IMAGE']
    }
  }

  // Add image config with aspect ratio only
  // Note: resolution parameter is not supported in REST API
  if (aspectRatio) {
    requestBody.generationConfig.imageConfig = {
      aspectRatio: aspectRatio
    }
  }

  console.log('Request body:', JSON.stringify(requestBody, null, 2))

  const response = await fetch(
    `${GEMINI_API_URL}/gemini-3-pro-image-preview:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    }
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    console.error('API Error:', error)
    throw new Error(error.error?.message || `HTTP ${response.status}: ${response.statusText}`)
  }

  const data = await response.json()
  console.log('API Response structure:', JSON.stringify(data, null, 2).substring(0, 500))

  // Extract image from response - following official SDK pattern
  // for part in response.parts:
  //     if part.inline_data is not None:
  //         image = part.as_image()
  const candidates = data.candidates || []
  for (const candidate of candidates) {
    const parts = candidate.content?.parts || []
    for (const part of parts) {
      // Check for inline_data (matches Python SDK's part.inline_data)
      if (part.inlineData) {
        const mimeType = part.inlineData.mimeType || 'image/png'
        const base64Data = part.inlineData.data
        console.log(`Found image data, mime type: ${mimeType}, size: ${base64Data.length} bytes`)
        return `data:${mimeType};base64,${base64Data}`
      }
      // Also check for fileData as fallback
      if (part.fileData) {
        console.log('Found file data:', part.fileData)
        // File data would need to be downloaded separately
      }
    }
  }

  // Log full response for debugging if no image found
  console.error('No image found in response. Full response:', JSON.stringify(data, null, 2))
  throw new Error('No image data in response')
}
