const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  prompt: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  provider: {
    type: String,
    required: true,
    enum: ['flux', 'together', 'recraft']
  },
  seed: {
    type: String
  },
  aspectRatio: {
    type: String,
    default: 'default'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Image', imageSchema); 