#!/usr/bin/env node

var createInterface = require('readline').createInterface
var Readable        = require('stream').Readable

var eachSeries = require('async').eachSeries
var parse      = require('shell-parse')

var ast2js    = require('./lib/ast2js').command
var completer = require('./lib/completer')

var npmPath = require('npm-path').bind(null, {env:{PATH:process.env.PATH}})


function noop(){}

function execCommand(command, callback)
{
  npmPath()

  ast2js(command, function(error, command)
  {
    if(error) return callback(error)

    var input  = rl.input
    var output = rl.output

    var stdin = new Readable({read: noop})
    var push = stdin.push.bind(stdin)

    stdin.pipe(command).pipe(output)
    input.on('data', push)

    command.on('end', function(code)
    {
      input.removeListener('data', push)
      stdin.unpipe(command).unpipe(output)

      callback(code)
    })
    .on('error', function(error)
    {
      if(error.code !== 'ENOENT') throw error

      console.error(error.path+': not found')
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
