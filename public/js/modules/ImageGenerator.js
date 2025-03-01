/**
 * ImageGenerator class
 * Handles image generation functionality and UI interactions
 */
export class ImageGenerator {
  constructor() {
    this.config = {
      imageGeneration: {
        defaultWidth: 1024,
        defaultHeight: 768,
        defaultSteps: 28,
        maxImages: 4,
        recraft: {
          availableSizes: [
            'square_hd',
            'portrait_hd',
            'landscape_hd',
            'square_sd',
            'portrait_sd',
            'landscape_sd'
          ],
          defaultSize: 'square_hd',
          defaultStyle: 'realistic_image'
        },
        // Size presets based on quality level
        sizePresets: {
          small: {
            baseWidth: 512,
            baseHeight: 512
          },
          medium: {
            baseWidth: 768,
            baseHeight: 768
          },
          large: {
            baseWidth: 1024,
            baseHeight: 1024
          },
          xl: {
            baseWidth: 1536,
            baseHeight: 1536
          }
        }
      }
    };
    
    // UI elements
    this.elements = {
      form: null,
      prompt: null,
      provider: null,
      width: null,
      height: null,
      steps: null,
      numImages: null,
      generateButton: null,
      loadingIndicator: null,
      errorMessage: null,
      recraftOptions: null,
      standardOptions: null,
      imageSize: null,
      style: null,
      colorInputs: null,
      galleryContent: null,
      aspectRatio: null,
      customSizeFields: null
    };
    
    // State
    this.isGenerating = false;
    this.history = [];
  }
  
  /**
   * Initialize the image generator
   */
  initialize() {
    this.loadElements();
    this.loadHistory();
    this.setupEventListeners();
    this.setupGalleryEventListeners();
    this.setupAspectRatioHandler();
    this.fetchConfig();
    this.initializeFormWithConfig();
  }
  
