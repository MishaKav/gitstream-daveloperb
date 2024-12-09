const { Octokit } = require('@octokit/rest');

// store log actions for whole automation
const results = [];

const log = (message, type = 'log') => {
  results.push(message);

  if (type === 'error') {
    console.error(message);
  } else if (type === 'warn') {
    console.warn(message);
  } else {
    console.log(message);
  }
};

const getClientPayload = () => {
  const afterOneParsing = JSON.parse(process.env.CLIENT_PAYLOAD);

  if (typeof afterOneParsing === 'string') {
    log('CLIENT_PAYLOAD double parsed');
    return JSON.parse(afterOneParsing);
  }

  log('CLIENT_PAYLOAD parsed once');
  return afterOneParsing;
};

/**
 * should enable `auto-merge` for pr and add comment for e2e based on author
 * when adding a label "auto-deploy" to the pr
 * usage: {{ repo | autoDeploy(pr) }}
 * @param {*} pr context
 * @param {*} callback from nunjucks
 * @returns string that indicates status
 */
const autoDeploy = async (repo, pr, callback) => {
  try {
    const { labels, checks, draft, author, number } = pr;
    const prNumber = Number(number);

    if (draft) {
      log('skip `auto-deploy` on draft PR');
      return callback(null, results.join(', '));
    }

    if (!labels.includes('auto-deploy')) {
      log('skip on PR without `auto-deploy` label');
      return callback(null, results.join(', '));
    }

    const { githubToken } = getClientPayload();
    if (!githubToken) {
      log('missing githubToken in CLIENT_PAYLOAD');
      return callback(null, results.join(', '));
    }

    const octokit = new Octokit({ auth: githubToken });

    await checkPrStateAndMergeFromMaster(octokit, repo, prNumber);

    // const autoMergeEnabled = await enableAutoMerge(octokit, repo, prNumber);

    // if (autoMergeEnabled) {
    //   log('enabled `auto-merge`');
    // } else {
    //   log('failed to enable `auto-merge`');
    // }

    const e2eCheck = checks.find(check => check.name === 'gitstream-e2e');
    const shouldRunE2e = !e2eCheck || e2eCheck?.conclusion === 'failure';

    if (!shouldRunE2e) {
      log('e2e check passed, skipping run e2e');
      return callback(null, results.join(', '));
    }

    const e2eComment = AUTHOR_E2E_MAP[author] || AUTHOR_E2E_MAP.default;
    await octokit.issues.createComment({
      owner: repo.owner,
      repo: repo.name,
      issue_number: prNumber,
      body: e2eComment
    });

    results.push(`run e2e for \`${author}\``);
  } catch (error) {
    log(error?.message);
  }

  console.log(results.join('\n'));
  return callback(null, results.join('\n'));
};

/**
 * Enables auto-merge for a specified pull request using the GitHub GraphQL API
 *
 * @param {Object} octokit - The Octokit instance for making API requests
 * @param {{ owner: string, name: string }} repo - The repository information
 * @param {string} repo.owner - The owner of the repository
 * @param {string} repo.name - The name of the repository
 * @param {pullNumber|string} number - The pull request number
 * @returns {Promise<void>} - A promise that resolves when the auto-merge is enabled
 */
const enableAutoMerge = async (octokit, repo, pullNumber) => {
  try {
    // get real PR ID for GraphQL
    const { repository } = await octokit.graphql(
      `
    query ($owner: String!, $repo: String!, $pullNumber: Int!) {
      repository(owner: $owner, name: $repo) {
        pullRequest(number: $pullNumber) { id }
      }
    }`,
      {
        owner: repo.owner,
        repo: repo.name,
        pullNumber
      }
    );

    const pullRequestId = repository?.pullRequest?.id;

    if (!pullRequestId) {
      log(`PR #${pullNumber} not found on graphql response`, 'warn');
      return;
    } else {
      log(`PR #${pullNumber} found on graphql - ${pullRequestId}`, 'warn');
    }

    // enable auto-merge
    await octokit.graphql(
      `
    mutation EnablePullRequestAutoMerge($pullRequestId: ID!) {
      enablePullRequestAutoMerge(input: { pullRequestId: $pullRequestId, mergeMethod: SQUASH }) {
        pullRequest { autoMergeRequest { enabledAt } }
      }
    }`,
      { pullRequestId }
    );

    return true;
  } catch (error) {
    log(error?.message, 'error');
  }

  return false;
};

/**
 * Merge the pull request from master branch if available
 *
 * @param {Object} octokit - The Octokit instance for making API requests
 * @param {{ owner: string, name: string }} repo - The repository information
 * @param {pullNumber|string} number - The pull request number
 * @returns {Promise<void>} - A promise that resolves when the pull request is merged
 * @throws {Error} - An error is thrown if the pull request cannot be merged
 *  mergeable_state values:
 *	"clean": No conflicts and up-to-date
 *	"behind": The branch is behind the base branch and needs to be updated
 *	"dirty": Merge conflicts are present
 *	"unstable": Failing or pending status checks
 *	"blocked": Merging is blocked by branch protection rules
 */
const checkPrStateAndMergeFromMaster = async (octokit, repo, pullNumber) => {
  try {
    const res = await octokit.rest.pulls.get({
      owner: repo.owner,
      repo: repo.name,
      pull_number: pullNumber
    });
    const { mergeable_state } = res?.data;

    if (mergeable_state === 'clean') {
      log('The branch is up-to-date');
    } else if (mergeable_state === 'behind') {
      log('The branch is behind and can be updated');
      await updateToMasterBranch(octokit, repo, pullNumber);
    } else {
      // log(`The branch is not up-to-date: ${mergeable_state}`);
    }
  } catch (error) {
    log(`Error merging pull request: ${error?.message}`, 'error');
  }
};

/**
 * Update the pull request branch to the master (default) branch
 *
 * @param {Object} octokit - The Octokit instance for making API requests
 * @param {{ owner: string, name: string }} repo - The repository information
 * @param {pullNumber|string} number - The pull request number
 * @returns {Promise<void>} - A promise that resolves when the branch is updated
 */
const updateToMasterBranch = async (octokit, repo, pullNumber) => {
  try {
    await octokit.rest.pulls.updateBranch({
      owner: repo.owner,
      repo: repo.name,
      pull_number: pullNumber
    });

    log('Branch updated successfully');
  } catch (error) {
    if (error?.status === 409) {
      log('Conflict detected. Manual resolution required');
    } else {
      log(`Error updating branch: ${error?.message}`);
    }
  }
};

const AUTHOR_E2E_MAP = {
  MishaKav: `/dev env=misha rune2e=true`,
  yeelali14: `/dev env=yeela rune2e=true`,
  nivSwisa1: `/dev env=niv rune2e=true`,
  EladKohavi: `/dev env=elad rune2e=true`,
  ShakedZrihen: `/dev env=shaked rune2e=true`,
  default: `/dev env=oriel rune2e=true`
};

module.exports = {
  async: true,
  filter: autoDeploy
};
