const stem = require('stem-porter');

function getClassName(filename) {
  return filename.replace(/.*\//, '').replace(/\..*/, '');
}

function areProductionTestPair(productionFile, testFile) {
  const productionClassName = getClassName(productionFile);
  const productionClassNameStem = stem(productionClassName);

  return productionClassName &&
         (testFile.includes(productionClassName) ||
          testFile.includes(productionClassNameStem));
}

function getProductionTestPairs(productionFiles, testFiles) {
  const productionTestPairs = [];

  productionFiles.forEach(productionFile => {
    testFiles.forEach(testFile => {
      if (areProductionTestPair(productionFile, testFile)) {
        productionTestPairs.push({
          productionFile,
          testFile,
        });
      }
    });
  });

  return productionTestPairs;
}

module.exports = getProductionTestPairs;
