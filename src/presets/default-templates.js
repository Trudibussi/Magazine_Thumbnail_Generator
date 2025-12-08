/**
 * Default YAML templates for magazine-style thumbnails
 */

export const defaultTemplates = [
  {
    id: 'news-breaking',
    name: '📰 ニュース速報風',
    description: '緊急性の高いニュース向け',
    yaml: `aspect_ratio: "16:9"
background:
  type: gradient
  colors:
    - "#FF0000"
    - "#CC0000"
  angle: 135
title:
  text: "速報"
  font:
    family: "Noto Sans JP"
    weight: 900
    size: 120
  color: "#FFFF00"
  stroke:
    color: "#000000"
    width: 8
  position:
    x: 50
    y: 30
  shadow:
    color: "rgba(0,0,0,0.8)"
    blur: 20
    offset_x: 4
    offset_y: 4
main_text:
  text: "{{MAIN_TEXT}}"
  font:
    family: "Noto Sans JP"
    weight: 900
    size: 80
  color: "#FFFFFF"
  stroke:
    color: "#000000"
    width: 6
  position:
    x: 50
    y: 60
  max_width: 90
  line_height: 1.3
sub_text:
  text: "{{SUB_TEXT}}"
  font:
    family: "Noto Sans JP"
    weight: 700
    size: 40
  color: "#FFFF00"
  position:
    x: 50
    y: 85
accent:
  type: rectangle
  color: "#FFFF00"
  position:
    x: 5
    y: 5
  size:
    width: 10
    height: 90`
  },
  {
    id: 'magazine-weekly',
    name: '📕 週刊誌風',
    description: 'スキャンダル・ゴシップ向け',
    yaml: `aspect_ratio: "16:9"
background:
  type: gradient
  colors:
    - "#000000"
    - "#1a1a1a"
  angle: 180
title:
  text: "衝撃"
  font:
    family: "Noto Sans JP"
    weight: 900
    size: 100
  color: "#FF0000"
  stroke:
    color: "#FFFF00"
    width: 6
  position:
    x: 50
    y: 20
  rotation: -5
main_text:
  text: "{{MAIN_TEXT}}"
  font:
    family: "Noto Sans JP"
    weight: 900
    size: 70
  color: "#FFFFFF"
  stroke:
    color: "#FF0000"
    width: 5
  position:
    x: 50
    y: 55
  max_width: 85
  line_height: 1.4
sub_text:
  text: "{{SUB_TEXT}}"
  font:
    family: "Noto Sans JP"
    weight: 700
    size: 35
  color: "#FFFF00"
  position:
    x: 50
    y: 85
accent:
  type: circle
  color: "#FF0000"
  position:
    x: 90
    y: 10
  size:
    radius: 80
  opacity: 0.3`
  },
  {
    id: 'business-formal',
    name: '💼 ビジネス風',
    description: '企業・ビジネスニュース向け',
    yaml: `aspect_ratio: "16:9"
background:
  type: solid
  color: "#FFFFFF"
title:
  text: "NEWS"
  font:
    family: "Noto Sans JP"
    weight: 700
    size: 60
  color: "#003366"
  position:
    x: 50
    y: 15
main_text:
  text: "{{MAIN_TEXT}}"
  font:
    family: "Noto Sans JP"
    weight: 700
    size: 65
  color: "#000000"
  position:
    x: 50
    y: 50
  max_width: 85
  line_height: 1.5
sub_text:
  text: "{{SUB_TEXT}}"
  font:
    family: "Noto Sans JP"
    weight: 400
    size: 35
  color: "#666666"
  position:
    x: 50
    y: 80
accent:
  type: rectangle
  color: "#003366"
  position:
    x: 0
    y: 0
  size:
    width: 100
    height: 5`
  },
  {
    id: 'sports-dynamic',
    name: '⚽ スポーツ風',
    description: 'スポーツニュース向け',
    yaml: `aspect_ratio: "16:9"
background:
  type: gradient
  colors:
    - "#0066FF"
    - "#00CCFF"
  angle: 45
title:
  text: "速報"
  font:
    family: "Noto Sans JP"
    weight: 900
    size: 90
  color: "#FFFFFF"
  stroke:
    color: "#000000"
    width: 6
  position:
    x: 50
    y: 25
  rotation: -3
main_text:
  text: "{{MAIN_TEXT}}"
  font:
    family: "Noto Sans JP"
    weight: 900
    size: 75
  color: "#FFFF00"
  stroke:
    color: "#000000"
    width: 5
  position:
    x: 50
    y: 60
  max_width: 90
  line_height: 1.3
sub_text:
  text: "{{SUB_TEXT}}"
  font:
    family: "Noto Sans JP"
    weight: 700
    size: 40
  color: "#FFFFFF"
  position:
    x: 50
    y: 85
accent:
  type: rectangle
  color: "#FFFF00"
  position:
    x: 0
    y: 95
  size:
    width: 100
    height: 5`
  },
  {
    id: 'entertainment-pop',
    name: '🎬 エンタメ風',
    description: '芸能・エンタメニュース向け',
    yaml: `aspect_ratio: "16:9"
background:
  type: gradient
  colors:
    - "#FF1493"
    - "#FF69B4"
  angle: 90
title:
  text: "芸能"
  font:
    family: "Noto Sans JP"
    weight: 900
    size: 80
  color: "#FFFFFF"
  stroke:
    color: "#000000"
    width: 5
  position:
    x: 50
    y: 20
main_text:
  text: "{{MAIN_TEXT}}"
  font:
    family: "Noto Sans JP"
    weight: 900
    size: 70
  color: "#FFFF00"
  stroke:
    color: "#000000"
    width: 5
  position:
    x: 50
    y: 55
  max_width: 85
  line_height: 1.4
sub_text:
  text: "{{SUB_TEXT}}"
  font:
    family: "Noto Sans JP"
    weight: 700
    size: 38
  color: "#FFFFFF"
  position:
    x: 50
    y: 85
accent:
  type: circle
  color: "#FFFF00"
  position:
    x: 10
    y: 50
  size:
    radius: 100
  opacity: 0.2`
  }
]
