/**
 * Graphorum
 */

var express = require('express')
  , neo4j = require('neo4j')
  , db;

var app = module.exports = express.createServer();


// Configuration

app.configure(function(){
  app.register('.html', require('ejs'));
  app.set('views', __dirname + '/views');
  app.set('view engine', 'html');
  app.set('view options', { layout: false });
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
  db = new neo4j.GraphDatabase('http://localhost:7474');
});

app.configure('production', function(){
  app.use(express.errorHandler());
  db = new neo4j.GraphDatabase(process.env.NEO4J_REST_URL);
});


// Routes

app.get('/', function(req, res){
  res.render('index', { title: 'Graphorum' });
});

var port = process.env.PORT || 3000;
app.listen(port);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);