var cmdutil = require('../lib/cmdutil');

cmdutil.configure({
    'progname': 'myprog',
    'usageMessage': 'Fetch or update the contents of a remote URL.',
    'synopses': [
	'fetch  [-v] URL',
	'upload [-v] URL FILENAME'
    ]
});
cmdutil.usage();
throw (new Error('reached unreachable code!'));
