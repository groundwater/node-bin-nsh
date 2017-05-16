var globFunc = require('glob')


function glob(item, callback)
{
  globFunc(item.value, callback)
}


module.exports = glob
