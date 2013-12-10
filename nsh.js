#!/usr/bin/env node

var rl     = require('readline');
var cp     = require('child_process');

process.on('uncaughtException', function(err) {
  console.log(err);
});

var iface = rl.createInterface({
  input  : process.stdin,
  output : process.stdout
});

function readline(line){
  line = interpolate( line.trim(), process.env );
  if(line && line.length > 0) {
    if(line.substring(0,2)=='cd'){
      // 'cd' command
      var dir = line.substring(2).trim();
      if(dir.length==0) dir=process.env.HOME;
      process.chdir(dir);
      setImmediate(prompt);
    }else{
      // other commands
      run(line);
    }
  }else{
    setImmediate(prompt);
  }
}

process.on('close',function(){
  process.exit(0);
});

function interpolate(string,replace){
  return string.replace(/\$\w+/g,function(key){
    var name = key.substring(1);
    var out;
    if(replace[name]){
      out = replace[name];
    } else { 
      out = key;
    }
    return out;
  });
}

function run(line){
  
  // We must stop reading STDIN because we will soon
  // be the background process group, which will raise
  // errors when attempting to read/write to the TTY driver
  process.stdin.pause();
  
  // Sub-Process
  var args = line.split(/\s+/);
  var exec = args.shift();
  var proc = cp.spawn(exec,args,{
    
    // Inherit process working directory and environment
    cwd: process.cwd(),
    env: process.env,
    
    // Inerit the terminal
    stdio: 'inherit'
    
  });
  
  // Have this shell resume control after the sub-process exists
  function res(){
    process.stdin.resume();
    prompt();    
  }
  
  // catch exit code
  function end(code,signal){
    res();
  }
  
  // catch errors
  function err(err){
    res();
  }
  
  proc.on('error',err);
  proc.on('exit',end);
  
}

function prompt(prefix){
  iface.question("# ", function (line) {
    readline(line);
  });
}

// Main method
if(!module.parent){
  prompt();
}
