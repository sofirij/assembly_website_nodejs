require('../css/styles.css'); // added so bundling could include css

const {basicSetup, minimalSetup} = require('codemirror');
const {EditorState} = require('@codemirror/state');
const {EditorView, keymap, lineNumbers} = require('@codemirror/view');
const {simulateTab, viewInsertAtEnd, trimView} = require('./viewEditor.js');
const {highlightExtension} = require('./highlight.js');
const {linterExtension, lintPanelTheme} = require('./linting.js');
const {assemblyViewTheme, binaryViewTheme} = require('./theme.js');
const {compileAssembly} = require('./compile.js');

let binaryCodeObject = null;
let binaryLineNumbers = null;

// State for binary code container
const binaryState = EditorState.create({
    extensions: [
        minimalSetup, 
        binaryViewTheme,
        EditorView.lineWrapping, 
        EditorView.editable.of(false),
        lineNumbers({
            formatNumber: formatNumber
        }),
    ]   
});

const binaryView = new EditorView({
    state: binaryState,
    parent: document.getElementById('binary-container')
});

// State for assembly code container
const assemblyState = EditorState.create({
    doc: '',
    extensions: [
        basicSetup,
        EditorView.lineWrapping,
        keymap.of({key: 'Tab', run: simulateTab}),
        highlightExtension,
        assemblyViewTheme,
        linterExtension,
        lintPanelTheme,
    ]
});

const assemblyView = new EditorView({
    state: assemblyState,
    parent: document.getElementById('assembly-container')
});


const assembleButton = document.getElementById('assemble-button');

assembleButton.addEventListener('click', () => {
    console.log('Assemble button clicked');

    binaryCodeObject = null;
    binaryLineNumbers = null;

    // clear the binary view
    binaryView.dispatch({
        changes: {from: 0, to: binaryView.state.doc.length, insert: ''}
    });

    const binaryCode = compileAssembly(assemblyView);

    if (binaryCode.outcome === 'pass') {
        binaryCodeObject = binaryCode.result;
        const keys = getSortedListOfKeys(binaryCodeObject);

        binaryLineNumbers = new Set(keys);

        for (let key of keys) {
            viewInsertAtEnd(binaryView, binaryCodeObject[key].binaryCode);
        }
    }

    trimView(binaryView);
});


function formatNumber (lineNo) {
    if (binaryCodeObject === null) {
        return lineNo.toString();
    }

    let floor = lineNo;
    
    while (!binaryLineNumbers.has(floor)) {
        floor--;
    }

    const assemblyLineNumber = binaryCodeObject[floor].assemblyLineNumber;

    return assemblyLineNumber.toString();
}

function getSortedListOfKeys (object) {
    return Object.keys(object).map(Number).sort((a, b) => a - b);
}