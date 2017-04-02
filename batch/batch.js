require('./base.js');

var scheduler = load('batch.scheduler');

// month, date, hour, minute
scheduler.register('*', '*', '1', '5', 'UpdatePrice', load('batch.job.UpdatePrice'));
scheduler.register('*', '*/2', '5', '5', 'UpdateAll', load('batch.job.UpdateAll'));

if (process.argv[2] === 'debug' && process.argv[3] !== undefined) {
	scheduler.execNow(process.argv[3]);
} else {	
	scheduler.run();
}
