#!/usr/bin/env node

var createInterface = require('readline').createInterface

var eachSeries = require('async').eachSeries
var parse      = require('shell-parse')

var completer = require('./lib/completer')


var rl = createInterface(
{
  input: process.stdin,
  output: process.stdout,
  completer: completer
})

var execCommand = require('./lib/execCommand').bind(null, rl)


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

rl.on('SIGINT', function()
{
  this.write('^C')
  this.clearLine()

  prompt()
})
