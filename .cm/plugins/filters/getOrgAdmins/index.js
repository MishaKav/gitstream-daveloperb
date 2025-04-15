const { Octokit } = require('@octokit/rest');

/**
 * Get CLIENT_PAYLOAD from environment variables and parse it
 * @returns {Object} - The client payload object
 */
const getClientPayload = () => {
  const afterOneParsing = JSON.parse(process.env.CLIENT_PAYLOAD);

  if (typeof afterOneParsing === 'string') {
    return JSON.parse(afterOneParsing);
  }

  return afterOneParsing;
};

/**
 * Retrieves a list of organization administrators for a given organization
 *
 * @function getOrgAdmins
 * @param {Object} repo - The repository object containing information about the repository
 * @param {string} repo.owner - The owner of the repository (organization name)
 * @returns {Promise<string[]>} A promise that resolves to an array of organization admin usernames
 */
const getOrgAdmins = async (repo, callback) => {
  try {
    const { githubToken } = getClientPayload();

    if (!repo?.owner) {
      console.log(`missing "repo" argument`);
      return callback(null, []);
    }

    if (!githubToken || typeof githubToken !== 'string') {
      console.log(`missing githubToken or bad format`);
      return callback(null, []);
    }

    const octokit = new Octokit({ auth: githubToken });

    const owners = await octokit.paginate(octokit.orgs.listMembers, {
      org: repo.owner,
      role: 'admin',
      per_page: 100
    });
    const results = owners.map(owner => owner.login);

    return callback(null, results);
  } catch (error) {
    console.log(error?.message);
    return callback(null, error?.message);
  }
};

module.exports = {
  async: true,
  filter: getOrgAdmins
};
