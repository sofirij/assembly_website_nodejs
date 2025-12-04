@{%
    const lexer = require('./lexer.js');
    const {validateLabelName, validateDecimalWithinRange, validateHexadecimalWithinRange, validateBinaryWithinRange, validateTrapVector, validateAddress, convertToBinaryString} = require('./grammarUtils.js');
%}

@lexer lexer

input
    ->  _ line {% (data) => data[1] %}

line
    ->  (%label %ws):? %comment
        {% (data) => {
            const label = data[0] ? data[0][0] : null;
            const errorFromLabel = label ? validateLabelName(label.value, label.offset) : null;
            const comment = data[1];
            return {
                type: 'commentLine',
                label: (label ? label.value : null),
                labelStart: (label ? label.col : null),
                labelEnd: (label ? label.value.length + label.offset : null),
                comment: comment.value,
                commentStart: comment.col,
                commentEnd: comment.value.length + comment.offset,
                errors: [...(errorFromLabel ? [errorFromLabel] : [])]
            };
        } %}

    |   (%label %ws):? operandExpression (%ws | %ws %comment):?
        {% (data) => {
            const label = data[0] ? data[0][0] : null;
            const errorFromLabel = label ? validateLabelName(label.value, label.offset) : null;
            // separate the error from the rest of the operand expression object
            const { binary, error, ...opExpressionObject} = data[1];
            const errorFromOpExpression = error;
            const comment = data[2] ? data[2][1] : null;
            return {
                type: 'operandExpressionLine',
                label: (label ? label.value : null),
                labelStart: (label ? label.col : null),
                labelEnd: (label ? label.value.length + label.offset : null),
                ...opExpressionObject,
                comment: (comment ? comment.value : null),
                commentStart: (comment ? comment.col : null),
                commentEnd: (comment ? comment.value.length + comment.offset : null),
                errors: [...(errorFromLabel ? [errorFromLabel] : []), ...(errorFromOpExpression)],
                binary: binary
            };
        } %}

    |   directiveExpression (%ws | %ws %comment):?
        {% (data) => {
            const {error, ...directiveExpressionObject} = data[0];
            const errorFromDirectiveExpression = error;
            const comment = data[1] ? data[1][1] : null;

            return {
                type: 'directiveExpressionLine',
                ...directiveExpressionObject,
                comment: (comment ? comment.value : null),
                commentStart: (comment ? comment.col : null),
                commentEnd: (comment ? comment.offset+comment.value.length : null),
                errors: errorFromDirectiveExpression
            };
        } %}
    
    |   %label _
        {% ([label]) => {
            const errorFromLabel = validateLabelName(label.value, label.offset);
            
            return {
                type: 'labelLine',
                label: label.value,
                labelStart: label.col,
                labelEnd: label.value.length,
                comment: null,
                commentStart: null,
                commentEnd: null,
                errors: [...(errorFromLabel ? [errorFromLabel] : [])]
            }
        } %}



