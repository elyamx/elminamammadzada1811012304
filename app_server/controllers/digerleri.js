const hakkinda = function(req, res, next) {
  res.render('hakkinda', 
    { 
      title: 'Hakkında',
      'footer' : 'Elmina Mammadzada 2020'
    }
  );
}

module.exports = {
  hakkinda
}