var https = require('https');
var jsonfile = require('jsonfile');
var P = require('p-promise');
var adkami = require('./adkami.js');

var animes = {};
var config = {};
jsonfile.readFile('./config.json', function(err, obj) {
    if (err)
        console.log(err); 
    else
        config = obj;
});

sendSMS('Anime Notifier: Monster ep 1 est disponible sur adkami.');
/*addAnimeEp('Kill la Kill', 1, 'adkami').then(function() {
    addAnimeEp('Kill la Kill', 2, 'adkami');
}).then(function() {
    addAnimeEp('Tokyo Ghoul', 1, 'adkami');
}).then(function() {
    addAnimeEp('Tokyo Ghoul', 1, 'nekosan');
});*/

function addAnimeEp(name, ep, host) {
    var defer = P.defer();
    //sendSMS('Anime Notifier: ' + name + ' ep ' + ep + ' est disponible sur ' + host + '.');
    readAnimes().then(function() {
        if (!animes[name])
            animes[name] = {}
        if (!animes[name][ep])
            animes[name][ep] = [host];
        else
            animes[name][ep] = animes[name][ep].concat(host);
    }).then(function() {
        writeAnimes();
        defer.resolve();
    }).fail(function(err) {
        defer.reject(err);
    });
    return defer.promise;
}

function readAnimes() {
    var defer = P.defer();
    jsonfile.readFile('./animes.json', function(err, obj) {
        if (err)
            if (err.errno === 34) {
                animes = {};
                writeAnimes().then(function() {
                    readAnimes();
                }).fail(function(err) {
                    console.log(err);
                });
            } else {
                defer.reject(err);
                return defer.promise;
    }
        else
            animes = obj;
    });
    defer.resolve();
    return defer.promise;
}

function writeAnimes() {
    var defer = P.defer();
    jsonfile.writeFile('./animes.json', animes, function(err) {
        if (err) {
            defer.reject(err);
            return defer.promise;
        }
    });
    defer.resolve();
    return defer.promise;
}

function sendSMS(message) {
    message = encodeURIComponent(message);
    var req = https.request({
        hostname: 'smsapi.free-mobile.fr',
        port: 443,
        path: '/sendmsg?user=' + config.SMSUser + '&pass=' + config.SMSPass + '&msg=' + message,
        method: 'GET'
    }).end();
}
