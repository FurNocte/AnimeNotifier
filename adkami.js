var url = require('url');
var http = require('http');
var rsj = require('rsj');
var P = require('p-promise');
var html2json = require('html-to-json');

function main() {
    var defer = P.defer();
    getPage().then(function(list) {
        var news = [];
        for (i in list)
            news.push(fullTitle2JSON(list[i].item));
        defer.resolve(news);
    }).fail(function(err) {
        defer.reject(err);
    });

    return defer.promise;
}

function mainRSS() { // deprecated Adkami not update rss flux
    var defer = P.defer();
    var news = [];
    rsj.r2j('http://www.adkami.com/rss.xml', function(episodes) {
            var episodes = JSON.parse(episodes);
            for (var i in episodes) {
                var episode = episodes[i];
                if ((new Date()).getTime() - new Date(episode.date).getTime() < 900000)
                    continue;
                news.push(fullTitle2JSON(episode.title));
            }
            defer.resolve(news);
    });
    return defer.promise;
}

function fullTitle2JSON(fullTitle) {
    var json = {};
    json.name = fullTitle.match(/.*(?=(\ Episode|\ OAV|\ Spécial))/i)[0];
    json.ep = fullTitle.match(/[0-9]*(?=(\ vostfr|\ vf))/i)[0];
    json.host = 'adkami';
    return json;
}

function getPage() {
    var defer = P.defer();
    var parser = html2json.createParser(
    ['#tab2 li #index_haut', {
        'item': function (item) {
            return item.text();
        }
    }]);

    parser.request(url.format('http://www.adkami.com')).done(function (list) {
        defer.resolve(list);
    }, function (err) {
        defer.reject(err);
    });

    return defer.promise;
}

exports.main = main;
