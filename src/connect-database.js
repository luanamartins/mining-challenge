require('dotenv').config({
	silent : true,
});

var sampleSize = require('lodash/sampleSize');
var flatten = require('lodash/flatten');

var allProjects = ['47deg/appsly-android-rest', 'AChep/AcDisplay', 'ActiveJpa/activejpa'];
connection = createConnection();
numberOfProjects = 5;
language = 'java';
numberOfBuilds = 2;

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

function getBuildsFromProject(projectName){
  console.log('Getting builds from project: ' + projectName);
   return new Promise(function(resolve, reject) {
        var queryString = 'SELECT DISTINCT tr_build_id from travistorrent_7_9_2016 WHERE gh_test_churn > 0 AND gh_lang = \'' + language + '\' AND gh_project_name = \'' + projectName +  '\'';
        
        connection.query(queryString, function (err, rows) {
            if (err) {
                return reject(err);
            }
            
          var builds = [];
          for(var i = 0; i < rows.length; i++){
            builds.push(rows[i].tr_build_id);
          }
           resolve(builds);
        });
    });
  
}

function getRandomBuildIds(projectName){
  console.log('Getting rows');
  return getBuildsFromProject(projectName)
  .then(function(buildIds){
    var list = sampleSize(buildIds, numberOfBuilds);
    return list;
  })
  .catch(console.log);
}

function getChosenBuilds(id){
  console.log('Getting builds');
  return new Promise(function(resolve, reject) {
        var queryString = 'SELECT gh_project_name, git_commit, git_commits from travistorrent_7_9_2016 WHERE tr_build_id = \'' + id + '\' LIMIT 1';
        
        console.log('Getting build ' + id);
        connection.query(queryString, function (err, rows) {
            if (err) {
                return reject(err);
            }
            resolve(rows);
        });
        
    });
}

function getProjects(){
    console.log('Getting projects');
    return new Promise(function(resolve, reject) {
      var query = 'SELECT distinct gh_project_name from travistorrent_7_9_2016 WHERE gh_test_churn > 0 AND gh_lang = \'' + language + '\'';
      connection.query(query, function(err, rows){
          if(err){
            console.log(err);
            return reject(err);
          }
          var projectNames = [];
          for(var i = 0; i < rows.length; i++){
            projectNames.push(rows[i].gh_project_name);
          }
          var chosenProjects = sampleSize(projectNames, numberOfProjects);
          resolve(chosenProjects);
          console.log('Chosen projects:\n' + chosenProjects);
      });
   });
}

function getRandomRowsFromProjects(projects){
  var listOfPromises = [];
  for(var i = 0; i < projects.length; i++){
      listOfPromises.push(getRandomBuildIds(projects[i]));
  }
  return listOfPromises;
}

function getBuildsFromRows(ids){
  var listOfPromises = [];
  for(var i = 0; i < ids.length; i++){
      listOfPromises.push(getChosenBuilds(ids[i]));
  }
  return flatten(listOfPromises);
}

function getRandomBuilds(projects){
  return Promise.all(getRandomRowsFromProjects(projects))
  .then(ids => Promise.all(getBuildsFromRows(ids)))
  .then(flatten)
  .catch(console.log);
}

function getBuildData(){
  return getProjects(connection, language)
    .then(getRandomBuilds)
    .catch(console.log);
}
/*
getProjects(connection, language)
    .then(getRandomBuilds)
    .then(builds => {
      connection.end();
      console.log('Finished access data');
      console.log(builds);
      return builds;
    });
 */
//console.time("dbsave");
//getBuildData();
 
 

module.exports = getBuildData;

