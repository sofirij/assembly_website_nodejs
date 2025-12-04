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

// insert text at end of codemirror view
function viewInsertAtEnd(view, toInsert) {
    const length = view.state.doc.length;
    view.dispatch({
        changes: {
            from: length,
            to: length,
            insert: toInsert + '\n'
        }
    });
}

module.exports = {simulateTab, displayBinaryCode, clearBinaryView, viewInsertAtEnd};