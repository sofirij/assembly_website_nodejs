// const { setDiagnostics } = require('@codemirror/lint');
const {linter} = require('@codemirror/lint');
const {compileAssembly} = require('./compile.js');

// define the lint extension for the assembly view
// create the lint source
function lintSource(view) {
    const result = compileAssembly(view);

    // this occurs in the event that the assembly view is empty
    if (!result) {
        return [];
    }

    if (result.fail) {
        const errors = result.fail;
        return createDiagnosticList(view, errors);
    }

    // if compiling doesn't fail that means there are no diagnostics to display
    return [];
}

function renderErrorMessage(message) {
    const dom = document.createElement('div');
    dom.style.color = '#1e1e1e';
    dom.style.display = 'inline-block';


    const p = document.createElement('p');
    p.textContent = message;
    p.style.color = '#1e1e1e';

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

// configuration for the lint extension
const lintConfig = {
    autoPanel: true
}

// create the linter extension
const linterExtension = linter(lintSource, lintConfig);

/*
function displayErrors(view, errors) {
    console.log('Tried to display errors');
    const diagnosticList = createDiagnosticList(view, errors);
    const lintingEffect = setDiagnostics(view.state, diagnosticList);
    view.dispatch(lintingEffect);
    
    console.log('Linting done');
}*/

module.exports = {linterExtension};