require("./base");

var DownloadPages = DownloadPages || {};

// Properties
DownloadPages.requiredArgs = ["l", "d", "e"];
DownloadPages.helpMessage = "Usage: DownloadPages [options]\n" +
		"Where [options] can be:\n" +
		"  -?              : show help\n" +
		"  -l=<file name>  : (required)page list file\n" +
		"  -d=<directory>  : (required)directory where html files are saved\n" +
		"  -e=<error log>  : (required)error log\n" +
		"  -x=<workers>    : (optional)number of download workers. DEFAULT=5\n";
DownloadPages.pageListFile = "";
DownloadPages.htmlPath = "";
DownloadPages.numWorkers = 5;
DownloadPages.errorLog = "";
DownloadPages.numDone = 0;
DownloadPages.numTotal = 0;
DownloadPages.failList = [];
DownloadPages.numWorkersRunning = 0;

// Methods
DownloadPages.parseParameters = function() {
	var args = require("minimist")(process.argv.slice(2));
	var fs = require('fs');

	for (var arg in this.requiredArgs) {
		if (args[this.requiredArgs[arg]] === undefined) {
			return this.helpMessage;
		}
	}

	this.pageListFile = args.l;
	if (!fs.existsSync(this.pageListFile)) {
		return this.helpMessage;
	}

	this.htmlPath = args.d;
	if (!fs.existsSync(this.htmlPath)) {
		return this.helpMessage;
	}

	this.errorLog = args.e;

	if (args.x !== undefined) {
		this.numWorkers = parseInt(args.x);
		if (isNaN(this.numWorkers)) {
			return this.helpMessage;
		}
	}

	return true;
}


DownloadPages.onJobDone = function(workerID, isSuccess, url, jobID, content) {
	this.numDone += 1;
	if (isSuccess) {
		var fileName = this.htmlPath + "/" + jobID + ".html";
		require('fs').writeFileSync(fileName, content);
		console.log("Worker#" + workerID + ": " + jobID + " (" + this.numDone + "/" + this.numTotal + ") - done");
	} else {
		this.failList.push({
			url: url,
			hash: jobID
		});
		console.log("Worker#" + workerID + ": " + jobID + " (" + this.numDone + "/" + this.numTotal + ") - failed");
	}
	// console.log(workerID + "," + isSuccess + "," + url + "," + jobID + ":" + content);
}

DownloadPages.onAllDone = function(workerID) {
	console.log("Worker#" + workerID + ": " + "exits!");
	this.numWorkersRunning -= 1;
	if (this.numWorkersRunning == 0) {
		// write error log
		if (this.failList.length > 0) {
			require('fs').writeFileSync(this.errorLog, JSON.stringify(this.failList));
		}
	}
}

DownloadPages.run = function() {
	// create workers
	var Worker = load("batch.DownloadWorker").Worker;
	var workers = [];
	for (var i = 0; i < this.numWorkers; i ++) {
		var worker = new Worker(i, DownloadPages.onJobDone, DownloadPages.onAllDone, DownloadPages);
		workers.push(worker);
	}

	// Dispatch jobs
	var fs = require('fs');
	var pageList = JSON.parse(fs.readFileSync(this.pageListFile, 'utf8'));
	for (var i = 0; i < pageList.length; i ++) {
		var workerIndex = i % this.numWorkers;
		workers[workerIndex].addJob(pageList[i].url, pageList[i].hash);
	}
	this.numTotal = pageList.length;

	// Start running ...
	this.numWorkersRunning = this.numWorkers;
	for (var i = 0; i < this.numWorkers; i ++) {
		workers[i].run();
	}
}

// Execution
var result = DownloadPages.parseParameters();
if (result !== true) {
	console.log(result);
	return;
}

DownloadPages.run();

