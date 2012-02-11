var express = require('express');

var app = express.createServer(express.logger());

app.get('/', function(request, response) {
  response.send('Hello Graphorum!');
});

var port = process.env.PORT || 3000;
app.listen(port, function() {
  console.log("Listening on " + port);
});

/*var neo4j = require('neo4j');
var db = new neo4j.GraphDatabase(process.env.NEO4J_REST_URL);

db.getNodeById(1, function(err, res) {
  if (err) {
    console.error(err);
  } else {
    console.log(res);
  }
});

db.getRelationshipById(1, function(err, res) {
  if (err) {
    console.error(err);
  } else {
    console.log(res);
  }
});

var query = "START ghjunior=node:node_auto_index(username = 'ghjunior') \
RETURN ghjunior";

db.query(function(err, res) { console.log(res) }, query);*/