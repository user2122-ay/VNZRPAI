const { MongoClient } = require('mongodb');
let p;
module.exports = async () => {
  p = p || new MongoClient(process.env.MONGODB_URI).connect();
  return (await p).db(process.env.DB_NAME || 'staff_web');
};
