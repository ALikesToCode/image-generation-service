const { fal } = require('@fal-ai/client');
const Image = require('../models/Image');

class FluxService {
  constructor() {
    if (process.env.FAL_KEY) {
      fal.config({
        credentials: process.env.FAL_KEY
      });
    }
  }

  async generateImage(prompt, options = {}) {
    try {
      const {
        aspectRatio = '16:9',
        outputFormat = 'jpeg',
        numImages = 1,
        enableSafetyChecker = false,
        safetyTolerance = '6'
      } = options;

      const result = await fal.subscribe('fal-ai/flux-pro/v1.1-ultra', {
        input: {
          prompt,
          aspect_ratio: aspectRatio,
          output_format: outputFormat,
          num_images: numImages,
          enable_safety_checker: enableSafetyChecker,
          safety_tolerance: safetyTolerance
        },
        logs: true
      });

      if (!result.data.images || result.data.images.length === 0) {
        throw new Error('No images generated from FLUX');
      }

      return {
        images: result.data.images.map(img => img.url),
        metadata: {
          provider: 'flux',
          seed: result.data.seed,
          aspectRatio
        }
      };
    } catch (error) {
      console.error('Error in FLUX image generation:', error);
      throw error;
    }
  }

  async getGeneratedImages(limit = 10) {
    return Image.find().sort({ createdAt: -1 }).limit(limit);
  }
}

module.exports = new FluxService(); 