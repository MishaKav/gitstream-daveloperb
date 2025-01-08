// const { RULES_RESOLVER } = require('./data');
// const fs = require('fs');
// const path = require('path');

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

const WORDS_LIMIT = 50000;
const OPEN_AI_ENDPOINT = 'https://api.openai.com/v1/chat/completions';
const ASK_LB_ENDPOINT =
  'https://yho0owet1b.execute-api.us-west-1.amazonaws.com/dev-01/api/v1/gitstream/ask_lb';
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
  const files = source.diff?.files.filter(shouldIncludeFile);
  const words = JSON.stringify(files).split(' ').length;

  if (WORDS_LIMIT > words) {
    return files;
  }

  return [];
};

const askLB = async (source, prompt, token, callback) => {
  const formattedContext = convertFilesForContext(source);

  // const filePath = path.join(__dirname, 'formattedContext.json');
  // fs.writeFile(filePath, JSON.stringify(JSON.stringify(formattedContext), null, 2), err => {
  //   if (err) {
  //     console.error('Error writing formattedContext to file:', err);
  //   } else {
  //     console.log('formattedContext has been written to', filePath);
  //   }
  // });

  if (!formattedContext?.length) {
    const message = `There are no context files to analyze.\nAll ${source?.diff?.files?.length} files were excluded by pattern.`;
    console.log(message);
    return callback(null, message);
  }

  // const { RULES_RESOLVER_TOKEN } = getClientPayload();
  // if (!RULES_RESOLVER_TOKEN) {
  //   console.log(`missing RULES_RESOLVER_TOKEN`);
  //   return callback(null, 'missing RULES_RESOLVER_TOKEN');
  // }

  const response = await fetch(ASK_LB_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.RULES_RESOLVER_TOKEN}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-2024-08-06',
      messages: [
        {
          role: 'system',
          content: `You are a code reviewer. Answer only to the request, without any introductory or conclusion text.`
        },
        {
          role: 'user',
          content: JSON.stringify(formattedContext)
        },
        { role: 'user', content: prompt }
      ]
    })
  });

  const data = await response.json();

  if (data?.error?.message) {
    console.error(data.error.message);
    return callback(null, data.error.message);
  }

  const suggestion =
    data.choices?.[0]?.message?.content ??
    'context was too big for api, try with smaller context object';

  return callback(null, suggestion);
};

module.exports = {
  async: true,
  filter: askLB
};
