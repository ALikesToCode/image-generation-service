document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('generateForm');
  const loadingIndicator = document.getElementById('loadingIndicator');
  const generateButton = document.getElementById('generateButton');
  const errorMessage = document.getElementById('errorMessage');
  const providerSelect = document.getElementById('provider');
  const recraftOptions = document.getElementById('recraftOptions');
  const standardOptions = document.getElementById('standardOptions');
  
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
    }
  }

  function initializeFormWithConfig() {
    // Initialize form fields with config values
    document.getElementById('width').value = config.imageGeneration.defaultWidth;
    document.getElementById('height').value = config.imageGeneration.defaultHeight;
    document.getElementById('steps').value = config.imageGeneration.defaultSteps;
    document.getElementById('n').value = 1;

    // Initialize Recraft-specific fields if they exist
    if (document.getElementById('imageSize')) {
      const sizeSelect = document.getElementById('imageSize');
      sizeSelect.innerHTML = config.imageGeneration.recraft.availableSizes
        .map(size => `<option value="${size}">${size.replace(/_/g, ' ').toUpperCase()}</option>`)
        .join('');
      sizeSelect.value = config.imageGeneration.recraft.defaultSize;
    }
  }

  // Create gallery section if it doesn't exist
  let gallerySection = document.getElementById('gallerySection');
  if (!gallerySection) {
    gallerySection = document.createElement('div');
    gallerySection.id = 'gallerySection';
    gallerySection.className = 'gallery-section';
    document.querySelector('.container').appendChild(gallerySection);
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
    }
  }

  // Save new images to history
  function saveToHistory(newImages, prompt) {
    const history = JSON.parse(localStorage.getItem('imageHistory') || '[]');
    const newEntry = {
      id: Date.now(),
      timestamp: new Date().toLocaleString(),
      prompt: prompt,
      images: newImages
    };
    history.unshift(newEntry);
    localStorage.setItem('imageHistory', JSON.stringify(history));
    return history;
  }

  // Add function to copy text to clipboard
  async function copyToClipboard(text, button) {
    try {
      await navigator.clipboard.writeText(text);
      const originalHTML = button.innerHTML;
      button.innerHTML = '<i class="fas fa-check"></i>';
      button.classList.add('copied');
      setTimeout(() => {
        button.innerHTML = originalHTML;
        button.classList.remove('copied');
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  }

  function displayImages(history) {
    gallerySection.innerHTML = `
      <h2 class="gallery-title">
        <i class="fas fa-history"></i>
        Generated Images History
      </h2>
      ${history.map(entry => `
        <div class="history-entry">
          <div class="history-entry-header">
            <div class="history-entry-info">
              <div class="prompt-container">
                <p class="prompt-text" title="${entry.prompt}">"${entry.prompt}"</p>
                <button class="copy-btn ripple" data-prompt="${entry.prompt}" title="Copy prompt">
                  <i class="fas fa-copy"></i>
                </button>
                <button class="reuse-btn ripple" data-prompt="${entry.prompt}" title="Reuse prompt">
                  <i class="fas fa-sync-alt"></i>
                </button>
              </div>
              <div class="entry-metadata">
                <span class="timestamp">
                  <i class="far fa-clock"></i>
                  ${entry.timestamp}
                </span>
                <span class="image-count">
                  <i class="far fa-images"></i>
                  ${entry.images.length} image${entry.images.length > 1 ? 's' : ''}
                </span>
              </div>
            </div>
            <button class="delete-btn ripple" data-id="${entry.id}" title="Delete entry">
              <i class="fas fa-trash"></i>
            </button>
          </div>
          <div class="image-grid">
            ${entry.images.map(path => `
              <div class="image-card">
                <div class="image-container">
                  <img src="${path}" alt="Generated Image" loading="lazy"/>
                  <div class="image-actions">
                    <a href="${path}" download class="action-btn download-btn ripple" title="Download">
                      <i class="fas fa-download"></i>
                    </a>
                    <button class="action-btn fullscreen-btn ripple" data-image="${path}" title="View fullscreen">
                      <i class="fas fa-expand"></i>
                    </button>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `).join('')}
    `;

    // Add event listeners for all buttons
    document.querySelectorAll('.copy-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const prompt = e.currentTarget.dataset.prompt;
        copyToClipboard(prompt, e.currentTarget);
      });
    });

    document.querySelectorAll('.reuse-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const prompt = e.currentTarget.dataset.prompt;
        document.getElementById('prompt').value = prompt;
        document.getElementById('prompt').focus();
        document.getElementById('prompt').scrollIntoView({ behavior: 'smooth' });
      });
    });

    document.querySelectorAll('.fullscreen-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const imagePath = e.currentTarget.dataset.image;
        showFullscreenImage(imagePath);
      });
    });

    // Add delete button listeners
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(e.currentTarget.dataset.id);
        const history = JSON.parse(localStorage.getItem('imageHistory') || '[]');
        const updatedHistory = history.filter(entry => entry.id !== id);
        localStorage.setItem('imageHistory', JSON.stringify(updatedHistory));
        displayImages(updatedHistory);
      });
    });
  }

  function showFullscreenImage(imagePath) {
    const viewer = document.createElement('div');
    viewer.className = 'fullscreen-viewer';
    viewer.innerHTML = `
      <div class="fullscreen-content">
        <img src="${imagePath}" alt="Fullscreen view">
        <button class="close-btn ripple">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;

    document.body.appendChild(viewer);
    document.body.style.overflow = 'hidden';

    viewer.addEventListener('click', (e) => {
      if (e.target === viewer) {
        document.body.removeChild(viewer);
        document.body.style.overflow = '';
      }
    });

    viewer.querySelector('.close-btn').addEventListener('click', () => {
      document.body.removeChild(viewer);
      document.body.style.overflow = '';
    });
  }

  // Load history on page load
  loadImageHistory();
  fetchConfig();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
      loadingIndicator.classList.add('active');
      generateButton.disabled = true;
      errorMessage.style.display = 'none';

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
      const updatedHistory = saveToHistory(data.images, formData.prompt);
      displayImages(updatedHistory);

      // Scroll to gallery
      gallerySection.scrollIntoView({ behavior: 'smooth' });

    } catch (error) {
      console.error('Error:', error);
      errorMessage.textContent = error.message || 'Failed to generate images. Please try again.';
      errorMessage.style.display = 'block';
    } finally {
      loadingIndicator.classList.remove('active');
      generateButton.disabled = false;
    }
  });
}); 