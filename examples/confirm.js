var cmdutil = require('../lib/cmdutil');
var message = process.argv.length >= 3 ?
    process.argv[2] : 'Are you sure that you want to confirm? (y/[n]) ';
cmdutil.confirm({
    'message': message
}, function (result) {
	console.error('result: ', result);
	process.exit(result ? 0 : 1);
});
