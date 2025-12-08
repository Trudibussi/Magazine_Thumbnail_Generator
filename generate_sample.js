require(\'dotenv\').config();
const { generateYamlPlan, generateImages, fetchUrlContent } = require(\'./dist/assets/index-bfaQ5hgw.js\');
const fs = require(\'fs\');

async function main() {
  const geminiKey = process.env.GEMINI_API_KEY;
  const firecrawlKey = process.env.FIRECRAWL_API_KEY;
  const url = \'https://www.nikkansports.com/entertainment/news/202405230000334253.html\';

  console.log(\'Generating YAML plan...\');
  const content = await fetchUrlContent(url, firecrawlKey);
  const yamlPlan = await generateYamlPlan(content, geminiKey);

  console.log(\'Generating image...\');
  const images = await generateImages(yamlPlan, \'16:9\', 1, geminiKey, () => {});

  const imageData = images[0].replace(/^data:image\/png;base64,/, \'\');
  fs.writeFileSync(\'sample_image.png\', imageData, \'base64\');
  console.log(\'Sample image saved as sample_image.png\');
}

main().catch(console.error);
EOF