operandExpression
    ->  %addAndOpcode %ws %register %operandSeparator %register %operandSeparator addAndOperand
        {% ([opcode, , destinationRegister, , sourceRegister1, , lastOperand]) => {
            const binaryOpcode = opcode.value.toLowerCase() === 'add' ? '0001' : '0101';
            // no need to pass in bits value
            const binaryDestinationRegister = convertToBinaryString(destinationRegister.value, destinationRegister.type);
            const binarySourceRegister1 = convertToBinaryString(sourceRegister1.value, sourceRegister1.type);
            const reservedBit = lastOperand.reservedBit;
            const binaryLastOperand = lastOperand.binary;
            const delimeter = ',';
            const binary = binaryOpcode + delimeter + binaryDestinationRegister + delimeter + binarySourceRegister1 + delimeter + reservedBit + delimeter + binaryLastOperand;

            return {
                opcode: opcode.value,
                opcodeStart: opcode.col,
                opcodeEnd: opcode.offset + opcode.value.length,
                operands: {
                    destinationRegister: destinationRegister.value,
                    destinationRegisterStart: destinationRegister.col,
                    destinationRegisterEnd: destinationRegister.offset + destinationRegister.value.length,
                    sourceRegister1: sourceRegister1.value,
                    sourceRegister1Start: sourceRegister1.col,
                    sourceRegister1End: sourceRegister1.value.length + sourceRegister1.offset,
                    ...lastOperand.operand
                },
                error: [...lastOperand.error],
                binary: binary + `   => ${opcode.text} ${destinationRegister.value}, ${sourceRegister1.value}, ${lastOperand.text}`
            };
        } %}

    |   %brOpcode %ws brOperand
        {% ([opcode, , lastOperand]) => {
            const binaryOpcode = '0000';

            // branch conditions n, z, p
            let n = '0';
            let z = '0';
            let p = '0';
            
            // set the branch conditions
            const tempOpcode = opcode.value.slice(2);
            const length = tempOpcode.length;
            if (length === 3 || length === 0) {
                n = z = p = '1';
            } else {
                for (let i = 0; i < length; i++) {
                    switch (tempOpcode[i]) {
                        case 'n':
                            n = '1';
                            break;
                        case 'z':
                            z = '1';
                            break;
                        case 'p':
                            p = '1';
                            break;
                    }
                }
            }

            const binaryLastOperand = lastOperand.binary;
            const delimeter = ',';

            const binary = binaryOpcode + delimeter + n + delimeter + z + delimeter + p + delimeter + binaryLastOperand;

            return {
                opcode: opcode.value,
                opcodeStart: opcode.col,
                opcodeEnd: opcode.offset + opcode.value.length,
                operands: {
                    ...lastOperand.operand
                },
                error: [...lastOperand.error],
                binary: binary + `   => ${opcode.value} ${lastOperand.text}`
            }
        } %}
    
    |   %jmpOpcode %ws %register
        {% ([opcode, , register]) => {
            const delimeter = ',';
            const binaryOpcode = '1100';
            const binaryBaseRegister = convertToBinaryString(register.value, register.type);
            const reservedBit = '0';

            const binary = binaryOpcode + delimeter + (reservedBit).repeat(3) + delimeter + binaryBaseRegister + delimeter + (reservedBit).repeat(6);

            return {
                opcode: opcode.value,
                opcodeStart: opcode.col,
                opcodeEnd: opcode.offset + opcode.value.length,
                operands: {
                    baseRegister: register.value,
                    baseRegisterStart: register.col,
                    baseRegisterEnd: register.offset + register.value.length
                },
                error: [],
                binary: binary + `   => ${opcode.value} ${register.value}`
            }
        } %}
    
    |   %jsrrOpcode %ws %register
        {% ([opcode, , register]) => {
            const delimeter = ',';
            const binaryOpcode = '0100';
            const binaryBaseRegister = convertToBinaryString(register.value, register.type);
            const reservedBit = '0';

            const binary = binaryOpcode + delimeter + (reservedBit).repeat(3) + delimeter + binaryBaseRegister + delimeter + (reservedBit).repeat(6);

            return {
                opcode: opcode.value,
                opcodeStart: opcode.col,
                opcodeEnd: opcode.offset + opcode.value.length,
                operands: {
                    baseRegister: register.value,
                    baseRegisterStart: register.col,
                    baseRegisterEnd: register.offset + register.value.length
                },
                error: [],
                binary: binary + `   => ${opcode.value} ${register.value}`
            }
        } %}
    
    |   %jsrOpcode %ws jsrOperand
        {% ([opcode, , lastOperand]) => {
            const delimeter = ',';
            const binaryOpcode = '0100';
            const binaryLastOperand = lastOperand.binary;
            const reservedBit = '1';

            const binary = binaryOpcode + delimeter + reservedBit + delimeter + binaryLastOperand;

            return {
                opcode: opcode.value,
                opcodeStart: opcode.col,
                opcodeEnd: opcode.offset + opcode.value.length,
                operands: {
                    ...lastOperand.operand
                },
                error: [...lastOperand.error],
                binary: binary + `   => ${opcode.value} ${lastOperand.text}`
            }
        } %}

    |   %ldLdiStStiLeaOpcode %ws %register %operandSeparator ldLdiStStiLeaOperand
        {% ([opcode, , register, , lastOperand]) => {
            // register can either be a source register or a destination register
            let binaryOpcode;
            let registerName;

            const delimeter = ',';
            const binaryLastOperand = lastOperand.binary;

            switch (opcode.value) {
                case 'ld': {
                    binaryOpcode = '0010';
                    registerName = 'destinationRegister';
                    const binaryDestinationRegister = convertToBinaryString(register.value, register.type);
                    binary = binaryOpcode + delimeter + binaryDestinationRegister + delimeter + binaryLastOperand;
                    break;
                }
                case 'ldi': {
                    binaryOpcode = '1010';
                    registerName = 'destinationRegister';
                    const binaryDestinationRegister = convertToBinaryString(register.value, register.type);
                    binary = binaryOpcode + delimeter + binaryDestinationRegister + delimeter + binaryLastOperand;
                    break;
                }
                case 'lea': {
                    binaryOpcode = '1110';
                    registerName = 'destinationRegister';
                    const binaryDestinationRegister = convertToBinaryString(register.value, register.type);
                    binary = binaryOpcode + delimeter + binaryDestinationRegister + delimeter + binaryLastOperand;
                    break;
                }
                case 'st': {
                    binaryOpcode = '0011';
                    registerName = 'sourceRegister';
                    const binarySourceRegister = convertToBinaryString(register.value, register.type);
                    binary = binaryOpcode + delimeter + binarySourceRegister + delimeter + binaryLastOperand;
                    break;
                }
                case 'sti': {
                    binaryOpcode = '1011';
                    registerName = 'sourceRegister';
                    const binarySourceRegister = convertToBinaryString(register.value, register.type);
                    binary = binaryOpcode + delimeter + binarySourceRegister + delimeter + binaryLastOperand;
                    break;
                }
            }

        

            return {
                opcode: opcode.value,
                opcodeStart: opcode.col,
                opcodeEnd: opcode.offset + opcode.value.length,
                operands: {
                    [registerName]: register.value,
                    [`${registerName}End`]: register.col,
                    [`${registerName}Start`]: register.offset + register.value.length,
                    ...lastOperand.operand
                },
                error: [...lastOperand.error],
                binary: binary + `   => ${opcode.value} ${register.value}, ${lastOperand.text}`
            };
        } %}
    
    |   %ldrStrOpcode %ws %register %operandSeparator %register %operandSeparator ldrStrOperand
        {% ([opcode, , register, , baseRegister, , lastOperand]) => {
            // register could be a destination or source register
            let binaryOpcode;
            let registerName;
            let binary;

            const delimeter = ',';
            const binaryBaseRegister = convertToBinaryString(baseRegister.value, baseRegister.type);
            const binaryLastOperand = lastOperand.binary;

            switch (opcode.value) {
                case 'ldr':
                    registerName = 'destinationRegister';
                    binaryOpcode = '0110';
                    binaryDestinationRegister = convertToBinaryString(register.value, register.type);
                    binary = binaryOpcode + delimeter + binaryDestinationRegister + delimeter + binaryBaseRegister + delimeter + binaryLastOperand;
                    break;
                case 'str':
                    registerName = 'sourceRegister';
                    binaryOpcode = '0111';
                    binarySourceRegister = convertToBinaryString(register.value,  register.type);
                    binary = binaryOpcode + delimeter + binarySourceRegister + delimeter + binaryBaseRegister + delimeter + binaryLastOperand;
                    break;
            }

            return {
                opcode: opcode.value,
                opcodeStart: opcode.col,
                opcodeEnd: opcode.offset + opcode.value.length,
                operands: {
                    [registerName]: register.value,
                    [`${registerName}Start`]: register.col,
                    [`${registerName}End`]: register.offset + register.value.length,
                    baseRegister: baseRegister.value,
                    baseRegisterStart: baseRegister.col,
                    baseRegisterEnd: baseRegister.value.length + baseRegister.offset,
                    ...lastOperand.operand
                },
                error: [...lastOperand.error],
                binary: binary + `   => ${opcode.value} ${register.value}, ${baseRegister.value}, ${lastOperand.text}`
            };
        } %}
    
    |   %notOpcode %ws %register %operandSeparator %register
        {% ([opcode, , destinationRegister, , sourceRegister]) => {
            const delimeter = ',';
            const binaryOpcode = '1001';
            const reservedBits = '111111';
            const binaryDestinationRegister = convertToBinaryString(destinationRegister.value, destinationRegister.type);
            const binarySourceRegister = convertToBinaryString(sourceRegister.value, sourceRegister.type);

            const binary = binaryOpcode + delimeter + binaryDestinationRegister + delimeter + binarySourceRegister + delimeter + reservedBits;
            return {
                opcode: opcode.value,
                opcodeStart: opcode.col,
                opcodeEnd: opcode.offset + opcode.value.length,
                operands: {
                    destinationRegister: destinationRegister.value,
                    destinationRegisterStart: destinationRegister.col,
                    destinationRegisterEnd: destinationRegister.offset + destinationRegister.value.length,
                    sourceRegister: sourceRegister.value,
                    sourceRegisterStart: sourceRegister.col,
                    sourceRegisterEnd: sourceRegister.value.length + sourceRegister.offset
                },
                error: [],
                binary: binary + `   => ${opcode.value} ${destinationRegister.value}, ${sourceRegister.value}`
            }
        } %} 

    |   %retOpcode
        {% ([opcode]) => {
            const binaryOpcode = '1100';
            const delimeter = ',';
            const reservedBits = '000111000000';

            const binary = binaryOpcode + delimeter + reservedBits;

            return {
                opcode: opcode.value,
                opcodeStart: opcode.col,
                opcodeEnd: opcode.offset + opcode.value.length,
                operands: {},
                error: [],
                binary: binary + `   => ${opcode.value}`
            }
        } %} 

    |   %rtiOpcode
        {% ([opcode]) => {
            const binaryOpcode = '1000';
            const delimeter = ',';
            const reservedBits = '000000000000';

            const binary = binaryOpcode + delimeter + reservedBits;

            return {
                opcode: opcode.value,
                opcodeStart: opcode.col,
                opcodeEnd: opcode.offset + opcode.value.length,
                operands: {},
                error: [],
                binary: binary + `   => ${opcode.value}`
            }
        } %} 


    |   %trapOpcode %ws (%decimal|%binary|%hexadecimal)
        {% ([opcode, , [trapVector]]) => {
            const binaryOpcode = '1111';
            const reservedBits = '0000';
            const binaryTrapVector = convertToBinaryString(trapVector.value, trapVector.type, 8);
            const delimeter = ',';

            const binary = binaryOpcode + delimeter + reservedBits + delimeter + binaryTrapVector;

            const errorFromTrapVector = validateTrapVector(trapVector.value, trapVector.type, trapVector.offset);
            return ({
                opcode: opcode.value,
                opcodeStart: opcode.col,
                opcodeEnd: opcode.value.length + opcode.offset,
                operands: {
                    trapVector: trapVector.value,
                    trapVectorStart: trapVector.col,
                    trapVectorEnd: trapVector.offset + trapVector.value.length
                },
                error: [...(errorFromTrapVector ? [errorFromTrapVector] : [])],
                binary: binary + `   => ${opcode.value} ${trapVector.value}`
            })
        } %}
    
    |   (%getcOpcode|%outOpcode|%putsOpcode|%inOpcode|%putspOpcode|%haltOpcode)
        {% ([[opcode]]) => {
            const binaryOpcode = '1111';
            const delimeter = ',';
            const reservedBits = '0000';
            let binaryTrapVector;

            switch (opcode.value) {
                case 'getc':
                    binaryTrapVector = '00010100';
                    break;
                case 'out':
                    binaryTrapVector = '00010101';
                    break;
                case 'puts':
                    binaryTrapVector = '00010110';
                    break;
                case 'in':
                    binaryTrapVector = '00010111';
                    break;
                case 'putsp':
                    binaryTrapVector = '00011000';
                    break;
                case 'halt':
                    binaryTrapVector = '00011001';
                    break;
            }

            const binary = binaryOpcode + delimeter + reservedBits + delimeter + binaryTrapVector;

            return {
                opcode: opcode.value,
                opcodeStart: opcode.col,
                opcodeEnd: opcode.value.length + opcode.offset,
                operands: {},
                error: [],
                binary: binary + `   => ${opcode.value}`
            };
        } %}


