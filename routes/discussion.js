module.exports = function(app, db, middleware) {
  app.get('/discussion/create', middleware.authenticate, function(req, res) {
    res.render('discussion/create');
  });

  app.post('/discussion', middleware.authenticate, function(req, res) {
    db.batch([
        { id: 0, method : 'POST', to : '/node', body : { type: 'discussion', title: req.body.title, message: req.body.message } }
      , { id: 1, method : 'POST', to : '/node/' + req.user.id + '/relationships', body : { to : '{0}', type : 'CREATED', data: { date: new Date() } } }
    ], function(err, dbRes) {
      if (err) console.log(err);
      console.log(dbRes);
      res.redirect('/');
    });

    /*var node = db.createNode({ type: 'discussion', title: req.body.title, message: req.body.message });
    node.save(function (err) {
      if (err) {
        res.render('discussion/create', { scripts: 'discussion.create', errors: [err] });
        return;
      }
      res.render('index', { scripts: 'index' })
    });*/
  });
}