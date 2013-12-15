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
        that = this,
        interval = 5000,
        cgMinerInfo = {
            summary: {
                speedHistory: []
            },
            devices: {}
        };

    config = merge(DEFAULT_CONFIG, config);

    console.log(config);
    console.log('Attempting to connect to cgminer @ %s:%s', config.cg_host, config.cg_port);

    cgMinerClient = new cgminer(config.cg_host, config.cg_port);

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

    app.get('/devices.json', function(req, res) {
        try {
            cgMinerClient.devs().then(function(result) {
                res.json(result);
            }).done();
        } catch (err) {
            return {"error" : err};
        }
    });

    app.get('/summary.json', function(req, res) {
        res.json(cgMinerInfo.summary);
    });

    app.listen(config.port);
    console.log('Server started on port %s', config.port);

    // Gather cgminer info periodically and store it for retreival by web requests
    setInterval(function() {

        try {
            cgMinerClient.summary().then(function(result) {
                var summary = cgMinerInfo.summary;
                summary.raw = result;
                summary.version = result.STATUS[0].Description;
                summary.mhs = result.SUMMARY[0]["MHS 5s"];
                summary.accepted = result.SUMMARY[0]["Accepted"];
                summary.rejected = result.SUMMARY[0]["Rejected"];
                summary.hardwareErrors = result.SUMMARY[0]["Hardware Errors"];
                
                summary.speedHistory.push([result.SUMMARY[0]["Elapsed"], summary.mhs]);

                if (summary.speedHistory.length > 500) {
                    summary.speedHistory = summary.speedHistory.slice(-500);
                }
            }).done();
        } catch (err) {
            return {"error" : err};
        }

    }, interval);
}