directiveExpression
    ->  %origDirective %ws (%hexadecimal|%binary|%decimal)
        {% ([directive, , [address]]) => {
            const errorFromAddress = validateAddress(address.value, address.type, address.offset);

            return {
                directive: directive.value,
                directiveStart: directive.col,
                directiveEnd: directive.value.length + directive.offset,
                operands: {
                    address: address.value,
                    addressStart: address.col,
                    addressEnd: address.value.length + address.offset,
                    type: address.type,
                },
                error: [...(errorFromAddress ? [errorFromAddress] : [])],
                binary: ''
            };
        }%}

    |   %endDirective
        {% ([directive]) => {
            return {
                directive: directive.value,
                directiveStart: directive.col,
                directiveEnd: directive.value.length + directive.offset,
                operands: {},
                error: [],
                binary: ''
            };
        } %}

    |   (%label %ws):? %fillDirective %ws (%hexadecimal|%binary|%decimal|%label|%fillCharacter)
        {% ([label, directive, , [value]]) => {
            let error = [];
            const errorFromLabel = label ? validateLabelName(label[0].value, label[0].offset) : null;

            switch (value.type) {
                case "label":
                    const labelError = validateLabelName(value.value, value.offset);
                    if (labelError) {
                        error.push(labelError);
                    }
                    break;
                case "decimal":
                    const decimalError = validateDecimalWithinRange(value.value, 16, value.offset);
                    if (decimalError) {
                        error.push(decimalError);
                    }
                    break;
                case "binary":
                    const binaryError = validateBinaryWithinRange(value.value, 16, value.offset);
                    if (binaryError) {
                        error.push(binaryError);
                    }
                    break;
                case "hexadecimal":
                    const hexadecimalError = validateHexadecimalWithinRange(value.value, 16, value.offset);
                    if (hexadecimalError) {
                        error.push(hexadecimalError);
                    }
                    break;
                case "fillCharacter":
                    const sequence = value.value.slice(1, value.value.length-1);

                    if (sequence[0] === '\\') {

                        if (sequence.length < 2) {
                            error.push({semanticError: `Invalid escape sequence '\\' at index ${value.col}`, end: value.offset + value.value.length});
                        } else if (sequence.length > 2) {
                            error.push({semanticError: `Invalid character '${sequence}' should be a single character at index {value.col}`, end: value.offset+value.value.length});
                        } else {
                            const escapeCharacter = sequence[1];
                            const validEscapeCharacters = ['n', 't', 'r', 'b', 'f', 'v', '\'', '"', '\\', '\0'];
                            if (!validEscapeCharacters.includes(escapeCharacter)) {
                                error.push({semanticError: `Invalid escape sequence '${value.value}' at index ${value.col}`, end: value.offset+value.value.length});
                            }
                        } 
                    } else if (sequence.length > 1) {
                        error.push({semanticError: `Invalid character '${sequence}' should be a single character at index ${value.col}`, end: value.offset+value.value.length});
                    }
                    break;
            }

            let binary = '0'
            if (!errorFromLabel && error.length === 0) {
                // fill operand should be represented in 16 bits
                switch (value.type) {
                    case 'decimal':
                    case 'hexadecimal':
                    case 'register':
                        binary = convertToBinaryString(value.value, value.type, 16);
                        break;
                    case 'binary':
                        binary = value.value.slice(2);
                        break;
                    case 'label':
                        binary = 0;
                        break;
                    case 'fillCharacter': {
                        const text = value.value.slice(1, -1);
                        let character;
                        if (text.length > 1) {
                            const character = text.replace(/\\[a-zA-Z"'\\]/, (sequence) => {
                            switch (sequence[1]) {
                                case 'n':
                                    return '\n';
                                case 't':
                                    return '\t';
                                case 'r':
                                    return '\r';
                                case 'b':
                                    return '\b';
                                case 'f':
                                    return '\f';
                                case 'v':
                                    return '\v';
                                case '\\':
                                    return '\\';
                                case '"':
                                    return '"';
                                case '\'':
                                    return '\'';
                                case '0':
                                    return '\0';
                                }
                            }); 
                            binary = convertToBinaryString(character.charCodeAt(0).toString(), 'decimal', 16);
                        } else {
                            binary = text.charCodeAt(0).toString(2).padStart(16, '0');
                        }
                        break;
                    }              
                }
            }

            return {
                label: label ? label[0].value : null,
                labelStart: label ? label[0].col : null,
                labelEnd: label ? label[0].value.length + label[0].offset : null,
                directive: directive.value,
                directiveStart: directive.col,
                directiveEnd: directive.value.length + directive.offset,
                operands: {
                    [`${value.type}`]: value.value,
                    [`${value.type}Start`]: value.col,
                    [`${value.type}End`]: value.value.length + value.offset
                },
                error: [...(errorFromLabel ? [errorFromLabel] : []), ...(error)],
                binary: binary + `   => ${directive.value} ${value.value}`
            };

        } %}

    |   (%label %ws):? %blkwDirective %ws blkwOperand
        {% ([label, directive, , blkwOperand]) => {
            const errorFromLabel = label ? validateLabelName(label[0].value, label[0].offset) : null;

            const {error, ...blkwOperandObject} = blkwOperand

            let binary = '';
            if (!errorFromLabel && error.length === 0) {
                let magnitude;
                let type; 
                switch (blkwOperand.type) {
                    case 'decimal':
                        type = 'decimal';
                        magnitude = parseInt(blkwOperand[type].slice(1));
                        break;
                    case 'binary':
                        type = 'binary';
                        magnitude = parseInt(blkwOperand[type].slice(2), 2);
                        break;
                    case 'hexadecimal':
                        type = 'hexadecimal';
                        magnitude = parseInt(blkwOperand[type].slice(2), 16); 
                        break;
                }
                let i = 0;
                while (i < magnitude) {
                    binary += `0000000000000000   => ${directive.value} ${blkwOperand[type]}`;
                    i++;

                    if (i !== magnitude) {
                        binary += '\n';
                    }
                }
            }

            return {
                label: label ? label[0].value : null,
                labelStart: label ? label[0].col : null,
                labelEnd: label ? label[0].value.length + label[0].offset : null,
                directive: directive.value,
                directiveStart: directive.col,
                directiveEnd: directive.value.length + directive.offset,
                operands: {
                    ...blkwOperandObject
                },
                error: [...(errorFromLabel ? [errorFromLabel] : []), ...error],
                binary: binary
            };
        } %}

    |   (%label %ws):? %stringzDirective %ws string
        {% ([label, directive, ,lastOperandObject]) => {
            const errorFromLabel = label ? validateLabelName(label[0].value, label[0].offset) : null;
            const { binary, error, ...stringzObject } = lastOperandObject;


            
            return {
                label: label ? label[0].value : null,
                labelStart: label ? label[0].col : null,
                labelEnd: label ? label[0].value.length + label[0].offset : null,
                directive: directive.value,
                directiveStart: directive.col,
                directiveEnd: directive.value.length + directive.offset,
                operands: {
                    ...stringzObject
                },
                error: [...error, ...(errorFromLabel ? [errorFromLabel] : [])],
                binary: binary + `   => .stringz ${stringzObject.stringz}`
            };
        } %}


