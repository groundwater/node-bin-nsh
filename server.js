#!/usr/bin/env node

const readFile = require('fs').readFile

const concat     = require('concat-stream')
const eachSeries = require('async/eachSeries')

const Nsh = require('.')


const PROFILE_FILES = ['/etc/profile', process.env.HOME+'/.profile']
const stdio         = [process.stdin, process.stdout, process.stderr]


function eval(data)
{
  // Re-adjust arguments
  process.argv = process.argv.concat(argv)

  Nsh.eval(stdio, data, function(error)
  {
    if(error) onerror(error)
  })
}

function interactiveShell()
{
  Nsh(stdio)
  .on('SIGINT', function()
  {
    this.write('^C')
    this.clearLine()

    this.prompt()
  })
}

function loadCommands()
{
  switch(argv[0])
  {
    case '-c':
      argv.shift()

      const command_string = argv.shift()
      if(!command_string) return onerror('-c requires an argument')

      const command_name = argv.shift()
      if(command_name) process.argv[0] = command_name

      return eval(command_string)

    case '-s':
      argv.shift()

      return process.stdin.pipe(concat(function(data)
      {
        eval(data.toString())
      }))
      .on('error', onerror)
    break

    default:
      const command_file = argv.shift()
      if(command_file)
        return readFile(command_file, 'utf-8', function(error, data)
        {
          if(error) return onerror(error)

          eval(data)
        })
  }


  //
  // Start an interactive shell
  //

  // Re-adjust arguments
  process.argv = process.argv.concat(argv)

  const ENV = process.env.ENV
  if(!ENV) return interactiveShell()

  readFile(ENV, 'utf-8', function(error, data)
  {
    if(error) return onerror(error)

    Nsh.eval(stdio, data, function(error)
    {
      if(error) return onerror(error)

      interactiveShell()
    })
  })
}

function onerror(error)
{
  console.error(process.argv0+': '+error)
  process.exit(2)
}


// Get arguments

const argv = process.argv.slice(2)
process.argv = [process.argv[1]]

if(argv[0] != '-l') return loadCommands()


// Login shell

argv.shift()

eachSeries(PROFILE_FILES, function(file, callback)
{
  readFile(file, 'utf-8', function(error, data)
  {
    if(error) return callback(error.code !== 'ENOENT' ? error : null)

    Nsh.eval(stdio, data, callback)
  })
},
function(error)
{
  if(error) return onerror(error)

  loadCommands()
})
