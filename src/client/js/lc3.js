// Generated automatically by nearley, version 2.20.1
// http://github.com/Hardmath123/nearley
(function () {
function id(x) { return x[0]; }

const lexer = require('./lexer.js');


    function validateLabelName(name, offset) {
        // labels should have a max length of 20
        if (name.length > 20) {
            return {semanticError : `Label name '${name}' is too long (max 20 characters) at index ${offset + 1}`, end: name.length + offset};
        }
    }

    function validateDecimalWithinRange(decimal, bits, offset) {
        // decimals should be in a range that can be represented by a signed {bits} bit integer
        const decimalString = decimal;
        const min = -1 * Math.ceil(((2 ** bits) - 1) / 2);
        const max = (-1 * min) - 1;
        decimal = parseInt(decimal.slice(1));
        
        if (decimal < min || decimal > max) {
            return {semanticError: `Decimal value '${decimal}' should be a signed value between ${min} and ${max} at index ${offset + 1}`, end: decimal.length + offset};
        }
    }

    function validateHexadecimalWithinRange(hexadecimal, bits, offset) {
        // hexadecimals should be in a range that can be represented by a signed {bits} bit integer
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
        // binary values should be in a range that can be represented by a signed {bits} bit integer
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
        // a trap vector can only be one of these values {x20, x21, x22, x23, x24, x25}
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
        // an address should be in a range that can be represented by a 16 bit unsigned integer
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

    function convertToBinaryString(value, type, bits) {
        // convert an operand to its binary value string
        // the operand will be in the valid range so no need to capture edge cases
        switch (type) {
            case 'decimal':{
                let binaryValue = parseInt(value.slice(1));
                if (binaryValue < 0) {
                    // convert a negative integer to its binary form in twos complement
                    // perform bit operations on the positive version of the number
                    binaryValue = binaryValue * -1;

                    // representing the bit mask for 5 bits
                    const bitsToFlip = 5;
                    const mask = 2 ** 5 - 1;

                    return ((mask & ~binaryValue) + 1).toString(2).padStart(bits, '1');
                } else {
                    return binaryValue.toString(2).padStart(bits, '0');
                }
            }
            case 'hexadecimal': {
                let binaryValue = parseInt(value);
                const maxPositiveVal = ((2 ** bits) / 2);
                if (binaryValue > maxPositiveVal) {
                    return binaryValue.toString(2).padStart(bits, '1');
                } else {
                    return binaryValue.toString(2).padStart(bits, '0');
                }
            }
            case 'register': {
                return parseInt(value.slice(1)).toString(2).padStart(3, '0');
            }
        }
    }
var grammar = {
    Lexer: lexer,
    ParserRules: [
    {"name": "input", "symbols": ["_", "line"], "postprocess": (data) => JSON.stringify(data[1])},
    {"name": "line$ebnf$1$subexpression$1", "symbols": [(lexer.has("label") ? {type: "label"} : label), (lexer.has("ws") ? {type: "ws"} : ws)]},
    {"name": "line$ebnf$1", "symbols": ["line$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "line$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "line", "symbols": ["line$ebnf$1", (lexer.has("comment") ? {type: "comment"} : comment)], "postprocess":  (data) => {
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
        } },
    {"name": "line$ebnf$2$subexpression$1", "symbols": [(lexer.has("label") ? {type: "label"} : label), (lexer.has("ws") ? {type: "ws"} : ws)]},
    {"name": "line$ebnf$2", "symbols": ["line$ebnf$2$subexpression$1"], "postprocess": id},
    {"name": "line$ebnf$2", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "line$ebnf$3$subexpression$1", "symbols": [(lexer.has("ws") ? {type: "ws"} : ws)]},
    {"name": "line$ebnf$3$subexpression$1", "symbols": [(lexer.has("ws") ? {type: "ws"} : ws), (lexer.has("comment") ? {type: "comment"} : comment)]},
    {"name": "line$ebnf$3", "symbols": ["line$ebnf$3$subexpression$1"], "postprocess": id},
    {"name": "line$ebnf$3", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "line", "symbols": ["line$ebnf$2", "operandExpression", "line$ebnf$3"], "postprocess":  (data) => {
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
        } },
    {"name": "line$ebnf$4$subexpression$1", "symbols": [(lexer.has("ws") ? {type: "ws"} : ws)]},
    {"name": "line$ebnf$4$subexpression$1", "symbols": [(lexer.has("ws") ? {type: "ws"} : ws), (lexer.has("comment") ? {type: "comment"} : comment)]},
    {"name": "line$ebnf$4", "symbols": ["line$ebnf$4$subexpression$1"], "postprocess": id},
    {"name": "line$ebnf$4", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "line", "symbols": ["directiveExpression", "line$ebnf$4"], "postprocess":  (data) => {
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
        } },
    {"name": "operandExpression", "symbols": [(lexer.has("addAndOpcode") ? {type: "addAndOpcode"} : addAndOpcode), (lexer.has("ws") ? {type: "ws"} : ws), (lexer.has("register") ? {type: "register"} : register), (lexer.has("operandSeparator") ? {type: "operandSeparator"} : operandSeparator), (lexer.has("register") ? {type: "register"} : register), (lexer.has("operandSeparator") ? {type: "operandSeparator"} : operandSeparator), "addAndOperand"], "postprocess":  ([opcode, , destinationRegister, , sourceRegister1, , lastOperand]) => {
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
                binary: binary
            };
        } },
    {"name": "operandExpression", "symbols": [(lexer.has("brOpcode") ? {type: "brOpcode"} : brOpcode), (lexer.has("ws") ? {type: "ws"} : ws), "brOperand"], "postprocess":  ([opcode, , lastOperand]) => {
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
                binary: binary
            }
        } },
    {"name": "operandExpression", "symbols": [(lexer.has("jmpOpcode") ? {type: "jmpOpcode"} : jmpOpcode), (lexer.has("ws") ? {type: "ws"} : ws), (lexer.has("register") ? {type: "register"} : register)], "postprocess":  ([opcode, , register]) => {
            const delimeter = ',';
            const binaryOpcode = '1100';
            const binaryBaseRegister = convertToBinaryString(register.value, register.type);
            const reservedBit = '0';
        
            const binary = binaryOpcode + delimeter + (reservedBit+delimeter).repeat(3) + binaryBaseRegister + (delimeter+reservedBit).repeat(6);
        
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
                binary: binary
            }
        } },
    {"name": "operandExpression", "symbols": [(lexer.has("jsrrOpcode") ? {type: "jsrrOpcode"} : jsrrOpcode), (lexer.has("ws") ? {type: "ws"} : ws), (lexer.has("register") ? {type: "register"} : register)], "postprocess":  ([opcode, , register]) => {
            const delimeter = ',';
            const binaryOpcode = '0100';
            const binaryBaseRegister = convertToBinaryString(register.value, register.type);
            const reservedBit = '0';
        
            const binary = binaryOpcode + delimeter + (reservedBit+delimeter).repeat(3) + binaryBaseRegister + (delimeter+reservedBit).repeat(6);
        
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
                binary: binary
            }
        } },
    {"name": "operandExpression", "symbols": [(lexer.has("jsrOpcode") ? {type: "jsrOpcode"} : jsrOpcode), (lexer.has("ws") ? {type: "ws"} : ws), "jsrOperand"], "postprocess":  ([opcode, , lastOperand]) => {
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
                binary: binary
            }
        } },
    {"name": "operandExpression", "symbols": [(lexer.has("ldLdiStStiLeaOpcode") ? {type: "ldLdiStStiLeaOpcode"} : ldLdiStStiLeaOpcode), (lexer.has("ws") ? {type: "ws"} : ws), (lexer.has("register") ? {type: "register"} : register), (lexer.has("operandSeparator") ? {type: "operandSeparator"} : operandSeparator), "ldLdiStStiLeaOperand"], "postprocess":  ([opcode, , destinationRegister, , lastOperand]) => {
            let binaryOpcode;
        
            switch (opcode.value) {
                case 'ld':
                    binaryOpcode = '0010';
                    break;
                case 'ldi':
                    binaryOpcode = '1010';
                    break;
                case 'st':
                    binaryOpcode = '0011';
                    break;
                case 'sti':
                    binaryOpcode = '1011';
                    break;
            }
        
            const delimeter = ',';
            const binaryDestinationRegister = convertToBinaryString(destinationRegister.value, destinationRegister.type);
            const binaryLastOperand = lastOperand.binary;
            const binary = binaryOpcode + delimeter + binaryDestinationRegister + delimeter + binaryLastOperand;
        
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
                error: [...lastOperand.error],
                binary: binary
            };
        } },
    {"name": "operandExpression", "symbols": [(lexer.has("ldrStrOpcode") ? {type: "ldrStrOpcode"} : ldrStrOpcode), (lexer.has("ws") ? {type: "ws"} : ws), (lexer.has("register") ? {type: "register"} : register), (lexer.has("operandSeparator") ? {type: "operandSeparator"} : operandSeparator), (lexer.has("register") ? {type: "register"} : register), (lexer.has("operandSeparator") ? {type: "operandSeparator"} : operandSeparator), "ldrStrOperand"], "postprocess":  ([opcode, , register, , baseRegister, , lastOperand]) => {
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
                binary: binary
            };
        } },
    {"name": "operandExpression", "symbols": [(lexer.has("notOpcode") ? {type: "notOpcode"} : notOpcode), (lexer.has("ws") ? {type: "ws"} : ws), (lexer.has("register") ? {type: "register"} : register), (lexer.has("operandSeparator") ? {type: "operandSeparator"} : operandSeparator), (lexer.has("register") ? {type: "register"} : register)], "postprocess":  ([opcode, , destinationRegister, , sourceRegister]) => {
            const delimeter = ',';
            const binaryOpcode = '1001';
            const reservedBits = '1,1,1,1,1,1';
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
                binary: binary
            }
        } },
    {"name": "operandExpression", "symbols": [(lexer.has("retOpcode") ? {type: "retOpcode"} : retOpcode)], "postprocess":  ([opcode]) => {
            const binaryOpcode = '1100';
            const delimeter = ',';
            const reservedBits = '0,0,0,1,1,1,0,0,0,0,0,0';
        
            const binary = binaryOpcode + delimeter + reservedBits;
        
            return {
                opcode: opcode.value,
                opcodeStart: opcode.col,
                opcodeEnd: opcode.offset + opcode.value.length,
                operands: {},
                error: [],
                binary: binary
            }
        } },
    {"name": "operandExpression", "symbols": [(lexer.has("rtiOpcode") ? {type: "rtiOpcode"} : rtiOpcode)], "postprocess":  ([opcode]) => {
            const binaryOpcode = '1000';
            const delimeter = ',';
            const reservedBits = '0,0,0,0,0,0,0,0';
        
            const binary = binaryOpcode + delimeter + reservedBits;
        
            return {
                opcode: opcode.value,
                opcodeStart: opcode.col,
                opcodeEnd: opcode.offset + opcode.value.length,
                operands: {},
                error: [],
                binary: binary
            }
        } },
    {"name": "operandExpression$subexpression$1", "symbols": [(lexer.has("decimal") ? {type: "decimal"} : decimal)]},
    {"name": "operandExpression$subexpression$1", "symbols": [(lexer.has("binary") ? {type: "binary"} : binary)]},
    {"name": "operandExpression$subexpression$1", "symbols": [(lexer.has("hexadecimal") ? {type: "hexadecimal"} : hexadecimal)]},
    {"name": "operandExpression", "symbols": [(lexer.has("trapOpcode") ? {type: "trapOpcode"} : trapOpcode), (lexer.has("ws") ? {type: "ws"} : ws), "operandExpression$subexpression$1"], "postprocess":  ([opcode, , [trapVector]]) => {
            const binaryOpcode = '1111';
            const reservedBits = '0000';
            const binaryTrapVector = convertToBinaryString(trapVector.value, trapVector.type, 6);
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
                binary: binary
            })
        } },
    {"name": "operandExpression$subexpression$2", "symbols": [(lexer.has("getcOpcode") ? {type: "getcOpcode"} : getcOpcode)]},
    {"name": "operandExpression$subexpression$2", "symbols": [(lexer.has("outOpcode") ? {type: "outOpcode"} : outOpcode)]},
    {"name": "operandExpression$subexpression$2", "symbols": [(lexer.has("putsOpcode") ? {type: "putsOpcode"} : putsOpcode)]},
    {"name": "operandExpression$subexpression$2", "symbols": [(lexer.has("inOpcode") ? {type: "inOpcode"} : inOpcode)]},
    {"name": "operandExpression$subexpression$2", "symbols": [(lexer.has("putspOpcode") ? {type: "putspOpcode"} : putspOpcode)]},
    {"name": "operandExpression$subexpression$2", "symbols": [(lexer.has("haltOpcode") ? {type: "haltOpcode"} : haltOpcode)]},
    {"name": "operandExpression", "symbols": ["operandExpression$subexpression$2"], "postprocess":  ([[opcode]]) => {
            return {
                opcode: opcode.value,
                opcodeStart: opcode.col,
                opcodeEnd: opcode.value.length + opcode.offset,
                operands: {},
                error: {}
            };
        } },
    {"name": "directiveExpression$subexpression$1", "symbols": [(lexer.has("hexadecimal") ? {type: "hexadecimal"} : hexadecimal)]},
    {"name": "directiveExpression$subexpression$1", "symbols": [(lexer.has("binary") ? {type: "binary"} : binary)]},
    {"name": "directiveExpression$subexpression$1", "symbols": [(lexer.has("decimal") ? {type: "decimal"} : decimal)]},
    {"name": "directiveExpression", "symbols": [(lexer.has("origDirective") ? {type: "origDirective"} : origDirective), (lexer.has("ws") ? {type: "ws"} : ws), "directiveExpression$subexpression$1"], "postprocess":  ([directive, , [address]]) => {
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
        }},
    {"name": "directiveExpression", "symbols": [(lexer.has("endDirective") ? {type: "endDirective"} : endDirective)], "postprocess":  ([directive]) => {
            return {
                directive: directive.value,
                directiveStart: directive.col,
                directiveEnd: directive.value.length + directive.offset,
                error: []
            };
        } },
    {"name": "directiveExpression$ebnf$1$subexpression$1", "symbols": [(lexer.has("label") ? {type: "label"} : label), (lexer.has("ws") ? {type: "ws"} : ws)]},
    {"name": "directiveExpression$ebnf$1", "symbols": ["directiveExpression$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "directiveExpression$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "directiveExpression$subexpression$2", "symbols": [(lexer.has("hexadecimal") ? {type: "hexadecimal"} : hexadecimal)]},
    {"name": "directiveExpression$subexpression$2", "symbols": [(lexer.has("binary") ? {type: "binary"} : binary)]},
    {"name": "directiveExpression$subexpression$2", "symbols": [(lexer.has("decimal") ? {type: "decimal"} : decimal)]},
    {"name": "directiveExpression$subexpression$2", "symbols": [(lexer.has("label") ? {type: "label"} : label)]},
    {"name": "directiveExpression$subexpression$2", "symbols": [(lexer.has("fillCharacter") ? {type: "fillCharacter"} : fillCharacter)]},
    {"name": "directiveExpression", "symbols": ["directiveExpression$ebnf$1", (lexer.has("fillDirective") ? {type: "fillDirective"} : fillDirective), (lexer.has("ws") ? {type: "ws"} : ws), "directiveExpression$subexpression$2"], "postprocess":  ([label, directive, , [value]]) => {
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
        
        } },
    {"name": "directiveExpression$ebnf$2$subexpression$1", "symbols": [(lexer.has("label") ? {type: "label"} : label), (lexer.has("ws") ? {type: "ws"} : ws)]},
    {"name": "directiveExpression$ebnf$2", "symbols": ["directiveExpression$ebnf$2$subexpression$1"], "postprocess": id},
    {"name": "directiveExpression$ebnf$2", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "directiveExpression", "symbols": ["directiveExpression$ebnf$2", (lexer.has("blkwDirective") ? {type: "blkwDirective"} : blkwDirective), (lexer.has("ws") ? {type: "ws"} : ws), "blkwOperand"], "postprocess":  ([label, directive, , blkwOperand]) => {
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
        } },
    {"name": "directiveExpression$ebnf$3$subexpression$1", "symbols": [(lexer.has("label") ? {type: "label"} : label), (lexer.has("ws") ? {type: "ws"} : ws)]},
    {"name": "directiveExpression$ebnf$3", "symbols": ["directiveExpression$ebnf$3$subexpression$1"], "postprocess": id},
    {"name": "directiveExpression$ebnf$3", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "directiveExpression", "symbols": ["directiveExpression$ebnf$3", (lexer.has("stringzDirective") ? {type: "stringzDirective"} : stringzDirective), (lexer.has("ws") ? {type: "ws"} : ws), "string"], "postprocess":  ([label, directive, ,lastOperandObject]) => {
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
        } },
    {"name": "blkwOperand$subexpression$1", "symbols": [(lexer.has("decimal") ? {type: "decimal"} : decimal)]},
    {"name": "blkwOperand$subexpression$1", "symbols": [(lexer.has("hexadecimal") ? {type: "hexadecimal"} : hexadecimal)]},
    {"name": "blkwOperand$subexpression$1", "symbols": [(lexer.has("binary") ? {type: "binary"} : binary)]},
    {"name": "blkwOperand", "symbols": ["blkwOperand$subexpression$1"], "postprocess":  ([[value]]) => {
            const error = validateAddress(value.value, value.type, value.offset);
            return {
                [`${value.type}`]: value.value,
                [`${value.type}Start`]: value.col,
                [`${value.type}End`]: value.value.length + value.offset,
                error: [...(error ? [error] : [])]
            };
        } },
    {"name": "blkwOperand", "symbols": [(lexer.has("label") ? {type: "label"} : label), (lexer.has("ws") ? {type: "ws"} : ws), (lexer.has("minus") ? {type: "minus"} : minus), (lexer.has("ws") ? {type: "ws"} : ws), (lexer.has("label") ? {type: "label"} : label)], "postprocess":  ([label1, , , , label2]) => {
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
        } },
    {"name": "string", "symbols": [(lexer.has("stringzSequence") ? {type: "stringzSequence"} : stringzSequence)], "postprocess":  ([string]) => {
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
        } },
    {"name": "addAndOperand", "symbols": [(lexer.has("register") ? {type: "register"} : register)], "postprocess":  ([register]) => {
            return {
                operand: {
                    storeRegister2: register.value,
                    lastOperandStart: register.col,
                    lastOperandEnd: register.value.length + register.offset
                },
                error: [],
                binary: convertToBinaryString(register.value, register.type),
                reservedBit: '000'
            };
        } },
    {"name": "addAndOperand", "symbols": [(lexer.has("decimal") ? {type: "decimal"} : decimal)], "postprocess":  ([decimal]) => {
            const error = validateDecimalWithinRange(decimal.value, 5, decimal.offset);
            return {
                operand: {
                    decimal: decimal.value,
                    lastOperandStart: decimal.col,
                    lastOperandEnd: decimal.value.length + decimal.offset
                },
                error: [...(error ? [error] : [])],
                binary: (error ? '0' : convertToBinaryString(decimal.value, decimal.type, 5)),
                reservedBit: '1'
            };
        } },
    {"name": "addAndOperand", "symbols": [(lexer.has("binary") ? {type: "binary"} : binary)], "postprocess":  ([binary]) => {
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
                reservedBit: '1'
            };
        } },
    {"name": "addAndOperand", "symbols": [(lexer.has("hexadecimal") ? {type: "hexadecimal"} : hexadecimal)], "postprocess":  ([hexadecimal]) => {
            const error = validateHexadecimalWithinRange(hexadecimal.value, 5, hexadecimal.offset);
            return {
                operand: {
                    hexadecimal: hexadecimal.value,
                    lastOperandStart: hexadecimal.col,
                    lastOperandEnd: hexadecimal.value.length + hexadecimal.offset
                },
                error: [...(error ? [error] : [])],
                binary: (error ? '0' : convertToBinaryString(hexadecimal.value, hexadecimal.type, 5)),
                reservedBit: '1'
            };
        } },
    {"name": "brOperand", "symbols": [(lexer.has("label") ? {type: "label"} : label)], "postprocess":  ([label]) => {
            const errorFromLabel = validateLabelName(label.value, label.offset);
            return {
                operand: {
                    label: label.value,
                    lastOperandStart: label.col,
                    lastOperandEnd: label.value.length + label.offset
                },
                error: [...(errorFromLabel ? [errorFromLabel] : [])],
                binary: '0' // this value will be evaluated at a later point
            }
        } },
    {"name": "brOperand", "symbols": [(lexer.has("decimal") ? {type: "decimal"} : decimal)], "postprocess":  ([decimal]) => {
            const error = validateDecimalWithinRange(decimal.value, 9, decimal.offset);
            return {
                operand: {
                    decimal: decimal.value,
                    lastOperandStart: decimal.col,
                    lastOperandEnd: decimal.value.length + decimal.offset
                },
                error: [...(error ? [error] : [])],
                binary: (error ? '0' : convertToBinaryString(decimal.value, decimal.type, 9))
            };
        } },
    {"name": "brOperand", "symbols": [(lexer.has("binary") ? {type: "binary"} : binary)], "postprocess":  ([binary]) => {
            const error = validateBinaryWithinRange(binary.value, 9, binary.offset);
            return {
                operand: {
                    binary: binary.value,
                    lastOperandStart: binary.col,
                    lastOperandEnd: binary.value.length + binary.offset
                },
                error: [...(error ? [error] : [])],
                binary: (error ? '0' : binary.value.slice(2))
            };
        } },
    {"name": "brOperand", "symbols": [(lexer.has("hexadecimal") ? {type: "hexadecimal"} : hexadecimal)], "postprocess":  ([hexadecimal]) => {
            const error = validateHexadecimalWithinRange(hexadecimal.value, 9, hexadecimal.offset);
            return {
                operand: {
                    hexadecimal: hexadecimal.value,
                    lastOperandStart: hexadecimal.col,
                    lastOperandEnd: hexadecimal.value.length + hexadecimal.offset
                },
                error: [...(error ? [error] : [])],
                binary: (error ? '0' : convertToBinaryString(hexadecimal.value, hexadecimal.type, 9))
            };
        } },
    {"name": "jsrOperand", "symbols": [(lexer.has("label") ? {type: "label"} : label)], "postprocess":  ([label]) => {
            const errorFromLabel = validateLabelName(label.value, label.offset);
            return {
                operand: {
                    label: label.value,
                    lastOperandStart: label.col,
                    lastOperandEnd: label.value.length + label.offset
                },
                error: [...(errorFromLabel ? [errorFromLabel] : [])],
                binary: '0' // this value will be evaluated at a later point
            }
        } },
    {"name": "jsrOperand", "symbols": [(lexer.has("decimal") ? {type: "decimal"} : decimal)], "postprocess":  ([decimal]) => {
            const error = validateDecimalWithinRange(decimal.value, 11, decimal.offset);
            return {
                operand: {
                    decimal: decimal.value,
                    lastOperandStart: decimal.col,
                    lastOperandEnd: decimal.value.length + decimal.offset
                },
                error: [...(error ? [error] : [])],
                binary: (error ? '0' : convertToBinaryString(decimal.value, decimal.type, 11))
            };
        } },
    {"name": "jsrOperand", "symbols": [(lexer.has("binary") ? {type: "binary"} : binary)], "postprocess":  ([binary]) => {
            const error = validateBinaryWithinRange(binary.value, 11, binary.offset);
            return {
                operand: {
                    binary: binary.value,
                    lastOperandStart: binary.col,
                    lastOperandEnd: binary.value.length + binary.offset
                },
                error: [...(error ? [error] : [])],
                binary: (error ? '0' : binary.value.slice(2))
            };
        } },
    {"name": "jsrOperand", "symbols": [(lexer.has("hexadecimal") ? {type: "hexadecimal"} : hexadecimal)], "postprocess":  ([hexadecimal]) => {
            const error = validateHexadecimalWithinRange(hexadecimal.value, 11, hexadecimal.offset);
            return {
                operand: {
                    hexadecimal: hexadecimal.value,
                    lastOperandStart: hexadecimal.col,
                    lastOperandEnd: hexadecimal.value.length + hexadecimal.offset
                },
                error: [...(error ? [error] : [])],
                binary: (error ? '0' : convertToBinaryString(hexadecimal.value, hexadecimal.type, 11))
            };
        } },
    {"name": "ldLdiStStiLeaOperand", "symbols": ["brOperand"], "postprocess": id},
    {"name": "ldrStrOperand", "symbols": [(lexer.has("decimal") ? {type: "decimal"} : decimal)], "postprocess":  ([decimal]) => {
            const error = validateDecimalWithinRange(decimal.value, 6, decimal.offset);
            return {
                operand: {
                    decimal: decimal.value,
                    lastOperandStart: decimal.col,
                    lastOperandEnd: decimal.value.length + decimal.offset
                },
                error: [...(error ? [error] : [])],
                binary: (error ? '0' : convertToBinaryString(decimal.value, decimal.type, 6))
            };
        } },
    {"name": "ldrStrOperand", "symbols": [(lexer.has("binary") ? {type: "binary"} : binary)], "postprocess":  ([binary]) => {
            const error = validateBinaryWithinRange(binary.value, 6, binary.offset);
            return {
                operand: {
                    binary: binary.value,
                    lastOperandStart: binary.col,
                    lastOperandEnd: binary.value.length + binary.offset
                },
                error: [...(error ? [error] : [])],
                binary: (error ? '0' : binary.value.slice(2))
            };
        } },
    {"name": "ldrStrOperand", "symbols": [(lexer.has("hexadecimal") ? {type: "hexadecimal"} : hexadecimal)], "postprocess":  ([hexadecimal]) => {
            const error = validateHexadecimalWithinRange(hexadecimal.value, 6, hexadecimal.offset);
            return {
                operand: {
                    hexadecimal: hexadecimal.value,
                    lastOperandStart: hexadecimal.col,
                    lastOperandEnd: hexadecimal.value.length + hexadecimal.offset
                },
                error: [...(error ? [error] : [])],
                binary: (error ? '0' : convertToBinaryString(hexadecimal.value, hexadecimal.type, 6))
            };
        } },
    {"name": "_$ebnf$1", "symbols": []},
    {"name": "_$ebnf$1", "symbols": ["_$ebnf$1", /[ \t]/], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "_", "symbols": ["_$ebnf$1"]}
]
  , ParserStart: "input"
}
if (typeof module !== 'undefined'&& typeof module.exports !== 'undefined') {
   module.exports = grammar;
} else {
   window.grammar = grammar;
}
})();
