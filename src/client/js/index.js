require('../css/styles.css');
const {basicSetup} = require('codemirror');
const {EditorState} = require('@codemirror/state');
const {EditorView, keymap} = require('@codemirror/view');

// State for assembly code container
let assemblyState = EditorState.create({
    doc: '',
    extensions: [basicSetup, EditorView.lineWrapping, keymap.of({key: 'Tab', run: simulateTab})]
});

let assemblyView = new EditorView({
    state: assemblyState,
    parent: document.getElementById('assembly-container')
});

// State for binary code container
let binaryState = EditorState.create({
    doc: '',
    extensions: [basicSetup, EditorView.lineWrapping, EditorView.editable.of(false)]
});

let binaryView = new EditorView({
    state: binaryState,
    parent: document.getElementById('binary-container')
});

// Send a request to the server with the assemble button
const assembleButton = document.getElementById('assemble-button');

assembleButton.addEventListener('click', async () => {
    // clear the binary view
    
    clearBinaryView(binaryView);

    // send a request to the server to assemble the code to binary
    const assemblyCode = assemblyView.state.doc.toString();
    const response = await fetch('/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({assemblyCode: assemblyCode})
    });

    // display the binary code
    const result = await response.json();
    const binaryCode = result.binaryCode.trim();

    console.log(binaryCode);

    displayBinaryCode(binaryView, binaryCode);
});

// Simulate the 4 space indent by a Tab key press
function simulateTab(view) {
    const {state, dispatch} = view;
    const pos = state.selection.main.head;

    const transaction = state.update({
        changes: {from: pos, insert: '    '},
        selection: {anchor: pos + 4}
    });

    dispatch(transaction);

    return true;
}

// Display the binary code in the binary view
function displayBinaryCode(view, binaryCode) {
    let cursorPos = view.state.selection.main.head;
    
    view.dispatch({
        changes: {from: cursorPos, insert: binaryCode}
    });
}

// Clear the binary view
function clearBinaryView(view) {
    view.dispatch({
        changes: {from: 0, to: view.state.doc.length, insert: ''}
    });
}