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
  
   return new Promise(function(resolve, reject) {
        var queryString = 'SELECT DISTINCT tr_build_id from travistorrent_7_9_2016 WHERE gh_test_churn > 0 AND gh_lang = \'' + language + '\' AND gh_project_name = \'' + projectName +  '\'';
        var list = [67361243, 9748121, 65891521];
        resolve(list);

        /*connection.query(queryString, function (err, rows) {
            if (err) {
                return reject(err);
            }
            
          var builds = [];
          for(var i = 0; i < rows.length; i++){
            builds.push(rows[i].tr_build_id);
          }
           resolve(builds);
        });
        */
    });
  
}

function getRandomBuildIds(projectName){
  return getBuildsFromProject(projectName)
  .then(function(buildIds){
    var list = sampleSize(buildIds, numberOfBuilds);
    //console.log("Builds from project - " + projectName + ': ' + buildIds);
    //console.log("Selected builds from projects: " + list);
    return list;
  })
  .catch(console.log);
}

function getChosenBuilds(id){
  //console.log('Getting builds');
  return new Promise(function(resolve, reject) {
        var queryString = 'SELECT gh_project_name, git_commit, git_commits from travistorrent_7_9_2016 WHERE tr_build_id = \'' + id + '\' LIMIT 1';
        var build1 ={
            gh_project_name: 'OryxProject/oryx', 
            git_commit: 'fddb336ac30ea3fb0bde91c61ef043f523d7d9fe', 
            git_commits: '49c1ead1c67cc8b980a4be36cff731a14ba4f3fb'
        };
        var build2 ={
            gh_project_name: 'SQiShER/java-object-diff', 
            git_commit: '1b8e26ec8f3c3119eabf64a800dbf9a5ba6b8bbc', 
            git_commits: 'a54380e87391f0604dad8756a1707ba1dabb4f66'
        };
        var list = [build1, build2];
        resolve(list);
        //console.log('Getting build ' + id);
        /*connection.query(queryString, function (err, rows) {
            if (err) {
                return reject(err);
            }
            resolve(rows);
        });
        */
    });
}

function getProjects(){
    //console.log('Getting projects');
    return new Promise(function(resolve, reject) {
      var query = 'SELECT distinct gh_project_name from travistorrent_7_9_2016 WHERE gh_test_churn > 0 AND gh_lang = \'' + language + '\'';
      //console.log(allProjects);
      resolve(allProjects);
      /*connection.query(query, function(err, rows){
          console.log('Terminou');
          if(err){
            console.log(err);
            return reject(err);
          }
          console.log('teste de projects');
          var projectNames = [];
          for(var i = 0; i < rows.length; i++){
            projectNames.push(rows[i].gh_project_name);
          }
          var chosenProjects = sampleSize(projectNames, numberOfProjects);
          resolve(chosenProjects);
          console.log('Chosen projects: ' + chosenProjects);
      });*/
   });
}

function getRandomRowsFromProjects(projects){
  //console.log('Getting rows');
  //console.log('Projects: ' + projects);
  var listOfPromises = [];
  for(var i = 0; i < projects.length; i++){
      listOfPromises.push(getRandomBuildIds(projects[i]));
  }
  //console.log('Promises: ' + listOfPromises);
  return listOfPromises;
}

function getBuildsFromRows(ids){
  var listOfPromises = [];
  //console.log('ids: ' + ids);
  for(var i = 0; i < ids.length; i++){
      listOfPromises.push(getChosenBuilds(ids[i]));
  }
  //console.log(flatten(listOfPromises));
  return flatten(listOfPromises);
}

function getRandomBuilds(projects){
  //console.log('getRandomBuilds');
  return Promise.all(getRandomRowsFromProjects(projects))
  .then(ids => Promise.all(getBuildsFromRows(ids)))
  .then(flatten)
  .catch(console.log);
}

function getBuildData(){
  return getProjects(connection, language)
    .then(getRandomBuilds)
    //.then(builds => {
      //connection.end();
      //console.log('Finished access data');
      //console.log(builds);
      //console.timeEnd("dbsave");
     // return builds;
    //})
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
console.time("dbsave");
getBuildData();
 
 

module.exports = getBuildData;

