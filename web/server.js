require('./base.js');

var express = require('express');
var app = express();
var path = require('path');

// Template settings
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Static content settings
app.use(express.static(path.join(__dirname, 'static')));

// Dynamic requests
app.get('/hello/:user', function(req, res) {
	res.render('hello', {name: req.params.user});
});

app.get('/product/index/json/:url', function(req, res) {
	// console.log(req.params.url);
	var model = load('web.controller.IndexController')(req.params.url);
	res.send(model);
});

// Handle 404
app.get('*', function(req, res) {
	res.status(404);
	if (req.accepts('html')) {
		res.render('404', {url: req.url});
		return;
	}

	if (req.accepts('json')) {
		res.send({error: 'Not found'});
		return;
	}

	res.send('Not found');
});

app.listen(3000, function() {
	console.log('Server is listening on port 3000');
})