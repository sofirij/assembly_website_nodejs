@{%
const moo = require('moo');

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
});
%}

@lexer lexer

@{%
    function validateLabelName(name, offset) {
        if (name.length > 20) {
            return {semanticError : `Label name '${name}' is too long (max 20 characters) at index ${offset + 1}`, end: name.length + offset};
        }
    }

    function validateDecimalWithinRange(decimal, bits, offset) {
        const decimalString = decimal;
        const min = -1 * Math.ceil(((2 ** bits) - 1) / 2);
        const max = (-1 * min) - 1;
        decimal = parseInt(decimal.slice(1));
        
        if (decimal < min || decimal > max) {
            return {semanticError: `Decimal value '${decimal}' should be a signed value between ${min} and ${max} at index ${offset + 1}`, end: decimal.length + offset};
        }
    }

    function validateHexadecimalWithinRange(hexadecimal, bits, offset) {
        const hexadecimalString = hexadecimal;
        hexadecimal = hexadecimal.slice(2);
        
        hexadecimal = parseInt(hexadecimal, 16);

        const maxVal = 2 ** bits;
        const negativeThreshold = maxVal / 2;
        const min = -1 * negativeThreshold;
        const max = negativeThreshold - 1;

        if (hexadecimal >= maxVal) {
            return {semanticError: `Hexadecimal value '${hexadecimalString}' should be a signed value between ${min} and ${max} at index ${offset + 1}`, end: hexadecimalString.length + offset};
        }

        if (hexadecimal >= negativeThreshold) {
            hexadecimal = hexadecimal - maxVal;
        }

        if (hexadecimal < min || hexadecimal > max) {
            return {semanticError: `Hexadecimal value '${hexadecimalString}' should be a signed value between ${min} and ${max} at index ${offset + 1}`, end: hexadecimalString.length + offset};
        }
    }

    function validateBinaryWithinRange(binary, bits, offset) {
        const binaryString = binary;
        binary = binary.slice(2);

        if (binary.length !== bits) {
            return {semanticError: `Binary value '${binaryString}' should be exactly ${bits} bits at index ${offset + 1}`, end: binaryString.length + offset};
        }

        binary = parseInt(binary, 2);
        const maxVal = 2 ** bits;
        const negativeThreshold = maxVal / 2;
        const min = -1 * negativeThreshold;
        const max = negativeThreshold - 1;


        if (binary >= maxVal) {
            return {semanticError: `Binary value '${binaryString}' should be a signed value between ${min} and ${max} at index ${offset + 1}`, end: binaryString.length + offset};
        }

        if (binary >= negativeThreshold) {
            binary = binary - maxVal;
        }

        if (binary < min || binary > max) {
            return {semanticError: `Binary value '${binaryString}' should be a signed value between ${min} and ${max} at index ${offset + 1}`, end: binaryString.length + offset};
        }
    }

    function validateTrapVector(trapVector, type, offset) {
        let value;

        switch (type) {
            case "decimal":
                value = parseInt(trapVector);
                break;
            case "hexadecimal":
                value = parseInt(trapVector, 16);
                break;
            case "binary":
                value = parseInt(trapVector, 2);
                break;
        }

        if (value < 32 || value > 36) {
            return {semanticError: `Trap Vector '${trapVector}' should be a value between 0x20 and 0x25 at index ${offset + 1}`, end: trapVector.length + offset};   
        }
    }

    function validateAddress(address, type, offset) {
        let value;
        const maxVal = (2 ** 16) - 1;

        switch (type) {
            case "decimal":
                value = parseInt(address.slice(1));
                break;
            case "hexadecimal":
                value = parseInt(address.slice(2), 16);
                break;
            case "binary":
                value = parseInt(address.slice(2), 2);
                break;
        }

        if (value < 0 || value > maxVal) {
            return {semanticError: `Address value '${address}' should be a value between 0 and ${maxVal} at index ${offset + 1}`, end: address.length + offset};
        }
    }
%}

input
    ->  _ line {% (data) => JSON.stringify(data[1]) %}

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
            const { error, ...opExpressionObject} = data[1];
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
                errors: [...(errorFromLabel ? [errorFromLabel] : []), ...(errorFromOpExpression ? [errorFromOpExpression] : [])]
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



