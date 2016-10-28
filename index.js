// https://www.npmjs.com/package/json2csv

var json2csv = require('json2csv');
var fields =['projectName', 'language', 'productionFile', 'testFile'];
var fs = require('fs');

require('dotenv').config({
	silent : true,
});

function getRepo(author, project) {
	const GitHub = require('github-api');
	const github = new GitHub({
	  //token : process.env.GITHUB_OAUTH_TOKEN,
    token : 'c02981283e6623a9490b84c0f6c04eddb8b144a4'
	});

	const remoteRepo = github.getRepo(author, project);
	return remoteRepo;
}

function getPairsFromCommits(language, build) {
  const getProductionTestPairsFromCommits = require('./src/get-production-test-pairs-from-commits');

	var credentials = getCredentials(build.gh_project_name);
	const remoteRepo = getRepo(credentials.author, credentials.projectName);

	const gitCommit = build.git_commit;
	var gitCommits = build.git_commits;

	if (gitCommits == undefined) {
		gitCommits = null;
	}
  return getProductionTestPairsFromCommits(remoteRepo, gitCommit, gitCommits)
	.then(productionTestPairs => createObject(language, build.gh_project_name, productionTestPairs))
  .catch(console.log);
}

function getCredentials(fullProjectName) {
  	return {
       author : fullProjectName.split('/')[0],
       projectName : fullProjectName.split('/')[1]
  	};
}

function createObject(language, projectName, productionTestPairs){
  return {
      'language' : language,
      'projectName' : projectName,
      'productionTestPairs' : productionTestPairs
      //'production file' : productionTestPairs.productionFile,
     // 'test file': productionTestPairs.testFile
  };
}

function getPairs(builds){
     console.log('Getting pairs from builds');
     var list = [];
     for(var i = 0; i < builds.length; i++){
        list.push(getPairsFromCommits('java', builds[i]));
     }
      return list;
}

function writeOnFile(builds){
  console.log('Writing on file');
  return new Promise(function(resolve, reject) {
    var fs = require('fs');
    var csv = json2csv({ data: builds, fields: fields });
    fs.writeFile("output.csv", csv, function(err) {
        if(err) {
            reject(err);
        }
        console.log("The file was saved!");
        resolve();
    }); 
  });
}

function processBuildsForWriteOnFile(arrayOfBuilds){
  var data =[];
  var obj;
  return new Promise(function(resolve, reject){
    for(var i = 0; i < arrayOfBuilds.length; i++){
        data = data.concat(process(arrayOfBuilds[i]));
    }
    console.log("DATAAA: \n" + JSON.stringify(data));
    resolve(data);
  });
}

function process(object){
  
  var pairs = object.productionTestPairs;
  //console.log("Pairs " + JSON.stringify(pairs));
  var list = [];
  pairs.forEach(function(value){
    //console.log("Value " +  JSON.stringify(value));
    list.push({
      'projectName' : object.projectName,
      'language': object.language,
      'productionFile': value.productionFile,
      'testFile': value.testFile
    });
  });
  console.log("LISTAA \n" + JSON.stringify(list));
  return list;
   /*return {
      'project name' : object.projectName,
      'language': object.language,
      'productionTestPairs' : productionTestPairs
      //'production file': object.productionTestPairs[0].productionFile, // MAYBE FIX
      //'test file': object.productionTestPairs[0].testFile, // MAYBE FIX
    }*/
}

function writeBuildsOnFile(){
  const getBuildData = require('./src/connect-database');
  return getBuildData()
  .then(builds => Promise.all(getPairs(builds)))
  .then(processBuildsForWriteOnFile)
  // Testar algum cenário que retorne pares de produção e teste não vazios
  // Verificar se o array de productionTestPairs irá retornar mais de um conjunto
  // Ajeitar o código de geração do arquivo csv
  // O código gera "Finished" antes de concluir a execução de writeBuildsOnFile
  .then(writeOnFile)
}

function run(){
  console.log('Started');
  writeBuildsOnFile()
  .then(console.log('Finished'))
  .then(console.timeEnd("execution"))
  .catch(console.log);
}

console.time("execution");
run();


