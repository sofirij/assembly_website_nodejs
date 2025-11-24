const moo = require('moo');
const {StateField} = require('@codemirror/state');
const {Decoration, EditorView} = require('@codemirror/view');

const commentHighlight = Decoration.mark({class: 'commentHighlight'});
const opcodeHighlight = Decoration.mark({class: 'opcodeHighlight'});
const errorHighlight = Decoration.mark({class: 'errorHighlight'});
const directiveHighlight = Decoration.mark({class: 'directiveHighlight'});
const labelOperandHighlight = Decoration.mark({class: 'labelOperandHighlight'});
const labelHighlight = Decoration.mark({class: 'labelHighlight'});
const registerHighlight = Decoration.mark({class: 'registerHighlight'});
const constantHighlight = Decoration.mark({class: 'constantHighlight'});

const lexer = require('./lexer.js');

const highlightField = StateField.define({
    create() {
        return Decoration.none;
    },
    update(deco, tr) {
        deco = deco.map(tr.changes);

        const newDecos = [];

        // tokenize each line with the lexer and highlight each token
        if (tr.docChanged) {
            const uniqueAffectedLines = new Set();

            // only work on the new lines
            tr.changes.iterChanges((from, to, fromA, toA, inserted) => {
                const startLineNew = tr.state.doc.lineAt(fromA).number;
                const endLineNew = tr.state.doc.lineAt(toA).number;
                console.log(`Line ${startLineNew} to ${endLineNew}\n`);
                uniqueAffectedLines.add(startLineNew);
                uniqueAffectedLines.add(endLineNew);

                for (let pos = startLineNew; pos <= endLineNew; pos++) {
                    const line = tr.state.doc.line(pos);
                    const lineText = line.text.toLowerCase();
                    const lineStart = line.from;
                    let canBeLabel = true;

                    console.log(lineText);
                    
                    lexer.reset(lineText);

                    while ((token = lexer.next())) {
                        if (token.type === 'error') {
                            console.log(`Lexer error on line ${pos}, column${token.col}\n`);
                            console.log(`Unmatched text: '${token.text}'\n`);
                            newDecos.push(errorHighlight.range(lineStart+token.col-1, lineStart+token.offset+token.text.length));
                            continue;
                        }

                        switch(token.type) {
                            case 'addAndOpcode':
                            case 'brOpcode':
                            case 'jmpOpcode':
                            case 'retOpcode':
                            case 'rtiOpcode':
                            case 'jsrrOpcode':
                            case 'jsrOpcode':
                            case 'ldrStrOpcode':
                            case 'ldLdiStStiLeaOpcode':
                            case 'notOpcode':
                            case 'trapOpcode':
                            case 'getcOpcode':
                            case 'outOpcode':
                            case 'putsOpcode':
                            case 'inOpcode':
                            case 'putspOpcode':
                            case 'haltOpcode': {
                                const start = lineStart + token.col - 1;
                                const end = lineStart + token.offset + token.text.length;
                                console.log(`Token - ${token.text}, Start - ${start}, End - ${end}\n`);
                                newDecos.push(opcodeHighlight.range(start, end));
                                break;
                            }   
                            case 'endDirective':
                            case 'origDirective':
                            case 'fillDirective':
                            case 'blkwDirective':
                            case 'stringzDirective':{
                                const start = lineStart + token.col - 1;
                                const end = lineStart + token.offset + token.text.length;
                                console.log(`Token - ${token.text}, Start - ${start}, End - ${end}\n`);
                                newDecos.push(directiveHighlight.range(start, end));
                                break;
                            }   
                            case 'register':{
                                const start = lineStart + token.col - 1;
                                const end = lineStart + token.offset + token.text.length;
                                console.log(`Token - ${token.text}, Start - ${start}, End - ${end}\n`);
                                newDecos.push(registerHighlight.range(start, end));
                                break;
                            }   
                            case 'decimal':
                            case 'binary':
                            case 'hexadecimal':
                            case 'fillCharacter':
                            case 'stringzSequence':{
                                const start = lineStart + token.col - 1;
                                const end = lineStart + token.offset + token.text.length;
                                console.log(`Token - ${token.text}, Start - ${start}, End - ${end}\n`);
                                newDecos.push(constantHighlight.range(start, end));
                                break;
                            }   
                            case 'label':{
                                const start = lineStart + token.col - 1;
                                const end = lineStart + token.offset + token.text.length;
                                console.log(`Token - ${token.text}, Start - ${start}, End - ${end}\n`);
                                if (canBeLabel) {
                                    newDecos.push(labelHighlight.range(start, end));
                                } else {
                                    newDecos.push(labelOperandHighlight.range(start, end));
                                }
                                break;
                            }   
                            case 'comment':{
                                const start = lineStart + token.col - 1;
                                const end = lineStart + token.offset + token.text.length;
                                console.log(`Token - ${token.text}, Start - ${start}, End - ${end}\n`);
                                newDecos.push(commentHighlight.range(start, end));
                                break;
                            }   
                        }
                        canBeLabel = false;
                    }
                }
            });

            // lines that are to be updated should replace previous lines
            // at the same time try not to touch unchanged lines
            let filterFrom = Infinity;
            let filterTo = -Infinity;

            for (const pos of uniqueAffectedLines) {
                const line = tr.state.doc.line(pos);
                filterFrom = Math.min(filterFrom, line.from);
                filterTo = Math.max(filterTo, line.to);
            }
            
            return deco.update({
                filter: (from, to) => to <= filterFrom || from >= filterTo,
                add: newDecos,
                sort: true
            });
        }

        return deco;
    },
    provide: f => EditorView.decorations.from(f)
});

module.exports = {
    highlightField
};