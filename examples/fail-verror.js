var cmdutil = require('../lib/cmdutil');
var fs = require('fs');
var VError = require('verror');

cmdutil.configure({ 'progname': 'myprog' });
try {
	fs.statSync('/nonexistent_file');
} catch (ex) {
	cmdutil.fail(new VError(ex, 'something went wrong'));
}
throw (new Error('reached unreachable code!'));
