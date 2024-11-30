const { Octokit } = require('@octokit/rest');

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
    console.log('inside autoDeploy filter');
    const { labels, checks, draft, author, number } = pr;
    const prNumber = Number(number);

    if (draft) {
      return callback(null, 'skip on draft PR');
    }

    if (!labels.includes('auto-deploy')) {
      return callback(null, 'skip on PR without `auto-deploy` label');
    }

    console.log(`Misha Token: ${process.env.GITHUB_TOKEN}`);
    console.log(`Misha Token Length: ${process.env.GITHUB_TOKEN?.length}`);
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

    await enableAutoMerge(octokit, repo, number);

    const e2eCheck = checks.find(check => check.name === 'gitstream-e2e');
    const shouldRunE2e = !e2eCheck || e2eCheck?.conclusion === 'failure';

    if (!shouldRunE2e) {
      return callback(null, 'e2e check passed, skipping run e2e');
    }

    const e2eComment = AUTHOR_E2E_MAP[author] || AUTHOR_E2E_MAP.default;
    await octokit.issues.createComment({
      owner: repo.owner,
      repo: repo.name,
      issue_number: prNumber,
      body: e2eComment
    });

    return callback(null, `enabled \`auto-merge\` and run e2e for \`${author}\``);
  } catch (error) {
    console.log(error?.message);
    return callback(null, error?.message);
  }
};

/**
 * Enables auto-merge for a specified pull request using the GitHub GraphQL API
 *
 * @param {Object} octokit - The Octokit instance for making API requests
 * @param {{ owner: string, name: string }} repo - The repository information
 * @param {string} repo.owner - The owner of the repository
 * @param {string} repo.name - The name of the repository
 * @param {number|string} number - The pull request number
 * @returns {Promise<void>} - A promise that resolves when the auto-merge is enabled
 * @throws {Error} - Throws an error if the GraphQL request fails
 */
const enableAutoMerge = async (octokit, repo, pullNumber) => {
  try {
    // get real PR ID for GraphQL
    const { repository } = await octokit.graphql(
      `
    query ($owner: String!, $repo: String!, $pullNumber: Int!) {
      repository(owner: $owner, name: $repo) {
        pullRequest(number: $pullNumber) {
          id
        }
      }
    }
    `,
      {
        owner: repo.owner,
        repo: repo.name,
        pullNumber
      }
    );

    const pullRequestId = repository?.pullRequest?.id;

    if (!pullRequestId) {
      console.warn(`PR #${number} not found on graphql response`);
      return;
    }

    // enable auto-merge
    await octokit.graphql(
      `
    mutation EnablePullRequestAutoMerge($pullRequestId: ID!) {
      enablePullRequestAutoMerge(input: { pullRequestId: $pullRequestId, mergeMethod: SQUASH }) {
        pullRequest {
          autoMergeRequest {
            enabledAt
          }
        }
      }
    }`,
      { pullRequestId }
    );
  } catch (error) {
    console.error(error);
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
