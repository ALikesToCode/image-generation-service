const express = require('express');
const router = express.Router();
const RecraftService = require('../services/recraftService');

/**
 * @route POST /api/images/generate
 * @description Generate an image using Recraft V3
 */
router.post('/generate', async (req, res) => {
  try {
    const { prompt, style, imageSize, colors } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const result = await RecraftService.generateImage({
      prompt,
      style,
      imageSize,
      colors
    });

    res.json(result.data);
  } catch (error) {
    console.error('Error in image generation route:', error);
    res.status(500).json({ error: 'Failed to generate image' });
  }
});

/**
 * @route POST /api/images/submit
 * @description Submit a long-running image generation request
 */
router.post('/submit', async (req, res) => {
  try {
    const { prompt, webhookUrl } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const result = await RecraftService.submitRequest({
      prompt,
      webhookUrl
    });

    res.json(result);
  } catch (error) {
    console.error('Error in request submission route:', error);
    res.status(500).json({ error: 'Failed to submit request' });
  }
});

/**
 * @route GET /api/images/status/:requestId
 * @description Check the status of an image generation request
 */
router.get('/status/:requestId', async (req, res) => {
  try {
    const { requestId } = req.params;
    const status = await RecraftService.checkStatus(requestId);
    res.json(status);
  } catch (error) {
    console.error('Error in status check route:', error);
    res.status(500).json({ error: 'Failed to check status' });
  }
});

/**
 * @route GET /api/images/result/:requestId
 * @description Get the result of a completed image generation request
 */
router.get('/result/:requestId', async (req, res) => {
  try {
    const { requestId } = req.params;
    const result = await RecraftService.getResult(requestId);
    res.json(result.data);
  } catch (error) {
    console.error('Error in result fetch route:', error);
    res.status(500).json({ error: 'Failed to get result' });
  }
});

module.exports = router; 