var http = require('http');
var fs   = require('fs');
var oppressor = require('oppressor');

var server = http.createServer(function (req, res) {
    var stream = fs.createReadStream('index.html');
    stream.pipe(res);
});

server.listen(8080);