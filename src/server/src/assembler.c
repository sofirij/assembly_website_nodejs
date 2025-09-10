#include "SYMBOL_TABLE.h"
#include <ctype.h>
#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>


#define BUFFER_SIZE 300
#define OPCODE_COUNT 29
#define MAX_LINE_COUNT 10000

char* OPCODE_LIST[] = {"ADD", "AND", "BR", "BRn", "BRz", "BRp", "BRnz", "BRnp", "BRzp", "BRnzp", "LD", "LDI", "LDR", "LEA", "NOT", "ST", "STI", "STR", "TRAP", "HALT", "RET", "RTI", "JMP", "JSR", "JSRR", "GETC", "OUT", "PUTS", "IN"};
int BINARY_OPCODE_LIST[] = {0b0001, 0b0101, 0b0000, 0b0000, 0b0000, 0b0000, 0b0000, 0b0000, 0b0000, 0b0000, 0b0010, 0b1010, 0b0110, 0b1110, 0b1001, 0b0011, 0b1011, 0b0111, 0b1111, 0b1111, 0b1100, 0b1000, 0b1100, 0b0100, 0b0100, 0b1111, 0b1111, 0b1111, 0b1111};

Hashmap* create_label_hashmap(char***, int);
Hashmap* create_opcode_hashmap();

int read_decimal(char*);
int read_hexadecimal(char*);
int read_register(char*);

char* to_binary(int, int);

char** tokenize(char*);

int* get_string_tokens(char*);

void process_tokens(int*, char**, Hashmap*, Hashmap*);

int main() {
    char** lines[MAX_LINE_COUNT];
    int line_count = 0;

    char buffer[BUFFER_SIZE];

    // save the standard input as tokens
    while (fgets(buffer, sizeof(buffer), stdin) != NULL) {
        if (line_count > MAX_LINE_COUNT) {
            break;
        }

        // remove the \n from the end of the buffer
        char* last_newline = strrchr(buffer, '\n');
        if (last_newline) {
            *last_newline = '\0';
        }
        
        // remove the \r from the end of the buffer
        char* last_cr = strrchr(buffer, '\r');
        if (last_cr) {
            *last_cr = '\0';
        }
        
        char** token_line = tokenize(buffer);
        
        if (token_line != NULL) {
            lines[line_count] = tokenize(buffer);
            line_count++; 
        } 
    }

    Hashmap* label_map = create_label_hashmap(lines, line_count);
    Hashmap* opcode_map = create_opcode_hashmap();

    // process the standard input
    int pc = 1;
    for (int i = 0; i < line_count; i++) {
        char** line = lines[i];
        int length = atoi(line[0]);

        for (int j = 0; j < length; j++) {
            printf("%s ", line[j+1]);
        }
        printf("\n");

        process_tokens(&pc, lines[i], label_map, opcode_map);
    }

    // free hashmaps
    free_hashmap(label_map);
    free_hashmap(opcode_map);

    // free standard input
    for (int i = 0; i < line_count; i++) {
        char** line = lines[i];
        int length = atoi(line[0]);

        for (int j = 0; j < length+1; j++) {
            free(line[j]);
        }
        free(line);
    }
}

/*
    Create a hashmap of opcodes corresponding to the magnitude of their binary opcode values
*/
Hashmap* create_opcode_hashmap() {
    Hashmap* map = create_hashmap(1009);

    for (int i = 0; i < OPCODE_COUNT; i++) {
        insert(map, OPCODE_LIST[i], BINARY_OPCODE_LIST[i]);
    }

    return map;
}

