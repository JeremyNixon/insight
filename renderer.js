// Global state
let contextFiles = [];
let isProcessing = false;

// DOM elements
const elements = {
    selectFilesBtn: document.getElementById('selectFilesBtn'),
    selectFolderBtn: document.getElementById('selectFolderBtn'),
    clearContextBtn: document.getElementById('clearContextBtn'),
    contextFiles: document.getElementById('contextFiles'),
    fileCount: document.getElementById('fileCount'),
    totalSize: document.getElementById('totalSize'),
    chatMessages: document.getElementById('chatMessages'),
    chatInput: document.getElementById('chatInput'),
    sendBtn: document.getElementById('sendBtn'),
    modelSelect: document.getElementById('modelSelect'),
    connectionStatus: document.getElementById('connectionStatus'),
    connectionText: document.getElementById('connectionText'),
    loadingOverlay: document.getElementById('loadingOverlay'),
    loadingText: document.getElementById('loadingText')
};

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
    await initializeApp();
    setupEventListeners();
});

async function initializeApp() {
    // Test Ollama connection
    await testOllamaConnection();
    
    // Load available models
    await loadAvailableModels();
    
    // Update UI
    updateContextDisplay();
    updateSendButtonState();
}

function setupEventListeners() {
    // File selection
    elements.selectFilesBtn.addEventListener('click', handleSelectFiles);
    elements.selectFolderBtn.addEventListener('click', handleSelectFolder);
    elements.clearContextBtn.addEventListener('click', handleClearContext);
    
    // Chat
    elements.sendBtn.addEventListener('click', handleSendMessage);
    elements.chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    });
    
    elements.chatInput.addEventListener('input', updateSendButtonState);
    
    // Auto-resize textarea
    elements.chatInput.addEventListener('input', () => {
        elements.chatInput.style.height = 'auto';
        elements.chatInput.style.height = Math.min(elements.chatInput.scrollHeight, 120) + 'px';
    });
}

async function testOllamaConnection() {
    updateConnectionStatus('checking', 'Checking connection...');
    
    try {
        const result = await window.electronAPI.testOllama();
        if (result.success) {
            updateConnectionStatus('connected', 'Connected to Ollama');
        } else {
            updateConnectionStatus('disconnected', result.error);
        }
    } catch (error) {
        updateConnectionStatus('disconnected', 'Connection failed');
    }
}

function updateConnectionStatus(status, text) {
    elements.connectionStatus.className = `status-indicator ${status}`;
    elements.connectionText.textContent = text;
}

