const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  selectFiles: () => ipcRenderer.invoke('select-files'),
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  processFiles: (filePaths) => ipcRenderer.invoke('process-files', filePaths),
  ollamaChat: (data) => ipcRenderer.invoke('ollama-chat', data),
  getOllamaModels: () => ipcRenderer.invoke('get-ollama-models'),
  testOllama: () => ipcRenderer.invoke('test-ollama')
});