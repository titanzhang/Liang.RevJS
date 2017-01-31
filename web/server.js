require('./base.js');

var express = require('express');
var app = express();
var path = require('path');
var bodyParser = require('body-parser');

app.set('x-powered-by', false)

// Template settings
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Static content settings
app.use(express.static(path.join(__dirname, 'static')));

// Parse application/json
app.use(bodyParser.json());

// Dynamic requests
app.get('/hello/:user', function(req, res) {
	res.render('hello', {name: req.params.user});
});

// Track/Update a product
app.get('/product/index/:url', load('web.controller.IndexController'));

// Update product information
app.post('/product/update', load('web.controller.UpdateController'));

// View product information
app.get('/product/get/:url', load('web.controller.ProductController'));

// Get product list
app.get('/product/list/:startRow/:numRows', load('web.controller.ListController'));

// Search
app.get('/product/search', load('web.controller.SearchController'))

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

app.listen(loadConfig('server').port, function() {
	console.log('Server is listening on port ' + loadConfig('server').port);
})