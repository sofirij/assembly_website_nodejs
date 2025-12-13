const {EditorView} = require('@codemirror/view');

// define colors for the assembly view
const assemblyViewTheme = EditorView.baseTheme({
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

module.exports = {assemblyViewTheme};