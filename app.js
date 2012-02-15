/**
 * Graphorum
 */

var everyauth = require('everyauth');

var express = require('express')
  , neo4j = require('neo4j')
  , markdown = require('markdown')
  , db;

var usersById = {};
var nextUserId = 0;

function addUser (source, sourceUser) {
  var user;
  if (arguments.length === 1) { // password-based
    user = sourceUser = source;
    user.id = ++nextUserId;
    return usersById[nextUserId] = user;
  } else { // non-password-based
    user = usersById[++nextUserId] = {id: nextUserId};
    user[source] = sourceUser;
  }
  return user;
}

var usersByLogin = {
  'brian@example.com': addUser({ login: 'brian@example.com', password: 'password'})
};

everyauth.everymodule
  .findUserById( function (id, callback) {
    callback(null, usersById[id]);
  });

everyauth.password
  .getLoginPath('/login') // Uri path to the login page
  .postLoginPath('/login') // Uri path that your login form POSTs to
  .loginView('login')
  .authenticate( function (login, password) {
    // Either, we return a user or an array of errors if doing sync auth.
    // Or, we return a Promise that can fulfill to promise.fulfill(user) or promise.fulfill(errors)
    // `errors` is an array of error message strings
    //
    // e.g., 
    // Example 1 - Sync Example
    // if (usersByLogin[login] && usersByLogin[login].password === password) {
    //   return usersByLogin[login];
    // } else {
    //   return ['Login failed'];
    // }
    //
    // Example 2 - Async Example
    // var promise = this.Promise()
    // YourUserModel.find({ login: login}, function (err, user) {
    //   if (err) return promise.fulfill([err]);
    //   promise.fulfill(user);
    // }
    // return promise;

    var errors = [];
    if (!login) errors.push('Missing login');
    if (!password) errors.push('Missing password');
    if (errors.length) return errors;
    var user = usersByLogin[login];
    if (!user) return ['Login failed'];
    if (user.password !== password) return ['Login failed'];
    return user;

  })
  .loginSuccessRedirect('/') // Where to redirect to after a login

    // If login fails, we render the errors via the login view template,
    // so just make sure your loginView() template incorporates an `errors` local.
    // See './example/views/login.jade'

  .getRegisterPath('/register') // Uri path to the registration page
  .postRegisterPath('/register') // The Uri path that your registration form POSTs to
  .registerView('register')
  .validateRegistration( function (newUserAttributes) {
    // Validate the registration input
    // Return undefined, null, or [] if validation succeeds
    // Return an array of error messages (or Promise promising this array)
    // if validation fails
    //
    // e.g., assuming you define validate with the following signature
    // var errors = validate(login, password, extraParams);
    // return errors;
    //
    // The `errors` you return show up as an `errors` local in your jade template

    var errors = [];
    var login = newUserAttributes.login;
    if (usersByLogin[login]) errors.push('Login already taken');
    return errors;

  })
  .registerUser( function (newUserAttributes) {
    // This step is only executed if we pass the validateRegistration step without
    // any errors.
    //
    // Returns a user (or a Promise that promises a user) after adding it to
    // some user store.
    //
    // As an edge case, sometimes your database may make you aware of violation
    // of the unique login index, so if this error is sent back in an async
    // callback, then you can just return that error as a single element array
    // containing just that error message, and everyauth will automatically handle
    // that as a failed registration. Again, you will have access to this error via
    // the `errors` local in your register view jade template.
    // e.g.,
    // var promise = this.Promise();
    // User.create(newUserAttributes, function (err, user) {
    //   if (err) return promise.fulfill([err]);
    //   promise.fulfill(user);
    // });
    // return promise;
    //
    // Note: Index and db-driven validations are the only validations that occur 
    // here; all other validations occur in the `validateRegistration` step documented above.

    var login = newUserAttributes[this.loginKey()];
    return usersByLogin[login] = addUser(newUserAttributes);

  })
  .registerSuccessRedirect('/'); // Where to redirect to after a successful registration


var app = module.exports = express.createServer(
    express.bodyParser()
  , express.static(__dirname + "/public")
  , express.favicon()
  , express.cookieParser()
  , express.session({ secret: 'htuayreve'})
  , everyauth.middleware()
);


// Configuration

everyauth.debug = true;

app.configure(function(){
  app.register('.html', require('ejs'));
  app.set('views', __dirname + '/views');
  app.set('view engine', 'html');
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
  db = new neo4j.GraphDatabase('http://localhost:7474');
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
  res.render('index');
});

everyauth.helpExpress(app);


// Start me up

var port = process.env.PORT || 3000;
app.listen(port);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);