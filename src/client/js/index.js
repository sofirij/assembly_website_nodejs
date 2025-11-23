require('../css/styles.css');
const {basicSetup} = require('codemirror');
const {EditorState} = require('@codemirror/state');
const {EditorView, keymap} = require('@codemirror/view');
const {simulateTab, displayBinaryCode, clearBinaryView} = require('./codeEditor.js');
const {highlightField} = require('./highlightField.js');



const opcodes = ["add", "and", "br", "brn", "brz", "brp", "brnz", "brnp", "brzp", "brnzp", "ld", "ldi", "ldr", "lea", "not", "st", "sti", "str", "trap", "halt", "ret", "rti", "jmp", "jsr", "jsrr", "getc", "out", "puts", "in"];
const assemblerDirectives = [".orig", ".end", ".fill", ".blkw", ".stringz"];


const assemblyTheme = EditorView.baseTheme({
    "&.cm-focused .cm-content": {
        "caret-color": "#FFD700 !important"
    },
    ".cm-selectionBackground": {
        "backgroundColor": "#284B63 !important"
    },
    ".cm-cursor, .cm-dropCursor": {
        "borderLeftColor": "#FFD700"
    },
    "&": {
        "outline": "none !important",
        "width": "100%",
        "background-color": "#1e1e1e",
        "color": "#D4D4D4"
    },
    ".cm-gutters": {
        "background-color": "#1e1e1e !important"
    }
});

// State for assembly code container
let assemblyState = EditorState.create({
    doc: '',
    extensions: [
        basicSetup,
        EditorView.lineWrapping,
        keymap.of({key: 'Tab', run: simulateTab}),
        highlightField,
        assemblyTheme
    ]
});

let assemblyView = new EditorView({
    state: assemblyState,
    parent: document.getElementById('assembly-container')
});



// State for binary code container
let binaryState = EditorState.create({
    extensions: [
        basicSetup, 
        EditorView.lineWrapping, 
        EditorView.editable.of(false)
    ]
});

let binaryView = new EditorView({
    state: binaryState,
    parent: document.getElementById('binary-container')
});



const assembleButton = document.getElementById('assemble-button');


module.exports = {
    assemblyView,
    binaryView,
    assembleButton
};
