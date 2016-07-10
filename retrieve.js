var https = require('https');
var jsonfile = require('jsonfile');
var P = require('p-promise');
var _ = require('underscore');

var adkami = require('./adkami.js');

animes = {};
config = {};
toSend = [];

function init() {
    var defer = P.defer();
    readAnimes().fail(function(err) {defer.reject();});
    jsonfile.readFile(__dirname + '/./config.json', function(err, obj) {
        if (err)
            defer.reject(err);
        else {
            config = obj;
            defer.resolve();
        }
    });
    return defer.promise;
}

init().then(function() {
    var defer = P.defer();
    adkami.main().then(function(list) {
        for (i in list) {
            var anime = list[i];
            if (!containsAnime(anime.name, anime.ep, anime.host))
                addAnimeEp(anime.name, anime.ep, anime.host);
        }
        defer.resolve();
    });
    return defer.promise;
}).then(function() {
    sendQueue();
}).fail(function(err) {
    console.log(err);
});

function containsAnime(name, ep, host) {
    for (anime in animes) {
        if (anime != name)
            continue;
        if (_.contains(animes[anime][ep], host))
            return true;
        else
            return false;
    }
    return false;
}

function sendQueue() {
    var message = 'Anime Notifier:';
    for (var i in toSend)
        message = message.concat('\n' + toSend[i].name + ' ep ' + toSend[i].ep + ' on ' + toSend[i].host);
    sendSMS(message);
}

function addAnimeEp(name, ep, host) {
    var defer = P.defer();
    toSend.push({"name": name, "ep": ep, "host": host});
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
    jsonfile.readFile(__dirname + '/./animes.json', function(err, obj) {
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
            }
            else {
                animes = obj;
                defer.resolve();
            }
    });
    return defer.promise;
}

function writeAnimes() {
    var defer = P.defer();
    jsonfile.writeFile(__dirname + '/./animes.json', animes, function(err) {
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
    https.request({
        hostname: 'smsapi.free-mobile.fr',
        port: 443,
        path: '/sendmsg?user=' + config.SMSUser + '&pass=' + config.SMSPass + '&msg=' + message,
        method: 'GET'
    }).end();
}
