module.exports = function(app, db) {
  app.get('/discussion/create', function(req, res) {
    res.render('discussion/create', { 'scripts': 'discussion.create' });
  });

  app.post('/discussion', function(req, res) {
    var node = db.createNode({ type: 'discussion', title: req.body.title, message: req.body.message });
    node.save(function (err) {
      if (err) {
        res.render('discussion/create', { scripts: 'discussion.create', errors: [err] });
        return;
      }
      res.render('index', { scripts: 'index' })
    });
  });
}