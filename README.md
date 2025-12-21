# LC3 Assembler Web Application

This project is a web-based LC3 assembler built with Node.js, Express, and CodeMirror. It allows users to write LC3 assembly code in the browser, assemble it using a server side assembler.

## Features

- **Assembly Editor:** Write LC3 assembly code with syntax highlighting and tab support using CodeMirror.
- **Binary Viewer:** View the assembled binary code in a read-only editor.
- **One-Click Assemble:** Convert assembly code to binary with a single button click.
- **Client Assembler Integration:** No need to worry about delays when assembling is performed on the client side.

## How It Works
- Users write LC3 assembly code in the browser
- Clicking the assembly button would initiate the assembling process
- Any errors whether semantic or syntactic, will be pointed out in a user friendly manner (still in dev)
- If there are no errors, the assembled version of your code would be shown in a human readable format (i.e  the binary code with a description of the assembly before conversion)
- The binary code is displayed in the read-only binary editor

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

## Upcoming Updates

- Linting
- Containerization (with Docker)
- Deploying the backend online
- Option to switch to a simulator to see how the program would be executed (still in dev)
- Update the compile to produce diagnostics for syntax errors
- Fix tab and shift + tab functionality when text is hightlighted
- Make the line number in the binary view correspond to the assembly code's line number in the assembly view