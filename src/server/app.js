const express = require('express');
const index = require('./routes/index.js');
const app = express();
const port = 3000;

app.use(express.static(__dirname + '/../../dist'));
app.use(express.json());

app.use('/', index);

app.listen(port, () => {
    console.log(`Port open on ${port}`);
});

