require('dotenv').config({
	silent : true,
});


LANGUAGE = 'ruby';
TABLE_NAME = 'table_aux2_' + LANGUAGE;
TABLE_AUX1_NAME = 'table_aux1_' + LANGUAGE;
MAIN_TABLE_NAME = 'travistorrent_7_9_2016';
connection = createConnection();

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

function getProjects(){
    return new Promise(function(resolve, reject) {
      var selectQuery = 'SELECT distinct gh_project_name FROM ' + MAIN_TABLE_NAME + ' WHERE gh_lang = \'' + LANGUAGE + '\';';
      connection.query(selectQuery, function (err, rows) {
          if (err) {
            console.log('Deu ruim, ' + err);
            reject(err);
          }
          resolve(rows);
        });
      });
}

function fillMetricsOnTable(metricsObject){
    var updateQuery = 'UPDATE ' + TABLE_NAME + 
					  ' SET buildScenario1Metric = ' + metricsObject.buildScenario1Metric + 
					  ', buildScenario2Metric = ' + metricsObject.buildScenario2Metric + 
					  ', buildScenario3Metric = ' + metricsObject.buildScenario3Metric +
					  ' WHERE gh_project_name = \'' + metricsObject.project_name + '\';';
    console.log('UPDATE QUERY: ' + updateQuery);
    return new Promise(function(resolve, reject) {
       connection.query(updateQuery, function(err,rows){
          if (err) {
            console.log('Deu ruim, ' + err);
            reject(err);
          }else{
            resolve(true);
          }
       });
    });
}

function calculateMetrics(projectName){
    var buildJobsQuery = 'SELECT COUNT(*) as buildJobs FROM ' + MAIN_TABLE_NAME + ' WHERE gh_project_name = \'' + projectName + '\';'
     
    var buildJobsScenario1Query = 'SELECT COUNT(*) as buildJobsScenario1 FROM ' + MAIN_TABLE_NAME + ' WHERE gh_project_name = \'' + projectName + '\' and tr_status=\'failed\' and tr_tests_fail > 0;';
    var buildJobsScenario2Query = 'SELECT COUNT(*) as buildJobsScenario2 FROM ' + MAIN_TABLE_NAME + ' WHERE gh_project_name = \'' + projectName + '\' and tr_status=\'passed\' and tr_tests_fail > 0;';
	var buildJobsScenario3Query = 'SELECT COUNT(*) as buildJobsScenario3 FROM ' + MAIN_TABLE_NAME + ' WHERE gh_project_name = \'' + projectName + '\' and tr_status=\'passed\' and tr_tests_skipped > 0 and tr_tests_fail = 0;';
	
    var resAux = {};
    
    return new Promise(function(resolve, reject) {
        connection.query(buildJobsQuery, function(err, rows){
            console.log(buildJobsQuery);
            if (err) {
                console.log('Deu ruim, ' + err);
                reject(err);
            }
            console.log(rows);
            resAux.buildJobs = rows[0].buildJobs;
			resolve(resAux);
        });
      })
      .then(() => {
        console.log(buildJobsScenario1Query);
        return new Promise(function(resolve, reject) {
            connection.query(buildJobsScenario1Query, function(err, rows){
              if (err) {
                  console.log('Deu ruim, ' + err);
                  reject(err);
              }
             console.log(rows);
             resAux.buildJobsScenario1 = rows[0].buildJobsScenario1;
              resolve(resAux);
            });
        });
      })
      .then(() => {
        console.log(buildJobsScenario2Query);
        return new Promise(function(resolve, reject) {
            connection.query(buildJobsScenario2Query, function(err, rows){
              if (err) {
                  console.log('Deu ruim, ' + err);
                  reject(err);
              }
             console.log(rows);
             resAux.buildJobsScenario2 = rows[0].buildJobsScenario2;
			 resolve(resAux);
            });
        });
      })
	  .then(() => {
        console.log(buildJobsScenario3Query);
        return new Promise(function(resolve, reject) {
            connection.query(buildJobsScenario3Query, function(err, rows){
              if (err) {
                  console.log('Deu ruim, ' + err);
                  reject(err);
              }
             console.log(rows);
             resAux.buildJobsScenario3 = rows[0].buildJobsScenario3;
			 resolve(resAux);
            });
        });
      })
      .then(() => {
          
          console.log(resAux);
          var buildScenario1Metric = resAux.buildJobsScenario1/resAux.buildJobs;
          var buildScenario2Metric = resAux.buildJobsScenario2/resAux.buildJobs;
		  var buildScenario3Metric = resAux.buildJobsScenario3/resAux.buildJobs;
		  
          return {
            project_name: projectName,
			buildScenario1Metric,
			buildScenario2Metric,
			buildScenario3Metric
          }
      });
}

function listOfProjectNamePromises(projects){
     //console.log('Getting pairs from builds');
     var list = [];
     for(var i = 0; i < projects.length; i++){
        list.push(calculateMetrics(projects[i].gh_project_name));
     }
      return list;
}

function listOfUpdateProjects(objects){
    var list = [];
     for(var i = 0; i < objects.length; i++){
        list.push(fillMetricsOnTable(objects[i]));
     }
      return list;
}



getProjects()
.then(projects => Promise.all(listOfProjectNamePromises(projects)))
.then(objects => Promise.all(listOfUpdateProjects(objects)))
.then(() => connection.end())
.catch(console.log);
