const getOrgAdminsTest = async (repo, reviewers, callback) => {
  try {
    const ADMINS = ['EladKohavi', 'MishaKav'];
    const reviewersLower = reviewers.map(r => r.toLowerCase());
    const HAS_ADMIN_APPROVAL = admins.some(item => reviewersLower.includes(item.toLowerCase()));
    const results = { ADMINS, HAS_ADMIN_APPROVAL };
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
