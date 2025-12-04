const { assemblyView, binaryView, assembleButton } = require('./index.js');
const nearley = require('nearley');
const grammar = require('./lc3.js');
const {validateDecimalWithinRange, convertToBinaryString} = require('./grammarUtils.js');
const {viewInsertAtEnd} = require('./codeEditor.js');



// perform linting
// pass data through and return any errors
assembleButton.addEventListener('click', () => {
    console.log('Assemble button clicked');

    // clear the binary view
    binaryView.dispatch({
        changes: {from: 0, to: binaryView.state.doc.length, insert: ''}
    });

    const lines = assemblyView.state.doc.lines;
    let lineStartValue;
    const labelMap = new Map();
    let pc = 0;
    let hasOrigLine = false;
    let hasEndLine = false;
    let binaryCode = '';
    

    // ignore errors for now
    // perform the first pass to get the labels and their positions
    for (let line = 1; line <= lines; line++) {
        const text = assemblyView.state.doc.line(line).text;
        
        // don't try to assemble empty lines
        if (text.trim() === '') {
            continue;
        }

        const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
        
        try {
            parser.feed(text);
            // make sure that the parser processed the text
            if (parser.results) {
                
                const result = parser.results[0];

                // check for errors before doing anything
                if (result.errors > 0) {
                    console.log('Semantic error in assembly on line ' + line);
                    return;
                }

                // check if a label exists and add it to the label map
                if (result.label) {
                    // add the offset to the labelMap
                    // actual line number will be set when the .orig directive is processed

                    // a label can have ':' at the end of it so make sure it doesn't cause any matching issues
                    const label = result.label.slice(-1) === ':' ? result.label.slice(0, -1).toLowerCase() : result.label.toLowerCase();

                    if (labelMap.has(label)) {
                        console.log(`Trying to reuse label ${label} from line ${labelMap.get(label) + 1} at line ${line}\n`);
                        return;
                    }

                    if (result.type === 'directiveExpressionLine' || result.type === 'operandExpressionLine') {
                        pc++;
                    }

                    labelMap.set(label, pc);
                }
            } else {
                console.log('Incomplete line at line ' + line);
                return;
            }
        } catch (e) {
            console.log('Incorrect syntax at line ' + line);
            return;
        }
    }

    // show the label map
    labelMap.forEach((value, key, map) => {
        console.log(key + ' - ' + value);
    });

    pc = 0;

    // actual line numbers will be set when we assemble the .orig directive
    // the first pass should have dealt with incomplete lines and syntax errors
    for (let line = 1; line <= lines; line++) {
        const text = assemblyView.state.doc.line(line).text;
        const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
        console.log(text);

        // do nothing on empty lines before the .orig directive
        if (text.trim() === '') {
            if (hasOrigLine) {
                binaryCode += '\n\n';
            }
            continue;
        }

        // process the line then decide what to do after
        parser.feed(text);
        const result = parser.results[0];


        switch (result.type) {
            case 'labelLine': {
                let toInsert = result.label + '\n\n';
                binaryCode += toInsert;
                break;
            }
            case 'commentLine': {
                let toInsert = '';
                if (result.label) {
                    toInsert += result.label + ' ';
                }
                toInsert += result.comment + '\n\n';

                // insert into the binaryView
                binaryCode += toInsert;
                continue;
            }
            case 'directiveExpressionLine': {
                // starts with orig line
                // doesnt start with orig line
                // more than one orig line
                if (result.directive === '.orig') {
                    if (!hasOrigLine) {
                        // update the label map using the line number provided by the .orig directive
                        pc++;
                        const type = result.operands.type;
                        lineStartValue = result.operands.address;
                        switch (type) {
                            case 'decimal':
                                lineStartValue = parseInt(lineStartValue.slice(1));
                                break;
                            case 'binary':
                                lineStartValue = parseInt(lineStartValue.slice(2), 2);
                                break;
                            case 'hexadecimal':
                                lineStartValue = parseInt(lineStartValue.slice(2), 16);
                        }
                        console.log('.orig value is ' + lineStartValue);

                        // update the label map to show the address of each instruction following the initialization of the start address
                        labelMap.forEach((value, key, map) => {
                            map.set(key, lineStartValue + map.get(key));
                        });

                        // show the label map
                        labelMap.forEach((value, key, map) => {
                            console.log(key + ' - ' + value);
                        });
                        hasOrigLine = true;
                        break;
                    } else {
                        console.log('There can only be one .orig expression on line ' + line);
                        return;
                    }
                } else if (hasOrigLine) {
                    // process directive expression
                    console.log('processing the operand directive\n');
                    pc++;
                    let toInsert = '';
                    if (result.label) {
                        toInsert += result.label + '\n';
                    }

                    if (result.directive === '.end') {
                        hasEndLine = true;
                    }

                    if (result.directive === '.fill' && result.operands.label) {
                        // replace the label with the actual value in the .fill directive if necessary
                        // format label correctly
                        let label = result.operands.label.toLowerCase();
                        label = label.slice(-1) === ':' ? label.slice(0, -1) : label;
                        if (!labelMap.has(label)) {
                            console.log('Label ' + label + ' already exists on line ' + line);
                            return;
                        }

                        // validate label is of the right size (16 bits)
                        const address = labelMap.get(address);
                        const addressString = '#' + address;
                        if (validateAddress(addressString, decimal, 0)) {
                            console.log('Address is too big on line ' + line);
                            return;
                        }

                        // convert the address to its binary form
                        const binaryAddress = convertToBinaryString(addressString, decimal, 16);
                        
                        toInsert += result.binary.replace('0', binaryAddress);
                    } else {
                        toInsert += result.binary;
                    }

                    toInsert += ' ' + (result.comment ? result.comment + '\n\n' : '\n\n');
                    
                    
                    binaryCode += toInsert;
                    break;
                } else {
                    console.log('Assembly must start with a .orig expression on line ' + line);
                    return;
                }
            }
            case 'operandExpressionLine': {
                if (!hasOrigLine) {
                    console.log('Assembly must start with a .orig expression on line ' + line);
                    return;
                }
                pc++;
                let toInsert = '';
                if (result.label) {
                    toInsert += result.label + '\n';
                }

                // check if there is an operand that has to be calculated
                if (!result.operands.label) {
                    // show the binary in the binary view
                    // also show labels and comments if they exist
                    toInsert += result.binary + ' ' + (result.comment ? result.comment : '');

                } else {
                    console.log('Tried to calculate the label');
                    // validate that there will be no issues with the label
                    // make sure the label exists
                    let label = result.operands.label.toLowerCase();
                    label = label.slice(-1) === ':' ? label.slice(0, -1) : label;
                    console.log('Label is ' + label);
                    if (!labelMap.has(label)) {
                        console.log('Label ' + label + ' does not exist on line ' + line);
                        return;
                    }

                    // make sure the offset won't be too large
                    console.log(`${labelMap.get(label)} - ${lineStartValue + pc}`);
                    const offset = labelMap.get(label) - (lineStartValue + pc);
                    console.log(offset);
                    const opcode = result.binary.slice(0, 4);
                    let binaryOffset;

                    switch (opcode) {
                        // BR, LD, LDI, LEA, ST, STI has label offsets of 9 bits
                        case '0000':
                        case '0010':
                        case '1010':
                        case '1110':
                        case '0011':
                        case '1011': {
                            // will clean up later
                            const offsetString = '#' + offset.toString();
                            if (validateDecimalWithinRange(offsetString, 9, 0)) {
                                console.log('Cannot encode label as a 9 bit unsigned number on line ' + line);
                                return;
                            }
                            binaryOffset = convertToBinaryString(offsetString, 'decimal', 9);
                            console.log(offsetString);
                            console.log(binaryOffset);
                            break;
                        }
                        // JSR has label offset of 11
                        case '0100': {
                            // will clean up later
                            const offsetString = '#' + offset.toString();
                            if (validateDecimalWithinRange(offsetString, 11, 0)) {
                                console.log('Cannot encode label as a 11 bit unsigned number on line ' + line);
                                return;
                            }
                            binaryOffset = convertToBinaryString(offsetString, 'decimal', 11);
                            console.log(offsetString);
                            console.log(binaryOffset);
                            break;  
                        }         
                    }

                    // set the offset in the binary conversion
                    toInsert += result.binary.replace(/0\s/, binaryOffset+' ');
                }

                // show the binary conversion to the binary view
                binaryCode += toInsert + '\n';
                break;
            }
        }
    }

    if (!hasEndLine) {
        console.log('Missing end directive\n');
        return;
    }

    // display the binary code in the binary view
    viewInsertAtEnd(binaryView, binaryCode);
});