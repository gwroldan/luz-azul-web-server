const express = require('express');
const http = require('http');

const https = require('https');
const fs = require('fs');

const app = express();
const tablaStock = require('./database/consulta-stock');
const tablaSueldos = require('./database/consulta-sueldos');
const tablaProductos = require('./database/consulta-productos');

const PORTHTTP = 9568;
const PORTHTTPS = 9569;

app.get('/', (req, res) => {
    res.status(200).send("Welcome to API REST");
});

app.get('/api/stock/:depositoId', (req, res) => {
	res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Request-With, Content-Type, Accept');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, PATCH, DELETE, OPTIONS');
    const depositoId = req.params.depositoId;
    if (depositoId) {
        tablaStock.getData(depositoId)
            .then((result) => {
                res.status(200).send(result);
            })
            .catch((err) => {
                res.status(401).send(err);
            });
    } else {
        res.status(401).send({ message: 'DepositoId invalido' });
    }
});

app.get('/api/lista-precios/:listaPrecioId', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Request-With, Content-Type, Accept');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, PATCH, DELETE, OPTIONS');
    const listaPrecioId = req.params.listaPrecioId;
    if (listaPrecioId) {
        tablaProductos.getData(listaPrecioId)
            .then((result) => {
                res.status(200).send(result);
            })
            .catch((err) => {
                res.status(401).send(err);
            });
    } else {
        res.status(401).send({ message: 'Lista de Precio invalida' });
    }
});

app.get('/api/sueldos/control', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Request-With, Content-Type, Accept');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, PATCH, DELETE, OPTIONS');

    const mes = req.query.mes;
    const anio = req.query.anio;

    if (mes && anio) {
        tablaSueldos.getData(mes, anio)
            .then((result) => {
                res.status(200).send(result);
            })
            .catch((err) => {
                res.status(401).send(err);
            });
    } else {
        res.status(401).send({ message: 'Mes o año invalido' });
    }
});

http.createServer(app).listen(PORTHTTP, () => {
    console.log('My http server listening on port ' + PORTHTTP + '...');
});

https.createServer({
    key: fs.readFileSync('./cert-zero-ssl/private.key'),
    cert: fs.readFileSync('./cert-zero-ssl/certificate.crt')
}, app).listen(PORTHTTPS, function(){
    console.log('My https server listening on port ' + PORTHTTPS + '...');
});
