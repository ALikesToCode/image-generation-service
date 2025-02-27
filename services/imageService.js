const { fal } = require('@fal-ai/client');
const axios = require('axios');
const Image = require('../models/Image');
const fluxService = require('./fluxService');
const togetherService = require('./togetherService');
const recraftService = require('./recraftService');
const logger = require('../utils/logger');

class ImageService {
  constructor() {
    // Initialize FLUX client
    if (process.env.FAL_KEY) {
      fal.config({
        credentials: process.env.FAL_KEY
      });
    }

    // Initialize Together AI client
    this.togetherApiKey = process.env.TOGETHER_API_KEY;
    this.togetherApiUrl = 'https://api.together.xyz/v1/images/generations';
  }

  async generateImageWithFlux(prompt, options = {}) {
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
      url: result.data.images[0].url,
      seed: result.data.seed,
      provider: 'flux',
      aspectRatio
    };
  }

  async generateImageWithTogether(prompt, options = {}) {
    const {
      width = 1024,
      height = 1024,
      steps = 30,
      numImages = 1,
      aspectRatio
    } = options;

    if (!this.togetherApiKey) {
      throw new Error('Together API key not configured');
    }

    // Calculate dimensions based on aspect ratio if provided
    let finalWidth = width;
    let finalHeight = height;
    
    if (aspectRatio) {
      const [w, h] = aspectRatio.split(':').map(Number);
      // Maintain the larger dimension and adjust the smaller one based on aspect ratio
      if (width >= height) {
        finalHeight = Math.round(width * (h / w));
      } else {
        finalWidth = Math.round(height * (w / h));
      }
    }

    const response = await axios.post(
      this.togetherApiUrl,
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
          'Authorization': `Bearer ${this.togetherApiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.data.data || response.data.data.length === 0) {
      throw new Error('No images generated from Together AI');
    }

    // Convert base64 to data URL
    const imageData = response.data.data[0].b64_json;
    const dataUrl = `data:image/png;base64,${imageData}`;

    return {
      url: dataUrl,
      provider: 'together',
      aspectRatio: aspectRatio || `${finalWidth}:${finalHeight}`
    };
  }

  async generateImage(prompt, options = {}) {
    try {
      const { provider = 'flux' } = options;
      let result;

      switch (provider.toLowerCase()) {
        case 'flux':
          result = await fluxService.generateImage(prompt, options);
          break;
        case 'together':
          result = await togetherService.generateImage(prompt, options);
          break;
        case 'recraft':
          result = await recraftService.generateImage({
            prompt,
            ...options
          });
          break;
        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }

      // Store generated images in database
      const savedImages = await Promise.all(
        result.images.map(imageUrl => {
          const imageData = {
            prompt,
            imageUrl,
            provider: result.metadata.provider,
            seed: result.metadata.seed,
            aspectRatio: options.aspectRatio || 'default'
          };
          return new Image(imageData).save();
        })
      );

      return {
        success: true,
        images: result.images,
        savedImages,
        metadata: result.metadata
      };

    } catch (error) {
      logger.error('Error in image generation:', error);
      throw error;
    }
  }

  async getGeneratedImages() {
    try {
      return await Image.find().sort({ createdAt: -1 });
    } catch (error) {
      logger.error('Error fetching generated images:', error);
      throw error;
    }
  }
}

module.exports = new ImageService(); 