blkwOperand
    ->  (%decimal|%hexadecimal|%binary)
        {% ([[value]]) => {
            const error = validateAddress(value.value, value.type, value.offset);
            return {
                [`${value.type}`]: value.value,
                [`${value.type}Start`]: value.col,
                [`${value.type}End`]: value.value.length + value.offset,
                error: [...(error ? [error] : [])],
                type: value.type
            };
        } %}
    

string
    ->  %stringzSequence
        {% ([string]) => {
            const errors = [];
            const validEscapeCharacters = ['n', 't', 'r', 'b', 'f', 'v', '\'', '"', '\\', '0'];
            const text = string.value.slice(1,-1);

            // ensure the string sequence is valid
            for (let i = 0; i < text.length; i++) {
                if (i+1 >= text.length) {
                    if (text[i] == '\\') {
                        errors.push({semanticError: `Invalid escape sequence '${text[i]}' at index ${i+2+string.offset}`, end: i+2+string.offset});
                    }
                } else if (text[i] == '\\' && !validEscapeCharacters.includes(text[i+1].toLowerCase())) {
                    errors.push({semanticError: `Invalid escape sequence '${text[i]}' at index ${i+2+string.offset}`, end: i+3+string.offset});
                }
            }

            // if the stringz sequence is valid return its binary conversion
            // the binary would be the 16 bit value of each character line by line
            let binary = '';
            if (errors.length === 0) {
                let i = 0;
                while (i < text.length) {
                    let character;
                    if (text[i] === '\\') {
                        i++;
                        charToPrint = text.slice(i-1, i+1);
                        character = text[i].replace(/\\[a-zA-Z"'\\]/, (sequence) => {
                            switch (sequence[1]) {
                                case 'n':
                                    return '\n';
                                case 't':
                                    return '\t';
                                case 'r':
                                    return '\r';
                                case 'b':
                                    return '\b';
                                case 'f':
                                    return '\f';
                                case 'v':
                                    return '\v';
                                case '\\':
                                    return '\\';
                                case '"':
                                    return '"';
                                case '\'':
                                    return '\'';
                                case '0':
                                    return '\0';
                            }
                        });
                    } else {
                        character = text[i];
                        charToPrint = character;
                    }

                    // a character will be represented in 16 bits
                    let toInsert = character.charCodeAt(0).toString(2).padStart(16, '0');
                    toInsert += `   => ${charToPrint} \n`;
                    binary += toInsert;
                    i++;
                }
                // add the last line that will represent where the directive is stored
                binary += '0000000000000000';
            }

            return {
                stringz: string.value,
                stringzStart: string.col,
                stringzEnd: string.value.length + string.offset,
                error: errors,
                binary: binary
            };
        } %}
        

        

