var fs = require('fs')

var pc = require('lib-pathcomplete')
var ps = require('lib-pathsearch')

var builtins    = require('./builtins')
var environment = require('./ast2js/_environment')


var execinfo_path = process.env.PATH.split(':')


function filterNames(name)
{
  return name.substr(0, this.length) === this
}

function getEnvVars(item)
{
  var vars = environment.ownKeys()   .filter(filterNames, item)
  var env  = Object.keys(process.env).filter(filterNames, item)

  if(vars.length && env.length) vars.push('')

  return vars.concat(env)
}


// auto-complete handler
function completer(line, callback)
{
  // avoid crazy auto-completions when the line is empty
  if(!line) return callback(1)

  var split = line.split(/\s+/)
  var item  = split.pop()

  // user is attempting to type a relative directory
  var is_rel = item[0] === '.'

  // user is typing first command
  var is_first = !split.length

  // Environment variables
  if(item === '$') return callback(2)
  if(item[0] === '$')
  {
    var result = getEnvVars(item.substr(1)).map(function(name)
    {
      if(name === '') return name

      return '$'+name
    })

    // if there is only one environment variable, append a space after it
    if(result.length === 1) result[0] += ' '

    return callback(null, [result, item])
  }

  // if this is the first token on the line
  // autocomplete it against commands in the search path
  if(!is_rel && is_first)
    return ps(item, execinfo_path, function(err, execs)
    {
      if(err) return callback(err)

      // Environment variables
      var envVars = getEnvVars(item).map(function(name)
      {
        if(name !== '') name += '='

        return name
      })

      // Builtins
      var names = Object.keys(builtins).filter(function(name)
      {
        return name.substr(0, item.length) === item
      })

      if(envVars.length && names.length) envVars.push('')
      if(names  .length && execs.length) names  .push('')

      var result = envVars.concat(names, execs)

      // if there is only one executable, append a space after it
      var length = result.length
      if(length === 1 && result[length-1] !== '=')
        execs[0] += ' '

      callback(null, [result, item])
    })

  // if this is not the first token on the line
  // autocomplete it against items in current dir
  pc(item, function(err, arr, info)
  {
    if(err) return callback(err)

    var result = [arr, info.file]

    // if there is only one completion, and it's a directory
    // automatically append a '/' to the completion
    if(arr.length === 1)
      return fs.stat(info.dir + arr[0], function(error, stats)
      {
        if(error) return callback(error)

        if(stats.isDirectory()) arr[0] += '/'

        callback(null, result)
      })

    callback(null, result)
  })
}


module.exports = completer