  /**
   * Load UI elements
   */
  loadElements() {
    this.elements = {
      form: document.getElementById('generateForm'),
      prompt: document.getElementById('prompt'),
      provider: document.getElementById('provider'),
      width: document.getElementById('width'),
      height: document.getElementById('height'),
      steps: document.getElementById('steps'),
      numImages: document.getElementById('n'),
      generateButton: document.getElementById('generateButton'),
      loadingIndicator: document.getElementById('loadingIndicator'),
      errorMessage: document.getElementById('errorMessage'),
      recraftOptions: document.getElementById('recraftOptions'),
      standardOptions: document.getElementById('standardOptions'),
      imageSize: document.getElementById('imageSize'),
      style: document.getElementById('style'),
      colorInputs: document.querySelectorAll('.color-input'),
      galleryContent: document.getElementById('galleryContent'),
      aspectRatio: document.getElementById('aspectRatio'),
      customSizeFields: document.getElementById('customSizeFields')
    };
  }
  
  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Form submission
    if (this.elements.form) {
      this.elements.form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.generateImage();
      });
    }
    
    // Provider change
    if (this.elements.provider) {
      this.elements.provider.addEventListener('change', () => {
        this.toggleProviderOptions();
      });
    }
    
    // Add animation to the generate button
    if (this.elements.generateButton) {
      this.elements.generateButton.addEventListener('mouseenter', () => {
        this.elements.generateButton.classList.add('animate-pulse');
      });
      
      this.elements.generateButton.addEventListener('mouseleave', () => {
        this.elements.generateButton.classList.remove('animate-pulse');
      });
    }
    
    // Focus animation for prompt textarea
    if (this.elements.prompt) {
      this.elements.prompt.addEventListener('focus', () => {
        this.elements.prompt.classList.add('border-primary');
      });
      
      this.elements.prompt.addEventListener('blur', () => {
        this.elements.prompt.classList.remove('border-primary');
      });
    }
  }
  
  /**
   * Set up aspect ratio handler
   */
  setupAspectRatioHandler() {
    if (!this.elements.aspectRatio || !this.elements.width || !this.elements.height) return;
    
    const aspectRatioSelect = this.elements.aspectRatio;
    const imageSizeSelect = this.elements.imageSize;
    const widthInput = this.elements.width;
    const heightInput = this.elements.height;
    const customSizeFields = this.elements.customSizeFields;
    
    // Handle aspect ratio change
    aspectRatioSelect.addEventListener('change', () => {
      const ratio = aspectRatioSelect.value;
      
      if (ratio === 'custom') {
        // Show custom size fields
        if (customSizeFields) customSizeFields.classList.remove('hidden');
        return;
      }
      
      // Hide custom size fields
      if (customSizeFields) customSizeFields.classList.add('hidden');
      
      // Calculate dimensions based on aspect ratio and selected size
      this.updateDimensionsFromAspectRatio();
    });
    
    // Handle image size change
    if (imageSizeSelect) {
      imageSizeSelect.addEventListener('change', () => {
        this.updateDimensionsFromAspectRatio();
      });
    }
    
    // Initial calculation
    this.updateDimensionsFromAspectRatio();
  }
  
  /**
   * Update dimensions based on aspect ratio and size
   */
  updateDimensionsFromAspectRatio() {
    if (!this.elements.aspectRatio || !this.elements.width || !this.elements.height) return;
    
    const ratio = this.elements.aspectRatio.value;
    if (ratio === 'custom') return;
    
    const [widthRatio, heightRatio] = ratio.split(':').map(Number);
    if (!widthRatio || !heightRatio) return;
    
    // Get base size from selected size preset
    const sizePreset = this.elements.imageSize ? 
      this.config.imageGeneration.sizePresets[this.elements.imageSize.value] : 
      this.config.imageGeneration.sizePresets.medium;
    
    const baseSize = sizePreset ? sizePreset.baseWidth : 1024;
    
    // Calculate dimensions while maintaining aspect ratio
    // Scale based on the longer dimension to ensure it fits within baseSize
    let newWidth, newHeight;
    
    if (widthRatio > heightRatio) {
      newWidth = baseSize;
      newHeight = Math.round((baseSize * heightRatio) / widthRatio);
    } else {
      newHeight = baseSize;
      newWidth = Math.round((baseSize * widthRatio) / heightRatio);
    }
    
    // Round to nearest 64 (common for AI models)
    newWidth = Math.round(newWidth / 64) * 64;
    newHeight = Math.round(newHeight / 64) * 64;
    
    // Update input fields
    this.elements.width.value = newWidth;
    this.elements.height.value = newHeight;
  }
  
  /**
   * Set up event delegation for gallery actions
   */
  setupGalleryEventListeners() {
    if (!this.elements.galleryContent) return;
    
    this.elements.galleryContent.addEventListener('click', (e) => {
      // Handle download button clicks
      if (e.target.closest('.download-btn')) {
        const btn = e.target.closest('.download-btn');
        e.preventDefault();
        const url = btn.dataset.url;
        const prompt = btn.dataset.prompt;
        this.downloadImage(url, `${prompt.substring(0, 20)}.png`);
      }
      
      // Handle copy prompt button clicks
      if (e.target.closest('.copy-prompt-btn')) {
        const btn = e.target.closest('.copy-prompt-btn');
        e.preventDefault();
        navigator.clipboard.writeText(btn.dataset.prompt).then(() => {
          Swal.fire({
            toast: true,
            position: 'bottom-end',
            icon: 'success',
            title: 'Prompt copied to clipboard!',
            showConfirmButton: false,
            timer: 1500
          });
        });
      }
      
      // Handle image click for fullscreen view
      if (e.target.tagName === 'IMG' && e.target.closest('figure')) {
        const img = e.target;
        const prompt = img.closest('.card').querySelector('.card-title').textContent;
        Swal.fire({
          imageUrl: img.src,
          imageAlt: prompt,
          title: prompt,
          width: '90vw',
          padding: '1rem',
          showConfirmButton: false,
          showCloseButton: true,
          backdrop: 'rgba(0,0,0,0.9)',
          customClass: {
            image: 'max-h-[85vh] object-contain'
          }
        });
      }
    });
  }
  
  /**
   * Toggle provider-specific options
   */
  toggleProviderOptions() {
    const selectedProvider = this.elements.provider.value;
    
    if (selectedProvider === 'recraft') {
      this.elements.recraftOptions.classList.remove('hidden');
      this.elements.standardOptions.classList.add('hidden');
    } else {
      this.elements.recraftOptions.classList.add('hidden');
      this.elements.standardOptions.classList.remove('hidden');
    }
    
    // Add a subtle animation to show the transition
    const activeOptions = selectedProvider === 'recraft' 
      ? this.elements.recraftOptions 
      : this.elements.standardOptions;
      
    activeOptions.classList.add('animate-fadeIn');
    setTimeout(() => {
      activeOptions.classList.remove('animate-fadeIn');
    }, 500);
  }
  
  /**
   * Fetch configuration from server with improved error handling
   */
  async fetchConfig() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch('/api/config', { 
        signal: controller.signal 
      });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        this.config = data.config;
        this.initializeFormWithConfig();
      }
    } catch (error) {
      console.error('Error fetching config:', error);
      // Use default config instead of failing
      this.initializeFormWithConfig();
      
      if (error.name === 'AbortError') {
        this.showError('Config request timed out. Using default settings.');
      } else {
        this.showError('Failed to load configuration. Using default settings.');
      }
    }
  }
  
  /**
   * Initialize form with configuration values
   */
  initializeFormWithConfig() {
    // Set default values from config
    if (this.elements.width) {
      this.elements.width.value = this.config.imageGeneration.defaultWidth;
    }
    
    if (this.elements.height) {
      this.elements.height.value = this.config.imageGeneration.defaultHeight;
    }
    
    if (this.elements.steps) {
      this.elements.steps.value = this.config.imageGeneration.defaultSteps;
    }
    
    if (this.elements.numImages) {
      this.elements.numImages.value = 1;
    }
    
    // Initialize Recraft-specific fields
    if (this.elements.style) {
      this.elements.style.value = this.config.imageGeneration.recraft.defaultStyle;
    }
    
    // Update dimensions based on aspect ratio
    this.updateDimensionsFromAspectRatio();
  }
  
  /**
   * Format option label for display
   */
  formatOptionLabel(value) {
    return value
      .replace(/_/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase())
      .replace(/Sd$/, 'SD')
      .replace(/Hd$/, 'HD');
  }
  
  /**
   * Generate image based on form inputs with improved error handling
   */
  async generateImage() {
    if (this.isGenerating) return;
    
    const prompt = this.elements.prompt.value.trim();
    if (!prompt) {
      this.showError('Please enter a prompt');
      this.elements.prompt.focus();
      return;
    }
    
    this.isGenerating = true;
    this.elements.generateButton.disabled = true;
    this.elements.loadingIndicator.classList.remove('hidden');
    this.elements.errorMessage.classList.add('hidden');
    
    // Add loading animation to button
    this.elements.generateButton.innerHTML = '<span class="loading loading-spinner loading-xs mr-2"></span> Generating...';
    
    try {
      const provider = this.elements.provider.value;
      
      // Build request data based on provider
      const requestData = {
        prompt,
        provider
      };
      
      if (provider === 'recraft') {
        // For Recraft, use the aspect ratio to determine the image size
        const aspectRatio = this.elements.aspectRatio.value;
        let imageSize = 'square_hd'; // Default
        
        if (aspectRatio === '1:1') {
          imageSize = 'square_hd';
        } else if (aspectRatio === '4:3' || aspectRatio === '3:2') {
          imageSize = 'landscape_hd';
        } else if (aspectRatio === '16:9' || aspectRatio === '21:9') {
          imageSize = 'landscape_hd';
        } else if (aspectRatio === '2:3' || aspectRatio === '9:16') {
          imageSize = 'portrait_hd';
        } else if (aspectRatio === 'custom') {
          // Use the closest match based on width/height ratio
          const width = parseInt(this.elements.width.value);
          const height = parseInt(this.elements.height.value);
          const ratio = width / height;
          
          if (ratio > 1.2) {
            imageSize = 'landscape_hd';
          } else if (ratio < 0.8) {
            imageSize = 'portrait_hd';
          } else {
            imageSize = 'square_hd';
          }
        }
        
        requestData.imageSize = imageSize;
        requestData.style = this.elements.style.value;
        
        // Get color palette
        const colors = [];
        this.elements.colorInputs.forEach(input => {
          if (input.value && input.value !== '#000000') {
            colors.push(input.value);
          }
        });
        
        if (colors.length > 0) {
          requestData.colorPalette = colors;
        }
      } else {
        // For other providers, use the calculated width and height
        requestData.width = parseInt(this.elements.width.value);
        requestData.height = parseInt(this.elements.height.value);
        requestData.steps = parseInt(this.elements.steps.value);
        requestData.n = parseInt(this.elements.numImages.value);
      }
      
      // Send request to server with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout for generation
      
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to generate images');
      }
      
      // Save to history and display
      this.saveToHistory(data.images, prompt, {
        provider,
        width: requestData.width,
        height: requestData.height,
        style: requestData.style,
        aspectRatio: this.elements.aspectRatio ? this.elements.aspectRatio.value : null
      });
      
      // Show success notification
      Swal.fire({
        toast: true,
        position: 'bottom-end',
        icon: 'success',
        title: 'Images generated successfully!',
        showConfirmButton: false,
        timer: 3000
      });
      
      // Scroll to gallery
      document.getElementById('gallery').scrollIntoView({ behavior: 'smooth' });
      
    } catch (error) {
      console.error('Generation error:', error);
      
      let errorMessage = 'Failed to generate image';
      
      if (error.name === 'AbortError') {
        errorMessage = 'Request timed out. The server took too long to respond.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      this.showError(errorMessage);
    } finally {
      this.isGenerating = false;
      this.elements.generateButton.disabled = false;
      this.elements.loadingIndicator.classList.add('hidden');
      this.elements.generateButton.innerHTML = '<i class="fas fa-magic mr-2"></i> Generate Images';
    }
  }
  
  /**
   * Show error message
   */
  showError(message) {
    this.elements.errorMessage.textContent = message;
    this.elements.errorMessage.classList.remove('hidden');
    
    // Add animation for better visibility
    this.elements.errorMessage.classList.add('animate-fadeIn');
    
    // Scroll to error message
    this.elements.errorMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Hide after 5 seconds
    setTimeout(() => {
      this.elements.errorMessage.classList.add('hidden');
      this.elements.errorMessage.classList.remove('animate-fadeIn');
    }, 5000);
  }
  
  /**
   * Load image history from localStorage
   */
  loadHistory() {
    try {
      this.history = JSON.parse(localStorage.getItem('imageHistory') || '[]');
      this.displayImages();
    } catch (error) {
      console.error('Error loading history:', error);
      // Reset history if corrupted
      localStorage.removeItem('imageHistory');
      this.history = [];
      this.displayImages();
    }
  }
  
  /**
   * Save new images to history
   */
  saveToHistory(newImages, prompt, metadata) {
    const newEntry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      prompt,
      images: newImages,
      metadata
    };
    
    this.history.unshift(newEntry);
    
    // Limit history to 50 entries
    if (this.history.length > 50) {
      this.history = this.history.slice(0, 50);
    }
    
    localStorage.setItem('imageHistory', JSON.stringify(this.history));
    this.displayImages();
  }
  
  /**
   * Display images in the gallery
   */
  displayImages() {
    if (!this.elements.galleryContent) return;
    
    if (this.history.length === 0) {
      // Show empty state
      this.elements.galleryContent.innerHTML = `
        <div class="col-span-1 md:col-span-2 lg:col-span-3 text-center p-12">
          <div class="flex flex-col items-center justify-center">
            <svg class="w-16 h-16 text-base-content/30" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
            <p class="mt-4 text-base-content/70">No images generated yet. Create your first image above!</p>
          </div>
        </div>
      `;
      return;
    }
    
    this.elements.galleryContent.innerHTML = '';
    
    this.history.forEach(entry => {
      const { id, timestamp, prompt, images, metadata = {} } = entry;
      
      // Create a card for each image
      images.forEach((imageUrl, index) => {
        const card = document.createElement('div');
        card.className = 'card bg-base-200 shadow-xl overflow-hidden group hover:shadow-2xl transition-all duration-300 hardware-accelerated';
        
        // Format the provider name for display
        const provider = metadata.provider || 'AI';
        const formattedProvider = provider.charAt(0).toUpperCase() + provider.slice(1);
        
        // Add aspect ratio badge if available
        let aspectRatioBadge = '';
        if (metadata.aspectRatio && metadata.aspectRatio !== 'custom') {
          aspectRatioBadge = `<span class="badge badge-secondary ml-2">${metadata.aspectRatio}</span>`;
        }
        
        card.innerHTML = `
          <figure class="relative h-64 overflow-hidden">
            <img src="${imageUrl}" alt="${prompt}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
            <div class="absolute top-2 right-2">
              <span class="badge badge-primary">${formattedProvider}</span>
              ${aspectRatioBadge}
            </div>
          </figure>
          <div class="card-body">
            <h3 class="card-title text-base line-clamp-1">${prompt}</h3>
            <p class="text-xs text-base-content/70">${new Date(timestamp).toLocaleString()}</p>
            <div class="card-actions justify-end mt-2">
              <button class="btn btn-sm btn-outline btn-primary download-btn" data-url="${imageUrl}" data-prompt="${prompt.replace(/"/g, '&quot;')}">
                <i class="fas fa-download mr-1"></i> Download
              </button>
              <button class="btn btn-sm btn-ghost copy-prompt-btn" data-prompt="${prompt.replace(/"/g, '&quot;')}">
                <i class="fas fa-copy mr-1"></i> Copy Prompt
              </button>
            </div>
          </div>
        `;
        
        this.elements.galleryContent.appendChild(card);
      });
    });
  }
  
  /**
   * Download an image with error handling
   */
  downloadImage(url, filename) {
    fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to download: ${response.status} ${response.statusText}`);
        }
        return response.blob();
      })
      .then(blob => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Show success notification
        Swal.fire({
          toast: true,
          position: 'bottom-end',
          icon: 'success',
          title: 'Image downloaded successfully!',
          showConfirmButton: false,
          timer: 1500
        });
      })
      .catch(error => {
        console.error('Download error:', error);
        this.showError('Failed to download image: ' + error.message);
      });
  }
}