# immediate values are in 5 bits
# if there are no errors in the operand the binary value string of it is returned
# otherwise a string zero is returned in place of the binary value
# also return the reservedBit corresponding to a register or an immediate value
addAndOperand
    ->  %register 
        {% ([register]) => {
            return {
                operand: {
                    storeRegister2: register.value,
                    lastOperandStart: register.col,
                    lastOperandEnd: register.value.length + register.offset
                },
                error: [],
                binary: convertToBinaryString(register.value, register.type),
                reservedBit: '000',
                text: register.value
            };
        } %}

    |   %decimal
        {% ([decimal]) => {
            const error = validateDecimalWithinRange(decimal.value, 5, decimal.offset);
            return {
                operand: {
                    decimal: decimal.value,
                    lastOperandStart: decimal.col,
                    lastOperandEnd: decimal.value.length + decimal.offset
                },
                error: [...(error ? [error] : [])],
                binary: (error ? '0' : convertToBinaryString(decimal.value, decimal.type, 5)),
                reservedBit: '1',
                text: decimal.value
            };
        } %}

    |   %binary
        {% ([binary]) => {
            // could return the value as the binary value string becuase no change would occur
            const error = validateBinaryWithinRange(binary.value, 5, binary.offset);
            return {
                operand: {
                    binary: binary.value,
                    lastOperandStart: binary.col,
                    lastOperandEnd: binary.value.length + binary.offset
                },
                error: [...(error ? [error] : [])],
                binary: (error ? '0' : binary.value.slice(2)),
                reservedBit: '1',
                text: binary.value
            };
        } %}

    |   %hexadecimal
        {% ([hexadecimal]) => {
            const error = validateHexadecimalWithinRange(hexadecimal.value, 5, hexadecimal.offset);
            return {
                operand: {
                    hexadecimal: hexadecimal.value,
                    lastOperandStart: hexadecimal.col,
                    lastOperandEnd: hexadecimal.value.length + hexadecimal.offset
                },
                error: [...(error ? [error] : [])],
                binary: (error ? '0' : convertToBinaryString(hexadecimal.value, hexadecimal.type, 5)),
                reservedBit: '1',
                text: hexadecimal.value
            };
        } %}

