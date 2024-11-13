const axios = require('axios');
const moment = require('moment');

const testingRequest = async (promt, webhook_site_url, callback) => {
  let result = null;

  try {
    const response = await axios.post(webhook_site_url, {
      promt: promt?.split(' ').slice(0, 3),
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
