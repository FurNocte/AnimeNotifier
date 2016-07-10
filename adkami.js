var http = require('http');
var rsj = require('rsj');
var P = require('p-promise');

function main() {
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
    json.name = fullTitle.match(/.*(?=(\ Episode|\ OAV))/i)[0];
    json.ep = fullTitle.match(/[0-9]*(?=(\ vostfr|\ vf))/i)[0];
    json.host = 'adkami';
    return json;
}

exports.main = main;