# immediate values are in 9 bits
brOperand
    ->  %label
        {% ([label]) => {
            const errorFromLabel = validateLabelName(label.value, label.offset);
            return {
                operand: {
                    label: label.value,
                    lastOperandStart: label.col,
                    lastOperandEnd: label.value.length + label.offset
                },
                error: [...(errorFromLabel ? [errorFromLabel] : [])],
                binary: '0', // this value will be evaluated at a later point
                text: label.value
            }
        } %}

    |   %decimal
        {% ([decimal]) => {
            const error = validateDecimalWithinRange(decimal.value, 9, decimal.offset);
            return {
                operand: {
                    decimal: decimal.value,
                    lastOperandStart: decimal.col,
                    lastOperandEnd: decimal.value.length + decimal.offset
                },
                error: [...(error ? [error] : [])],
                binary: (error ? '0' : convertToBinaryString(decimal.value, decimal.type, 9)),
                text: decimal.value
            };
        } %}

    |   %binary
        {% ([binary]) => {
            const error = validateBinaryWithinRange(binary.value, 9, binary.offset);
            return {
                operand: {
                    binary: binary.value,
                    lastOperandStart: binary.col,
                    lastOperandEnd: binary.value.length + binary.offset
                },
                error: [...(error ? [error] : [])],
                binary: (error ? '0' : binary.value.slice(2)),
                text: binary.value
            };
        } %}

    |   %hexadecimal
        {% ([hexadecimal]) => {
            const error = validateHexadecimalWithinRange(hexadecimal.value, 9, hexadecimal.offset);
            return {
                operand: {
                    hexadecimal: hexadecimal.value,
                    lastOperandStart: hexadecimal.col,
                    lastOperandEnd: hexadecimal.value.length + hexadecimal.offset
                },
                error: [...(error ? [error] : [])],
                binary: (error ? '0' : convertToBinaryString(hexadecimal.value, hexadecimal.type, 9)),
                text: hexadecimal.value
            };
        } %}

