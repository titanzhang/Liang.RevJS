
var SolrManager = SolrManager || {};

SolrManager.servers = {};

SolrManager.getServer = function(logicalName) {
	if (this.servers[logicalName] === undefined) {
		this.servers[logicalName] = new Solr(logicalName);
	}
	return this.servers[logicalName];
}


function Solr(logicalName) {
	var config = loadConfig('solr');

	this.CMD_UPDATE = "update";	
	this.masterConfig = config[logicalName].master;
	this.slaveConfig = config[logicalName].slave;	
}

Solr.prototype.getMaster = function() {
	return this.masterConfig;
}

Solr.prototype.getSlave = function() {
	var index = Math.floor(Math.random() * this.slaveConfig.length);
	return this.slaveConfig[index];
}

Solr.prototype.addDocuments = function(docList) {
	return new Promise( (resolve, reject) => {
		var updateUrl = this.getMaster() + this.CMD_UPDATE;
		var sendData = JSON.stringify(docList);

		const curl = load("common.Curl");
		curl.post(updateUrl, sendData, 30000, 'application/json')
			.then( (httpReturn) => {
				resolve({
					headers: httpReturn.headers,
					data: JSON.parse(httpReturn.data)
				});
			})
			.catch( (error) => {
				reject( {message: error.message} );
			});
	});
}

function Product() {
	this.hash = 0;
	this.title = '';
	this.content = '';
	this.url = '';
	this.price = 0.0;
	this.price_change = 0.0;
	this.price_change_percent = 0.0;
}

Product.prototype.setHash = function(hash) {
	this.hash = hash;
	return this;
}

Product.prototype.setTitle = function(title) {
	this.title = title;
	return this;
}

Product.prototype.setContent = function(content) {
	this.content = content;
	return this;
}

Product.prototype.setUrl = function(url) {
	this.url = url;
	return this;
}

Product.prototype.setPrice = function(price) {
	this.price = price;
	return this;
}

Product.prototype.setPriceChange = function(priceChange) {
	this.price_change = priceChange;
	return this;
}

Product.prototype.setPriceChangePercent = function(priceChangePercent) {
	this.price_change_percent = priceChangePercent;
	return this;
}


exports.manager = SolrManager;
exports.Product = Product;
