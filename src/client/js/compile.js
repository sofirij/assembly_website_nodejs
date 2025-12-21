const nearley = require('nearley');
const grammar = require('./lc3.js');
const {validateDecimalWithinRange, convertToBinaryString, validateAddress} = require('./grammarUtils.js');

// perform linting
// pass data through and return any errors
function compileAssembly (view) {
    const lines = view.state.doc.lines;
    let lineStartValue;
    const labelMap = new Map();
    let pc = 0;
    let hasOrigLine = false;
    let hasEndLine = false;
    let binaryCode = '';
    let assemblerErrors = [];
    let lastLineProcessed;


    
    // do nothing if view is empty
    const string = view.state.doc.toString();
    if (string.trim() === '') {
        return;
    }
    

    // ignore errors for now
    // perform the first pass to get the labels and their positions
    for (let line = 1; line <= lines; line++) {
        const text = view.state.doc.line(line).text;
        
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
                
                // stop processing after the end directive
                if (result.type === 'directiveExpressionLine' && result.directive === '.end') {
                    hasEndLine = true;
                    break;
                }

                // check if a label exists and add it to the label map
                if (result.label) {
                    // add the offset to the labelMap
                    // actual line number will be set when the .orig directive is processed

                    // a label can have ':' at the end of it so make sure it doesn't cause any matching issues
                    const label = result.label.slice(-1) === ':' ? result.label.slice(0, -1).toLowerCase() : result.label.toLowerCase();

                    if (labelMap.has(label)) {
                        console.log(`Trying to reuse label '${label}' on line ${line}\n`);
                        const errorMessage = `Trying to reuse label '${label}'`;
                        const errorType = 'Semantic Error';
                        const start = result.labelStart - 1;
                        const end = result.labelEnd;
                        const errorObject = {type: errorType, message: errorMessage, start: start, end: end};

                        assemblerErrors.push({line: line, errors: [errorObject]});
                        return {fail: assemblerErrors};
                    }

                    if (result.type === 'directiveExpressionLine' || result.type === 'operandExpressionLine') {
                        pc++;
                    }

                    labelMap.set(label, pc);
                }

                if (result.type === 'directiveExpressionLine' || result.type === 'operandExpressionLine' || result.type === 'labelLine') {
                    lastLineProcessed = line;
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

    if (!hasEndLine) {
        console.log('Missing the end directive');
        const errorMessage = 'Assembly should end with a .end directive';
        const errorType = 'Semantic Error';

        console.log('Getting the string');
        const string = view.state.doc.line(lastLineProcessed).text;
        console.log(string);
        const start = 0;
        const end = string.length;
        const errorObject = {type: errorType, message: errorMessage, start: start, end: end};
        assemblerErrors.push({line: lastLineProcessed, errors: [errorObject]});
        return {fail: assemblerErrors};
    }

    // show the label map
    labelMap.forEach((value, key, map) => {
        console.log(key + ' - ' + value);
    });

    pc = 0;
    hasEndLine = false;

    // actual line numbers will be set when we assemble the .orig directive
    // the first pass should have dealt with incomplete lines and syntax errors
    for (let line = 1; line <= lines; line++) {
        const text = view.state.doc.line(line).text;
        const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
        // console.log(text);
        console.log('processing text');

        // do nothing on empty lines before the .orig directive
        if (text.trim() === '') {
            if (hasOrigLine) {
                binaryCode += '\n\n';
            }
            continue;
        }

        // stop reading lines after the end directive
        if (hasEndLine) {
            break;
        }

        // process the line then decide what to do after
        parser.feed(text);
        const result = parser.results[0];

        // check for errors before doing anything
        // return diagnostics for semantic errors
        if (result.errors.length > 0) {
            console.log('Semantic error in assembly on line ' + line);
            assemblerErrors.push({line: line, errors: result.errors});
            continue;
        }


        switch (result.type) {
            case 'labelLine': {

                if (!hasOrigLine) {
                    console.log('Assembly must start with a .orig expression on line ' + line);
                    const errorMessage = 'Asssembly must start with a .orig expression';
                    const errorType = 'Semantic Error';

                    const string = view.state.doc.line(line).text;
                    const start = string.search(/\S/);
                    const end = string.length;

                    const errorObject = {type: errorType, message: errorMessage, start: start, end: end};
                    assemblerErrors.push({line: line, errors: [errorObject]});
                    return {fail: assemblerErrors};
                }

                
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
                        const errorMessage = `There can only be one .orig expression`;
                        const errorType = 'Semantic Error';
                        const start = result.directiveStart - 1;
                        const end = result.directiveEnd;
                        const errorObject = {type: errorType, message: errorMessage, start: start, end: end};
                        assemblerErrors.push({line: line, errors: [errorObject]});
                        return {fail: assemblerErrors}
                    }
                } else if (hasOrigLine) {
                    // process directive expression
                    console.log('processing the operand directive\n');
                    pc++;
                    let toInsert = '';
                    if (result.label) {
                        toInsert += result.label + '\n';
                    }


                    if (result.directive === '.fill' && result.operands.label) {
                        // replace the label with the actual value in the .fill directive if necessary
                        // format label correctly
                        let label = result.operands.label.toLowerCase();
                        label = label.slice(-1) === ':' ? label.slice(0, -1) : label;
                        if (!labelMap.has(label)) {
                            console.log(`Label '${label}' does not exist on line ${line}`);
                            const errorMessage = `Label '${label}' does not exist`;
                            const errorType = 'Semantic Error';
                            const start = result.operands.lastOperandStart - 1;
                            const end = result.operands.lastOperandEnd;
                            const errorObject = {type: errorType, message: errorMessage, start: start, end: end};
                            assemblerErrors.push({line: line, errors: [errorObject]})
                            continue;
                        }

                        // validate label is of the right size (16 bits)
                        const address = labelMap.get(label);
                        const addressString = '#' + address;
                        const addressError = validateAddress(addressString, 'decimal', result.labelStart);
                    
                        if (addressError) {
                            const errorMessage = addressError.message;
                            const errorType = addressError.type;
                            const start = result.labelStart - 1;
                            const end = result.labelEnd;
                            const errorObject = {type: errorType, message: errorMessage, start: start, end: end};
                            assemblerErrors.push({line: line, errors: [errorObject]});
                            continue;
                        }

                        // convert the address to its binary form
                        const binaryAddress = convertToBinaryString(addressString, 'decimal', 16);
                        
                        toInsert += result.binary.replace('0', binaryAddress);
                    } else {
                        toInsert += result.binary;
                    }

                    toInsert += ' ' + (result.comment ? result.comment + '\n\n' : '\n\n');
                    
                    
                    binaryCode += toInsert;
                    break;
                } else {
                    console.log('Assembly must start with a .orig expression on line ' + line);
                    const errorMessage = 'Asssembly must start with a .orig expression';
                    const errorType = 'Semantic Error';

                    const string = view.state.doc.line(line).text;
                    const start = string.search(/\S/);
                    const end = string.length;
                    console.log(end);

                    const errorObject = {type: errorType, message: errorMessage, start: start, end: end};
                    assemblerErrors.push({line: line, errors: [errorObject]});
                    return {fail: assemblerErrors};
                }
            }
            case 'operandExpressionLine': {
                if (!hasOrigLine) {
                    console.log('Assembly must start with a .orig expression on line ' + line);
                    const errorMessage = 'Asssembly must start with a .orig expression';
                    const errorType = 'Semantic Error';

                    const string = view.state.doc.line(line).text;
                    const start = string.search(/\S/);
                    const end = string.length;

                    const errorObject = {type: errorType, message: errorMessage, start: start, end: end};
                    assemblerErrors.push({line: line, errors: [errorObject]});
                    return {fail: assemblerErrors};
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
                        console.log(`Label '${label}' does not exist on line ${line}`);
                        const errorMessage = `Label '${label}' does not exist`;
                        const errorType = 'Semantic Error';
                        const start = result.operands.lastOperandStart - 1;
                        const end = result.operands.lastOperandEnd;
                        const errorObject = {type: errorType, message: errorMessage, start: start, end: end};
                        assemblerErrors.push({line: line, errors: [errorObject]});
                        continue;
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
                                const errorMessage = `Cannot encode label '${label}' as a 9 bit unsigned integer`;
                                const errorType = 'Semantic Error';
                                const start = result.operands.lastOperandStart - 1;
                                const end = result.operands.lastOperandEnd;
                                const errorObject = {type: errorType, message: errorMessage, start: start, end: end};
                                assemblerErrors.push({line: line, errors: [errorObject]});
                                continue;
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
                                console.log('Cannot encode label as an 11 bit unsigned number on line ' + line);
                                const errorMessage = `Cannot encode label '${label}' as an 11 bit unsigned integer`;
                                const errorType = 'Semantic Error';
                                const start = result.operands.lastOperandStart - 1;
                                const end = result.operands.lastOperandEnd;
                                const errorObject = {type: errorType, message: errorMessage, start: start, end: end};
                                assemblerErrors.push({line: line, errors: [errorObject]});
                                continue;
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

    if (assemblerErrors.length > 0) {
        return {fail: assemblerErrors};
    }

    return {pass: binaryCode};
}




module.exports = {compileAssembly}