# the immediate value for this operand is in 11 bits
jsrOperand
    ->  %label
        {% ([label]) => {
            const errorFromLabel = validateLabelName(label.value, label.offset);
            return {
                operand: {
                    label: label.value,
                    lastOperandStart: label.col,
                    lastOperandEnd: label.value.length + label.offset
                },
                error: [...(errorFromLabel ? [errorFromLabel] : [])],
                binary: '0', // this value will be evaluated at a later point
                text: label.value
            }
        } %}
    
    |   %decimal
        {% ([decimal]) => {
            const error = validateDecimalWithinRange(decimal.value, 11, decimal.offset);
            return {
                operand: {
                    decimal: decimal.value,
                    lastOperandStart: decimal.col,
                    lastOperandEnd: decimal.value.length + decimal.offset
                },
                error: [...(error ? [error] : [])],
                binary: (error ? '0' : convertToBinaryString(decimal.value, decimal.type, 11)),
                text: decimal.value
            };
        } %}

    |   %binary
        {% ([binary]) => {
            const error = validateBinaryWithinRange(binary.value, 11, binary.offset);
            return {
                operand: {
                    binary: binary.value,
                    lastOperandStart: binary.col,
                    lastOperandEnd: binary.value.length + binary.offset
                },
                error: [...(error ? [error] : [])],
                binary: (error ? '0' : binary.value.slice(2)),
                text: binary.value
            };
        } %}

    |   %hexadecimal
        {% ([hexadecimal]) => {
            const error = validateHexadecimalWithinRange(hexadecimal.value, 11, hexadecimal.offset);
            return {
                operand: {
                    hexadecimal: hexadecimal.value,
                    lastOperandStart: hexadecimal.col,
                    lastOperandEnd: hexadecimal.value.length + hexadecimal.offset
                },
                error: [...(error ? [error] : [])],
                binary: (error ? '0' : convertToBinaryString(hexadecimal.value, hexadecimal.type, 11)),
                text: hexadecimal.value
            };
        } %}

