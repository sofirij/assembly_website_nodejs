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

const lexer = moo.compile({
    ws: /[ \t]+/,
    register: /r[0-7](?![^ \t,])/,
    addAndOpcode: /(?:add|and)(?![^ \t])/,
    brOpcode: /brn?z?p?(?![^ \t])/,
    jmpOpcode: /jmp(?![^ \t])/,
    retOpcode: /ret(?![^ \t])/,
    jssrOpcode: /jssr(?![^ \t])/,
    jsrOpcode: /jsr(?![^ \t])/,
    ldrStrOpcode: /(?:ldr|str)(?![^ \t])/,
    ldLdiStStiLeaOpcode: /(?:ld|ldi|st|sti|lea)(?![^ \t])/,
    notOpcode: /not(?![^ \t])/,
    trapOpcode: /trap(?![^ \t])/,
    getcOpcode: /getc(?![^ \t])/,
    outOpcode: /out(?![^ \t])/,
    putsOpcode: /puts(?![^ \t])/,
    inOpcode: /in(?![^ \t])/,
    putspOpcode: /putsp(?![^ \t])/,
    haltOpcode: /halt(?![^ \t])/,
    decimal: /#(?:[+-]?[0-9]+)(?![^ \t])/,
    binary: /0b[0-1]+(?![^ \t])/,
    hexadecimal: /0x[0-9a-fA-F]+(?![^ \t])/,
    operandSeparator: /[ \t]*,[ \t]*/,
    endDirective: /\.end(?![^ \t])/,
    origDirective: /\.orig(?![^ \t])/,
    fillDirective: /\.fill(?![^ \t])/,
    blkwDirective: /\.blkw(?![^ \t])/,
    stringzDirective: /\.stringz(?![^ \t])/,
    comment: /;[^\n]*/,
    fillCharacter: /'.*'/,
    stringzSequence: /".*"/,
    label: /[a-zA-Z][a-zA-Z0-9_]*:?/,
    minus: /\-(?![^ \t])/,
    error: /\S+/,
});

const highlightField = StateField.define({
    create() {
        return Decoration.none;
    },
    update(deco, tr) {
        deco = deco.map(tr.changes);

        const newDecos = [];

        //print each line of the codemirror
        if (tr.docChanged) {

            for (let pos = 1; pos <= tr.state.doc.lines; pos++) {
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
                        case 'jssrOpcode':
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
                        case 'haltOpcode':
                            newDecos.push(opcodeHighlight.range(lineStart+token.col-1, lineStart+token.offset+token.text.length));
                            break;
                        case 'endDirective':
                        case 'origDirective':
                        case 'fillDirective':
                        case 'blkwDirective':
                        case 'stringzDirective':
                            newDecos.push(directiveHighlight.range(lineStart+token.col-1, lineStart+token.offset+token.text.length));
                            break;
                        case 'register':
                            newDecos.push(registerHighlight.range(lineStart+token.col-1, lineStart+token.offset+token.text.length));
                            break;
                        case 'decimal':
                        case 'binary':
                        case 'hexadecimal':
                        case 'fillCharacter':
                        case 'stringzSequence':
                            newDecos.push(constantHighlight.range(lineStart+token.col-1, lineStart+token.offset+token.text.length));
                            break;
                        case 'label':
                            if (canBeLabel) {
                                newDecos.push(labelHighlight.range(lineStart+token.col-1, lineStart+token.offset+token.text.length));
                            } else {
                                newDecos.push(labelOperandHighlight.range(lineStart+token.col-1, lineStart+token.offset+token.text.length));
                            }
                            break;
                        case 'comment':
                            newDecos.push(commentHighlight.range(lineStart+token.col-1, lineStart+token.offset+token.text.length));
                            break;
                    }
                    canBeLabel = false;
                }
            }

            return Decoration.set(newDecos);
        }

        return deco;
    },
    provide: f => EditorView.decorations.from(f)
});

module.exports = {
    highlightField
};