/**
 * @module checkForCodeowners
 * @description Checks that the CODEOWNERS file is in the correct location
 * @param {string} auth - access token with repo:read scope, used to read the CODEOWNERS file
 * @returns {boolean} - if CODEOWNERS in correct location, returns true, otherwise false
 * @example {{ repo | checkForCodeowners(env.CODEOWNERS_TOKEN) }}
 **/

const { Octokit } = require('@octokit/rest');

async function checkForCodeowners(repo, auth, callback) {
  const octokit = new Octokit({
    request: { fetch },
    auth
  });

  console.log('repo', repo);
  console.log('repoName', repo?.name);

  const res = await octokit.repos.getContent({
    owner: 'MishaKav',
    repo: repo?.name || 'gitstream-daveloperb',
    path: '.github/CODEOWNERS'
  });

  if (res.status !== 200) {
    return callback(null, false);
  } else {
    console.log(JSON.stringify(res));
    return callback(null, true);
  }
}

checkForCodeowners();
module.exports = {
  async: true,
  filter: checkForCodeowners
};
