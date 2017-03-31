var Utils = Utils || {};

Utils.parseXML = function(content) {
	var xml = {};
	var XML2JS = require("xml2js");
	XML2JS.parseString(content, function(err, result) {
		xml = result;
	});
	return xml;
}

Utils.removeHTMLTags = function(html) {
	var regexp = /<[^>]*>/g;
	return html.replace(regexp, "");
}

Utils.deepReplace = function(pattern, rep, text) {
	var oldLength = text.length;
	var string = text.replace(pattern, rep);
	var newLength = string.length;

	while (oldLength !== newLength) {
		oldLength = string.length;
		string = string.replace(pattern, rep);
		newLength = string.length;
	}
	return string;
}

Utils.truncate = function(str, len, affix) {
	let result = str.substr(0, len);
	if (len < str.length) {
		result += affix;
	}
	return result;
}

Utils.log = function(module, message) {
	const currentTime = new Date();
	console.log('[' + currentTime.toLocaleString('en-US', {hour12:false}) + '] ' + module + ': ' + message);
}

// exports = Utils;
exports.parseXML = Utils.parseXML;
exports.removeHTMLTags = Utils.removeHTMLTags;
exports.deepReplace = Utils.deepReplace;
exports.log = Utils.log;
exports.truncate = Utils.truncate;