operandExpression
    ->  %addAndOpcode %ws %register %operandSeparator %register %operandSeparator addAndOperand
        {% ([opcode, , destinationRegister, , sourceRegister1, , lastOperand]) => {
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
                error: {
                    ...(lastOperand.error || {}),
                }
            };
        } %}

    |   %brOpcode %ws brOperand
        {% ([opcode, , lastOperand]) => {
            return {
                opcode: opcode.value,
                opcodeStart: opcode.col,
                opcodeEnd: opcode.offset + opcode.value.length,
                operands: {
                    ...lastOperand.operand
                },
                error: {
                    ...(lastOperand.error || {})
                }
            }
        } %}
    
    |   %jmpOpcode %ws %register
        {% ([opcode, , register]) => {
            return {
                opcode: opcode.value,
                opcodeStart: opcode.col,
                opcodeEnd: opcode.offset + opcode.value.length,
                operands: {
                    baseRegister: register.value,
                    baseRegisterStart: register.col,
                    baseRegisterEnd: register.offset + register.value.length
                },
                error: {}
            }
        } %}
    
    |   %jssrOpcode %ws %register
        {% ([opcode, , register]) => {
            return {
                opcode: opcode.value,
                opcodeStart: opcode.col,
                opcodeEnd: opcode.offset + opcode.value.length,
                operands: {
                    baseRegister: register.value,
                    baseRegisterStart: register.col,
                    baseRegisterEnd: register.offset + register.value.length
                },
                error: {}
            }
        } %}
    
    |   %jsrOpcode %ws jsrOperand
        {% ([opcode, , lastOperand]) => {
            return {
                opcode: opcode.value,
                opcodeStart: opcode.col,
                opcodeEnd: opcode.offset + opcode.value.length,
                operands: {
                    ...lastOperand.operand
                },
                error: {
                    ...(lastOperand.error || {})
                }
            }
        } %}

    |   %ldLdiStStiLeaOpcode %ws %register %operandSeparator ldLdiStStiLeaOperand
        {% ([opcode, , destinationRegister, , lastOperand]) => {
            return {
                opcode: opcode.value,
                opcodeStart: opcode.col,
                opcodeEnd: opcode.offset + opcode.value.length,
                operands: {
                    destinationRegister: destinationRegister.value,
                    destinationRegisterStart: destinationRegister.col,
                    destinationRegisterEnd: destinationRegister.offset + destinationRegister.value.length,
                    ...lastOperand.operand
                },
                error: {
                    ...(lastOperand.error || {})
                }
            };
        } %}
    
    |   %ldrStrOpcode %ws %register %operandSeparator %register %operandSeparator ldrStrOperand
        {% ([opcode, , destinationRegister, , baseRegister, , lastOperand]) => {
            return {
                opcode: opcode.value,
                opcodeStart: opcode.col,
                opcodeEnd: opcode.offset + opcode.value.length,
                operands: {
                    destinationRegister: destinationRegister.value,
                    destinationRegisterStart: destinationRegister.col,
                    destinationRegisterEnd: destinationRegister.offset + destinationRegister.value.length,
                    baseRegister: baseRegister.value,
                    baseRegisterStart: baseRegister.col,
                    baseRegisterEnd: baseRegister.value.length + baseRegister.offset,
                    ...lastOperand.operand
                },
                error: {
                    ...(lastOperand.error || {}),
                }
            };
        } %}
    
    |   %notOpcode %ws %register %operandSeparator %register
        {% ([opcode, , destinationRegister, , sourceRegister]) => {
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
                error: {}
            }
        } %} 

    |   %trapOpcode %ws (%decimal|%binary|%hexadecimal)
        {% ([opcode, , [trapVector]]) => {
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
                error: {
                    ...(errorFromTrapVector || {})
                }
            })
        } %}
    
    # use inVector instead of in because in is a keyword
    |   (%getcOpcode|%outOpcode|%putsOpcode|%inOpcode|%putspOpcode|%haltOpcode)
        {% ([[opcode]]) => {
            return {
                opcode: opcode.value,
                opcodeStart: opcode.col,
                opcodeEnd: opcode.value.length + opcode.offset,
                operands: {},
                error: {}
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
                address: address.value,
                addressStart: address.col,
                addressEnd: address.value.length + address.offset,
                error: [...(errorFromAddress ? [errorFromAddress] : [])]
            };
        }%}

    |   %endDirective
        {% ([directive]) => {
            return {
                directive: directive.value,
                directiveStart: directive.col,
                directiveEnd: directive.value.length + directive.offset,
                error: []
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
                            const validEscapeCharacters = ['n', 't', 'r', 'b', 'a', 'f', 'v', '\'', '"', '\\'];
                            if (!validEscapeCharacters.includes(escapeCharacter)) {
                                error.push({semanticError: `Invalid escape sequence '${value.value}' at index ${value.col}`, end: value.offset+value.value.length});
                            }
                        } 
                    } else if (sequence.length > 1) {
                        error.push({semanticError: `Invalid character '${sequence}' should be a single character at index ${value.col}`, end: value.offset+value.value.length});
                    }
                    break;
            }

            return {
                label: label ? label[0].value : null,
                labelStart: label ? label[0].col : null,
                labelEnd: label ? label[0].value.length + label[0].offset : null,
                directive: directive.value,
                directiveStart: directive.col,
                directiveEnd: directive.value.length + directive.offset,
                [`${value.type}`]: value.value,
                [`${value.type}Start`]: value.col,
                [`${value.type}End`]: value.value.length + value.offset,
                error: [...(errorFromLabel ? [errorFromLabel] : []), ...(error)]
            };

        } %}

    |   (%label %ws):? %blkwDirective %ws blkwOperand
        {% ([label, directive, , blkwOperand]) => {
            const errorFromLabel = label ? validateLabelName(label[0].value, label[0].offset) : null;

            const {error, ...blkwOperandObject} = blkwOperand

            return {
                label: label ? label[0].value : null,
                labelStart: label ? label[0].col : null,
                labelEnd: label ? label[0].value.length + label[0].offset : null,
                directive: directive.value,
                directiveStart: directive.col,
                directiveEnd: directive.value.length + directive.offset,
                ...blkwOperandObject,
                error: [...(errorFromLabel ? [errorFromLabel] : []), ...error]
            };
        } %}

    |   (%label %ws):? %stringzDirective %ws string
        {% ([label, directive, ,lastOperandObject]) => {
            const errorFromLabel = label ? validateLabelName(label[0].value, label[0].offset) : null;
            const { error, ...stringzObject } = lastOperandObject;
            
            return {
                label: label ? label[0].value : null,
                labelStart: label ? label[0].col : null,
                labelEnd: label ? label[0].value.length + label[0].offset : null,
                directive: directive.value,
                directiveStart: directive.col,
                directiveEnd: directive.value.length + directive.offset,
                ...stringzObject,
                error: [...(error || []), ...(errorFromLabel ? [errorFromLabel] : [])]
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
                error: [...(error ? [error] : [])]
            };
        } %}
    
    |   %label %ws %minus %ws %label
        {% ([label1, , , , label2]) => {
            const errors = [];
            let error = validateLabelName(label1.value, label1.offset);
            if (error) {
                errors.push(error);
            }
            error = validateLabelName(label2.value, label2.offset);
            if (error) {
                errors.push(error);
            }

            return {
                label1: label1.value,
                label1Start: label1.col,
                label1End: label1.value.length + label1.offset,
                label2: label2.value,
                label2Start: label2.col,
                label2End: label2.value.length + label2.offset,
                error: errors
            };
        } %}