# ld, ldi, st, sti, br, lea all have the same last operand
ldLdiStStiLeaOperand
    ->  brOperand {% id %}

# immediate values are in 6 bits
ldrStrOperand
    ->   %decimal
        {% ([decimal]) => {
            const error = validateDecimalWithinRange(decimal.value, 6, decimal.offset);
            return {
                operand: {
                    decimal: decimal.value,
                    lastOperandStart: decimal.col,
                    lastOperandEnd: decimal.value.length + decimal.offset
                },
                error: [...(error ? [error] : [])],
                binary: (error ? '0' : convertToBinaryString(decimal.value, decimal.type, 6)),
                text: decimal.value
            };
        } %}

    |   %binary
        {% ([binary]) => {
            const error = validateBinaryWithinRange(binary.value, 6, binary.offset);
            return {
                operand: {
                    binary: binary.value,
                    lastOperandStart: binary.col,
                    lastOperandEnd: binary.value.length + binary.offset
                },
                error: [...(error ? [error] : [])],
                binary: (error ? '0' : binary.value.slice(2)),
                text: binary.value
            };
        } %}

    |   %hexadecimal
        {% ([hexadecimal]) => {
            const error = validateHexadecimalWithinRange(hexadecimal.value, 6, hexadecimal.offset);
            return {
                operand: {
                    hexadecimal: hexadecimal.value,
                    lastOperandStart: hexadecimal.col,
                    lastOperandEnd: hexadecimal.value.length + hexadecimal.offset
                },
                error: [...(error ? [error] : [])],
                binary: (error ? '0' : convertToBinaryString(hexadecimal.value, hexadecimal.type, 6)),
                text: hexadecimal.value
            };
        } %}

_
    ->	[ \t]:*


