const union = require('lodash/union');

const getProductionTestPairs = require('./get-production-test-pairs');
const extractFilesFromCommit = require('./extract-files-from-commit');

function mergeFilesList(filesList) {
  const mergedProductionFiles = filesList.map(files => files.productionFiles)
                                         .reduce((curr, next) => union(curr, next));

  const mergedTestFiles = filesList.map(files => files.testFiles)
                                   .reduce((curr, next) => union(curr, next));
  return {
    productionFiles: mergedProductionFiles,
    testFiles: mergedTestFiles,
  };
}

function getProductionTestPairsFromCommits(remoteRepo, gitCommit, gitCommits) {
  let commits = [gitCommit];

  if (gitCommits) {
    const gitCommitsArray = gitCommits.split('#');
    commits = commits.concat(gitCommitsArray);
  }

  return Promise.all(commits.map(commit => extractFilesFromCommit(remoteRepo, commit)))
    .then(filesList => mergeFilesList(filesList))
    .then(files => getProductionTestPairs(files.productionFiles, files.testFiles));
}

module.exports = getProductionTestPairsFromCommits;
