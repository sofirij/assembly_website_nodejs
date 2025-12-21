require('../css/styles.css'); // added so bundling could include css

const {basicSetup} = require('codemirror');
const {EditorState} = require('@codemirror/state');
const {EditorView, keymap} = require('@codemirror/view');
const {simulateTab, viewInsertAtEnd} = require('./viewEditor.js');
const {highlightExtension} = require('./highlight.js');
const {linterExtension, lintPanelTheme} = require('./linting.js');
const {assemblyViewTheme} = require('./theme.js');
const {compileAssembly} = require('./compile.js');



// State for binary code container
const binaryState = EditorState.create({
    extensions: [
        basicSetup, 
        EditorView.lineWrapping, 
        EditorView.editable.of(false),
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
        lintPanelTheme
    ]
});

const assemblyView = new EditorView({
    state: assemblyState,
    parent: document.getElementById('assembly-container')
});


const assembleButton = document.getElementById('assemble-button');

assembleButton.addEventListener('click', () => {
    console.log('Assemble button clicked');

    // clear the binary view
    binaryView.dispatch({
        changes: {from: 0, to: binaryView.state.doc.length, insert: ''}
    });

    const binaryCode = compileAssembly(assemblyView);

    if (binaryCode.pass) {
        const result = binaryCode.pass.trim();
        viewInsertAtEnd(binaryView, result);
    }
});
