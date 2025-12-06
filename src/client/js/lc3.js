// Generated automatically by nearley, version 2.20.1
// http://github.com/Hardmath123/nearley
(function () {
function id(x) { return x[0]; }

    const lexer = require('./lexer.js');
    const {validateLabelName, validateDecimalWithinRange, validateHexadecimalWithinRange, validateBinaryWithinRange, validateTrapVector, validateAddress, convertToBinaryString} = require('./grammarUtils.js');
var grammar = {
    Lexer: lexer,
    ParserRules: [
    {"name": "input", "symbols": ["_", "line"], "postprocess": (data) => data[1]},
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
    {"name": "line", "symbols": [(lexer.has("label") ? {type: "label"} : label), "_"], "postprocess":  ([label]) => {
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
                binary: binary + `   => ${opcode.text} ${destinationRegister.value}, ${sourceRegister1.value}, ${lastOperand.text}`
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
                binary: binary + `   => ${opcode.value} ${lastOperand.text}`
            }
        } },
    {"name": "operandExpression", "symbols": [(lexer.has("jmpOpcode") ? {type: "jmpOpcode"} : jmpOpcode), (lexer.has("ws") ? {type: "ws"} : ws), (lexer.has("register") ? {type: "register"} : register)], "postprocess":  ([opcode, , register]) => {
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
        } },
    {"name": "operandExpression", "symbols": [(lexer.has("jsrrOpcode") ? {type: "jsrrOpcode"} : jsrrOpcode), (lexer.has("ws") ? {type: "ws"} : ws), (lexer.has("register") ? {type: "register"} : register)], "postprocess":  ([opcode, , register]) => {
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
                binary: binary + `   => ${opcode.value} ${lastOperand.text}`
            }
        } },
    {"name": "operandExpression", "symbols": [(lexer.has("ldLdiStStiLeaOpcode") ? {type: "ldLdiStStiLeaOpcode"} : ldLdiStStiLeaOpcode), (lexer.has("ws") ? {type: "ws"} : ws), (lexer.has("register") ? {type: "register"} : register), (lexer.has("operandSeparator") ? {type: "operandSeparator"} : operandSeparator), "ldLdiStStiLeaOperand"], "postprocess":  ([opcode, , register, , lastOperand]) => {
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
                binary: binary + `   => ${opcode.value} ${register.value}, ${baseRegister.value}, ${lastOperand.text}`
            };
        } },
    {"name": "operandExpression", "symbols": [(lexer.has("notOpcode") ? {type: "notOpcode"} : notOpcode), (lexer.has("ws") ? {type: "ws"} : ws), (lexer.has("register") ? {type: "register"} : register), (lexer.has("operandSeparator") ? {type: "operandSeparator"} : operandSeparator), (lexer.has("register") ? {type: "register"} : register)], "postprocess":  ([opcode, , destinationRegister, , sourceRegister]) => {
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
        } },
    {"name": "operandExpression", "symbols": [(lexer.has("retOpcode") ? {type: "retOpcode"} : retOpcode)], "postprocess":  ([opcode]) => {
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
        } },
    {"name": "operandExpression", "symbols": [(lexer.has("rtiOpcode") ? {type: "rtiOpcode"} : rtiOpcode)], "postprocess":  ([opcode]) => {
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
        } },
    {"name": "operandExpression$subexpression$1", "symbols": [(lexer.has("decimal") ? {type: "decimal"} : decimal)]},
    {"name": "operandExpression$subexpression$1", "symbols": [(lexer.has("binary") ? {type: "binary"} : binary)]},
    {"name": "operandExpression$subexpression$1", "symbols": [(lexer.has("hexadecimal") ? {type: "hexadecimal"} : hexadecimal)]},
    {"name": "operandExpression", "symbols": [(lexer.has("trapOpcode") ? {type: "trapOpcode"} : trapOpcode), (lexer.has("ws") ? {type: "ws"} : ws), "operandExpression$subexpression$1"], "postprocess":  ([opcode, , [trapVector]]) => {
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
        } },
    {"name": "operandExpression$subexpression$2", "symbols": [(lexer.has("getcOpcode") ? {type: "getcOpcode"} : getcOpcode)]},
    {"name": "operandExpression$subexpression$2", "symbols": [(lexer.has("outOpcode") ? {type: "outOpcode"} : outOpcode)]},
    {"name": "operandExpression$subexpression$2", "symbols": [(lexer.has("putsOpcode") ? {type: "putsOpcode"} : putsOpcode)]},
    {"name": "operandExpression$subexpression$2", "symbols": [(lexer.has("inOpcode") ? {type: "inOpcode"} : inOpcode)]},
    {"name": "operandExpression$subexpression$2", "symbols": [(lexer.has("putspOpcode") ? {type: "putspOpcode"} : putspOpcode)]},
    {"name": "operandExpression$subexpression$2", "symbols": [(lexer.has("haltOpcode") ? {type: "haltOpcode"} : haltOpcode)]},
    {"name": "operandExpression", "symbols": ["operandExpression$subexpression$2"], "postprocess":  ([[opcode]]) => {
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
                operands: {
                    address: address.value,
                    addressStart: address.col,
                    addressEnd: address.value.length + address.offset,
                    type: address.type,
                },
                error: [...(errorFromAddress ? [errorFromAddress] : [])],
                binary: ''
            };
        }},
    {"name": "directiveExpression", "symbols": [(lexer.has("endDirective") ? {type: "endDirective"} : endDirective)], "postprocess":  ([directive]) => {
            return {
                directive: directive.value,
                directiveStart: directive.col,
                directiveEnd: directive.value.length + directive.offset,
                operands: {},
                error: [],
                binary: ''
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
                // no need to check for errors here because invalid characters wouldn't even parse
                /*
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
                */
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
        
        } },
    {"name": "directiveExpression$ebnf$2$subexpression$1", "symbols": [(lexer.has("label") ? {type: "label"} : label), (lexer.has("ws") ? {type: "ws"} : ws)]},
    {"name": "directiveExpression$ebnf$2", "symbols": ["directiveExpression$ebnf$2$subexpression$1"], "postprocess": id},
    {"name": "directiveExpression$ebnf$2", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "directiveExpression", "symbols": ["directiveExpression$ebnf$2", (lexer.has("blkwDirective") ? {type: "blkwDirective"} : blkwDirective), (lexer.has("ws") ? {type: "ws"} : ws), "blkwOperand"], "postprocess":  ([label, directive, , blkwOperand]) => {
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
        } },
    {"name": "directiveExpression$ebnf$3$subexpression$1", "symbols": [(lexer.has("label") ? {type: "label"} : label), (lexer.has("ws") ? {type: "ws"} : ws)]},
    {"name": "directiveExpression$ebnf$3", "symbols": ["directiveExpression$ebnf$3$subexpression$1"], "postprocess": id},
    {"name": "directiveExpression$ebnf$3", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "directiveExpression", "symbols": ["directiveExpression$ebnf$3", (lexer.has("stringzDirective") ? {type: "stringzDirective"} : stringzDirective), (lexer.has("ws") ? {type: "ws"} : ws), "string"], "postprocess":  ([label, directive, ,lastOperandObject]) => {
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
                error: [...(error ? [error] : [])],
                type: value.type
            };
        } },
    {"name": "string", "symbols": [(lexer.has("stringzSequence") ? {type: "stringzSequence"} : stringzSequence)], "postprocess":  ([string]) => {
            const errors = [];
            const validEscapeCharacters = ['n', 't', 'r', 'b', 'f', 'v', '\'', '"', '\\', '0'];
            const text = string.value.slice(1,-1);
        
            // no need to check this anymore because invalid string will not parse
            /*
            // ensure the string sequence is valid
            for (let i = 0; i < text.length; i++) {
                if (i+1 >= text.length) {
                    if (text[i] == '\\') {
                        errors.push({semanticError: `Invalid escape sequence '${text[i]}' at index ${i+2+string.offset}`, end: i+2+string.offset});
                    }
                } else if (text[i] == '\\' && !validEscapeCharacters.includes(text[i+1].toLowerCase())) {
                    errors.push({semanticError: `Invalid escape sequence '${text[i]}' at index ${i+2+string.offset}`, end: i+3+string.offset});
                }
            }*/
        
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
                reservedBit: '000',
                text: register.value
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
                reservedBit: '1',
                text: decimal.value
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
                reservedBit: '1',
                text: binary.value
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
                reservedBit: '1',
                text: hexadecimal.value
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
                binary: '0', // this value will be evaluated at a later point
                text: label.value
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
                binary: (error ? '0' : convertToBinaryString(decimal.value, decimal.type, 9)),
                text: decimal.value
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
                binary: (error ? '0' : binary.value.slice(2)),
                text: binary.value
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
                binary: (error ? '0' : convertToBinaryString(hexadecimal.value, hexadecimal.type, 9)),
                text: hexadecimal.value
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
                binary: '0', // this value will be evaluated at a later point
                text: label.value
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
                binary: (error ? '0' : convertToBinaryString(decimal.value, decimal.type, 11)),
                text: decimal.value
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
                binary: (error ? '0' : binary.value.slice(2)),
                text: binary.value
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
                binary: (error ? '0' : convertToBinaryString(hexadecimal.value, hexadecimal.type, 11)),
                text: hexadecimal.value
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
                binary: (error ? '0' : convertToBinaryString(decimal.value, decimal.type, 6)),
                text: decimal.value
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
                binary: (error ? '0' : binary.value.slice(2)),
                text: binary.value
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
                binary: (error ? '0' : convertToBinaryString(hexadecimal.value, hexadecimal.type, 6)),
                text: hexadecimal.value
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
