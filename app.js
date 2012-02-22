/**
 * Graphorum
 */

var everyauth = require('everyauth');

var express = require('express')
  , neo4j = require('neo4j')
  , markdown = require('markdown')
  , _und = require('underscore')
  , bcrypt = require('bcrypt')
  , check = require('validator').check
  , sanitize = require('validator').sanitize
  , db;

everyauth.everymodule
  .findUserById( function (id, callback) {
    var node = db.getNodeById(id, function(err, user) {
      if (err) callback(err);
      callback(null, user.data);
    });
  });

everyauth.password
  .getLoginPath('/login')
  .postLoginPath('/login')
  .loginView('login')
  .loginFormFieldName('username')
  .extractExtraRegistrationParams( function (req) {
    return {
      email: req.body.email
    };
  })
  .authenticate( function (login, password) {
    
    var promise = this.Promise();

    var node = db.getIndexedNode('users', 'username', login, function(err, result) {
      if (err) return promise.fulfill([err]);
      bcrypt.compare(password, result.data.password, function(err, res) {
        if (err) return promise.fulfill([err]);
        if (res == true) {
          var user = _und.extend({ id: result.id }, result.data);
          promise.fulfill(user);
        } else {
          return promise.fulfill(['Login failed, bad password']);
        }
      });
    });

    return promise;

  })
  .loginSuccessRedirect('/')
  .getRegisterPath('/register')
  .postRegisterPath('/register')
  .registerView('register')
  .validateRegistration( function (newUserAttributes) {

    var errors = validateRegistration(newUserAttributes);
    return errors;

  })
  .registerUser( function (newUserAttributes) {

    var promise = this.Promise();

    bcrypt.genSalt(10, function(err, salt) {
      if (err) return promise.fulfill([err]); 
      bcrypt.hash(newUserAttributes.password, salt, function(err, hash) {
        if (err) return promise.fulfill([err]);

        var user = _und.clone(newUserAttributes);
        delete user.login;
        user.password = hash;
        user.username = newUserAttributes.login;

        db.getIndexedNode('users', 'username', user.username, function(err, result) {
          if (result) {
            return promise.fulfill(['Username already registered.']);
          } else {
            var node = db.createNode(user);

            node.save(function (err) {
              if (err) return promise.fulfill([err]);
              node.index('users', 'username', node.data.username, function(err) {
                if (err) return promise.fulfill([err]);
                user.id = node.id;
                promise.fulfill(user);
              }, true);
            });
          }
        });

      });
    });

    return promise;

  })
  .registerSuccessRedirect('/');


function validateRegistration(newUserAttributes) {
  var errors = [];

  try {
    check(newUserAttributes.login, 'Please enter a valid username (2-20 chars, alphanumeric only).').is(/^[A-Za-z0-9_]{2,20}$/);
  } catch (error) {
    errors.push(error.message);
  }

  try {
    check(newUserAttributes.password, 'Please enter a valid password (6-20 chars).').len(6, 20);
  } catch (error) {
    errors.push(error.message);
  }

  try {
    check(newUserAttributes.email, 'Please enter a valid email.').isEmail();
  } catch (error) {
    errors.push(error.message);
  }

  newUserAttributes.login = sanitize(newUserAttributes.login).xss();
  newUserAttributes.password = sanitize(newUserAttributes.password).xss();
  newUserAttributes.email = sanitize(newUserAttributes.email).xss();

  return errors;
}

var app = module.exports = express.createServer(
    express.bodyParser()
  , express.static(__dirname + "/public")
  , express.favicon()
  , express.cookieParser()
  , express.session({ secret: 'htuayreve'})
  , everyauth.middleware()
);


// Configuration

app.configure(function(){
  app.register('.html', require('ejs'));
  app.set('views', __dirname + '/views');
  app.set('view engine', 'html');
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
  db = new neo4j.GraphDatabase('http://localhost:7474');
  everyauth.debug = true;
});

app.configure('production', function(){
  app.use(express.errorHandler());
  db = new neo4j.GraphDatabase(process.env.NEO4J_REST_URL);
});

app.helpers({
    title: 'Graphorum'
});


// Routes

app.get('/', function(req, res){
  res.render('index', { scripts: 'index' });
});

require('./routes')(app, db);

everyauth.helpExpress(app);


// Start me up

var port = process.env.PORT || 3000;
app.listen(port);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);