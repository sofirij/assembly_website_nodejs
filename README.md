# LC3 Assembler Web Application

This project is a web-based LC3 assembler built with Node.js, Express, and CodeMirror. It allows users to write LC3 assembly code in the browser, assemble it using a native executable, and view the resulting binary code.

## Features

- **Assembly Editor:** Write LC3 assembly code with syntax highlighting and tab support using CodeMirror.
- **Binary Viewer:** View the assembled binary code in a read-only editor.
- **One-Click Assemble:** Convert assembly code to binary with a single button click.
- **Native Assembler Integration:** Uses a C-based assembler executable (`assembler.exe`) on the backend for accurate assembly.

## How It Works

1. **Frontend:**  
   - Users write LC3 assembly code in the browser.
   - Clicking "Assemble" sends the code to the backend via a POST request.

2. **Backend:**  
   - The Express server receives the code and runs `assembler.exe`, passing the code as input.
   - The assembler processes the code and returns the binary output.
   - The server responds with the binary code as JSON.

3. **Frontend:**  
   - The binary code is displayed in the read-only binary editor.

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Build frontend assets:**
   ```bash
   npm run build
   ```

3. **Start the server:**
   ```bash
   node src/server/app.js
   ```

4. **Open your browser:**  
   Visit [http://localhost:3000](http://localhost:3000)

## Requirements

- Node.js and npm
- Webpack (configured in `webpack.config.js`)
- A compiled `assembler.exe` in `src/server/exe/` (Windows only)

## Notes

- The assembler executable must be built and placed in `src/server/exe/`.
- The project uses strict Content Security Policy for security.
- All code editing and viewing is done in the browser using CodeMirror.

## Upcoming Updates

- Linting
- Containerization (with Docker)
- Deploying the backend online
- Server side assembling
