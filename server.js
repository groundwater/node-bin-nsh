#!/usr/bin/env node

var createInterface = require('readline').createInterface
var Readable        = require('stream').Readable

var eachSeries = require('async').eachSeries
var parse      = require('shell-parse')

var ast2js    = require('./lib/ast2js').command
var completer = require('./lib/completer')


function noop(){}

function execCommand(command, callback)
{
  ast2js(command, function(error, command)
  {
    if(error) return callback(error)

    var stdin = new Readable({read: noop})
    var push = stdin.push.bind(stdin)

    stdin.pipe(command).pipe(process.stdout)

    process.stdin.on('data', push)

    command.on('close', function(code)
    {
      process.stdin.removeListener('data', push)

      stdin.unpipe(command).unpipe(process.stdout)

      callback(code)
    })
  })
}


var rl = createInterface(
{
  input: process.stdin,
  output: process.stdout,
  completer: completer
})


var input = ''

function prompt(smallPrompt)
{
  input = ''

  rl.setPrompt(smallPrompt ? '> ' : process.cwd()+'> ')
  rl.prompt()
}


prompt()

rl.on('line', function(line)
{
  input += line

  if(input === '') return prompt()

  try
  {
    var ast = parse(input)
  }
  catch(err)
  {
    if(err.constructor !== parse.SyntaxError) throw err

    line = input.slice(err.offset)

    try
    {
      parse(line, 'continuationStart')
      return prompt(true)
    }
    catch(err)
    {
      throw err
    }
  }

  eachSeries(ast, execCommand, prompt)
})
