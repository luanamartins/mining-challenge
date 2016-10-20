require('dotenv').config({
	silent : true,
});

// Única pendência: Trocar lista estática pela execução de uma consulta pra pegar lista de nome de projetos e usar o sampleSize pra pegar uma sublista aleatória

var sampleSize = require('lodash/sampleSize');
var flatten = require('lodash/flatten');

var allProjects = ['47deg/appsly-android-rest', 'AChep/AcDisplay', 'ActiveJpa/activejpa'];

function createConnection(){
  var mysql = require('mysql');
  var connection = mysql.createConnection({
      host : process.env.DATABASE_HOST,
      user : process.env.DATABASE_USER,
      password : process.env.DATABASE_PASSWORD,
      database : process.env.DATABASE_SCHEMA_NAME
  });
  
  return connection;
}

function getBuildsFromProject(connection, language, projectName){
   return new Promise(function(resolve, reject) {
        var queryString = 'SELECT DISTINCT tr_build_id from travistorrent_7_9_2016 WHERE gh_test_churn > 0 AND gh_lang = \'' + language + '\' AND gh_project_name = \'' + projectName +  '\'';

        connection.query(queryString, function (err, rows) {
            if (err) {
                return reject(err);
            }
           resolve(rows);
        });
    });
  
}

function getRandomRows(connection, language, projectName){
  var buildsPerProject = 3;
  
  return getBuildsFromProject(connection, language, projectName)
  .then(function(rowDataPackets){
    var buildIds = rowDataPackets.map(rowDataPacket => rowDataPacket.tr_build_id);
    var list = sampleSize(buildIds, buildsPerProject);
    console.log("LISTAA: " + list);
    return list;
  });
}

function getChosenBuilds(id){
  
  return new Promise(function(resolve, reject) {
        var queryString = 'SELECT git_commit, git_commits from travistorrent_7_9_2016 WHERE tr_build_id = \'' + id + '\' LIMIT 1';
        
        console.log(queryString);
        connection.query(queryString, function (err, rows) {
            if (err) {
                return reject(err);
            }
            resolve(rows);
        });
    });
}


// sampleSize
function getRandomProjects(language, numberOfProjects){
  console.log('Getting projects ' + language + ', ' + numberOfProjects + ' projects.');
  return new Promise(function(resolve, reject){
    var queryString = 'SELECT distinct gh_project_name from travistorrent_7_9_2016 WHERE gh_test_churn > 0 AND gh_lang LIKE  ? ORDER BY RAND() LIMIT ?'
    var queryVariables = [language, numberOfProjects];
    
    connection.query(queryString, queryVariables, function(err, rows, fields){
      if(err) return reject(err);
      resolve(rows);
    });
  });
}

function getRandomBuilds(connection, language){
  
  return Promise.resolve(allProjects)
  .then(projects => projects.map(function(project){
	  console.log('Getting rows');
	  return getRandomRows(connection, language, project);
  }))
  .then(coisa => Promise.all(coisa))
  .then(flatten)
  .then(rows => 
      rows.map(function(row){
        console.log('Getting builds');
        return getChosenBuilds(row)
      })
  )
   .then(coisa => Promise.all(coisa))
   .catch(console.log);
}

connection = createConnection();
getRandomBuilds(connection, 'java')
  .then(function(builds){
    console.log(builds);
    connection.end();
    console.log('finished');
  })
  .catch(console.log);


