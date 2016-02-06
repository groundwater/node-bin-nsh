var fs = require('fs')

var pc = require('lib-pathcomplete')
var ps = require('lib-pathsearch')

var builtins = require('./builtins')


var execinfo_path = process.env.PATH.split(':')


// auto-complete handler
function completer(line, callback)
{
  var split = line.split(/\s+/)
  var item  = split.pop()
  var outs  = []

  // avoid crazy auto-completions when the line is empty
  if (!line) return callback(1)

  // user is attempting to type a relative directory
  var is_rel = item[0] === '.'

  // user is typing first command
  var is_first = !split.length

  // if this is the first token on the line
  // autocomplete it against commands in the search path
  if(!is_rel && is_first)
    return ps(item, execinfo_path, function(err, execs)
    {
      if(err) return callback(err)

      // Builtins
      var names = Object.keys(builtins).filter(function(name)
      {
        return name.substr(0, item.length) === item
      })

      if(names.length)
      {
        if(execs.length) execs.unshift('')

        execs.unshift.apply(execs, names)
      }

      // if there is only one executable, append a space after it
      if(execs.length === 1) execs[0] += ' '

      callback(null, [execs, item])
    })

  // if this is not the first token on the line
  // autocomplete it against items in current dir
  pc(item, function(err, arr, info)
  {
    if(err) return callback(err)

    // if there is only one completion, and it's a directory
    // automatically append a '/' to the completion
    if(arr.length === 1)
      return fs.stat(info.dir + arr[0], function(error, stats)
      {
        if(stats.isDirectory()) arr[0] += '/'

        callback(null, [arr, info.file])
      })

    callback(null, [arr, info.file]);
  })
}


module.exports = completer
