<?php
	require_once('checkJson.php');

	class Json_Table_Class{
		public $checkJson; 
		public $sqlData = array( 
			'sqlQueries'=>array(),
			'joinTables'=>array('table'=>array(
				array(
					"foreign_key"=>"table_field_foreign_key",
					"to_table"=>"foreign_table", 
					"to_key"=>"foreign_table_field_key"
				))
			),
			'sqlTables'=>array(), 
			'sqlFields'=> array( 
				"no_sql"=>array(
					'table'=>"no_sql",
					'name'=>"no_sql", 
					'orig_type'=>"text",
					'type'=>"text",
					'other'=>""
				)
			)
		);
		public $formsData = array();
		public $configDB = array('db_name'=>'', 'db_user'=>'', 'db_pass'=>'');
		public $configCreate = array();
		public $configTables = array();

		// public $jsonPath =  __DIR__.'/json/';
		// public $jsonPathDefault =  __DIR__.'/json/';
		// public $configPath = __DIR__."/config/";
		public $jsonPath = 'json/';   
		public $jsonPathDefault = 'json/'; 
		public $configPath ="config/"; 

		public $languages = array();

		public $default_host_name = 'localhost';  //in mysqlCall file
		public $defaultConfigSuperAdminName = 'sa';  //in configDB file
		
		public $configDBfileExists = false;
		public $configCLfileExists = false;
		public $configTfileExists = false;
		public function __construct($create, $with_dir) {
			if($with_dir === true){
				$this->jsonPath = __DIR__.'/'.$this->jsonPath;
				$this->jsonPathDefault = __DIR__.'/'.$this->jsonPathDefault;
				$this->configPath = __DIR__.'/'.$this->configPath;
			}
			$this->checkJson = new Check_JSON();
			$this->configCLfileExists = $this->loadConfigCLFiles();
			if($create === false){
				$this->configDBfileExists = $this->loadConfigDBFile();
				$this->configTfileExists = $this->loadConfigTablesFiles();
			}
		}

/*************************************************************************************************
**
**	LOAD
**
*************************************************************************************************/

		public $systemErr = array('type'=>array(), 'msg'=>array());
		public function systemJsonError($errType, $msg){
			array_push($this->systemErr['type'], $errType);
			array_push($this->systemErr['msg'], $msg);
		}


/*************************************************************************************************
**
** LOAD CONFIG FILES
**
*************************************************************************************************/

		public $pathSet = false;
		public function loadConfigDBFile(){
			$configFile = $this->configPath . 'configDB.php';
			if (file_exists ($configFile)){
				require_once($configFile); 
				$configDBfile = configDB();
				$ret = $this->checkJson->checkDBconfig($configDBfile);
				if($ret['OKERR'] === false){
					$ret['msg'] = "configDB.json error: ".$ret['msg'];
					$this->systemJsonError('JSON', $ret['msg']);
					return false;
				}
				//json is OK
				$this->configDB = array();
				foreach($configDBfile as $adminName => $an_value){
					$this->configDB[$adminName] = array(
						'db_host' => $an_value['db_host'], 
						'db_name' => $an_value['db_name'], 
						'db_user' => $an_value['db_user'], 
						'db_pass' => $an_value['db_pass']
					);
				}
				if($this->pathSet === false){
					$sa = $this->defaultConfigSuperAdminName;
					$this->jsonPath .= $this->configDB[$sa]['db_name'].'/';
					$this->jsonPathDefault .= $this->configDB[$sa]['db_name'].'/default/';
					$this->pathSet = true;
				}
				//check all login credentials
				$rspns = array();
				foreach($this->configDB as $cName=>$obj){
					$rsp = $this->checkJson->checkDBData(null, $obj);
					if($rsp['OKERR'] === false){
						$this->systemJsonError('JSON', 'configDB.json '.$cName.' error: '.$rsp['msg']);
						array_push($rspns, false);
					}else{
						array_push($rspns, true);
					}
				}
				$ret = $rspns[0];
				for($i=1;$i<count($rspns);$i++) 
					$ret = $ret && $rspns[$i];
				return $ret;
			}else{
				$this->systemJsonError('create', $configFile.' doesn\'t exists!');
				return false;
			}
		}
		public function getLngType(){
			if(!array_key_exists('getLanguage', $this->languages))
				return array('default'=>$this->languages['default']);
			return array('default'=>$this->languages['default'], 'getLanguage'=>$this->languages['getLanguage']);
		}
		public function loadConfigCLFiles(){
			//load language file
			$configFile = $this->configPath . 'language.json';
			if (!file_exists ($configFile)){					
				$this->systemJsonError('missingCreate', $configFile.' doesn\'t exists!' );
				//echo json_encode(array( 'OKERR'=>false, 'msg'=>$configFile.' doesn\'t exists!', 'errType'=>2 ));
				return false;
			}
			$string = file_get_contents($configFile);
			try{
				$this->languages = json_decode($string, true);
				if($this->languages === null){
					$err = $this->get_json_error();
					$this->systemJsonError('missingCreate', 'Bad JSON format for language.json. '.$err );
					return false;
				}
			}catch(Exception $e){
				$this->systemJsonError('missingCreate', 'Bad JSON format for language.json. '.$e->getMessage() );
				return false;
			}

			if(!is_array($this->languages)){
				$this->languages = array();
			}
			if(!array_key_exists('default', $this->languages) || $this->languages['default'] === '') 
				$this->languages['default'] = 'EN';

			$ret = $this->checkJson->checkLanguageFile($this->languages);
			if($ret['OKERR'] === false){
				$ret['msg'] = "language.json error: ".$ret['msg'];
				$this->systemJsonError('missingCreate', $ret['msg']);
				//echo json_encode($ret);
				return false;
			}

			//load configCreate file
			$configFile = $this->configPath . 'configCreate.json';
			if (!file_exists ($configFile)){
				if($this->configDBfileExists === true) //dont report any errors, if db exists
						return false;
				$this->systemJsonError('missingCreate', $configFile.' doesn\'t exists!' );
				return false;
			}
			$string = file_get_contents($configFile);
			try{
				$this->configCreate = json_decode($string, true);
				if($this->configCreate === null){
					$err = $this->get_json_error();
					$this->systemJsonError('missingCreate', 'Bad JSON format for configCreate.json. '.$err );
					return false;
				}
			}catch(Exception $e){
				$this->systemJsonError('missingCreate', 'Bad JSON format for configCreate.json. '.$e->getMessage() );
				return false;
			}
			$ret = $this->checkJson->checkConfigCreate($this->configCreate);
			if($ret['OKERR'] === false){
				$ret['msg'] = "configCreate.json error: ".$ret['msg'];
				$this->systemJsonError('missingCreate', $ret['msg']);
				//echo json_encode($ret);
				return false;
			}
			return true;
		}
		
		public function loadConfigTablesFiles(){
			//load configTables file
			$configFile = $this->configPath . 'configTables.json';
			if (!file_exists ($configFile)){
				$this->systemJsonError('JSON', $configFile.' doesn\'t exists!' );
				//echo json_encode(array( 'OKERR'=>false, 'msg'=>$configFile.' doesn\'t exists!', 'errType'=>2 ));
				return false;
			}
			$string = file_get_contents($configFile);
			try{
				$this->configTables = json_decode($string, true);
				if($this->configTables === null){
					$err = $this->get_json_error();
					$this->systemJsonError('missingCreate', 'Bad JSON format for configTables.json. '.$err );
					return false;
				}
			}catch(Exception $e){
				$this->systemJsonError('JSON', 'Bad JSON format for configTables.json. '.$e->getMessage() );
				return false;
			}
			$ret = $this->checkJson->checkConfigTables($this->configTables);
			if($ret['OKERR'] === false){
				$ret['msg'] = "configTables.json error: ".$ret['msg'];
				$this->systemJsonError('JSON', $ret['msg']);
				//echo json_encode($ret);
				return false;
			}
			return true;
		}


/*************************************************************************************************
**
** LOAD JSON TABLES
**
*************************************************************************************************/

		public function loadJsonServerStructure($sqlObj){
			$this->formsData = array();
			$this->sqlData = array( 
				'sqlQueries'=>array(),
				'joinTables'=>array(),
				'sqlTables'=>array(), 
				'sqlFields'=> array( 
					"no_sql"=>array(
						'table'=>"no_sql",
						'name'=>"no_sql", 
						'orig_type'=>"text",
						'type'=>"text",
						'other'=>""
					)
				)
			);

			$sqlFile = $this->jsonPathDefault . 'sql_fields.json';
			//sync
			if (!file_exists ($sqlFile)){
				echo json_encode(array('OKERR'=>false, 'msg'=>$sqlFile.' doesn\'t exists!' ));
				$this->systemJsonError('JSON', $sqlFile.' doesn\'t exists!');
				return false;
			}
			$string = file_get_contents($sqlFile);
			try{
				$this->sqlData = json_decode($string, true);
				if($this->sqlData === null){
					$err = $this->get_json_error();
					$this->systemJsonError('JSON', 'Bad JSON format for sql_fields.json. '.$err );
					return false;
				}
			}catch(Exception $e){
				echo json_encode(array( 'OKERR'=>false, 'msg'=>'sql_fields.json bad format! '.$e->getMessage() ));
				$this->systemJsonError('JSON', 'sql_fields.json bad format! '.$e->getMessage());
				return false;
			}
			foreach($sqlObj as $table=>$value)
				if($value === 'FALSE_RESPONSE'){
					echo json_encode(array('OKERR'=>false, 'msg'=>$table.' ERROR: Got FALSE_RESPONSE from MySQL. Table probably dont exists or locked.'));
					$this->systemJsonError('JSON', $table.' ERROR: Got FALSE_RESPONSE from MySQL. Table probably dont exists or locked.');
					return false;
				}
			//check sql_fields.json with sqlObj
			$check = $this->checkJson->checkSqlFields($this->sqlData, $sqlObj);
			if($check['OKERR'] === false){
				echo json_encode(array('OKERR'=>false, 'msg'=>'sql_fields.json ERROR: '.$check['msg']));
				$this->systemJsonError('JSON', 'sql_fields.json ERROR: '.$check['msg']);
				return false;
			}
			$this->readAllJsonFilesFromDir($this->jsonPath, '');
			return true;
		}
		public function readAllJsonFilesFromDir($start_dir, $namePref){
			$dir = $start_dir;
			$dir_files = scandir($dir); 
			if(count($dir_files)>2){
				for ($i=0;$i<count($dir_files);$i++){
					$newPath = $dir.'/'.$dir_files[$i];
					if(substr($dir_files[$i], 0,1) != '.'){
						if( is_dir($dir.'/'.$dir_files[$i]) ){
							$newNamePref = ($namePref == '')? $dir_files[$i] : $namePref.'_'.$dir_files[$i]; 
							$this->readAllJsonFilesFromDir($newPath, $newNamePref);
						}else{
							if($dir_files[$i] !== 'sql_fields.json'){
								$file_parts = pathinfo($dir_files[$i]);
								if($file_parts['extension'] == 'json'){
									$arr = explode('.', $dir_files[$i]);
									array_pop($arr);
									$tName = ($namePref == '')? join('', $arr) : $namePref.'_'.join('', $arr);
									if($this->loadJsonTableFile($newPath, $tName) === false)
										exit;									
								}
							}
						}
					}
				}
			}
		}

		public function loadJsonTableFile($newPath, $tName){
			try{
				$string = file_get_contents($newPath);
			}catch(Exception $e){
				$this->formsData[$tName] = 'Can\'t load file!';
				echo json_encode(array('OKERR'=>false, 'msg'=>$newPath.' can\'t be loaded.'.
					$e->getMessage(), 'errType'=>1 ));
				$this->systemJsonError('JSON', $newPath.' can\'t be loaded. '.$e->getMessage());
				return false;
			}
			$this->formsData[$tName] = json_decode($string, true);
			if($this->formsData[$tName] === null) {
				$err = $this->get_json_error();
				$this->formsData[$tName] = 'Bad json file format!'.$err;
				echo json_encode(array(
					'OKERR'=>false, 'msg'=>$newPath.' bad format! ', 'errType'=>1 
				));
				$this->systemJsonError('JSON', $newPath.' bad format! ');
				return false;
			}
			$this->formsData[$tName]['filename'] = $newPath;
			$cf = $this->checkJson->checkJsonTable(
				$tName, $this->formsData[$tName], 
				$this->configTables['newElementsDef'], 
				$this->configTables['allowedTypeForDEFAULT']
			);
			if($cf['OKERR'] === false){
				$cf['msg'] = $newPath.' error: '.$cf['msg'];
				echo json_encode($cf);
				$this->systemJsonError('JSON', $cf['msg']);
				return false;
			}	
			return true;
		}
		
		public function copyView($data){
			$fldrs = explode('/', $data['newViewName']);
			if(count($fldrs) > 1){
				array_pop($fldrs);
				$fldr = join('/', $fldrs); 
				if (!file_exists ($this->jsonPath . $fldr)) {
					return array('success'=>false, 'msg'=>'Folder '.$fldr.' do not exists in '.$this->jsonPath .'!' );					
				}
			}
			$newView = join('_', explode('/', $data['newViewName']));
			//check does all dirs exists
			if(preg_match ('/^\w+$/', $newView) === false){
				return array('success'=>false, 'msg'=>'Name '.$newView.' can have only letters, numbers and _ !' );				
			}
			if(isset($this->formsData[$newView])){
				return array('success'=>false, 'msg'=>'View with name '.$newView.' already exists!' );				
			}
			$this->formsData[$newView] = array();
			$this->formsData[$newView] = $this->formsData[$data['origView']];
			$this->formsData[$newView]['jsonTableName'] = $newView;
			$filename = $this->jsonPath . $data['newViewName'].'.json';
			$this->formsData[$newView]['filename'] = $filename;
			$str = $this->json2str($this->formsData[$newView]);
			$myfile = fopen($filename, "w");
			fwrite($myfile, $str);
			fclose($myfile);
            return array('success'=>true, 'tName'=> $newView );
		}
		public function deleteView($tName){
			if(!isset($this->formsData[$tName])){
				echo json_encode(array('success'=>false, 'msg'=>'That view doesn\'t exists!' ));
				return;
			}
			$path = $this->formsData[$tName]['filename'];
			unlink($path);
			unset($this->formsData[$tName]);
			echo json_encode(array('success'=>true ));
		}
		public function updateView($data){
			if(!isset($this->formsData[$data['jsonTableName']])){
				echo json_encode(array('success'=>false, 'msg'=>'That view doesn\'t exists!' ));
				return;
			}
			//check view json object
			$cf = $this->checkJson->checkJsonTable($data['jsonTableName'], $this->formsData[$data['jsonTableName']], $this->configTables['newElementsDef'], $this->configTables['allowedTypeForDEFAULT']);
			if($cf['OKERR'] === false){
				$cf['success'] = false;
				$cf['msg'] = ' error: '.$cf['msg'];
				echo json_encode($cf);
				return;
			}
			$filename = $this->formsData[$data['jsonTableName']]['filename'];
			$this->formsData[$data['jsonTableName']] = $data;
			$str = $this->json2str($this->formsData[$data['jsonTableName']]);
			$myfile = fopen($filename, "w");
			fwrite($myfile, $str);
			fclose($myfile);
			echo json_encode(array('success'=>true ));
		}
		public function updateConfig($data, $name){
			$filename = $this->configPath . 'configCreate.json';
			if($name === 'ConfigTables')
				$filename = $this->configPath . 'ConfigTables.json';
			$cf = $this->checkJson['check'+$name]($data);
			if($cf['OKERR'] === false){
				$cf['success'] = false;
				$cf['msg'] = ' error: '.$cf['msg'];
				echo json_encode($cf);
				return;
			}
            $str = $this->json2str($data);
			$myfile = fopen($filename, "w");
			fwrite($myfile, $str);
			fclose($myfile);
			echo json_encode(array('success'=>true ));
		}
		
		

/*************************************************************************************************
**
** GLOBAL
**
*************************************************************************************************/



		public function diffView($newView){
			if(!isset($this->formsData[$newView['tableName']])){
				echo json_encode(array('success'=>false, 'msg'=>'View '.$newView['tableName'].' doesn\'t exists!' ));
				return;
			}
			$this->diff = array();
			$this->diffObj($newView, $this->formsData[$newView['tableName']]);
			echo json_encode($this->diff);
		}
		public function diffObj($obj1, $obj2){
			foreach($obj1 as $property => $p_value)
				if($property !== '_comment')
					if(!isset($obj2[$property])){
						$this->diff[$property] = $obj1[$property].'; undefined';
					}else{
						if( gettype($obj1[$property]) !== 'array'){
							if($obj1[$property] != $obj2[$property])
								$this->diff[$property] = 'NOT EQ PROP: '.$obj1[$property].'; '.$obj2[$property];
						}else{
							$this->diff[$property] = array();
							$this->diffObj($obj1[$property], $obj2[$property]);	
						}
					}
		}
		public function getJsonFile($filename){
			if (file_exists ($filename)){
				$string = file_get_contents($filename);
				$json = json_decode($string, true);
				echo json_encode($json);
			}else
				echo $filename.' is not a file.';
		}
		public function copyFile($source, $dest){
			copy($source, $dest);
			return array( 'success'=>true, 'msg'=>'File copied!');
		}
		

		public function json2str($data){
            $str = json_encode($data, JSON_UNESCAPED_SLASHES); 
            $len = strlen($str);
        	$strOpened = false;
            $buffer = "\t"; $tab_len = 1; $nl = "\n";
            for($i=0; $i<$len; $i++){
                $ch = substr($str, $i, 1); 
                if($ch == '"') $strOpened = !$strOpened;
            	if($strOpened === true){
                	$buffer .= $ch; continue;
            	}
            	if($ch !== '{' && $ch !== '}' && $ch !== '[' && $ch !== ']'){
                    $buffer .= $ch;
                    if($ch == ':') $buffer .= ' ';
                    if($ch == ',') $buffer .= $nl . $this->get_tab($tab_len);
                }
                if($ch == '{' || $ch == '['){
                    $tab_len++;
                    $buffer .= $ch . $nl . $this->get_tab($tab_len);
                }
                if($ch == '}' || $ch == ']'){
                    $buffer .= $nl;
                    $tab_len--;
                    $buffer .= $this->get_tab($tab_len) . $ch;
                }
            }
            return $buffer;
        }

        public function get_tab($l){
            for($i=0,$t=''; $i<$l; $i++) $t.="\t";
            return $t;
		}
		
		
		public function get_json_error(){
			switch (json_last_error()) {
                case JSON_ERROR_NONE:
                    return ' - No errors';
                break;
                case JSON_ERROR_DEPTH:
                    return ' - Maximum stack depth exceeded';
                break;
                case JSON_ERROR_STATE_MISMATCH:
                    return ' - Underflow or the modes mismatch';
                break;
                case JSON_ERROR_CTRL_CHAR:
                    return ' - Unexpected control character found';
                break;
                case JSON_ERROR_SYNTAX:
                    return ' - Syntax error, malformed JSON';
                break;
                case JSON_ERROR_UTF8:
                    return ' - Malformed UTF-8 characters, possibly incorrectly encoded';
                break;
                default:
                    return ' - Unknown error';
                break;
            }
            return " - UNKNOWN ERROR";
		}

}