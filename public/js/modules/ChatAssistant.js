/**
 * ChatAssistant class handles the AI prompt assistant functionality
 */
export class ChatAssistant {
  constructor() {
    this.chatMessages = document.getElementById('chatMessages');
    this.chatForm = document.getElementById('chatForm');
    this.chatInput = document.getElementById('chatInput');
    this.promptInput = document.getElementById('prompt');
    this.messageHistory = [];
    
    this.openai = {
      baseURL: "http://localhost:1400/xai/v1"
    };
    
    this.setupMarked();
    this.setupEventListeners();
  }

  /**
   * Initialize marked parser with options
   * @private
   */
  setupMarked() {
    this.marked = marked;
    this.marked.setOptions({
      highlight: (code, lang) => {
        const language = hljs.getLanguage(lang) ? lang : 'plaintext';
        return hljs.highlight(code, { language }).value;
      },
      langPrefix: 'hljs language-',
      breaks: true,
      gfm: true
    });
  }

  /**
   * Setup event listeners
   * @private
   */
  setupEventListeners() {
    this.chatForm.addEventListener('submit', this.handleSubmit.bind(this));
    this.chatInput.addEventListener('input', this.handleInputResize.bind(this));
  }

  /**
   * Handle form submission
   * @private
   * @param {Event} e - Form submit event
   */
  async handleSubmit(e) {
    e.preventDefault();
    const message = this.chatInput.value.trim();
    if (!message) return;

    // Add user message
    this.addMessage(message, 'user');
    this.messageHistory.push({ role: "user", content: message });
    this.chatInput.value = '';

    try {
      // Show typing indicator
      const typingId = this.addTypingIndicator();

      // Get AI response
      const response = await this.sendMessageToGPT(message);

      // Remove typing indicator
      this.removeTypingIndicator(typingId);

      // Add AI response with "Use Prompt" button
      this.addMessage(response, 'assistant', true);
      this.messageHistory.push({ role: "assistant", content: response });

    } catch (error) {
      console.error('Chat error:', error);
      this.addMessage('Sorry, I encountered an error. Please try again.', 'system');
    }
  }

  /**
   * Handle textarea auto-resize
   * @private
   */
  handleInputResize() {
    this.chatInput.style.height = 'auto';
    this.chatInput.style.height = this.chatInput.scrollHeight + 'px';
  }

  /**
   * Add message to chat
   * @private
   * @param {string} text - Message text
   * @param {string} type - Message type (user/assistant/system)
   * @param {boolean} addUseButton - Whether to add "Use Prompt" button
   * @returns {string} Message element ID
   */
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
      useButton.className = 'btn btn-primary btn-sm mt-2';
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

  /**
   * Add typing indicator
   * @private
   * @returns {string} Indicator element ID
   */
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

  /**
   * Remove typing indicator
   * @private
   * @param {string} id - Indicator element ID
   */
  removeTypingIndicator(id) {
    const indicator = document.getElementById(id);
    if (indicator) {
      indicator.remove();
    }
  }

  /**
   * Send message to GPT
   * @private
   * @param {string} message - User message
   * @returns {Promise<string>} AI response
   */
  async sendMessageToGPT(message) {
    try {
      const response = await fetch('/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
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