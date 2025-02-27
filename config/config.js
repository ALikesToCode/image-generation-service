require('dotenv').config();

const config = {
  port: process.env.PORT || 3000,
  togetherApiKey: process.env.TOGETHER_API_KEY,
  falApiKey: process.env.FAL_KEY,
  uploadsDir: 'public/uploads',
  imageGeneration: {
    defaultWidth: 1024,
    defaultHeight: 768,
    defaultSteps: 28,
    maxImages: 4,
    timeout: 30000,
    model: 'black-forest-labs/FLUX.1-dev',
    recraft: {
      model: 'fal-ai/recraft-v3',
      defaultStyle: 'realistic_image',
      defaultSize: 'square_hd',
      availableSizes: [
        'square_hd',
        'square',
        'portrait_4_3',
        'portrait_16_9',
        'landscape_4_3',
        'landscape_16_9'
      ]
    }
  }
};

if (!config.togetherApiKey) {
  console.error('ERROR: TOGETHER_API_KEY environment variable is not set');
  process.exit(1);
}

if (!config.falApiKey) {
  console.error('ERROR: FAL_KEY environment variable is not set');
  process.exit(1);
}

module.exports = config; 