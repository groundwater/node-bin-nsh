var fs = require('fs')

var pc = require('lib-pathcomplete')
var ps = require('lib-pathsearch')


var execinfo_path = process.env.PATH.split(':');


// auto-complete handler
function completer (line, callback) {
  var split = line.split(/\s+/);
  var item  = split.pop();
  var outs  = [];

  // avoid crazy auto-completions when the line is empty
  if (!line) return callback(1);

  // user is attempting to type a relative directory
  var is_rel = item[0] === '.';

  // user is typing first command
  var is_first = split.length === 0;

  // if this is the first token on the line
  // autocomplete it against commands in the search path
  if (!is_rel && is_first)
    ps(item, execinfo_path, function (err, execs) {
      // if there is only one executable, append a space after it
      if (execs.length === 1)
        execs[0] += ' ';

      callback(err, [execs, item]);
    });

  // if this is not the first token on the line
  // autocomplete it against items in current dir
  else
    pc(item, function (err, arr, info) {
      // if there is only one completion, and it's a directory
      // automatically append a '/' to the completion
      if (arr.length === 1
      && fs.statSync(info.dir + arr[0]).isDirectory())
        arr[0] += '/';

      callback(err, [arr, info.file]);
    });
}


module.exports = completer
