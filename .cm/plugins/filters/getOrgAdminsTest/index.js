const getOrgAdminsTest = async (repo, callback) => {
  try {
    const results = ['EladKohavi', 'MishaKav'];

    return callback(null, results);
  } catch (error) {
    console.log(error?.message);
    return callback(null, error?.message);
  }
};

module.exports = {
  async: true,
  filter: getOrgAdminsTest
};
