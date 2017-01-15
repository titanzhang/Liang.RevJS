var Utils = Utils || {};

Utils.curlGet = function(url, timeout) {
	var content = "";
	var header = "";
	var EasyCurl = require("node-libcurl").Easy, Curl = require("node-libcurl").Curl;
	var curl = new EasyCurl();
	curl.setOpt(Curl.option.URL, url);
	curl.setOpt(Curl.option.CONNECTTIMEOUT, timeout);
	curl.setOpt(Curl.option.WRITEFUNCTION, function(buf, size, nmemb) {
		content += buf.toString('utf8');
		return size * nmemb;
	});
	curl.setOpt(Curl.option.HEADERFUNCTION, function(buf, size, nmemb) {
		header += buf.toString('utf8');
		return size * nmemb;
	});
	var ret = curl.perform();
	curl.close();

	var result = { status:true };

	if (ret != Curl.code.CURLE_OK) {
		result.status = false;
		result.statusCode = 0;
	} else {
		var responseHeader = Utils.parseHttpHeader(header);
		result.statusCode = responseHeader.statusCode;
		result.content = content;
	}

	return result;
}

Utils.parseHttpHeader = function(header) {
	var result = {};
	var lines = header.split("\n");

	// Http version, status code
	var line = lines[0];
	var chunks = line.split(' ');
	result.httpVersion = chunks[0];
	result.statusCode = parseInt(chunks[1]);

	return result;
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
