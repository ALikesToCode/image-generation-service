import { ImageGenerator } from './modules/ImageGenerator.js';

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  // Create and initialize the image generator
  const app = new ImageGenerator();
  window.app = app; // Make it globally accessible for event handlers
  app.initialize();

  // Initialize tooltips
  if (typeof tippy === 'function') {
    tippy('[data-tippy-content]', {
      placement: 'top',
      arrow: true,
      theme: 'light',
    });
  }

  // Initialize theme handling
  setupThemeHandling();

  const form = document.getElementById('generateForm');
  const loadingIndicator = document.getElementById('loadingIndicator');
  const generateButton = document.getElementById('generateButton');
  const errorMessage = document.getElementById('errorMessage');
  const providerSelect = document.getElementById('provider');
  const recraftOptions = document.getElementById('recraftOptions');
  const standardOptions = document.getElementById('standardOptions');
  const galleryContent = document.getElementById('galleryContent');
  
  let config = {
    imageGeneration: {
      defaultWidth: 1024,
      defaultHeight: 768,
      defaultSteps: 28,
      maxImages: 4,
      recraft: {
        availableSizes: [],
        defaultSize: 'square_hd',
        defaultStyle: 'realistic_image'
      }
    }
  };

  // Fetch configuration from server
  async function fetchConfig() {
    try {
      const response = await fetch('/api/config');
      const data = await response.json();
      if (data.success) {
        config = data.config;
        initializeFormWithConfig();
      }
    } catch (error) {
      console.error('Error fetching config:', error);
      showError('Failed to load configuration');
    }
  }

  function initializeFormWithConfig() {
    // Initialize form fields with config values
    document.getElementById('width').value = config.imageGeneration.defaultWidth;
    document.getElementById('height').value = config.imageGeneration.defaultHeight;
    document.getElementById('steps').value = config.imageGeneration.defaultSteps;
    document.getElementById('n').value = 1;

    // Initialize Recraft-specific fields
    if (document.getElementById('imageSize')) {
      const sizeSelect = document.getElementById('imageSize');
      sizeSelect.innerHTML = config.imageGeneration.recraft.availableSizes
        .map(size => `<option value="${size}">${formatOptionLabel(size)}</option>`)
        .join('');
      sizeSelect.value = config.imageGeneration.recraft.defaultSize;
    }
  }

  // Handle provider selection change
  if (providerSelect) {
    providerSelect.addEventListener('change', (e) => {
      const selectedProvider = e.target.value;
      if (selectedProvider === 'recraft') {
        recraftOptions.classList.remove('hidden');
        standardOptions.classList.add('hidden');
      } else {
        recraftOptions.classList.add('hidden');
        standardOptions.classList.remove('hidden');
      }
    });
  }

  // Load and display history from localStorage
  function loadImageHistory() {
    const history = JSON.parse(localStorage.getItem('imageHistory') || '[]');
    if (history.length > 0) {
      displayImages(history);
    } else {
      // Show empty state if no images
      galleryContent.innerHTML = `
        <div class="col-span-1 md:col-span-2 lg:col-span-3 text-center p-12">
          <div class="flex flex-col items-center justify-center">
            <svg class="w-16 h-16 text-base-content/30" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
            <p class="mt-4 text-base-content/70">No images generated yet. Create your first image above!</p>
          </div>
        </div>
      `;
    }
  }

  // Save new images to history
  function saveToHistory(newImages, prompt, metadata) {
    const history = JSON.parse(localStorage.getItem('imageHistory') || '[]');
    const newEntry = {
      id: Date.now(),
      timestamp: new Date().toLocaleString(),
      prompt,
      images: newImages,
      metadata
    };
    history.unshift(newEntry);
    localStorage.setItem('imageHistory', JSON.stringify(history.slice(0, 50))); // Keep last 50 entries
    return history;
  }

  // Format option labels
  function formatOptionLabel(value) {
    return value
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  // Show error message
  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
    setTimeout(() => {
      errorMessage.classList.add('hidden');
    }, 5000);
  }

  // Display images in the gallery
  function displayImages(history) {
    if (!galleryContent) return;
    
    // Sort history by timestamp (newest first)
    const sortedHistory = [...history].sort((a, b) => {
      return new Date(b.timestamp) - new Date(a.timestamp);
    });

    galleryContent.innerHTML = '';
    
    sortedHistory.forEach(entry => {
      const { id, timestamp, prompt, images, metadata = {} } = entry;
      
      // Create a card for each image
      images.forEach((imageUrl, index) => {
        const card = document.createElement('div');
        card.className = 'card bg-base-200 shadow-xl overflow-hidden group hover:shadow-2xl transition-all duration-300';
        
        // Format the provider name for display
        const provider = metadata.provider || 'AI';
        const formattedProvider = provider.charAt(0).toUpperCase() + provider.slice(1);
        
        card.innerHTML = `
          <figure class="relative h-64 overflow-hidden">
            <img src="${imageUrl}" alt="${prompt}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
            <div class="absolute top-2 right-2">
              <span class="badge badge-primary">${formattedProvider}</span>
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
        
        // Add event listeners for buttons
        const downloadBtn = card.querySelector('.download-btn');
        downloadBtn.addEventListener('click', (e) => {
          e.preventDefault();
          downloadImage(imageUrl, `${prompt.substring(0, 20)}.png`);
        });
        
        const copyPromptBtn = card.querySelector('.copy-prompt-btn');
        copyPromptBtn.addEventListener('click', (e) => {
          e.preventDefault();
          navigator.clipboard.writeText(prompt).then(() => {
            Swal.fire({
              toast: true,
              position: 'bottom-end',
              icon: 'success',
              title: 'Prompt copied to clipboard!',
              showConfirmButton: false,
              timer: 1500
            });
          });
        });
        
        galleryContent.appendChild(card);
      });
    });
  }

  // Helper function to download images
  function downloadImage(url, filename) {
    fetch(url)
      .then(response => response.blob())
      .then(blob => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      })
      .catch(error => {
        console.error('Download error:', error);
        showError('Failed to download image');
      });
  }

  // Handle form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
      loadingIndicator.classList.remove('hidden');
      generateButton.disabled = true;
      errorMessage.classList.add('hidden');

      const formData = {
        prompt: document.getElementById('prompt').value,
        provider: document.getElementById('provider').value
      };

      // Add provider-specific options
      if (formData.provider === 'recraft') {
        formData.style = document.getElementById('style').value;
        formData.imageSize = document.getElementById('imageSize').value;
        const colorInputs = document.querySelectorAll('.color-input');
        if (colorInputs.length > 0) {
          formData.colors = Array.from(colorInputs).map(input => {
            const color = input.value;
            const rgb = parseInt(color.slice(1), 16);
            return {
              r: (rgb >> 16) & 255,
              g: (rgb >> 8) & 255,
              b: rgb & 255
            };
          }).filter(color => color.r !== 0 || color.g !== 0 || color.b !== 0);
        }
      } else {
        formData.width = parseInt(document.getElementById('width').value);
        formData.height = parseInt(document.getElementById('height').value);
        formData.steps = parseInt(document.getElementById('steps').value);
        formData.n = parseInt(document.getElementById('n').value);
      }

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate images');
      }

      // Save and display updated history
      const updatedHistory = saveToHistory(data.images, formData.prompt, {
        provider: formData.provider,
        style: formData.style,
        imageSize: formData.imageSize
      });
      displayImages(updatedHistory);

      // Show success message
      Swal.fire({
        title: 'Success!',
        text: 'Your image has been generated successfully.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });

    } catch (error) {
      console.error('Error:', error);
      showError(error.message || 'Failed to generate images. Please try again.');
    } finally {
      loadingIndicator.classList.add('hidden');
      generateButton.disabled = false;
    }
  });

  // Initialize
  fetchConfig();
  loadImageHistory();
});

/**
 * Setup theme handling
 */
function setupThemeHandling() {
  const themeController = document.querySelector('.theme-controller');
  if (!themeController) return;
  
  // Set initial theme based on system preference or localStorage
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
    themeController.checked = savedTheme === 'dark';
  } else {
    // Check system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    themeController.checked = prefersDark;
  }
  
  // Handle theme toggle
  themeController.addEventListener('change', function() {
    const newTheme = this.checked ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Refresh tooltips with new theme
    if (typeof tippy === 'function') {
      tippy('[data-tippy-content]', {
        placement: 'top',
        arrow: true,
        theme: newTheme === 'dark' ? 'light' : 'light',
      });
    }
  });
}

/**
 * Add color input to palette
 * Global function called from HTML
 */
window.addColorInput = function() {
  const colorPalette = document.getElementById('colorPalette');
  if (!colorPalette) return;

  const input = document.createElement('input');
  input.type = 'color';
  input.className = 'color-input h-10 w-10 rounded cursor-pointer';
  colorPalette.insertBefore(input, colorPalette.lastElementChild);
};

/**
 * Show prompt tips
 * Global function called from HTML
 */
window.showPromptTips = function() {
  Swal.fire({
    title: 'Tips for Better Prompts',
    html: `
      <ul class="text-left space-y-2">
        <li>🎨 <strong>Style:</strong> Specify art style (e.g., photorealistic, digital art, oil painting)</li>
        <li>🌟 <strong>Lighting:</strong> Describe lighting conditions (e.g., soft natural light, dramatic sunset)</li>
        <li>📸 <strong>Composition:</strong> Mention camera angle and distance (e.g., close-up, aerial view)</li>
        <li>🎭 <strong>Mood:</strong> Include emotional qualities (e.g., serene, mysterious, energetic)</li>
        <li>🔍 <strong>Details:</strong> Add specific details about textures, colors, and materials</li>
      </ul>
    `,
    icon: 'info',
    confirmButtonText: 'Got it!',
    confirmButtonColor: '#0ea5e9'
  });
};

// Global functions
window.copyToClipboard = async function(text, button) {
  try {
    await navigator.clipboard.writeText(text);
    const originalHTML = button.innerHTML;
    button.innerHTML = '<i class="fas fa-check"></i>';
    button.classList.add('text-success');
    setTimeout(() => {
      button.innerHTML = originalHTML;
      button.classList.remove('text-success');
    }, 2000);
  } catch (err) {
    console.error('Failed to copy text: ', err);
  }
};

window.reusePrompt = function(prompt) {
  document.getElementById('prompt').value = prompt;
  document.getElementById('prompt').focus();
  document.getElementById('prompt').scrollIntoView({ behavior: 'smooth' });
};

window.deleteHistoryEntry = function(id) {
  Swal.fire({
    title: 'Delete Entry?',
    text: 'Are you sure you want to delete this history entry?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#f43f5e',
    cancelButtonColor: '#6b7280',
    confirmButtonText: 'Yes, delete it!'
  }).then((result) => {
    if (result.isConfirmed) {
      const history = JSON.parse(localStorage.getItem('imageHistory') || '[]');
      const updatedHistory = history.filter(entry => entry.id !== id);
      localStorage.setItem('imageHistory', JSON.stringify(updatedHistory));
      displayImages(updatedHistory);
    }
  });
};

window.showFullscreenImage = function(imagePath) {
  Swal.fire({
    imageUrl: imagePath,
    imageAlt: 'Generated image',
    width: '90vw',
    padding: '1rem',
    showConfirmButton: false,
    showCloseButton: true,
    backdrop: 'rgba(0,0,0,0.9)',
    customClass: {
      image: 'max-h-[85vh] object-contain'
    }
  });
}; 