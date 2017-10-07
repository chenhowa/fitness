var mysql = require('mysql');
var pool = mysql.createPool({
  connectionLimit : 10,
  host            : 'mysql.eecs.oregonstate.edu',
  user            : 'cs290_chenhowa',
  password        : 'apples',
  database        : 'cs290_chenhowa'
});

module.exports.pool = pool;
