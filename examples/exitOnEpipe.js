var cmdutil = require('../lib/cmdutil');

if (process.argv[2] !== 'dontignore') {
	cmdutil.exitOnEpipe();
}

setInterval(function () {
	console.log('waiting for EPIPE');
}, 25);
