module.exports = function(db) {
  this.db = db;

 	this.authenticate = function(req, res, next) {
    if (req.loggedIn) {
    	next();
    } else {
    	next(new Error('Please login first.'));
    }
  }

  return this;
};

/*

function loadUser(req, res, next) {
  // You would fetch your user from the db
  var user = users[req.params.id];
  if (user) {
    req.user = user;
    next();
  } else {
    next(new Error('Failed to load user ' + req.params.id));
  }
}

*/