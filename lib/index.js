var inherits   = require('util').inherits
var ReplServer = require('repl').ReplServer

var parallel = require('async').parallel

var completer = require('./completer')
var readline  = require('./readline')


function pathPrompt()
{
  var prefix

  try
  {
    prefix = process.cwd()
  }
  catch (e)
  {
    prefix = "(none)"
  }

  return prefix + " > "
}


function NshRepl(prompt, stream, eval_, useGlobal, ignoreUndefined)
{
  if(!(this instanceof NshRepl))
    return new NshRepl(prompt, stream, eval_, useGlobal, ignoreUndefined)

  prompt = prompt || pathPrompt()

  NshRepl.super_.call(this, prompt, stream, eval_, useGlobal, ignoreUndefined)


  var jsEval = this.eval
  this.eval = function(cmd, context, filename, callback)
  {
    // Javascript
    jsEval.call(this, cmd, context, filename, function(error, result)
    {
      if(!error) return callback(null, result);

      // Shell
      if(cmd[0] == '(') cmd = cmd.substring(1, cmd.length-1);

      readline(cmd, function(error2, result)
      {
        if(error2) return callback(error);

        callback(null, result);
      });
    });
  };
}
inherits(NshRepl, ReplServer)


NshRepl.prototype.displayPrompt = function()
{
  this.prompt = prompt()
  NshRepl.super_.displayPrompt.call(this)
}

NshRepl.prototype.complete = function(line, callback)
{
  parallel(
  [
    NshRepl.super_.complete.bind(this, line),
    completer.bind(undefined, line)
  ],
  function(error, results)
  {
    if(error) return callback(error)

    var execs = results[0][0].concat(results[1][0])
    var item  = results[0][1]   ||   results[1][1]

    callback(null, [execs, item])
  })
}


module.exports = NshRepl
