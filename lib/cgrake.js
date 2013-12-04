require('better-require')();
var express = require('express'),
    engines = require('consolidate'),
    fs = require('fs'),
    merge = require('merge'),
    cgminer = require("cgminer");

var DEFAULT_CONFIG = {
    cg_host: "localhost",
    cg_port: 4028,
    port: 8080
};

module.exports = CGRake;

function CGRake(config) {

    var app = express(),
        that = this;

    config = merge(DEFAULT_CONFIG, config);

    console.log(config);

    cgMinerClient = new cgminer(config.cg_host, config.cg_port);

    cgMinerClient.summary().then(function(result) {
        console.log(result);
    }).done();

    app.set('views', __dirname + '/../views');
    app.set('view options', {layout: false});
    app.set('view engine', 'html');
    app.use("/public/", express.static(__dirname + '/../public'));
    app.engine('html', engines.hogan);

    app.get('/', function(req, res){
        res.render('index', {
            "config": config,
        });
    });

    app.get('/devices.json', function(req, res){
        try {
            cgMinerClient.devs().then(function(result) {
                res.json(result);
            }).done();
        } catch (err) {
            return {"error" : err};
        }
    });

    app.get('/summary.json', function(req, res){
        try {
            cgMinerClient.summary().then(function(result) {
                res.json(result);
            }).done();
        } catch (err) {
            return {"error" : err};
        }
    });

    app.listen(config.port);
    console.log('Server started on port %s', config.port);
}
