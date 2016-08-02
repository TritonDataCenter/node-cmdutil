/*
 * lib/cmdutil.js: common command-line library functions
 */

var mod_assertplus = require('assert-plus');
var mod_extsprintf = require('extsprintf');
var mod_os = require('os');
var mod_path = require('path');

var sprintf = mod_extsprintf.sprintf;

/* Public interface */
exports.progname = progname;
exports.configure = configure;
exports.usage = usage;
exports.warn = warn;
exports.fail = fail;
exports.exitOnEpipe = exitOnEpipe;
exports.confirm = confirm;

var usageMessage = null;
var progname = mod_path.basename(process.argv[1]);
var synopses = null;

function configure(args)
{
	mod_assertplus.object(args, 'args');
	mod_assertplus.ok(args !== null);
	mod_assertplus.optionalString(args.usageMessage, 'args.usageMessage');
	mod_assertplus.optionalString(args.progname, 'args.progname');
	mod_assertplus.optionalArrayOfString(args.synopses, 'args.synopses');

	if (typeof (args.progname) == 'string') {
		progname = args.progname;
	}

	if (typeof (args.usageMessage) == 'string') {
		mod_assertplus.ok(args.synopses,
		    'cannot specify a usage message without synopses');
		usageMessage = args.usageMessage;
	}

	if (args.synopses) {
		mod_assertplus.equal(typeof (args.usageMessage), 'string',
		    'cannot specify synopses without a usage message');
		mod_assertplus.ok(args.synopses.length > 0,
		    'there must be at least one synopsis');
		synopses = args.synopses.slice(0);
	}
}

function usage()
{
	var args;

	mod_assertplus.ok(usageMessage !== null,
	    'cannot call usage() without configuring usage message');
	mod_assertplus.ok(synopses !== null,
	    'cannot call usage() without configuring synopses');

	if (arguments.length > 0) {
		args = Array.prototype.slice.call(arguments);
		emitWarning(args);
	}

	synopses.forEach(function (syn, i) {
		if (i === 0) {
			console.error('usage: %s %s', progname, syn);
		} else {
			console.error('       %s %s', progname, syn);
		}
	});

	console.error(usageMessage);
	process.exit(2);
}

function emitWarning(args)
{
	var msg;

	if (args.length > 0 && args[0] instanceof Error) {
		msg = args[0].message;
	} else {
		msg = sprintf.apply(null, args);
	}

	console.error('%s: %s', progname, msg);
}

function warn()
{
	emitWarning(Array.prototype.slice.call(arguments));
}

function fail()
{
	var args;
	var status = 1;

	args = Array.prototype.slice.call(arguments);
	if (typeof (args[0]) == 'number') {
		status = args[0];
		args = args.slice(1);
	}

	emitWarning(args);
	process.exit(status);
}

/*
 * See details in README.md.
 */
function exitOnEpipe()
{
	process.stdout.on('error', function (err) {
		if (err.code == 'EPIPE') {
			process.exit(0);
		}

		throw (err);
	});
}

/*
 * See README.md.
 */
function confirm(args, callback)
{
	var cstate;

	mod_assertplus.object(args, 'args');
	mod_assertplus.string(args.message, 'args.message');

	/*
	 * This object encapsulates the state of this asynchronous operation.
	 */
	cstate = {
	    /* prompt message */
	    'cf_message': args.message,

	    /* streams used for output and input */
	    'cf_outstream': process.stdout,
	    'cf_instream': process.stdin,

	    /* input is a tty */
	    'cf_intty': null,
	    'cf_inraw': null,

	    /* data read from input */
	    'cf_read': null,

	    /* user callback to be invoked */
	    'cf_callback': callback
	};

	cstate.cf_intty = cstate.cf_instream.isTTY;
	if (cstate.cf_intty) {
		cstate.cf_inraw = cstate.cf_instream.isRaw;
		if (!cstate.cf_inraw) {
			cstate.cf_instream.setRawMode(true);
		}
	}

	cstate.cf_outstream.write(cstate.cf_message);
	cstate.cf_read = cstate.cf_instream.read(1);
	if (cstate.cf_read === null) {
		cstate.cf_instream.once('readable', function () {
			cstate.cf_read = cstate.cf_instream.read(1);
			confirmFini(cstate);
		});
	} else {
		setImmediate(confirmFini, cstate);
	}
}

function confirmFini(cstate)
{
	var result;

	cstate.cf_outstream.write(mod_os.EOL);

	if (cstate.cf_intty && !cstate.cf_inraw) {
		cstate.cf_instream.setRawMode(false);
	}

	/*
	 * We assume that a "null" return from read() in the context of the
	 * 'readable' event indicates end-of-stream, which we count as a
	 * non-affirmative answer.  There doesn't appear to be a programmatic
	 * way to tell that this condition really means end-of-stream, though.
	 * (Worse, it's not clear if there's any documented way to know if the
	 * end-of-stream had been reached before we even started reading from
	 * it.  In that case, we may hang waiting for "readable" earlier.  We
	 * explicitly call this case out in the README.)
	 */
	result = cstate.cf_read !== null &&
	    cstate.cf_read.toString('utf8').toLowerCase() == 'y';
	cstate.cf_callback(result);
}
