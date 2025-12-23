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

const highlightExtension = StateField.define({
    create() {
        return Decoration.none;
    },
    update(deco, tr) {
        deco = deco.map(tr.changes);

        const newDecos = [];

        // tokenize each line with the lexer and highlight each token
        if (tr.docChanged) {
            const uniqueAffectedLines = new Set();
            let filterFrom = Infinity;
            let filterTo = -Infinity;

            // only work on the new lines
            tr.changes.iterChanges((oldFrom, oldTo, newFrom, newTo) => {
                // console.log(newFrom + ' - ' + newTo);
                const startLineNew = tr.state.doc.lineAt(newFrom).number;
                const endLineNew = tr.state.doc.lineAt(newTo).number;

                if (newFrom < filterFrom) {
                    filterFrom = newFrom;
                }

                if (newTo > filterTo) {
                    filterTo = newTo;
                }

                for (let lineNo = startLineNew; lineNo <= endLineNew; lineNo++) {
                    const line = tr.state.doc.line(lineNo);
                    const lineText = line.text.toLowerCase();
                    const lineStart = line.from;
                    let canBeLabel = true;
                    uniqueAffectedLines.add(lineNo);

                    // console.log(lineText);
                    
                    lexer.reset(lineText);

                    let token;
                    while ((token = lexer.next())) {
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
                                // console.log(`Token - ${token.text}, Start - ${start}, End - ${end}\n`);
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
                                // console.log(`Token - ${token.text}, Start - ${start}, End - ${end}\n`);
                                newDecos.push(directiveHighlight.range(start, end));
                                break;
                            }   
                            case 'register':{
                                const start = lineStart + token.col - 1;
                                const end = lineStart + token.offset + token.text.length;
                                // console.log(`Token - ${token.text}, Start - ${start}, End - ${end}\n`);
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
                                // console.log(`Token - ${token.text}, Start - ${start}, End - ${end}\n`);
                                newDecos.push(constantHighlight.range(start, end));
                                break;
                            }   
                            case 'label':{
                                const start = lineStart + token.col - 1;
                                const end = lineStart + token.offset + token.text.length;
                                // console.log(`Token - ${token.text}, Start - ${start}, End - ${end}\n`);
                                if (canBeLabel) {
                                    newDecos.push(labelHighlight.range(start, end));
                                } else {
                                    newDecos.push(labelOperandHighlight.range(start, end));
                                }
                                canBeLabel = false;
                                break;
                            }   
                            case 'comment':{
                                const start = lineStart + token.col - 1;
                                const end = lineStart + token.offset + token.text.length;
                                // console.log(`Token - ${token.text}, Start - ${start}, End - ${end}\n`);
                                newDecos.push(commentHighlight.range(start, end));
                                break;
                            }   
                        }
                    }
                }
            });


            filterFrom = tr.state.doc.lineAt(filterFrom).from;
            filterTo = tr.state.doc.lineAt(filterTo).to;

            // console.log(`filterFrom: ${filterFrom} - filterTo: ${filterTo}`);
            
            return deco.update({
                filter: (from, to, value) => {
                    // console.log(`From: ${from} - To: ${to} - Value: ${value ? tr.state.doc.toString().slice(from, to) : "deleted"}`);

                    if ( uniqueAffectedLines.has(tr.state.doc.lineAt(from).number) || uniqueAffectedLines.has(tr.state.doc.lineAt(to).number) ) {
                        // console.log("Should get removed");
                    }
                    return ( !(uniqueAffectedLines.has(tr.state.doc.lineAt(from).number) || uniqueAffectedLines.has(tr.state.doc.lineAt(to).number)) )
                },
                add: newDecos,
                filterFrom: filterFrom,
                filterTo: filterTo
            });
        }

        return deco;
    },
    provide: f => EditorView.decorations.from(f)
});

module.exports = {
    highlightExtension
};
