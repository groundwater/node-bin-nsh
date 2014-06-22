#!/usr/bin/env node

var repl = require('repl');

var parallel = require('async').parallel;

var shellUtils = require('./shellUtils');
var completer  = shellUtils.completer;
var readline   = shellUtils.readline;


// Main method
if(!module.parent){
  function prompt(){
    var prefix;
    try {
      prefix = process.cwd();
    } catch (e) {
      prefix = "(none)";
    }
    return prefix + " # ";
  };

  var replserver = repl.start(
  {
    prompt: prompt()
  });

  var jsEval = replserver.eval;
  replserver.eval = function(cmd, context, filename, callback)
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

  var displayPrompt = replserver.displayPrompt;
  replserver.displayPrompt = function(){
    replserver.prompt = prompt();
    displayPrompt.call(this);
  };

  var jsComplete = replserver.complete.bind(replserver);
  replserver.complete = function(line, callback)
  {
    parallel(
      [
        function(callback)
        {
          jsComplete(line, callback)
        },
        function(callback)
        {
          completer(line, callback)
        }
      ],
      function(error, results)
      {
        if(error) return callback(error);

        var execs = results[0][0].concat(results[1][0]);
        var item  = results[0][1];

        callback(null, [execs, item]);
      }
    )
  };
}
