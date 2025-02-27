class ChatUI {
  constructor() {
    this.chatMessages = document.getElementById('chatMessages');
    this.chatForm = document.getElementById('chatForm');
    this.chatInput = document.getElementById('chatInput');
    this.promptInput = document.getElementById('prompt');
    this.messageHistory = [];
    this.modelSelector = null;
    
    this.openai = {
      baseURL: "http://localhost:1400/xai/v1",
      apiKey: "YOUR_API_KEY"
    };
    
    // Initialize markdown parser with options
    this.marked = marked;
    this.marked.setOptions({
      highlight: function(code, lang) {
        const language = hljs.getLanguage(lang) ? lang : 'plaintext';
        return hljs.highlight(code, { language }).value;
      },
      langPrefix: 'hljs language-',
      breaks: true,
      gfm: true
    });
    
    this.init();
  }

  async init() {
    await this.createModelSelector();
    this.setupEventListeners();
  }

  async fetchModels() {
    try {
      const response = await fetch('/models');
      if (!response.ok) throw new Error('Failed to fetch models');
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching models:', error);
      return [];
    }
  }

  async createModelSelector() {
    const models = await this.fetchModels();
    
    const selectorContainer = document.createElement('div');
    selectorContainer.className = 'model-selector-container';

    const label = document.createElement('label');
    label.htmlFor = 'modelSelector';
    label.textContent = 'Select AI Model:';
    
    this.modelSelector = document.createElement('select');
    this.modelSelector.id = 'modelSelector';
    this.modelSelector.className = 'model-selector';

    // Add models to selector
    models.forEach(model => {
      const option = document.createElement('option');
      option.value = model.id;
      option.textContent = model.id;
      this.modelSelector.appendChild(option);
    });

    selectorContainer.appendChild(label);
    selectorContainer.appendChild(this.modelSelector);
    this.chatMessages.parentElement.insertBefore(selectorContainer, this.chatMessages);
  }

  setupEventListeners() {
    this.chatForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const message = this.chatInput.value.trim();
      if (!message) return;

      // Add user message to chat and history
      this.addMessage(message, 'user');
      this.messageHistory.push({ role: "user", content: message });
      this.chatInput.value = '';

      try {
        // Show typing indicator
        const typingId = this.addTypingIndicator();

        // Send message to GPT
        const response = await this.sendMessageToGPT(message);

        // Remove typing indicator
        this.removeTypingIndicator(typingId);

        // Add GPT response with "Use Prompt" button
        this.addMessage(response, 'assistant', true);
        this.messageHistory.push({ role: "assistant", content: response });

      } catch (error) {
        console.error('Error:', error);
        this.addMessage('Sorry, I encountered an error. Please try again.', 'system');
      }
    });

    // Auto-resize textarea
    this.chatInput.addEventListener('input', () => {
      this.chatInput.style.height = 'auto';
      this.chatInput.style.height = this.chatInput.scrollHeight + 'px';
    });

    // Model change handler
    if (this.modelSelector) {
      this.modelSelector.addEventListener('change', () => {
        this.addMessage(`Switched to model: ${this.modelSelector.value}`, 'system');
      });
    }
  }

  addMessage(text, type, addUseButton = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    
    // Parse markdown for assistant messages
    if (type === 'assistant') {
      messageDiv.innerHTML = this.marked.parse(text);
    } else {
      messageDiv.textContent = text;
    }

    if (addUseButton) {
      const useButton = document.createElement('button');
      useButton.className = 'use-prompt-button';
      useButton.innerHTML = '<i class="fas fa-magic"></i> Use this prompt';
      useButton.onclick = () => {
        // Remove any markdown syntax when using the prompt
        const cleanText = text.replace(/[*_`#]/g, '');
        this.promptInput.value = cleanText;
        this.promptInput.focus();
      };
      messageDiv.appendChild(useButton);
    }

    this.chatMessages.appendChild(messageDiv);
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;

    // Initialize syntax highlighting for code blocks
    messageDiv.querySelectorAll('pre code').forEach((block) => {
      hljs.highlightElement(block);
    });

    return messageDiv.id;
  }

  addTypingIndicator() {
    const id = 'typing-' + Date.now();
    const indicator = document.createElement('div');
    indicator.id = id;
    indicator.className = 'message assistant typing';
    indicator.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';
    this.chatMessages.appendChild(indicator);
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    return id;
  }

  removeTypingIndicator(id) {
    const indicator = document.getElementById(id);
    if (indicator) {
      indicator.remove();
    }
  }

  async sendMessageToGPT(message) {
    try {
      const selectedModel = this.modelSelector?.value || 'grok-beta';
      console.log('Sending request with model:', selectedModel);
      
      const response = await fetch('/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            {
              role: "system",
              content: "You are an AI assistant specialized in creating detailed image generation prompts. Create vivid, descriptive prompts that include style, mood, lighting, and composition details. Keep responses focused and concise."
            },
            ...this.messageHistory,
            {
              role: "user",
              content: message
            }
          ]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(errorData.error || 'Failed to get response from GPT');
      }

      const data = await response.json();
      console.log('API Response:', data);

      if (!data.choices?.[0]?.message) {
        throw new Error('Invalid response format from API');
      }

      return data.choices[0].message.content;
    } catch (error) {
      console.error('Error calling GPT:', error);
      throw error;
    }
  }
}

// Initialize chat when document is loaded
document.addEventListener('DOMContentLoaded', () => {
  new ChatUI();
}); 