/*
    Create a hashmap of labels corresponding to their line numbers
*/
Hashmap* create_label_hashmap(char*** lines, int line_count) {
    Hashmap* map = create_hashmap(1009);
    int pc = 1;

    for (int i = 0; i < line_count; i++) {
        char** line = lines[i];

        char* temp = line[1];

        int count = 0;
        while (count < OPCODE_COUNT && strcasecmp(temp, OPCODE_LIST[count]) != 0) {
            count++;
        }

        if (count == OPCODE_COUNT) {

            if (strcasecmp(temp, ".FILL") == 0 || strcasecmp(temp, ".ORIG") == 0) {
                pc++;
            } else if (strcasecmp(temp, ".BLKW") == 0) {
                int offset = read_decimal(line[2]);
                pc += offset;
            } else if (strcasecmp(temp, ".STRINGZ") == 0) {
                pc += strlen(line[2]) - 1;
            } else if (strcasecmp(temp, ".END") != 0) {
                insert(map, temp, pc);

                // check if an opcode or assembler directive follows the label
                if (atoi(line[0]) > 1) {
                    temp = line[2];

                    count = 0;
                    while (count < OPCODE_COUNT && strcasecmp(temp, OPCODE_LIST[count]) != 0) {
                        count++;
                    }

                    if (count == OPCODE_COUNT) {
                        if (strcasecmp(temp, ".FILL") == 0) {
                            pc++;
                        } else if (strcasecmp(temp, ".BLKW") == 0) {
                            int offset = read_decimal(line[3]);
                            pc += offset;
                        } else if (strcasecmp(temp, ".STRINGZ") == 0) {
                            pc += strlen(line[3]) - 1;
                        }
                    } else {
                        pc++;
                    }
                }
                
            }
        
        } else {
            pc++;
        }
    }

    return map;
}


/*
    Break down the strings to a list of tokens
*/
char** tokenize(char* buffer) {
    int i = 0;
    int buffer_length = strlen(buffer);
    int length = 0;

    // clean the string
    while (i < buffer_length) {
        if (buffer[i] == ';' || buffer[i] == '"') {
            break;
        } else if (buffer[i] == ',' || buffer[i] == ':') {
            buffer[i] = ' ';
        }
        i++;
    }

    // find the first occurence of a character that is not a whitespace
    i = 0;
    while (i < buffer_length && isspace(buffer[i])) {
        i++;
    }

    // the line doesnt have any tokens
    if (i == buffer_length || buffer[i] == ';') {
        return NULL;
    }

    // calculate the number of tokens in the string
    while (i < buffer_length) {
        if (isspace(buffer[i])) {
            while (i < buffer_length && isspace(buffer[i])) {
                i++;
            }
        } else if (buffer[i] == ';') {
            break;
        } else if (buffer[i] == '"') {
            length++;
            break;
        } else {
            length++;
            while (i < buffer_length && !isspace(buffer[i])) {
                i++;
            }
        }
    }


    // create a list of each individual token
    char** res = (char**) malloc(sizeof(char*) * (length+1));

    // the first element in the list is the number of tokens in the list
    char* length_string = (char*) malloc(sizeof(char) * 2);
    length_string[0] = length + 48;
    length_string[1] = '\0';
    res[0] = length_string;

    i = 0;
    for (int j = 0; j < length; j++) {
        while (i < buffer_length) {
            if (!isspace(buffer[i])) {
                break;
            }
            i++;
        }

        int start = i;
        i++;

        if (buffer[start] == '"') {
            while (i < buffer_length) {
                if (buffer[i] == '"' && buffer[i-1] != '"') {
                    i++;
                    break;
                }
                i++;
            }
        } else {
            while (i < buffer_length) {
                if (isspace(buffer[i])) {
                    break;
                }
                i++;
            }
        }

        int end = i;

        char* temp = (char*) malloc(sizeof(char) * (end-start+1));
        int index = 0;
        for (int k = start; k < end; k++) {
            temp[index++] = buffer[k];
        }
        temp[index] = '\0';
        

        res[j+1] = temp;
    }

    return res;


}
/*
    Return the integer conversion of the string representing a decimal value passed in
*/
int read_decimal(char* buffer) {
    int i = 0;
    while (buffer[i] != '#' && buffer[i] != '-' && !isdigit(buffer[i])) {
        i++;
    }

    if (buffer[i] == '#') {
        i++;
    }

    int length = strlen(buffer);

    char* temp = (char*) malloc(sizeof(char) * (length-i+1));
    int index = 0;

    for (int k = i; k < length; k++) {
        temp[index++] = buffer[k];
    }
    temp[index] = '\0';

    int value = atoi(temp);

    free(temp);

    return value;
}

