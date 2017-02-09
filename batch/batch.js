require('./base.js');

if (process.argv[2] === 'debug') {
	setTimeout(load('batch.job.UpdatePrice'), 0);
} else {
	var scheduler = load('batch.scheduler');

	// month, date, hour, minute
	scheduler.register('*', '*', '4', '5', 'UpdatePrice', load('batch.job.UpdatePrice'));
	
	scheduler.run();
}
