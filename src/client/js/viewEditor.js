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
            insert: toInsert
        }
    });
}

function trimView(view) {
    const text = view.state.doc.toString();
    
    const start = text.search(/\S/);
    const end = text.search(/\s*$/);

    if (start === -1) {
        // document is all whitespace
        view.dispatch({
            changes: { from: 0, to: view.state.doc.length, insert: ''}
        });
    } else {
        view.dispatch({
            changes: [
                {from: 0, to: start},
                {from: end, to: view.state.doc.length}
            ]
        });
    }
}

module.exports = {simulateTab, clearBinaryView, viewInsertAtEnd, trimView};