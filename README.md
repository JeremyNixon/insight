# Insight

An AI-powered document analysis and chat application built with Electron and Ollama.

## Overview

Insight is a desktop application that combines the power of local AI models with an intuitive interface for document analysis and intelligent conversations. Built on Electron, it provides a native desktop experience while leveraging Ollama for AI capabilities.

## Features

- 🤖 **AI-Powered Chat**: Engage in intelligent conversations using local LLM models
- 📄 **Document Analysis**: Upload and analyze various document formats
- 🔒 **Privacy-First**: All processing happens locally using Ollama
- 💻 **Cross-Platform**: Works on Windows, macOS, and Linux
- 📝 **Multiple Formats**: Support for various document types including Word documents
- ⚡ **Fast Performance**: Native desktop performance with Electron

## Prerequisites

Before running Insight, make sure you have:

- **Node.js** (version 16 or higher)
- **Ollama** installed and running on your system
  - Download from: https://ollama.ai
  - Pull a model (e.g., `ollama pull llama2`)

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd insight
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start Ollama** (if not already running)
   ```bash
   ollama serve
   ```

## Usage

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

### Building for Distribution
```bash
npm run build
```

This will create distributable packages in the `dist/` directory for your platform.

## Project Structure

```
insight/
├── main.js           # Main Electron process
├── preload.js        # Preload script for secure renderer communication
├── renderer.js       # Renderer process logic
├── index.html        # Main application UI
├── styles.css        # Application styles
├── package.json      # Project configuration
└── README.md         # This file
```

## Dependencies

### Core Dependencies
- **electron**: Desktop application framework
- **ollama**: AI model integration
- **mammoth**: Word document processing
- **fs-extra**: Enhanced file system operations

### Development Dependencies
- **electron-builder**: Application packaging and distribution

## Configuration

The application can be configured through:

- **Ollama Models**: Configure which AI models to use
- **Document Processing**: Customize supported file types and processing options
- **UI Preferences**: Modify interface settings and themes

## Supported Document Formats

- Microsoft Word (.docx)
- Plain text (.txt)
- Additional formats can be added through the extensible document processing system

## AI Models

Insight works with any Ollama-compatible model. Popular choices include:

- **llama2**: General-purpose conversational AI
- **codellama**: Code-focused assistance
- **mistral**: Efficient and capable general model
- **neural-chat**: Specialized for conversations

To add a new model:
```bash
ollama pull <model-name>
```

## Troubleshooting

### Common Issues

1. **Ollama not found**
   - Ensure Ollama is installed and running
   - Check that `ollama serve` is active

2. **Document processing errors**
   - Verify file format is supported
   - Check file permissions and accessibility

3. **Build issues**
   - Clear node_modules and reinstall: `rm -rf node_modules && npm install`
   - Ensure all dependencies are compatible

### Getting Help

If you encounter issues:

1. Check the console for error messages
2. Verify Ollama is properly configured
3. Ensure all dependencies are installed correctly

## Development

### Adding New Features

1. **Document Processors**: Extend support for new file formats
2. **AI Integrations**: Add support for additional AI providers
3. **UI Components**: Enhance the user interface and experience

### Code Style

- Use modern JavaScript (ES6+)
- Follow Electron security best practices
- Maintain separation between main and renderer processes

## Security

Insight follows Electron security best practices:

- Context isolation enabled
- Node integration disabled in renderer
- Secure preload scripts for IPC communication
- Local-only AI processing (no data sent to external servers)

## License

MIT License - see LICENSE file for details.

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## Roadmap

- [ ] Additional document format support
- [ ] Enhanced AI model management
- [ ] Plugin system for extensibility
- [ ] Advanced document search and indexing
- [ ] Multi-language support

---

**Note**: This application processes all data locally using Ollama. No information is sent to external servers, ensuring your privacy and data security. 