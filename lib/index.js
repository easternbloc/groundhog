'use strict';

var connect = require('connect'),
    fs = require('fs'),
    argh = require('argh'),
    _ = require('underscore');

var record = argh.argv.record,
    options = {
        dir: argh.argv.dir,
        hostname: argh.argv.hostname,
        strict: argh.argv.strict
    },
    configFile;

if (argh.argv.config) {
    configFile = argh.argv.config
} else if (fs.existsSync(process.cwd() + '/groundhog.conf.json')) {
    configFile = process.cwd() + '/groundhog.conf.json';
}
if (configFile) {
    var config = fs.readFileSync(configFile);
    if (config) {
        _.extend(options, JSON.parse(config))
    } else {
        throw Error('Config file: ' + configFile + ' could not be found.');
    }
}

if (argh.argv.help || argh.argv.h || !options.dir || !options.hostname) {
    usage();
}

if (record) {
    fs.mkdir(options.dir, function () {
        start();
    });
} else {
    start();
}

function start(err) {
    if (err) { throw err; }

    var handler;

    if (record) {
        handler = require('./recorder');
    } else {
        handler = require('./playback');
    }

    connect()
        .use(parseBody)
        .use(handler(options))
        .listen(argh.argv.port || 3001);
}

function usage() {
    console.log('Usage: ./bin/groundhog');
    console.log('Usage: node index.js\n');
    console.log('Attempts to load configuration options from a "groundhog.config.json" if it exists in the current working directory.\n\n');

    console.log('Usage: ./bin/groundhog --config');
    console.log('Usage: node index.js --config <file>\n');
    console.log('--config        load the options from a config file specified\n\n');

    console.log('Usage: ./bin/groundhog --hostname <hostname> --dir <directory> [--port] [--record] [--strict]');
    console.log('Usage: node index.js --hostname <hostname> --dir <directory> [--port] [--record] [--strict]\n');
    console.log('--hostname      host to which to proxy requests');
    console.log('--dir           directory in which to read/write playback files');
    console.log('--record        record the current session');
    console.log('--port          port to run on (default: 3001)');
    console.log('--strict        only serve recordings in playback mode\n\n');

    process.exit();
}

function parseBody(req, res, next) {
    req.body = '';
    req.on('data', function (data) {
        req.body += data;
    });
    next();
}