async function loadAvailableModels() {
    try {
        const result = await window.electronAPI.getOllamaModels();
        if (result.success && result.models.length > 0) {
            elements.modelSelect.innerHTML = '';
            result.models.forEach(model => {
                const option = document.createElement('option');
                option.value = model.name;
                option.textContent = model.name;
                elements.modelSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading models:', error);
    }
}

async function handleSelectFiles() {
    try {
        showLoading('Selecting files...');
        const filePaths = await window.electronAPI.selectFiles();
        if (filePaths.length > 0) {
            await processFiles(filePaths);
        }
    } catch (error) {
        console.error('Error selecting files:', error);
        showErrorMessage('Error selecting files: ' + error.message);
    } finally {
        hideLoading();
    }
}

async function handleSelectFolder() {
    try {
        showLoading('Selecting folder...');
        const folderPath = await window.electronAPI.selectFolder();
        if (folderPath) {
            await processFiles([folderPath]);
        }
    } catch (error) {
        console.error('Error selecting folder:', error);
        showErrorMessage('Error selecting folder: ' + error.message);
    } finally {
        hideLoading();
    }
}

async function processFiles(filePaths) {
    try {
        showLoading('Processing files...');
        const processedFiles = await window.electronAPI.processFiles(filePaths);
        
        // Add new files to context (avoid duplicates)
        processedFiles.forEach(file => {
            const exists = contextFiles.some(existing => existing.path === file.path);
            if (!exists) {
                contextFiles.push(file);
            }
        });
        
        updateContextDisplay();
        updateSendButtonState();
        
        if (processedFiles.length > 0) {
            addSystemMessage(`Loaded ${processedFiles.length} files successfully.`);
        }
    } catch (error) {
        console.error('Error processing files:', error);
        showErrorMessage('Error processing files: ' + error.message);
    }
}

function handleClearContext() {
    contextFiles = [];
    updateContextDisplay();
    updateSendButtonState();
    addSystemMessage('Context cleared.');
}

function updateContextDisplay() {
    const totalSize = contextFiles.reduce((sum, file) => sum + file.size, 0);
    
    elements.fileCount.textContent = `${contextFiles.length} files loaded`;
    elements.totalSize.textContent = formatFileSize(totalSize);
    
    if (contextFiles.length === 0) {
        elements.contextFiles.innerHTML = `
            <div class="empty-state">
                <p>No files loaded. Select files or a folder to add context.</p>
            </div>
        `;
    } else {
        elements.contextFiles.innerHTML = contextFiles.map((file, index) => `
            <div class="file-item">
                <div class="file-header">
                    <span class="file-name">${file.name}</span>
                    <button class="remove-file" onclick="removeFile(${index})" title="Remove file">×</button>
                </div>
                <div class="file-size">${formatFileSize(file.size)}</div>
                <div class="file-preview">${truncateText(file.content, 200)}</div>
            </div>
        `).join('');
    }
}

function removeFile(index) {
    contextFiles.splice(index, 1);
    updateContextDisplay();
    updateSendButtonState();
}

function updateSendButtonState() {
    const hasMessage = elements.chatInput.value.trim().length > 0;
    elements.sendBtn.disabled = !hasMessage || isProcessing;
}

async function handleSendMessage() {
    const message = elements.chatInput.value.trim();
    if (!message || isProcessing) return;
    
    // Clear input immediately
    elements.chatInput.value = '';
    elements.chatInput.style.height = 'auto';
    updateSendButtonState();
    
    // Add user message
    addMessage('user', message);
    
    try {
        isProcessing = true;
        updateSendButtonState();
        
        // Show typing indicator
        const typingMessage = addMessage('assistant', '...');
        
        // Send to Ollama
        const response = await window.electronAPI.ollamaChat({
            prompt: message,
            context: contextFiles,
            model: elements.modelSelect.value
        });
        
        // Remove typing indicator
        typingMessage.remove();
        
        if (response.success) {
            addMessage('assistant', response.content);
        } else {
            addMessage('error', `Error: ${response.error}`);
        }
    } catch (error) {
        console.error('Chat error:', error);
        addMessage('error', `Error: ${error.message}`);
    } finally {
        isProcessing = false;
        updateSendButtonState();
    }
}

function addMessage(type, content) {
    // Remove welcome message if it exists
    const welcomeMessage = elements.chatMessages.querySelector('.welcome-message');
    if (welcomeMessage) {
        welcomeMessage.remove();
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    
    if (type === 'assistant') {
        // Format assistant messages with basic markdown-like formatting
        messageDiv.innerHTML = formatMessage(content);
    } else {
        messageDiv.textContent = content;
    }
    
    elements.chatMessages.appendChild(messageDiv);
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
    
    return messageDiv;
}

function addSystemMessage(content) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message system';
    messageDiv.style.cssText = 'background: #2a4d3a; color: #90ee90; text-align: center; margin: 0.5rem auto; max-width: 300px; font-size: 0.85rem;';
    messageDiv.textContent = content;
    
    elements.chatMessages.appendChild(messageDiv);
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
}

function showErrorMessage(content) {
    addMessage('error', content);
}

function formatMessage(content) {
    // Basic formatting for code blocks and inline code
    return content
        .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\n/g, '<br>');
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

function showLoading(text) {
    elements.loadingText.textContent = text;
    elements.loadingOverlay.classList.remove('hidden');
}

function hideLoading() {
    elements.loadingOverlay.classList.add('hidden');
}

// Make removeFile function globally available
window.removeFile = removeFile;