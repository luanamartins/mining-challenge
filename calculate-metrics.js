require('dotenv').config({
	silent : true,
});


LANGUAGE = 'java';
TABLE_NAME = 'table_aux2_' + LANGUAGE;
TABLE_AUX1_NAME = 'table_aux1_' + LANGUAGE;
MAIN_TABLE_NAME = 'travistorrent_27_10_2016';
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

function createTable(){
		return new Promise(function(resolve, reject) {
    
		var createQuery = 'CREATE TABLE ' + TABLE_NAME + ' (gh_project_name varchar(50) unique, metric1 float, metric2 float);';
    
		connection.query(createQuery, function (err, rows) {
				if (err) {
					console.log('Deu ruim, ' + err);
					reject(err);
				}
				resolve(rows);
			});
		});
}

function fillProjectNamesOnTable(){
    return new Promise(function(resolve, reject) {
      var selectQuery = 'SELECT distinct gh_project_name FROM ' + MAIN_TABLE_NAME + ' WHERE gh_lang = \'' + LANGUAGE + '\' LIMIT 2;'; // DELETE LIMIT
      connection.query(selectQuery, function (err, rows) {
          if (err) {
            console.log('Deu ruim, ' + err);
            reject(err);
          }
          resolve(rows);
        });
      })
      .then( (projectNames) =>{
          
          projectNames.forEach(function(projectName){
              var updateQuery = 'INSERT INTO ' + TABLE_NAME + ' (gh_project_name) VALUES (\'' + projectName.gh_project_name + '\');';
              console.log(updateQuery);
                connection.query(updateQuery, function(err, rows) {
                  if(err)
                    console.log(err);
                });
          });
          return projectNames;
      });
}

function fillMetricsOnTable(metricsObject){
    var updateQuery = 'UPDATE ' + TABLE_NAME + ' SET metric1 = ' + metricsObject.metric1 + ', metric2 = ' + metricsObject.metric2 + ' WHERE gh_project_name = \'' + metricsObject.project_name + '\';';
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
    var buildsWithTDDQuery = 'SELECT COUNT(distinct t.tr_build_id) as buildsWithTdd  FROM ' + MAIN_TABLE_NAME + ' t, table_aux1_java a WHERE t.tr_build_id = a.tr_build_id and t.gh_project_name = \'' + projectName + '\' and a.is_tdd = 1 LIMIT 10;' // DELETE LIMIT
     
    var buildsQuery = 'SELECT COUNT(distinct tr_build_id) as totalBuilds FROM ' + MAIN_TABLE_NAME + ' WHERE gh_project_name = \'' + projectName + '\' LIMIT 10';   // DELETE LIMIT
    
    var buildsWithTestChangesQuery = 'SELECT COUNT(distinct t.tr_build_id) as buildsWithTestChanges FROM ' + MAIN_TABLE_NAME + ' t, ' + TABLE_AUX1_NAME + ' a WHERE t.tr_build_id = a.tr_build_id and t.gh_project_name = \'' + projectName + '\' and t.gh_test_churn > 0 LIMIT 10;' // DELETE LIMIT
    
    var result = {};
    var resAux = {};
    
    return new Promise(function(resolve, reject) {
        connection.query(buildsWithTDDQuery, function(err, rows){
            console.log(buildsWithTDDQuery);
            if (err) {
                console.log('Deu ruim, ' + err);
                reject(err);
            }
            console.log(rows);
            resAux.buildsWithTdd = rows.buildsWithTdd;
            resolve(resAux);
        });
      })
      .then(res => {
        console.log(buildsQuery);
        return new Promise(function(resolve, reject) {
            connection.query(buildsQuery, function(err, rows){
              if (err) {
                  console.log('Deu ruim, ' + err);
                  reject(err);
              }
             console.log(rows);
             resAux.totalBuilds = rows.totalBuilds;
              resolve(resAux);
            });
        });
      })
      .then(res2 => {
         return new Promise(function(resolve, reject) {
            connection.query(buildsWithTestChangesQuery, function(err, rows){
              if (err) {
                  console.log('Deu ruim, ' + err);
                  reject(err);
              }
             console.log(rows);
             resAux.buildsWithTestChanges = rows.buildsWithTestChanges;
              resolve(resAux);
            });
        });
      })
      .then(
          return {
            project_name: projectName,
            metric1: resAux.buildsWithTdd / resAux.totalBuilds,
            metric2: resAux.buildsWithTdd / resAux.buildsWithTestChanges
          }
      );
      
      /*var mock = {
        project_name: projectName,
        metric1: 2,
        metric2: 3
      };
      
      console.log('Metric object: ' + JSON.stringify(mock));
      return Promise.resolve(mock);
    */
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



createTable()
.then(() => fillProjectNamesOnTable())
.then(projects => Promise.all(listOfProjectNamePromises(projects)))
.then(objects => Promise.all(listOfUpdateProjects(objects)))
.then(() => connection.end())
.catch(console.log);