string
    ->  %stringzSequence
        {% ([string]) => {
            const errors = [];
            const validEscapeCharacters = ['n', 't', 'r', 'b', 'a', 'f', 'v', '\'', '"', '\\'];
            const text = string.value.slice(1,string.value.length-1);

            for (let i = 0; i < text.length; i++) {
                if (i+1 >= text.length) {
                    if (text[i] == '\\') {
                        errors.push({semanticError: `Invalid escape sequence '${text[i]}' at index ${i+2+string.offset}`, end: i+2+string.offset});
                    }
                } else if (text[i] == '\\' && !validEscapeCharacters.includes(text[i] + 1)) {
                    errors.push({semanticError: `Invalid escape sequence '${text[i]}' at index ${i+2+string.offset}`, end: i+3+string.offset});
                }
            }

            return {
                stringz: string.value,
                stringzStart: string.col,
                stringzEnd: string.value.length + string.offset,
                error: errors
            };
        } %}
        

        

# immediate values are in 5 bits
addAndOperand
    ->  %register 
        {% ([register]) => {
            return {
                operand: {
                    storeRegister2: register.value,
                    lastOperandStart: register.col,
                    lastOperandEnd: register.value.length + register.offset
                },
                error: {}
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
                error: {
                    ...(error || {})
                }
            };
        } %}

    |   %binary
        {% ([binary]) => {
            const error = validateBinaryWithinRange(binary.value, 5, binary.offset);
            return {
                operand: {
                    binary: binary.value,
                    lastOperandStart: binary.col,
                    lastOperandEnd: binary.value.length + binary.offset
                },
                error: {
                    ...(error || {})
                }
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
                error: {
                    ...(error || {})
                }
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
                error: {
                    ...(errorFromLabel || {})
                }
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
                error: {
                    ...(error || {})
                }
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
                error: {
                    ...(error || {})
                }
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
                error: {
                    ...(error || {})
                }
            };
        } %}

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
                error: {
                    ...(errorFromLabel || {})
                }
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
                error: {
                    ...(error || {})
                }
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
                error: {
                    ...(error || {})
                }
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
                error: {
                    ...(error || {})
                }
            };
        } %}

# ld, ldi, st, sti, br, lea all have the same last operand
ldLdiStStiLeaOperand
    ->  brOperand {% id %}

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
                error: {
                    ...(error || {})
                }
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
                error: {
                    ...(error || {})
                }
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
                error: {
                    ...(error || {})
                }
            };
        } %}

_
    ->	[ \t]:*


