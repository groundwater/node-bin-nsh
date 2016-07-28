const fs = require('fs')

const pc     = require('lib-pathcomplete')
const ps     = require('lib-pathsearch')
const reduce = require('async/reduce')

const builtins    = require('./builtins')
const environment = require('./ast2js/_environment')

const constants = fs.constants
const stat      = fs.stat


const EMPTY_ITEM    = 1
const EMPTY_ENV_VAR = 2


//
// Helper functions
//

function filterEnvVars(item)
{
  return item && !item.includes('=')
}

function filterNames(name)
{
  return name.substr(0, this.length) === this.toString()
}

function getEnvVars(item)
{
  var vars = Object.getOwnPropertyNames(environment).filter(filterNames, item)
  var env  = Object.keys(process.env)               .filter(filterNames, item)

  if(vars.length && env.length) vars.push('')

  return vars.concat(env)
}

function isExecutable(stats)
{
  const mode = stats.mode

  return mode & constants.S_IXUSR && stats.uid === process.getuid()
      || mode & constants.S_IXGRP && stats.gid === process.getgid()
      || mode & constants.S_IXOTH
}

function mapEnvVarsAsign(name)
{
  if(name) name += '='

  return name
}

function mapEnvVarsRef(name)
{
  if(name) name = '$'+name

  return name
}


//
// Completer functions
//

function envVar(item, callback)
{
  const key = item.substr(1)

  if(!key) return callback(EMPTY_ENV_VAR)

  var result = getEnvVars(key).map(mapEnvVarsRef)

  // if there is only one environment variable, append a space after it
  if(result.length === 1) result[0] += ' '

  callback(null, [result, item])
}

function relativePath(item, is_arg, callback)
{
  pc(item, function(err, arr, info)
  {
    if(err) return callback(err)

    // [Hack] Add `.` and `..` entries
    if(info.file === '.' ) arr.unshift('.', '..')
    if(info.file === '..') arr.unshift('..')

    reduce(arr, {}, function(memo, name, callback)
    {
      const path = info.dir + name

      stat(path, function(error, stats)
      {
        if(error) return callback(error)

        memo[path] = stats

        callback(null, memo)
      })
    },
    function(error, stats)
    {
      if(error) return callback(error)

      // user is typing the command, autocomplete it only against the
      // executables and directories in the current directory
      if(!is_arg)
        arr = arr.filter(function(name)
        {
          const stat = stats[info.dir + name]

          return stat.isDirectory() || isExecutable(stat)
        })

      arr = arr.map(function(item)
      {
        // If completion is a directory, append a slash
        if(stats[info.dir + item].isDirectory()) item += '/'

        return item
      })

      // There's just only one completion and it's not a directory, append it a
      // space
      if(arr.length === 1 && arr[0][arr[0].length-1] !== '/') arr[0] += ' '

      callback(null, [arr, info.file])
    })
  })
}


/**
 * auto-complete handler
 */
function completer(line, callback)
{
  const split  = line.split(/\s+/)
  const item   = split.pop()
  const is_arg = split.filter(filterEnvVars).length

  // avoid crazy auto-completions when the item is empty
  if(!item && !is_arg) return callback(EMPTY_ITEM)

  // Environment variables
  if(item[0] === '$') return envVar(item, callback)

  // Relative paths and arguments
  if(item[0] === '.' || is_arg) return relativePath(item, is_arg, callback)

  // Commands & environment variables
  ps(item, environment.PATH.split(':'), function(err, execs)
  {
    if(err) return callback(err)

    // Builtins
    var names = Object.keys(builtins).filter(filterNames, item)

    // Environment variables
    var envVars = getEnvVars(item).map(mapEnvVarsAsign)

    // Current directory
    relativePath(item, true, function(err, entries)
    {
      if(err) return callback(err)

      entries = entries[0]

      // Compose result
      if(names.length && execs.length) names.push('')
      var result = names.concat(execs)

      if(result.length && envVars.length) result.push('')
      result = result.concat(envVars)

      if(result.length && entries.length) result.push('')
      result = result.concat(entries)

      // if there is only one executable, append a space after it
      const result0 = result[0]
      const type = result0[result0.length-1]
      if(result.length === 1 && type !== '=' && type !== '/') result[0] += ' '

      callback(null, [result, item])
    })
  })
}


module.exports = completer
