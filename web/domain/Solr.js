
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
	this.CMD_QUERY = "select";
	this.TIMEOUT_QUERY = 10000; // 10 seconds
	this.TIMEOUT_UPDATE = 30000; // 30 sencods

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

Solr.prototype.update = function(docList) {
	return new Promise( (resolve, reject) => {
		var updateUrl = this.getMaster() + this.CMD_UPDATE;
		var sendData = JSON.stringify(docList);

		const curl = load("common.Curl");
		curl.post(updateUrl, sendData, this.TIMEOUT_UPDATE, 'application/json')
			.then( (httpReturn) => {
				let jsonReturn = JSON.parse(httpReturn.data);
				if (jsonReturn.error !== undefined) {
					reject({message: 'Solr.update: ' + jsonReturn.error.msg});
				} else {
					resolve({
						headers: httpReturn.headers,
						data: jsonReturn
					});
				}
			})
			.catch( (error) => {
				reject( {message: 'Solr.update: ' + error.message} );
			});
	});
}

Solr.prototype.query = function(searchTermObject) {
	// const url = require('url');

	// Construct protocol hostname pathname of url
	// let solrUrlObject = url.parse(this.getMaster() + this.CMD_QUERY);

	// Default return format is JSON
	if (searchTermObject.wt === undefined) {
		searchTermObject.wt = 'json';
	}

	// Construct the complete solr request URL
	// solrUrlObject.query = searchTermObject;
	// const solrUrl = require('url').format(solrUrlObject);

	const solrUrl = this.getMaster() + this.CMD_QUERY + '?' + this.formatTerm(searchTermObject);
	// console.log(solrUrl);

	// Send request to solr server
	let taskChain = load("common.Curl").get(solrUrl, this.TIMEOUT_QUERY);
	taskChain = taskChain.then( (httpReturn) => {
		let jsonReturn = JSON.parse(httpReturn.data);
		if (jsonReturn.error !== undefined) {
			return Promise.reject({message: 'Solr.query.solr: ' + jsonReturn.error.msg});
		} else {
			return {
				headers: httpReturn.headers,
				data: jsonReturn
			};
		}
	});
	taskChain = taskChain.catch( (error) => {
		return Promise.reject( {message: 'Solr.query: ' + error.message} );
	});

	return taskChain;
}

Solr.prototype.formatTerm = function(searchTermObject) {
	const util = require('util');
	let termString = '';
	let prefix = '';
	for (let key in searchTermObject) {
		const value = searchTermObject[key];
		if (Array.isArray(value)) {
			if (value.length > 0) {
				for (let i in value) {
					termString += util.format('%s%s=%s', prefix, key, value[i]);
					prefix = '&';
				}
			}
		} else {
			termString += util.format('%s%s=%s', prefix, key, value);
			prefix = '&';
		}
	}
	return termString;
}

exports.manager = SolrManager;
