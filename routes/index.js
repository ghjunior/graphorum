module.exports = function(app, db) {
  require('fs').readdirSync(__dirname).forEach(function(file) {
    var current = (__filename.lastIndexOf('/') === -1)? __filename : __filename.substr(__filename.lastIndexOf('/') + 1);
    if (file !== current) require('./' + file)(app, db);
  });
}