/*
    Return the integer conversion of the string representive a hexadecimal value passed in
*/
int read_hexadecimal(char* buffer) {
    int i = 0;

    while (buffer[i] != 'x' && buffer[i] != 'X') {
        i++;
    }

    i++;

    int length = strlen(buffer);
    int index = 0;
    char* temp = (char*) malloc(sizeof(char) * length);
    for (int j = i; j < length; j++) {
        temp[index++] = buffer[j];
    }
    temp[index] = '\0';

    int value = strtol(temp, NULL, 16);

    free(temp);

    return value;
}

/*
    Process a line of tokens according to the opcode or assember direcitive
*/
void process_tokens(int *pc, char** line, Hashmap* label_map, Hashmap* opcode_map) {
    
    int index = 1;

    // check if token is a label
    if (get(label_map, line[index]) != -1) {
        // token is a label
        if (atoi(line[0]) < 2) {
            return;
        }
        index++;
    }

    (*pc)++;

    // check if token is an opcode
    if (get(opcode_map, line[index]) == -1) {
        // its an assembler directive
        char* assembler_directive = line[index];

        if (strcasecmp(assembler_directive, ".ORIG") == 0) {
            index++;
            char* binary_value = to_binary(read_hexadecimal(line[index]), 16);
            printf("%s\n\n", binary_value);
            free(binary_value);
        } else if (strcasecmp(assembler_directive, ".FILL") == 0) {
            index++;
            char* token = line[index];
            char* binary_value;

            if (token[0] == '#' ||  isdigit(token[0]) || token[0] == '-') {
                int decimal_value = read_decimal(token);
                binary_value = to_binary(decimal_value, 16);
            } else if ((token[0] == 'x' || token[0] == 'X') && get(label_map, token) == -1) {
                int hexadecimal_value = read_hexadecimal(token);
                binary_value = to_binary(hexadecimal_value, 16);
            } else if (isalpha(token[0]) && get(label_map, token) != -1) {
                binary_value = to_binary(get(label_map, token) - *pc, 16); 
            }

            printf("%s\n\n", binary_value);
            free(binary_value);
        } else if (strcasecmp(assembler_directive, ".BLKW") == 0) {
            index++;
            int decimal_value = read_decimal(line[index]);
            for (int i = 0; i < decimal_value; i++) {
                printf("%016d\n\n", 0);
            }
            *pc += decimal_value - 1;
        } else if (strcasecmp(assembler_directive, ".STRINGZ") == 0) {
            index++;
            char* token = line[index];
            int length = strlen(token);
            int* string_tokens = get_string_tokens(token);
            int string_tokens_length = string_tokens[0];

            for (int i = 0; i < string_tokens_length; i++) {
                char* binary_value = to_binary(string_tokens[i+1], 16);
                printf("%s\n\n", binary_value);
                free(binary_value);
            }

            printf("%016d\n\n", 0);
            *pc += length;
            free(string_tokens);
        }
    } else {
        // its an opcode
        char* opcode = line[index];

        int opcode_value = get(opcode_map, opcode);
        char* binary_opcode_value = to_binary(opcode_value, 4);

        printf("%s ", binary_opcode_value);
        free(binary_opcode_value);

        switch (opcode_value) {
            case 15: {
                // Trap Vectors
                printf("0000 ");

                char* token = line[index];

                if (strcasecmp(token, "HALT") == 0) {
                    printf("0010 0101\n\n");
                } else if (strcasecmp(token, "TRAP") == 0) {
                    index++;

                    token = line[index];

                    char* first;
                    char* second;

                    if (token[0] == 'x' || token[0] == 'X') {
                        int hexadecimal_value = read_hexadecimal(token);
                        first = to_binary(hexadecimal_value/10, 4);
                        second = to_binary(hexadecimal_value%10, 4);
                    } else if (token[0] == '#' || token[0] == '-' || isdigit(token[0])) {
                        int decimal_value = read_decimal(token);
                        first = to_binary(decimal_value/10, 4);
                        second = to_binary(decimal_value%10, 4);
                    }

                    printf("%s %s\n\n", first, second);
                    free(first);
                    free(second);
                } else if (strcasecmp(token, "IN") == 0) {
                    printf("0010 0011\n\n");
                } else if (strcasecmp(token, "PUTS") == 0) {
                    printf("0010 0010\n\n");
                } else if (strcasecmp(token, "OUT") == 0) {
                    printf("0010 0001\n\n");
                } else if (strcasecmp(token, "TRAP") == 0) {
                    printf("0010 0000\n\n");
                }

                break;
            }
            case 12: {
                // JMP or RET
                char* base_register;
                char* token = line[index];
                if (strcasecmp(token, "JMP") == 0) {
                    index++;
                    token = line[index];
                    base_register = to_binary(read_register(token), 3);
                    free(base_register);
                } else if (strcasecmp(token, "RET") == 0) {
                    base_register = "111";
                }

                printf("000 %s 000000\n\n", base_register);
                break;
            }
            case 8: {
                // RTI
                printf("0000 0000 0000\n\n");
                break;
            }
            case 4: {
                // JSR or JSRR
                char* token = line[index];
                if (strcasecmp(token, "JSR") == 0) {
                    index++;
                    token = line[index];
                    char* offset = to_binary(get(label_map, token) - *pc, 11);
                    printf("1 %s\n\n", offset);
                    free(offset);
                } else if (strcasecmp(token, "JSRR") == 0) {
                    index++;
                    token = line[index];
                    char* base_register = to_binary(read_register(token), 3);
                    printf("000 %s 000000\n\n", base_register);
                    free(base_register);
                }
                break;
            }
            case 9: {
                // NOT
                index++;
                char* token = line[index];
                char* destination_register = to_binary(read_register(token), 3);

                index++;
                token = line[index];
                char* source_register = to_binary(read_register(token), 3);

                printf("%s %s 111111\n\n", destination_register, source_register);
                break;
            }
            case 5:
            case 1: {
                // ADD or AND
                index++;
                char* token = line[index];
                char* destination_register = to_binary(read_register(token), 3);
                
                index++;
                token = line[index];
                char* source_register1 = to_binary(read_register(token), 3);

                printf("%s %s ", destination_register, source_register1);

                free(destination_register);
                free(source_register1);

                index++;
                token = line[index];
                if (token[0] == 'r' || token[0] == 'R') {
                    char* source_register2 = to_binary(read_register(token), 3);
                    printf("000 %s\n\n", source_register2);
                    free(source_register2);
                } else if (token[0] == 'x' || token[0] == 'X') {
                    char* immediate_value = to_binary(read_hexadecimal(token), 5);
                    printf("1 %s\n\n", immediate_value);
                    free(immediate_value);
                } else if (token[0] == '#' || token[0] == '-' || isdigit(token[0])) {
                    char* immediate_value = to_binary(read_decimal(token), 5);
                    printf("1 %s\n\n", immediate_value);
                    free(immediate_value);
                }

                break;
            }
            case 0: {
                // all BR configurations
                char* condition;
                char* token = line[index];

                if (strcasecmp(token, "BR") == 0 || strcasecmp(token, "BRnzp") == 0) {
                    condition = "111";
                } else if (strcasecmp(token, "BRn") == 0) {
                    condition = "100";
                } else if (strcasecmp(token, "BRz") == 0) {
                    condition = "010";
                } else if (strcasecmp(token, "BRp") == 0) {
                    condition = "001";
                } else if (strcasecmp(token, "BRnz") == 0) {
                    condition = "110";
                } else if (strcasecmp(token, "BRnp") == 0) {
                    condition = "101";
                } else if (strcasecmp(token, "BRzp") == 0) {
                    condition = "011";
                }

                index++;
                token = line[index];
                char* offset;

                if (get(label_map, token) != -1) {
                    offset = to_binary(get(label_map, token) - *pc, 9);
                } else if (token[0] == 'x' || token[0] == 'X') {
                    offset = to_binary(read_hexadecimal(token), 9);
                } else if (token[0] == '-' || token[0] == '#' || isdigit(token[0])) {
                    offset = to_binary(read_decimal(token), 9);
                }

                printf("%s %s\n\n", condition, offset);

                free(offset);
                break;
            }
            case 2:
            case 10:
            case 3:
            case 11: {
                // LD, LDI, ST, STI
                index++;
                char* token = line[index];
                char* destination_register = to_binary(read_register(token), 3);

                index++;
                token = line[index];
                char* offset = to_binary(get(label_map, token) - *pc, 9);

                printf("%s %s\n\n", destination_register, offset);

                free(destination_register);
                free(offset);

                break;
            }
            case 6:
            case 7: {
                // LDR, STR
                index++;
                char* token = line[index];

                char* first_register = to_binary(read_register(token), 3);
                
                index++;
                token = line[index];

                char* second_register = to_binary(read_register(token), 3);

                index++;
                token = line[index];

                char* offset = to_binary(read_decimal(token), 6);

                printf("%s %s %s\n\n", first_register, second_register, offset);

                free(first_register);
                free(second_register);
                free(offset);

                break;
            }
            case 14: {
                // LEA 
                index++;
                char* token = line[index];
                char* destination_register = to_binary(read_register(token), 3);

                index++;
                token = line[index];

                char* offset = to_binary(get(label_map, token) - *pc, 9);

                printf("%s %s\n\n", destination_register, offset);

                free(destination_register);
                free(offset);

                break;
            }
            default: 
                break;
        }
    }
}

