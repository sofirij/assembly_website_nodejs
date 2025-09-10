#ifndef SYMBOL_TABLE
#define SYMBOL_TABLE
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>
/*
    Symbol table representing a hash table using linear probing
*/
typedef struct Hashmap {
    int n; // capacity
    char** key_array;
    int* value_array;
} Hashmap;

Hashmap* create_hashmap(int);
void insert(Hashmap*, char*, int);
int hash(char*, int);
int get(Hashmap*, char*);
void print(Hashmap*);
void remove_trailing_spaces(char*);
void free_hashmap(Hashmap*);

/*
    Create hashmap of size chosen by the user
*/
Hashmap* create_hashmap(int capacity) {
    Hashmap *map = (Hashmap*) malloc(sizeof(Hashmap));

    map->n = capacity;
    map->key_array = (char**) calloc(map->n, sizeof(char*));
    map->value_array = (int*) calloc(map->n, sizeof(int));
    for (int i = 0; i < map->n; i++) {
        map->value_array[i] = -1;
    }

    return map;
}

/*
    Insert key and value into hashmap using linear probing
*/
void insert(Hashmap* map, char* key, int value) {
    remove_trailing_spaces(key);

    int length = 0;
    while (key[length] != '\0') {
        length++;
    }

    char* temp = (char*) malloc(sizeof(char) * (length+1));
    for (int i = 0; i < length; i++) {
        temp[i] = tolower(key[i]);
    }
    temp[length] = '\0';

    int index = hash(temp, map->n);

    char** key_array = map->key_array;
    int* value_array = map->value_array;

    // locate which index to insert the values
    while (value_array[index] != -1) {
        index = (index+1) % map->n;
    }

    // insert values into their respective arrays
    key_array[index] = temp;
    value_array[index] = value;
}

/*
    Calculate the hash for the key (formula = sum of ascii characters / capacity of map)
*/
int hash(char* key, int capacity) {
    int sum = 0;
    
    for (int i = 0; key[i] != '\0'; i++) {
        sum += key[i];
    }

    return sum % capacity;
}

/*
    Get the integer value corresponding to the key or -1 if its not in the hashmap
*/
int get(Hashmap* map, char* key) {
    remove_trailing_spaces(key);

    int length = 0;
    while (key[length] != '\0') {
        length++;
    }

    char* temp = (char*) malloc(sizeof(char) * (length+1));
    for (int i = 0; i < length; i++) {
        temp[i] = tolower(key[i]);
    }
    temp[length] = '\0';

    int index = hash(temp, map->n);

    char** key_array = map->key_array;
    int* value_array = map->value_array;
    int count = 0;
    
    while (count < map->n) {
        if (key_array[index] == NULL) {
            return -1;
        }
        if (strcasecmp(key_array[index], temp) == 0) {
            return value_array[index];
        }

        index = (index+1) % map->n;
        count++;
    }

    return -1;
}

/*
    Print out the parts of the hashmap that contains values
*/
void print(Hashmap* map) {
    printf("| %21s | %10s |\n", "key", "value");
    for (int i = 0; i < 38; i++) {
        printf("-");
    }
    printf("\n");

    for (int i = 0; i < map->n; i++) {
        if (map->value_array[i] != -1) {
            printf("| %21s | %10d |\n", map->key_array[i], map->value_array[i]);
        }
    }

    for (int i = 0; i < 38; i++) {
        printf("-");
    }
    printf("\n");
}

/*
    free the hashmap
*/
void free_hashmap(Hashmap* map) {
    // free the value array
    free(map->value_array);

    // free the key array
    for (int i = 0; i < map->n; i++) {
        if (map->key_array[i] != NULL) {
            free(map->key_array[i]);
        }
    }
    free(map->key_array);
    
    // free the map
    free(map);
}

void remove_trailing_spaces(char* str) {
    int len = strlen(str);
    while (len > 0 && isspace(str[len - 1])) {
        str[len-1] = '\0';
        len--;
    }
}
#endif