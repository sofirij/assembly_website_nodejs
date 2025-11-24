const { assemblyView, binaryView, assembleButton } = require('./index.js');
const nearley = require('nearley');
const grammar = require('./lc3.js');



// perform linting
// pass data through and return any errors
assembleButton.addEventListener('click', () => {
    console.log('Assemble button clicked');

    // clear the binary view
    binaryView.dispatch({
        changes: {from: 0, to: binaryView.state.doc.length, insert: ''}
    });

    const lines = assemblyView.state.doc.lines;

    for (let pos = 1; pos <= lines; pos++) {
        const line = assemblyView.state.doc.line(pos);
        const text = line.text;
        const length = binaryView.state.doc.length;

        // don't try to assemble empty lines
        if (text === '') {
            // skip the line on the binary view
            binaryView.dispatch({
                changes: {
                    from: length,
                    to: length,
                    insert: '\n'
                }
            });
            continue;
        }
        
        const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
        let toInsert;
        
        try { 
            parser.feed(text);
            toInsert = 'Incomplete line\n';
        } catch (e) {
            toInsert = 'Invalid syntax\n';
        }

        if (parser.results) {
            toInsert = '';
            const result = parser.results[0];
            // print labels and comments instead of assembly
            switch (result.type) {
                case 'commentLine': {
                    if (result.label) {
                        toInsert += result.label;
                    }
                    toInsert += ' ' + result.comment;
                    break;
                }
                case 'labelLine':
                    toInsert += result.label;
                    break;
                default:
                    if (result.label) {
                        toInsert += result.label + '\n';
                    }
                    toInsert += result.binary + ' ' + (result.comment ? result.comment : '');
                    break;
            }

            // don't add a new line after the last line
            if (pos !== lines) {
                toInsert = toInsert + '\n';
            }    
        }

        // update the binary view by showing the assembled code
        binaryView.dispatch({
            changes: {
                from: length,
                to: length,
                insert: toInsert
            }
        });
    }
});