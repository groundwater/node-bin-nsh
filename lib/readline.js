var cp = require('child_process');

var npmPath = require('npm-path')
var parse   = require('lib-cmdparse');


var state  = {
  "?" : null
}


function cd(line, callback)
{
  var dir = line.trim() || process.env.HOME

  // should not crash process with a bad 'cd'
  try
  {
    process.chdir(dir)
  }
  catch(e)
  {
    return callback(e)
  }

  // Update $PATH
  npmPath(callback)
}


function readline(line, callback){
  line = line.trim();
  line = interpolate(line, process.env);
  line = interpolate(line, state);

  if(line && line.length)
  {
    // cd is a native command
    if(line.substring(0,2) === 'cd')
      return cd(line.substring(2), callback)

    // other commands
    return run(line, callback)
  }

  callback()
}

// replace $VARs with environment variables
function interpolate(string, replace){
  return string.replace(/\$[^\s]+/g, function (key){
    var name = key.substring(1);

    var out;
    if(replace[name] || replace[name] === 0){
      out = replace[name];
    } else {
      out = key;
    }

    return out;
  });
}

function run(line, callback){
  // allow for setting environment variables
  // on the command line
  var stanza = parse(line);

  // fallback to current environment
  stanza.envs.__proto__ = process.env;

  // We must stop reading STDIN because we will soon
  // be the background process group, which will raise
  // errors when attempting to read/write to the TTY driver
  process.stdin.setRawMode(false)
  process.stdin.pause();

  // Sub-Process
  var args = stanza.args;
  var exec = stanza.exec;
  var proc = cp.spawn(exec,args,{
    cwd: process.cwd(),
    env: stanza.envs,

    // Inerit the terminal
    stdio: 'inherit'
  });

  // Have this shell resume control after the sub-process exists
  function res(){
    process.stdin.setRawMode(true)
    process.stdin.resume();

    callback();
  }

  // catch exit code
  function end(code, signal){
    // the $? variable should contain the exit code
    state["?"] = code;
    state["??"] = signal;

    res();
  }

  // catch errors
  function err(err){
    res();
  }

  proc.on('error', err);
  proc.on('exit', end);
}


module.exports = readline
