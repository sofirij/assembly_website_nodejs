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

                // representing the bit mask
                const mask = 2 ** bits - 1;


                // convert the decimal to a binary in its 2's complement form
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
            // a register is always in 3 bits
            return parseInt(value.slice(1)).toString(2).padStart(3, '0');
        }
    }
}

module.exports = {validateLabelName, validateDecimalWithinRange, validateHexadecimalWithinRange, validateBinaryWithinRange, validateTrapVector, validateAddress, convertToBinaryString};