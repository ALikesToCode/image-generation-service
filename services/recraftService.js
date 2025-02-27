const { fal } = require('@fal-ai/client');
require('dotenv').config();

// Configure fal client with API key from environment variables
fal.config({
  credentials: process.env.FAL_KEY
});

class RecraftService {
  /**
   * Generate an image using Recraft V3
   * @param {Object} params
   * @param {string} params.prompt - The text prompt for image generation
   * @param {string} [params.imageSize='square_hd'] - The size of the generated image
   * @param {string} [params.style='realistic_image'] - The style of the generated image
   * @param {Array} [params.colors=[]] - Array of preferred RGB colors
   * @returns {Promise<Object>} The generated image result
   */
  static async generateImage({
    prompt,
    imageSize = 'square_hd',
    style = 'realistic_image',
    colors = []
  }) {
    try {
      const result = await fal.subscribe('fal-ai/recraft-v3', {
        input: {
          prompt,
          image_size: imageSize,
          style,
          colors
        },
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === 'IN_PROGRESS') {
            update.logs.map((log) => log.message).forEach(console.log);
          }
        },
      });

      return result;
    } catch (error) {
      console.error('Error generating image:', error);
      throw error;
    }
  }

  /**
   * Submit a long-running image generation request
   * @param {Object} params
   * @param {string} params.prompt - The text prompt for image generation
   * @param {string} [params.webhookUrl] - Optional webhook URL for results
   * @returns {Promise<Object>} The request ID
   */
  static async submitRequest({
    prompt,
    webhookUrl = null
  }) {
    try {
      const { request_id } = await fal.queue.submit('fal-ai/recraft-v3', {
        input: {
          prompt
        },
        ...(webhookUrl && { webhookUrl })
      });

      return { requestId: request_id };
    } catch (error) {
      console.error('Error submitting request:', error);
      throw error;
    }
  }

  /**
   * Check the status of a request
   * @param {string} requestId - The ID of the request to check
   * @returns {Promise<Object>} The request status
   */
  static async checkStatus(requestId) {
    try {
      const status = await fal.queue.status('fal-ai/recraft-v3', {
        requestId,
        logs: true
      });

      return status;
    } catch (error) {
      console.error('Error checking status:', error);
      throw error;
    }
  }

  /**
   * Get the result of a completed request
   * @param {string} requestId - The ID of the completed request
   * @returns {Promise<Object>} The generation result
   */
  static async getResult(requestId) {
    try {
      const result = await fal.queue.result('fal-ai/recraft-v3', {
        requestId
      });

      return result;
    } catch (error) {
      console.error('Error getting result:', error);
      throw error;
    }
  }
}

module.exports = RecraftService; 