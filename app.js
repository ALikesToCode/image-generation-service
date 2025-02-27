const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const imageService = require('./services/imageService');
const imageRoutes = require('./routes/imageRoutes');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 1014;

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "cdn.tailwindcss.com", "cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'", "cdn.tailwindcss.com", "cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      connectSrc: ["'self'", "https://fal.run"] // Allow connections to fal.ai API
    }
  }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50 // limit each IP to 50 requests per windowMs
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/image-generator')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));

// Apply rate limiting to API routes
app.use('/api/', limiter);

// Routes
app.use('/api/images', imageRoutes); // Add the new image routes

app.post('/api/generate', async (req, res) => {
  try {
    const { prompt, provider, aspectRatio, width, height } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const options = {
      provider: provider || 'flux',
      aspectRatio,
      width,
      height
    };

    console.log(`Generating image with provider: ${options.provider}, aspectRatio: ${aspectRatio || 'default'}`);
    
    const image = await imageService.generateImage(prompt, options);
    res.json(image);
  } catch (error) {
    console.error('Generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate image',
      details: error.message 
    });
  }
});

app.get('/api/images', async (req, res) => {
  try {
    const images = await imageService.getGeneratedImages();
    res.json(images);
  } catch (error) {
    console.error('Fetch error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch images',
      details: error.message 
    });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser`);
});
