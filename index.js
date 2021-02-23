'use strict'

var moongose = require('mongoose');
var port = 3800;
var app = require("./app");

moongose.Promise = global.Promise;

moongose.connect('mongodb://localhost:27017/TwitterDB', {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false})
    .then(()=>{
        console.log('Conexión a la BD correcta');
        app.listen(port, ()=>{
            console.log('Servidor de express corriendo en el puerto: ', port);
        });
    }).catch(err => {
        console.log('Error al conectarse', err);
    })