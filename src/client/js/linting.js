const {EditorView} = require('@codemirror/view');
const {linter} = require('@codemirror/lint');
const {compileAssembly} = require('./compile.js');

// define the lint extension for the assembly view
// create the lint source
function lintSource(view) {
    const binaryCode = compileAssembly(view);

    // this occurs in the event that the assembly view is empty
    if (!binaryCode || binaryCode.outcome === 'pass') {
        return [];
    }

    const errors = binaryCode.result;
    return createDiagnosticList(view, errors);
}

function renderErrorMessage(message) {
    const dom = document.createElement('div');
    dom.style.backgroundColor = '#1e1e1e';
    dom.style.display = 'inline-block';


    const p = document.createElement('p');
    p.textContent = message;
    p.style.color = '#FFD700';
    p.style.fontSize = '15px';

    dom.appendChild(p);
    return dom;
}

function createDiagnosticList(view, errors) {
    console.log('Creating the diagnostics list');
    const diagnostics = [];

    errors.forEach(errorObject => {
        const line = errorObject.line;
        const lineErrors = errorObject.errors;
        const lineOffset = view.state.doc.line(line).from;

        lineErrors.forEach(error => {
            const errorMessage = `${error.type}: ${error.message} on line ${line}`;
            diagnostics.push({
                from: lineOffset + error.start,
                to: lineOffset + error.end,
                severity: 'error',
                message: errorMessage,
                renderMessage: () => renderErrorMessage(errorMessage)
            });
        });
    });

    diagnostics.forEach(diagnostic => console.log(`${diagnostic.from} ${diagnostic.to} ${diagnostic.severity} ${diagnostic.message}`));

    return diagnostics;
}

// define the theme for the lint panel
const lintPanelTheme = EditorView.theme({
    '.cm-panel.cm-panel-lint ul [aria-selected]': {
        'padding-left': '3px',
        'backgroundColor': '#1e1e1e'
    },
    '.cm-diagnostic.cm-diagnostic-error': {
        'backgroundColor': '#1e1e1e',
        'border-left': 'none',
        'padding': 'none'
    },
    '.cm-panel.cm-panel-lint [name=close]': {
        'position': 'absolute',
        'right': '17px',
        'background': 'inherit',
        'border': 'none',
        'font': 'inherit',
        'padding': '0',
        'margin': '0',
        'color': 'white'
    }
});

// configuration for the lint extension
const lintConfig = {
    autoPanel: true
}

// create the linter extension
const linterExtension = linter(lintSource, lintConfig);



module.exports = {linterExtension, lintPanelTheme};