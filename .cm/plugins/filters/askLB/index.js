/**
 * @module askLB
 * @description A gitStream plugin to interact with AI models. Currently works with `ChatGPR-4o-mini`.
 * @param {Object} context - The context that will be attached to the prompt .
 * @param {string} role - Role instructions for the conversation.
 * @param {string} prompt - The prompt string.
 * @param {Object} token - The token to the AI model.
 * @returns {Object} Returns the response from the AI model.
 * @example {{ branch | generateDescription(pr, repo, source) }}
 * @license MIT
 * */

const WORDS_LIMIT = 100000;
const LOCK_FILES = [
  'package-lock.json',
  'yarn.lock',
  'npm-shrinkwrap.json',
  'Pipfile.lock',
  'poetry.lock',
  'conda-lock.yml',
  'Gemfile.lock',
  'composer.lock',
  'packages.lock.json',
  'project.assets.json',
  'pom.xml',
  'Cargo.lock',
  'mix.lock',
  'pubspec.lock',
  'go.sum',
  'stack.yaml.lock',
  'vcpkg.json',
  'conan.lock',
  'ivy.xml',
  'project.clj',
  'Podfile.lock',
  'Cartfile.resolved',
  'flake.lock',
  'pnpm-lock.yaml'
];
const EXCLUDE_EXPRESSIONS_LIST = [
  '.*\\.(ini|csv|xls|xlsx|xlr|doc|docx|txt|pps|ppt|pptx|dot|dotx|log|tar|rtf|dat|ipynb|po|profile|object|obj|dxf|twb|bcsymbolmap|tfstate|pdf|rbi|pem|crt|svg|png|jpeg|jpg|ttf)$',
  '.*(package-lock|packages\\.lock|package)\\.json$',
  '.*(yarn|gemfile|podfile|cargo|composer|pipfile|gopkg)\\.lock$',
  '.*gradle\\.lockfile$',
  '.*lock\\.sbt$',
  '.*dist/.*\\.js',
  '.*public/assets/.*\\.js',
  '.*ci\\.yml$'
];
const IGNORE_FILES_REGEX_LIST = [
  ...LOCK_FILES.map(f => f.replace('.', '\\.')),
  ...EXCLUDE_EXPRESSIONS_LIST
];
const EXCLUDE_PATTERN = new RegExp(IGNORE_FILES_REGEX_LIST.join('|'));

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
 * @description Check if a file should be excluded from the context like "package-lock.json"
 * @param {*} fileObject
 * @returns returns true if the file should be excluded
 */
const shouldExcludeFile = fileObject => {
  const shouldExludeByName = EXCLUDE_PATTERN.test(fileObject.original_file);
  const shouldExludeBySize = false; // (fileObject.diff?.split(' ').length ?? 0) > 1000

  return shouldExludeByName || shouldExludeBySize;
};

/**
 * @description Check if a file should be included in the context
 * @param {*} fileObject
 * @returns returns true if the file should be included
 */
const shouldIncludeFile = fileObject => {
  return !shouldExcludeFile(fileObject);
};

const convertFilesForContext = source => {
  const files = source.diff?.files.filter(shouldIncludeFile).map(file => {
    const { original_file, diff } = file;
    return { original_file, diff };
  });
  const words = JSON.stringify(files).split(' ').length;

  if (WORDS_LIMIT > words) {
    return files;
  }

  return [];
};

const askLB = async (source, prompt, token, callback) => {
  const formattedContext = convertFilesForContext(source);

  if (!formattedContext?.length) {
    const message = `There are no context files to analyze.\nAll ${source?.diff?.files?.length} files were excluded by pattern.`;
    console.log(message);
    return callback(null, message);
  }

  const { RULES_RESOLVER_TOKEN, RULES_RESOLVER_URL } = process.env;
  const askLbEndpoint = RULES_RESOLVER_URL.replace('gitstream/resolve', 'gitstream/ask_lb');

  const response = await fetch(askLbEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${RULES_RESOLVER_TOKEN}`
    },
    body: JSON.stringify({ prompt, content: JSON.stringify(formattedContext) })
  });

  if (!response.ok) {
    const errorText = await response.text();
    const message = `Request failed with status ${response.status}: ${errorText}`;
    console.error(message);
    return callback(null, message);
  }

  const data = await response.json();
  const { statusCode, message } = data || {};

  if (statusCode !== 200) {
    console.error(message);
    return callback(null, message);
  }

  return callback(null, message);
};

module.exports = {
  async: true,
  filter: askLB
};
