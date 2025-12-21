const {EditorView, lineNumbers} = require('@codemirror/view');

// define theme for the assembly view
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
    },
    '.cm-lineNumbers .cm-gutterElement': {
        'text-align': 'right',
    },
    '.cm-gutter.cm-foldGutter': {
        'width': '0px'
    }
});

// define theme for the binary view
const binaryViewTheme = EditorView.baseTheme({
    '.cm-selectionBackground': {
        'backgroundColor': '#284B63 !important'
    },
    '.cm-lineNumbers .cm-gutterElement': {
        'text-align': 'right',
    },
    'cm-gutters': {
        'background-color': '#1e1e1e !important'
    },
    "&": {
        "outline": "none !important",
        "width": "100%",
        "background-color": "#1e1e1e",
        "color": "#D4D4D4"
    },
});

const lineNumberGutter = lineNumbers({});

module.exports = {assemblyViewTheme, lineNumberGutter, binaryViewTheme};