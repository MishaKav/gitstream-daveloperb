const axios = require('axios');
const moment = require('moment');

const testingRequest = async (repo, callback) => {
  let result = null;

  try {
    const response = await axios.post(process.env.WEBHOOK_SITE_URL, {
      repoName: repo.name,
      timestamp: moment().format('MMMM Do YYYY, HH:mm:ss')
    });
    result = response.data;
    console.log('POST request successful:', result);
  } catch (error) {
    console.error('Error in POST request:', error);
  }

  return callback(null, result);
};

module.exports = {
  async: true,
  filter: testingRequest
};
