const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs-extra');
const mammoth = require('mammoth');
const { Ollama } = require('ollama');

let mainWindow;
// Initialize ollama instance
const ollama = new Ollama({ host: 'http://127.0.0.1:11434' });

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'assets/icon.png'), // Optional: add your app icon
    titleBarStyle: 'default'
  });

  mainWindow.loadFile('index.html');

  // Open DevTools in development
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// File selection handler
ipcMain.handle('select-files', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Documents', extensions: ['txt', 'docx'] },
      { name: 'Text Files', extensions: ['txt'] },
      { name: 'Word Documents', extensions: ['docx'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  if (!result.canceled) {
    return result.filePaths;
  }
  return [];
});

// Folder selection handler
ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });

  if (!result.canceled) {
    return result.filePaths[0];
  }
  return null;
});

// Read and process files
ipcMain.handle('process-files', async (event, filePaths) => {
  const processedFiles = [];

  for (const filePath of filePaths) {
    try {
      const stat = await fs.stat(filePath);
      
      if (stat.isDirectory()) {
        // Process all txt and docx files in directory
        const files = await fs.readdir(filePath);
        const docFiles = files.filter(file => 
          file.endsWith('.txt') || file.endsWith('.docx')
        );
        
        for (const file of docFiles) {
          const fullPath = path.join(filePath, file);
          const content = await readFileContent(fullPath);
          if (content) {
            processedFiles.push({
              path: fullPath,
              name: file,
              content: content,
              size: (await fs.stat(fullPath)).size
            });
          }
        }
      } else {
        // Process single file
        const content = await readFileContent(filePath);
        if (content) {
          processedFiles.push({
            path: filePath,
            name: path.basename(filePath),
            content: content,
            size: stat.size
          });
        }
      }
    } catch (error) {
      console.error(`Error processing ${filePath}:`, error);
    }
  }

  return processedFiles;
});

// Read file content based on extension
async function readFileContent(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  
  try {
    if (ext === '.txt') {
      return await fs.readFile(filePath, 'utf8');
    } else if (ext === '.docx') {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value;
    }
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return null;
  }
  
  return null;
}

// Ollama chat handler
ipcMain.handle('ollama-chat', async (event, { prompt, context, model }) => {
  try {
    // Combine context with user prompt
    let fullPrompt = '';
    
    if (context && context.length > 0) {
      fullPrompt += 'Based on the following context:\n\n';
      context.forEach((file, index) => {
        fullPrompt += `--- ${file.name} ---\n${file.content}\n\n`;
      });
      fullPrompt += `---\n\nQuestion: ${prompt}`;
    } else {
      fullPrompt = prompt;
    }

    const response = await ollama.chat({
      model: model || 'llama3.1',
      messages: [
        {
          role: 'user',
          content: fullPrompt,
        },
      ],
    });

    return {
      success: true,
      content: response.message.content
    };
  } catch (error) {
    console.error('Ollama error:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

// Get available Ollama models
ipcMain.handle('get-ollama-models', async () => {
  try {
    const models = await ollama.list();
    return {
      success: true,
      models: models.models
    };
  } catch (error) {
    console.error('Error getting models:', error);
    return {
      success: false,
      error: error.message,
      models: []
    };
  }
});

// Test Ollama connection
ipcMain.handle('test-ollama', async () => {
  try {
    await ollama.list();
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: 'Cannot connect to Ollama. Make sure Ollama is running.' 
    };
  }
});