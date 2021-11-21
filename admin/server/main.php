<?php
	require_once('login.php');
	// require_once('jsonTables.php');
	require_once('jsonTablesCreateFull.php');
	require_once('mysqlCall.php');

	class Main{
		public $jsonTableClass; 
		public $jsonTableClassCreate; 
		public $mysqlCall;
		public $userRequest;
		public $user = array('name'=>'', 'pass'=>'', 'type'=>'');
		public $loginSystem;

		public function __construct($with_dir = false) {
			$this->serverStart($with_dir);
		}
		public function serverStart($with_dir){
			$this->jsonTableClass = new Json_Table_Class(false, $with_dir); //load configCreate & configTables & configDB (if exists).
			$this->jsonTableClassCreate = new Json_Table_Class_Create(false, $this->jsonTableClass); 
			$this->mysqlCall = new DB($this->jsonTableClass);
			$this->loginSystem = new Login($this->jsonTableClass, $this->mysqlCall);

			$this->getUserRequest();

			if($this->userRequest['arrPath'][1] == 'loginPage'){
				if(count($this->jsonTableClass->systemErr['type']) > 0){
					if($this->jsonTableClass->systemErr['type'][0] === 'create'){
						echo json_encode(array('type'=>'create', 'lng'=>$this->jsonTableClass->getLngType()));
					}
					if($this->jsonTableClass->systemErr['type'][0] === 'missingCreate')
						echo json_encode(array('type'=>'error', 
								'msg'=>$this->jsonTableClass->systemErr['msg']));
					if($this->jsonTableClass->systemErr['type'][0] === 'JSON')
						echo json_encode(array('type'=>'error', 
								'msg'=>$this->jsonTableClass->systemErr['msg']));
				}else
					echo json_encode(array('type'=>'login', 'lng'=>$this->jsonTableClass->getLngType()));
			}else{
				//if($this->userRequest['arrPath'][1] == 'regularUser'){
					//set user pass lng
                    $this->language = 'EN';
					$this->login(array(
						'user'=>$this->jsonTableClass->configDB['regular']['db_user'], 
						'pass'=>$this->jsonTableClass->configDB['regular']['db_pass']
					));
					//echo json_encode(array("OKERR"=>true, 'msg'=>'SVE OK!', 'user'=>$this->user));
					//exec request
					$res = $this->execRequest($this->userRequest['body'], $this->userRequest['arrPath'] );
					if($this->userRequest['arrPath'][1] === 'model') 
						echo json_encode($res);
				// }else{
				// 	//http_response_code(404);
				// 	echo json_encode(array("OKERR"=>false,"msg"=>'Wrong permissions!', "arrPath"=>$this->userRequest['arrPath'])); 
				// 	//include('my_404.php'); // provide your own HTML for the error page
				// 	return false;
				// }
			}
		}

		//from login page
		public function login($data){
			$ret = $this->loginSystem->configDBloginCheck($data);
			if($ret["OKERR"] === true){
				$this->user = $this->loginSystem->user;
				$this->LoadJSON();
			 	return $ret;
			}
			if($this->jsonTableClass->configTables['usersTable']['type'] === 'db' || 
			$this->jsonTableClass->configTables['usersTable']['type'] === 'other_and_db'){
				$this->setDBdata('sa');           
			
				$ret = $this->loginSystem->login($data);
				if($ret["OKERR"] === true){
					$this->user = $this->loginSystem->user;
				 	$this->LoadJSON();
				}else{
					$msg = ($this->language !== '')?
							$this->jsonTableClass->languages[$this->language]['wrongLogin'] : 
							$this->jsonTableClass->languages['EN']['wrongLogin'];
					return array("OKERR"=>false, "msg"=>$msg);
				}
			}
			return $ret;
		}
		//any other request, check credentials
		public function checkUser(){
			return $this->loginSystem->checkUser();
		}


		public function getSysError(){
			return $this->jsonTableClass->systemErr;
		}
		
		public function setDBdata($userType){
			$host = $this->jsonTableClass->configDB[$userType]['db_host'];
			$username = $this->jsonTableClass->configDB[$userType]['db_user'];
			$pass = $this->jsonTableClass->configDB[$userType]['db_pass'];
			$dbname = $this->jsonTableClass->configDB[$userType]['db_name'];
			$this->mysqlCall->setDBdata($host, $username, $pass, $dbname);
		}
		public function LoadJSON(){
			$this->setDBdata($this->user['type']);
			$sqlObj = $this->loadSqlServerStructure(); 
			if($this->jsonTableClass->loadJsonServerStructure($sqlObj) === false)
				exit; 
			return;
		}
		public function setDefaultUserTableNames(){
			$attr = array('table_name','col_user','col_pass','col_type');
			for($i=0;$i<count($attr);$i++)
				if(trim($this->jsonTableClass->configTables['usersTable'][$attr[$i]]) === '')
					$this->jsonTableClass->configTables['usersTable'][$attr[$i]] = 
						$this->mysqlCall->defaultUserTableData[$attr[$i]];
		}
		
/*************************************************************************************************
**
**	USER REQUEST
**
*************************************************************************************************/



		public function getUserRequest(){
		 	$this->userRequest['arrPath'] = array();
			if(!isset($_REQUEST['path'])){
				die(json_encode(array('OKERR'=>false, 'msg'=>'no_path'))); 
			}

			$url_path = explode('/', $_REQUEST['path']);
			$bool = false;
			$len = count($url_path);
			for($i=0; $i<$len; $i++){
				if($url_path[$i] === 'apijx') $bool = true;
				if($bool === true)
					array_push($this->userRequest['arrPath'], $url_path[$i]);
			}

			$method = $_SERVER['REQUEST_METHOD'];
			$this->userRequest['body'] = array();
			if($method == 'POST' || $method == 'PUT' || $method == 'DELETE')
				$this->userRequest['body'] = json_decode(file_get_contents("php://input"), true);
			if($method == 'GET')
				foreach($_GET as $prop=>$val)
					$this->userRequest['body'][$prop] = $val; //htmlspecialchars
		}


		public function execRequest($data, $arrPath){
			$this->jsonTableClassCreate->jsonPath = $this->jsonTableClassCreate->jsonPathBasic.$this->mysqlCall->db_data['db_name'].'/';
			$this->jsonTableClassCreate->jsonPathDefault = $this->jsonTableClassCreate->jsonPathBasic.$this->mysqlCall->db_data['db_name'].'/'.'default/';
			
            $sdb = $this->mysqlCall->startDB();  
            if($sdb['OKERR'] === false) return $sdb;
            //else echo "1.".json_encode($sdb);

            //echo json_encode($this->userRequest);
			if($arrPath[1] === 'test'){
				http_response_code(404);
				exit;
			}
			$sa = $this->jsonTableClass->defaultConfigSuperAdminName;
			
            if($arrPath[1] === 'testHash'){
				// require("user_def_fns.php");
                $vr = my_password_hash($arrPath[2]);
                echo json_encode(["OKERR"=>true, "msg"=>$vr]);
				exit;
			}

			if($arrPath[1] === 'reloadJSON'){
				if($this->user['type'] == $sa){
					$sqlObj = $this->loadSqlServerStructure(); 
					if($this->jsonTableClass->loadJsonServerStructure($sqlObj) === false)
						exit;
					die(json_encode(array('OKERR'=>true)));
				}else{
					die(json_encode(array('OKERR'=>false, 'msg'=>'Only superadmin can do that!', 'errType'=>1)));
				}
			}
			if($arrPath[1] === 'reloadJSONtable'){
				if($this->user['type'] !== '' && $this->user['type'] !== 'regular'){
					$tName = $arrPath[2];
					if($tName === '' || !array_key_exists($tName, $this->jsonTableClass->formsData)){
						echo json_encode(array('OKERR'=>false, 'msg'=>'No table!'));
						return;
					}
					$newPath = $this->jsonTableClass->formsData[$tName]['filename'];
					if($this->jsonTableClass->loadJsonTableFile($newPath, $tName) === false)
						return;
					echo json_encode(array('OKERR'=>true));
				}
			}
			if($arrPath[1] == 'language'){
				$lngn = (array_key_exists(2, $arrPath))? $arrPath[2] : '';
				$this->getLanguage($lngn);
			}
			
			if($arrPath[1] == 'myadmindata'){
				if($this->user['type'] !== '')
					die(json_encode(array('OKERR'=>true, 'data' => $this->user)));
				else
					die(json_encode(array('OKERR'=>false, 'msg'=> 'No data for you!' )));
			}
			if($arrPath[1] == 'viewSqlStructure'){
				if($this->jsonTableClass->configDBfileExists == false){
					echo json_encode(array( 'OKERR'=>false, 'msg'=>'configDB.json dont exists!', 'errType'=>1 ));
					return;
				}
				echo json_encode($this->loadSqlServerStructure()); 
			}
			if($arrPath[1] == 'createJsonStructureFromDbTable'){
				$tData = array('queryType'=>'get_table_info', 'tableName'=>$data['tName'], 'tableType'=>$data['tType'] );
				$response = $this->mysqlCall->execSql($tData, false);
				$this->jsonTableClassCreate->createJsonStructureFromDbTable($response); 
			}
			//send json lists
			if($arrPath[1] == 'viewJsonList'){
				if($this->user['type'] == $sa){
					if($this->jsonTableClass->configDBfileExists == false){
						echo json_encode(array( 'OKERR'=>false, 'msg'=>'configDB.json dont exists!', 'errType'=>1 ));
						return;
					}
					if(!array_key_exists('saSettings', $this->jsonTableClass->configTables))
						$this->jsonTableClass->configTables['saSettings'] = array();
					$this->jsonTableClass->configTables['saSettings']['mainMenu'] = array();
					foreach($this->jsonTableClass->formsData as $jsonTableName=>$val)
						$this->jsonTableClass->configTables['saSettings']['mainMenu'][$jsonTableName] = 
							array("viewName"=>$jsonTableName,"label"=>$jsonTableName);
					$ret = array(
						'formsData'=> $this->jsonTableClass->formsData, 
						'settings'=> $this->jsonTableClass->configTables['saSettings']
					);
				}else{
					$formsData = array();
					foreach($this->jsonTableClass->configTables[$this->user['type'].'Settings']['mainMenu'] 
					as $viewName=>$vn_val){
						if(array_key_exists($viewName, $this->jsonTableClass->formsData))
							$formsData[$viewName] = $this->jsonTableClass->formsData[$viewName];
						if(array_key_exists('smallScreens', $vn_val)){
							$arr = $vn_val['smallScreens'];
							for($i=0; $i<count($arr); $i++)
								if(array_key_exists('viewName', $arr[$i])){
									$vn = $arr[$i]['viewName'];
									if(array_key_exists($vn, $this->jsonTableClass->formsData))
										$formsData[$vn] = $this->jsonTableClass->formsData[$vn];
								}
						}
					}
					$ret = array(
						'formsData'=> $formsData, 
						'settings'=> $this->jsonTableClass->configTables[$this->user['type'] . 'Settings']
					);
				}
				echo json_encode($ret);
			}
			if($arrPath[1] == 'getTableType'){
				if($this->user['type'] == $sa){
					$tData = array('queryType'=>'get_table_type', 'tableName'=>$data['tName']);
					$response = $this->mysqlCall->execSql($tData, false);
					if($response['OKERR'] === true)
						die(json_encode(array('OKERR'=>true, 'tableType'=>$response['result'][0]['TABLE_TYPE'])));
					else
						die(json_encode($response));
					return;
				}else{
					die(json_encode(array('OKERR'=>false, 'msg'=>'Only superadmin can do that!')));
				}
			};
			if($arrPath[1] == 'jsonFile'){
				$jsonPath = $this->jsonTableClass->formsData[$arrPath[2]]['filename'];
				$this->jsonTableClass->getJsonFile($jsonPath); 
			}
			if($arrPath[1] == 'copyView'){
				echo json_encode($this->jsonTableClass->copyView($data));
			}
			if($arrPath[1] == 'deleteView'){
				$this->jsonTableClass->deleteView($data['tName']);
			}
			if($arrPath[1] == 'updateView'){
				$this->jsonTableClass->updateView($data);
			}
			if($arrPath[1] == 'diffView'){
				$this->jsonTableClass->diffView($data);
			}
			if($arrPath[1] == 'configCreate'){
				if($this->user['type'] == $sa){
					$configFile = $this->jsonTableClass->configPath . 'configCreate.json';
					$this->jsonTableClass->getJsonFile($configFile);
					die();
				}else{
					die(json_encode(array('OKERR'=>false, 'msg'=>'Only superadmin can do that!')));			
				}
			};
			if($arrPath[1] == 'configTables'){
				$configFile = $this->jsonTableClass->configPath . 'configTables.json';
				$this->jsonTableClass->getJsonFile($configFile);
				die();
			};
			if($arrPath[1]== 'updateConfigCreate' || $arrPath[1] == 'updateConfigTables'){
				$this->jsonTableClass->updateConfig($data, substr($arrPath[1], 6));
			};
			//create new sql field
			if($arrPath[1] == 'createSqlFieldInSqlFile'){
				$response = $this->updateFieldInSql($data);
				if($response['OKERR'] == true)
					echo json_encode(array( 'OKERR'=> true ));
				else
					echo json_encode($response);
			}
			if($arrPath[1] == 'createFieldInSqlAndDefJson'){
				$response = $this->updateFieldInSql($data);
				if($response['OKERR'] == true){
					$line = $response['result'][0];
					$tableName = $data['sqlTable'];
					$jsonName = 'default_'.$tableName;
					$bool = $this->createFieldInJsonFile($tableName, $jsonName, $line);
					echo json_encode(array( 'OKERR'=> $bool ));
				}else
					echo json_encode($response);
			}
			if($arrPath[1] == 'createFieldInSqlAndAllJson'){
				$response = $this->updateFieldInSql($data);
				if($response['OKERR'] == true){
					$line = $response['result'][0];
					$tableName = $data['sqlTable'];
					$bool = true;
					foreach($this->jsonTableClass->formsData as $jsonName=>$arr){
						if($arr['tableName'] === $tableName)
							$bool = $this->createFieldInJsonFile($tableName, $jsonName, $line) && $bool;
					}
					echo json_encode(array( 'OKERR'=> $bool ));
				}else
					echo json_encode($response);
			}

			//get one json file
			if($arrPath[1] == 'structure'){
				echo json_encode($this->jsonTableClass->formsData[$data['tableName']]);
			}
			//get sql file
			if($arrPath[1] == 'sqlFields'){
				echo json_encode($this->jsonTableClass->sqlData);
			}
			//get transactions
			if($arrPath[1] == 'sqlTrans'){
				echo json_encode( $this->mysqlCall->execTrans($data, $this->user['type']) );
			}
			if($arrPath[1] == 'model' ||$arrPath[1] == 'sqlQuery' || $arrPath[1] == 'sqlParamQuery'){
				$method = $_SERVER['REQUEST_METHOD'];
				if($method === 'POST' && array_key_exists('apijxMethod', $this->userRequest['body']))
					$method = $this->userRequest['body']['apijxMethod'];
				$response = $this->mysqlCall->resolveModelQuery($arrPath, $method, $data, $this->user['type']);
				if($arrPath[1] == 'sqlQuery' || $arrPath[1] == 'sqlParamQuery'){
                    if($data['sqlQuery'] == $this->jsonTableClass->configTables["usersTable"]["loginQuery"]){
                        if($response['OKERR'] == true)
                            $this->mysqlCall->set_userAppId($response['lines'][0]['id']);
                    }
                    if($data['sqlQuery'] == $this->jsonTableClass->configTables["usersTable"]["logoutQuery"]){
                        if($response['OKERR'] == true){
                            // echo "LOGOUT<br>";
                            $this->mysqlCall->set_userAppId(0);
                        }
                    }
					echo json_encode($response);
                }else
					return $response;
			}
		}
        
		/*****************************************************************************************************
		**
		**
		**
		*****************************************************************************************************/


		public function loadSqlServerStructure(){
			$nData = array('queryType'=>'get_table_names', 'close'=>false);
			$bufResponse = array();
			$response = $this->mysqlCall->execSql($nData, true);
			if($response['OKERR'] == false){ 
				$this->mysqlCall->_conn->close();
				return $response;
			}
			$sqlTablesTotal = count($response['result']);
			for($i=0; $i<$sqlTablesTotal; $i++){
				$tData = array('queryType'=>'get_table_info', 
								'tableName'=>$response['result'][$i]['TABLE_NAME'], 
								'close'=>false);
				$response2 = $this->mysqlCall->execSql($tData, true);
				$tName = $response2['data']['tableName'];
				if($response2['OKERR'] == false){
					$bufResponse[$tName] = 'FALSE_RESPONSE';
				}else{
					$bufResponse[$tName] = $response2['result'];		
				}
			}
			$this->mysqlCall->_conn->close();
			return $bufResponse;
		}
		public function checkDBData($data){
			if(!isset($data['host'])) $data['host'] = $this->jsonTableClass->default_host_name;
			$db_ok = $this->mysqlCall->openDB($data['host'], $data['user'], $data['pass'], $data['db']);
			if($db_ok === false) return false;
			$this->mysqlCall->setDBdata($data['host'], $data['user'], $data['pass'], $data['db']);
			return true;
		}

		public function createJsonServerStructure($data){
			if($this->checkDBData($data) == false) { echo 'OUT ON: 1';  return; }
			if($this->jsonTableClassCreate->createJsonServerStructureDB($data) == false) { echo 'OUT ON: 2';  return; }
			if($this->jsonTableClassCreate->createConfigTables() == false){ 
				$this->createJSSFailed();
				return;
			}
			$this->createTableUsers();			
			$this->setDefaultUserTableNames();
			$this->jsonTableClassCreate->createDefaultUserQuery();

			$nData = array('queryType'=>'get_table_names', 'dbname'=> $data['db'], 'close'=>false );
			$responseTN = $this->mysqlCall->execSql($nData);
			if($responseTN['OKERR'] == false){ 
				$this->mysqlCall->_conn->close();
				$this->createJSSFailed();
				echo json_encode($responseTN);
				return;
			}
			$this->jsonTableClassCreate->createAllowedArrays($responseTN);
			$bufResponse = array();
			$createdTablesTotal = count($responseTN['result']);
			$sqlObj = array();
			$allTablesBool = true;
			for($i=0; $i<$createdTablesTotal; $i++){
				$tName = $responseTN['result'][$i]['TABLE_NAME'];
				$tType = $responseTN['result'][$i]['TABLE_TYPE'];
				$tData = array( 'queryType'=>'get_table_info', 
								'tableName'=>$tName, 
								'close'=>false
				);
				$response = $this->mysqlCall->execSql($tData);
				if($response['OKERR'] == false){
					$bufResponse[$tName] = 'FALSE_RESPONSE';
					$sqlObj[$tName] = 'FALSE_RESPONSE';
					$this->jsonTableClassCreate->jsonTables[$tName] = 'FALSE_RESPONSE';
					$allTablesBool = false;
				}else{
					$sqlObj[$tName] = $response['result'];
					$this->jsonTableClassCreate->createJsonTablesStructure($tName, $tType, $response['result']);
					// $bool = $this->jsonTableClassCreate->createJsonFile(
					// 	$this->jsonTableClassCreate->jsonPathDefault . $tName.'.json', 
					// 	$this->jsonTableClass->formsData['default_'.$tName]
					// );
					$bool = $this->jsonTableClassCreate->createJsonFile(
						$this->jsonTableClassCreate->jsonPath . $tName.'.json', 
						$this->jsonTableClass->formsData[$tName]
					);	
					$bufResponse[$tName] = ($bool == true)	? 'created' : 'FALSE_RESPONSE';
					$allTablesBool = $allTablesBool && $bool;
					
					//$this->jsonTableClass->copyView(
					//	array('newViewName'=>$tName, 'origView'=>'default_'.$tName )
					//);

				}
			}
			$this->mysqlCall->_conn->close();
			$bufResponse['sql_fields'] = $this->jsonTableClassCreate->createJsonServerStructure2($sqlObj);
			if($allTablesBool === false)
				$this->createJSSFailed();
			$bufResponse['OKERR'] = $allTablesBool;
			echo json_encode($bufResponse);
		}
		public function createJSSFailed(){
			unlink($this->jsonTableClassCreate->configPath . 'configDB.php');
			unlink($this->jsonTableClassCreate->jsonPathDefault);
		}
		public function createTableUsers(){
			if($this->jsonTableClass->configCreate['usersTable']['create'] == 'table'){
					$retExec = $this->mysqlCall->execSql(array('queryType'=>'create_table_users', 'close'=>false ));
					if($retExec['OKERR'] === false){
						$this->mysqlCall->_conn->close();
						echo json_encode($retExec);
						$this->createJSSFailed();
						exit;
					}
					$dataExec = array('queryType'=>'insert_default_admin_user', 'close'=>false );
					$dataExec['db_val'] = (array_key_exists('admin', $this->jsonTableClass->configCreate['adminTypes']) && array_key_exists('db_val', $this->jsonTableClass->configCreate['adminTypes']['admin']))? 						
								$this->jsonTableClass->configCreate['adminTypes']['admin']['db_val']
								: 'admin';
					$this->mysqlCall->execSql($dataExec);
			}
			if($this->jsonTableClass->configCreate['usersTable']['create'] == 'col_type'){
				$retExec = $this->mysqlCall->execSql(array('queryType'=>'add_col_adminType', 'close'=>false ));
			}
		}
		/*****************************************************************************************************
		**
		** ONE FIELD
		**
		*****************************************************************************************************/

		public function updateFieldInSql($data){
			$dataSql = array(
				'queryType' => 'get_field_info', 'tableName'=>$data['sqlTable'], 'fieldName'=>$data['sqlField']  
			);
			$response = $this->mysqlCall->execSql($dataSql);
			if($response['OKERR'] == true){
				$this->jsonTableClassCreate->createSqlFieldInJsonSqlFile($data['sqlTable'], $response['result'][0]);
				$this->jsonTableClassCreate->createJsonFile(
					$this->jsonTableClassCreate->jsonPathDefault . 'sql_fields.json', 
					$this->jsonTableClass->sqlData
				);
			}
			return $response;
		}

		public function createFieldInJsonFile($tableName, $jsonName, $line){
			$field = $this->jsonTableClassCreate->createJsonField($tableName, $line);
			$fieldName = $field['field']['name'];

			//check Primary or unique not null
			$formsData = $this->jsonTableClass->formsData[$jsonName];
			$formsData['fields'][$fieldName] = $field['field'];

			if(strpos($line['COLUMN_KEY'], 'PRI') !== false){
				$formsData['orderBy']['sortOrder'][$fieldName] = 
					($field['types']['sqlType'] == 'datetime')? 'DESC' : 'ASC';
				if(!in_array ($fieldName, $formsData['orderBy']['primKeyOrder']))
					array_push($formsData['orderBy']['primKeyOrder'], $fieldName);
			}
			if(!in_array ($fieldName, $formsData['orderBy']['inputOrder']))
				array_push($formsData['orderBy']['inputOrder'], $fieldName);
			if(!in_array ($fieldName, $formsData['orderBy']['tableOrder']))
				array_push($formsData['orderBy']['tableOrder'], $fieldName);
			if(!in_array ($fieldName, $formsData['orderBy']['searchOrder']))
				array_push($formsData['orderBy']['searchOrder'], $fieldName);
			
			$bool = $this->jsonTableClassCreate->createJsonFile($formsData['filename'], $formsData);
			return $bool;
		}


/*************************************************************************************************
**
** LANGUAGES
**
*************************************************************************************************/


		public function getLanguage($pathPart2){
			if($this->jsonTableClass->languages === null)
				die(json_encode(array('OKERR'=>false, 'msg'=>'Languages are not loaded.' )));
			if($pathPart2 !== ''){  //i want that language, dont care for options
				$this->sendLanguage($pathPart2);
				exit;
			}
			$langConfig = $this->jsonTableClass->languages;
			$lngType = $this->jsonTableClass->getLngType();
			$lng = '';
			if(!array_key_exists('getLanguage', $lngType))
				$lng = $lngType['default'];
			else{
				if($langConfig['getLanguage']['type'] === 'jsfunction'){
					echo json_encode(array('OKERR'=>true, 'lngName'=>'jsfunction', 'lng'=>$langConfig['getLanguage']['language']));
					exit;
				};
				if($langConfig['getLanguage']['type'] === 'default'){
					$lng = $langConfig['getLanguage']['language'];
				};
				if($langConfig['getLanguage']['type'] === 'byAdminType'){
					$at = $this->user['type'];  
					$lng = $langConfig['getLanguage']['language'][$at];
				};
				if($langConfig['getLanguage']['type'] === 'dbColumn'){
					$sendData = array('queryType'=>'get_user_language', 'user'=>$this->user['name'] );
					$response = $this->mysqlCall->execSql($sendData); 
					if($response['OKERR'] == false){
						echo json_encode($response);
						return;
					} 
					$lng = $response['result'][0]['Language'];
				};
			}
			$this->sendLanguage($lng);	
		}

		public function sendLanguage($lng){
			if(trim($lng) === ''){
				echo json_encode(array('OKERR'=>false, 'msg'=>'Language from Client not received.' ));
				return false;
			}
			if(!array_key_exists($lng, $this->jsonTableClass->languages) ) {
				echo json_encode(array('OKERR'=>false, 'msg'=>'Language '.$lng.' not defined.' ));
				echo json_encode(array('Languages'=>$this->jsonTableClass->languages));
				return false;
			}
			$this->language = $lng;
			$lngSend = $this->jsonTableClass->languages[$lng];
			echo json_encode(array('OKERR'=>true, 'lngName'=>$lng, 'lng'=> $lngSend ));
			return true;
		}
	}
?>