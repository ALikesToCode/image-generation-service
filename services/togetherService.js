const axios = require('axios');

class TogetherService {
  constructor() {
    this.apiKey = process.env.TOGETHER_API_KEY;
    this.apiUrl = 'https://api.together.xyz/v1/images/generations';
  }

  async generateImage(prompt, options = {}) {
    try {
      const {
        width = 1024,
        height = 1024,
        steps = 30,
        numImages = 1,
        aspectRatio
      } = options;

      if (!this.apiKey) {
        throw new Error('Together API key not configured');
      }

      // Calculate dimensions based on aspect ratio if provided
      let finalWidth = width;
      let finalHeight = height;
      
      if (aspectRatio) {
        const [w, h] = aspectRatio.split(':').map(Number);
        if (width >= height) {
          finalHeight = Math.round(width * (h / w));
        } else {
          finalWidth = Math.round(height * (w / h));
        }
      }

      const response = await axios.post(
        this.apiUrl,
        {
          model: 'stabilityai/stable-diffusion-xl-base-1.0',
          prompt,
          width: finalWidth,
          height: finalHeight,
          steps,
          n: numImages,
          response_format: 'b64_json'
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.data.data || response.data.data.length === 0) {
        throw new Error('No images generated from Together AI');
      }

      // Convert base64 to URLs
      const images = response.data.data.map(item => `data:image/png;base64,${item.b64_json}`);

      return {
        images,
        metadata: {
          provider: 'together',
          aspectRatio: aspectRatio || `${finalWidth}:${finalHeight}`
        }
      };
    } catch (error) {
      console.error('Error in Together AI image generation:', error);
      throw error;
    }
  }
}

module.exports = new TogetherService(); 