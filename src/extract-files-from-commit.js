function isTestFile(filename) {
  const testPattern = /.*(test|spec).*/i;

  return testPattern.test(filename);
}

function separateProductionTestFiles(commit) {
  const productionFiles = [];
  const testFiles = [];

  const files = commit.files;

  files.forEach(file => {
    const filename = file.filename;

    if (isTestFile(filename)) {
      testFiles.push(filename);
    } else {
      productionFiles.push(filename);
    }
  });

  return {
    productionFiles,
    testFiles,
  };
}

function extractFilesFromCommit(remoteRepo, commitSha) {
  return remoteRepo.getSingleCommit(commitSha)
    .then(result => result.data)
    .then(separateProductionTestFiles);
}

module.exports = extractFilesFromCommit;
