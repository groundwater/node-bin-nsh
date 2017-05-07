const coreutils = require('coreutils.js')

const environment = require('./ast2js/_environment')


// `cd` is a special case, since it needs to change the shell environment,
// that's why we overwrite it

const coreutils_cd = coreutils.cd

function cd(argv)
{
  return coreutils_cd(argv, environment)
}

coreutils.cd = cd


module.exports = coreutils
