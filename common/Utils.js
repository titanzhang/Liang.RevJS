var Utils = Utils || {};

Utils.curlGet = function(url, timeout) {
	var content = "";
	var EasyCurl = require("node-libcurl").Easy, Curl = require("node-libcurl").Curl;
	var curl = new EasyCurl();
	curl.setOpt(Curl.option.URL, url);
	curl.setOpt(Curl.option.CONNECTTIMEOUT, timeout);
	curl.setOpt(Curl.option.WRITEFUNCTION, function(buf, size, nmemb) {
		content += buf.toString('utf8');
		return size * nmemb;
	});
	var ret = curl.perform();
	curl.close();

	return content;
}

Utils.curlGetAsync = function(url, timeout, callback, callbackObj) {
	var Curl = require('node-libcurl').Curl;
	var curl = new Curl();

	curl.setOpt(Curl.option.URL, url);
	curl.setOpt(Curl.option.CONNECTTIMEOUT, timeout);
	curl.on('end', function(statusCode, body, headers) {
		callback.call(callbackObj, statusCode, body.toString('utf8'), headers.toString('utf8'));
    this.close();
	});
	curl.on('error', curl.close.bind(curl) );
	curl.perform();
}

Utils.parseXML = function(content) {
	var xml = {};
	var XML2JS = require("xml2js");
	XML2JS.parseString(content, function(err, result) {
		xml = result;
	});
	return xml;
}

exports.curlGet = Utils.curlGet;
exports.curlGetAsync = Utils.curlGetAsync;
exports.parseXML = Utils.parseXML;
