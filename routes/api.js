const express = require('express');
const router = express.Router();
const imageService = require('../services/imageService');
const config = require('../config/config');
const logger = require('../utils/logger');

router.post('/generate', async (req, res) => {
  try {
    const {
      prompt,
      provider = 'flux',
      width,
      height,
      steps,
      style,
      imageSize,
      colors
    } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'Prompt is required'
      });
    }

    const options = {
      provider,
      width: width || config.imageGeneration.defaultWidth,
      height: height || config.imageGeneration.defaultHeight,
      steps: steps || config.imageGeneration.defaultSteps
    };

    // Add provider-specific options
    if (provider === 'recraft') {
      options.style = style || config.imageGeneration.recraft.defaultStyle;
      options.imageSize = imageSize || config.imageGeneration.recraft.defaultSize;
      if (colors && Array.isArray(colors)) {
        options.colors = colors;
      }
    }

    const result = await imageService.generateImage(prompt, options);
    res.json(result);

  } catch (error) {
    logger.error('API Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/images', async (req, res) => {
  try {
    const images = await imageService.getGeneratedImages();
    res.json({
      success: true,
      images
    });
  } catch (error) {
    logger.error('API Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/config', (req, res) => {
  // Send safe configuration to client
  res.json({
    success: true,
    config: {
      imageGeneration: {
        defaultWidth: config.imageGeneration.defaultWidth,
        defaultHeight: config.imageGeneration.defaultHeight,
        defaultSteps: config.imageGeneration.defaultSteps,
        maxImages: config.imageGeneration.maxImages,
        recraft: {
          availableSizes: config.imageGeneration.recraft.availableSizes,
          defaultSize: config.imageGeneration.recraft.defaultSize,
          defaultStyle: config.imageGeneration.recraft.defaultStyle
        }
      }
    }
  });
});

module.exports = router; 