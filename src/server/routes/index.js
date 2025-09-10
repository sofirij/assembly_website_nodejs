// single route to serve the html and process the assembly code

const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');

router.route('/')
    .get((req, res) => {
        res.sendFile(__dirname + '/../../../dist/index.html');
    })
    .post((req, res) => {
        // run the assembler.exe file and pass req data as stdin
        const child = spawn('exe/assembler.exe');
        const assemblyCode = req.body.assemblyCode;

        child.stdin.write(assemblyCode);
        child.stdin.end();

        child.stdout.on('data', (data) => {
            const binaryCode = data.toString();
            res.json({binaryCode: binaryCode});
        })
    });

module.exports = router;