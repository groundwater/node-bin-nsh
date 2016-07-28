var Readable = require('stream').Readable
var resolve  = require('path').resolve

var environment = require('./ast2js/_environment')


function noop(){}


function cd(argv)
{
  // `cd` is a special case, since it needs to change the shell environment

  var result = new Readable({objectMode: true})
      result._read = noop

  argv = argv || []

  var dir = argv[0] || environment.HOME

  var showNewPwd = false
  if(dir === '-')
  {
    dir = environment['OLDPWD']

    if(!dir)
    {
      result.emit('error', 'cd: OLDPWD not defined\n')

      result.push(null)
      return result
    }

    showNewPwd = true
  }

//  dir.replace(/^~\//, environment.HOME+'/')
  dir = resolve(environment.PWD, dir)

  try
  {
    process.chdir(dir)
  }
  catch(error)
  {
    if(error.code !== 'ENOENT') throw error

    result.emit('error', 'cd: '+dir+': no such file or directory\n')

    result.push(null)
    return result
  }

  environment['OLDPWD'] = environment.PWD
  environment.PWD = dir

  if(showNewPwd)
  {
    dir.type = 'cd'
    result.push(dir+'\n')
  }

  result.push(null)
  return result
}


exports.cd = cd
