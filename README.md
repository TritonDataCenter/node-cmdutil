# node-cmdutil: common command-line program functions

This module provides a few functions that are useful for command-line programs
written in Node.

* [warn(...)](#warn): print a warning message to stderr
* [fail(...)](#fail): print a warning message to stderr and exit
* [usage(...)](#usage): print a usage message to stderr and exit

You should also check out:

* [node-getopt](https://github.com/davepacheco/node-getopt) for POSIX option
  parsing
* [node-tab](https://github.com/davepacheco/node-tab) for reading and writing
  tables similar to other Unix tools
* [node-verror](https://github.com/davepacheco/node-verror) for constructing
  error chains that produce useful messages for command-line tools
* [node-extsprintf](https://github.com/davepacheco/node-extsprintf) for Node.js
  analogs to printf(), fprintf(), and sprintf().
* [node-cmdln](https://github.com/trentm/node-cmdln) for an alternative
  framework for building command-line programs


# Functions

The interfaces here follow [Joyent's Best Practices for Error Handling in
Node.js](https://www.joyent.com/developers/node/design/errors).  All of these
interfaces are synchronous and there are no operational errors.  The only
possible errors are invalid arguments, which are programmer errors.  These are
thrown and should not be handled.


## warn(...)

`warn(...)` emits a warning message to stderr in the same format as most other
Unix tools, which is that the warning message is prefixed with the program name.
See configure() below.

You can supply arguments in one of two ways.

    warn(err)
    warn(fmtstr, arg0, arg1, ...)

* If the first argument is an instance of Error, then the message printed will
  be `err.message`.
* Otherwise, all arguments will be passed directly to node-extsprintf's
  `sprintf` function.  This works similar to Node's `util.format`, but it
  supports many more format specifiers and it's stricter about null and
  undefined types.

For example, this test program called "warn.js" produces:

```javascript
var cmdutil = require('../lib/cmdutil');
cmdutil.warn('test message');
```

produces:

```
warn.js: test message
```

This program:

```javascript
cmdutil.warn('bad argument: "%s"', -5);
```

produces:

```
warn.js: bad argument: "-5"
```

And here's an example using an Error:

```javascript
cmdutil.warn(new Error('bad input'));
```

which produces:

```
warn.js: bad input
```

You can change the program name that gets printed using `configure()`:

```javascript
cmdutil.configure({
    'progname': 'myprog'
});
cmdutil.warn('test message');
```

which prints:

```
myprog: test message
```


## fail(...)

`fail(...)` emits a warning message just like `warn(...)`, but then exits the
process using `process.exit()`.

The arguments are exactly like `warn(..)`, but you may specify an _optional_
numeric first argument that indicates the exit status to pass to
`process.exit()`.  If you don't specify one, the exit status `1` is used.

    fail(err)                             /* will exit with status 1 */
    fail(fmtstr, arg0, arg1, ...)         /* will exit with status 1 */
    fail(status, err)                     /* will exit with status "status" */
    fail(status, fmtstr, arg0, arg1, ...) /* will exit with status "status" */

The easiest thing is to just pass an Error:

```
cmdutil.configure({ 'progname': 'myprog' });
cmdutil.fail(new Error('something went wrong');
/* This code is never reached. */
```

which outputs:

```
$ node examples/fail-error.js 
myprog: something went wrong
$ echo $?
1
```

You can use [node-verror](https://github.com/davepacheco/node-verror) to chain
together messages:

```javascript
var cmdutil = require('../lib/cmdutil');
var fs = require('fs');
var VError = require('verror');

cmdutil.configure({ 'progname': 'myprog' });
try {
        fs.statSync('/nonexistent_file');
} catch (ex) {
        cmdutil.fail(new VError(ex, 'something went wrong'));
        /* This code is never reached. */
}
```

This outputs:

```
$ node examples/fail-verror.js 
myprog: something went wrong: ENOENT, no such file or directory '/nonexistent_file'
$ echo $?
1
```

Just like with `warn()`, you can instead pass printf-style args:

```javascript
var cmdutil = require('../lib/cmdutil');
cmdutil.configure({ 'progname': 'myprog' });
cmdutil.fail('something %s went wrong', 'very bad');
/* This code is never reached. */
```

produces:

```
$ node examples/fail-printflike.js 
myprog: something very bad went wrong
$ echo $?
1
```

As mentioned above, with either invocation, you can specify a leading number to
use as the exit status instead of the default status of `1`:

```javascript
var cmdutil = require('../lib/cmdutil');
cmdutil.configure({ 'progname': 'myprog' });
cmdutil.fail(7, 'something %s went wrong', 'very bad');
/* This code is never reached. */
```

which does this:

```
$ node examples/fail-status.js 
myprog: something very bad went wrong
$ echo $?
7
```

## usage()

usage() does several things, in order:

* prints an optional warning message
* prints one or more synopses representing different ways to invoke your program
* prints a message of additional usage information
* exits with status `2` (as is standard for usage errors)

The synopses and additional usage information are whatever was last passed to
`configure()`.  You must have previously called `configure()` with valid values
for these.

If you invoke usage() with no arguments, then only the usage message is printed.
If you pass arguments, they're treated exactly as they are for `warn()`: they
can be an Error or a series of printf-like arguments.  These are used to
construct an error message that's printed to stderr before the warning message.

Here's an example:

```javascript
cmdutil.configure({
    'progname': 'myprog',
    'usageMessage': 'Fetch or update the contents of a remote URL.',
    'synopses': [
        'fetch  [-v] URL',
        'upload [-v] URL FILENAME'
    ]
});
cmdutil.usage();
/* This code is never reached. */
```

and here's what it prints out:

```
$ node examples/usage.js 
usage: myprog fetch  [-v] URL
       myprog upload [-v] URL FILENAME
Fetch or update the contents of a remote URL.
$ echo $?
2
```

You can also use the usual `warn()`-like arguments to print a warning message:

```javascript
cmdutil.configure({
    'progname': 'myprog',
    'usageMessage': 'Fetch or update the contents of a remote URL.',
    'synopses': [
        'fetch  [-v] URL',
        'upload [-v] URL FILENAME'
    ]
});
cmdutil.usage(new Error('no URL specified'));
/* This code is never reached. */
```

which prints:

```
$ node examples/usage-warn.js 
myprog: no URL specified
usage: myprog fetch  [-v] URL
       myprog upload [-v] URL FILENAME
Fetch or update the contents of a remote URL.
```


## configure(args)

`configure(args)` takes arguments as named properties of `args`.  Supported
properties are:

* `synopses`: an array of strings that are used in the `usage()` output.  See
  `usage()` below.
* `usageMessage`: a string message that is used when you call `usage(...)`.  See
  `usage()` below.
* `progname`: a string used as the program name in warning messages.  If
  unspecified, the program name is taken by applying Node's `path.basename`
  function on `process.argv[1]`.

The only time you _need_ to call this function is if you're going to use the
`usage()` function later, and in that case you must specify `usageMessage` and
`synopses`.  If you specify either of these, you must also specify the other.
If you call this function multiple times, only the last values for any of the
above properties will be used.




# Contributions

Contributions welcome.  Code should be "make prepush" clean.  To run "make
prepush", you'll need these tools:

* https://github.com/davepacheco/jsstyle
* https://github.com/davepacheco/javascriptlint

If you're changing something non-trivial or user-facing, you may want to submit
an issue first.