/*
    convert a given number into a binary string in a specified amount of spaces
*/
char* to_binary(int number, int spaces) {
    bool negative = 0;
    if (number < 0) {
        negative = 1;
    }
    number = abs(number);
    char* value = (char*) malloc(sizeof(char) * (spaces+1));
    int index = spaces;

    value[index--] = '\0';
    while (index >= 0) {
        value[index--] = (number % 2) + 48;
        number /= 2;
    }

    // handle negative numbers
    if (negative) {
        // flip the bits
        for (int i = 0; i < spaces; i++) {
            if (value[i] == '0') {
                value[i] = '1';
            } else {
                value[i] = '0';
            }
        }

        // add 1
        int c = 1;
        for (int i = spaces-1; i >= 0; i--) {
            int temp = value[i] - 48 + c;
            if (temp > 1) {
                value[i] = '0';
                c = 1;
            } else {
                value[i] = temp + 48;
                c = 0;
            }
        }
    } 
    
    return value;
}

/*
    Return an array of the integer values of the ascii interpretation of the strings individual characters
*/
int* get_string_tokens(char* string) {
    int i = 1;
    int string_length = strlen(string);
    int tokens_length = 0;

    while (i < string_length-1) {
        if (string[i] == '\\') {
            i += 2;
        } else if (string[i] == '"' && i < string_length - 2) {
            i += 2;
        } else {
            i++;
        }
        tokens_length++;
    }

    int* res = (int*) malloc(sizeof(int) * (tokens_length+1));
    res[0] = tokens_length;

    i = 1;
    for (int j = 0; j < tokens_length; j++) {
        if (string[i] == '\\') {
            i++;
            char c = string[i];
            switch (c) {
                case 'n': {
                    res[j+1] = '\n';
                    break;
                }
                case 'r': {
                    res[j+1] = '\r';
                    break;
                }
                case 't': {
                    res[j+1] = '\t';
                    break;
                }
                case '\\': {
                    res[j+1] = '\\';
                    break;
                }
                case '\'': {
                    res[j+1] = '\'';
                    break;
                }
                case '\"': {
                    res[j+1] = '\"';
                    break;
                }
                case '\0': {
                    res[j+1] = '\0';
                    break;
                }
                default: {
                    res[j+1] = '\0';
                }
            }
        } else if (string[i] == '"' && i < string_length-2) {
            i++;
            res[j+1] = '"';
        } else {
            res[j+1] = string[i];
        }

        i++;
    }  
    
    return res;
}

/*
    Read a register represented as a string and return the integer conversion of the number of the register
*/
int read_register(char* string) {
    int i = 0;
    while (string[i] != 'R' && string[i] != 'r') {
        i++;
    }

    i++;
    char* temp = (char*) malloc(sizeof(char) * (2));
    temp[0] = string[i];
    temp[1] = '\0';

    int value = atoi(temp);

    free(temp);
    return value;
}