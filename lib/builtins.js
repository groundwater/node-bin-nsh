var Readable = require('stream').Readable


function noop(){}


function cd(argv)
{
  // `cd` is a special case, since it needs to change the shell environment
  var env = process.env

  var result = new Readable({objectMode: true})
      result._read = noop

  argv = argv || []

  var dir = argv[0] || env.HOME

  var showNewPwd = false
  if(dir === '-')
  {
    dir = env.OLDPWD

    if(!dir)
    {
      result.emit('error', 'cd: OLDPWD not defined\n')

      result.push(null)
      return result
    }

    showNewPwd = true
  }

//  dir.replace(/^~\//, env.HOME+'/')
//  dir = path.resolve(env.PWD, dir)

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

  env.OLDPWD = env.PWD
  env.PWD = dir

  if(showNewPwd)
  {
    dir.type = 'cd'
    result.push(dir+'\n')
  }

  result.push(null)
  return result
}


exports.cd = cd
