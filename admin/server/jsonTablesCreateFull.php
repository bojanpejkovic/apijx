<?php
	require_once('jsonTables.php');

	class Json_Table_Class_Create{
		
		public $jsonPathBasic = 'json/';   
		public $jsonPath = 'json/';   
		public $jsonPathDefault = 'json/'; 
		public $configPath ="config/"; 
		public $defaultConfigSuperAdminName = 'sa';  //in configDB file
		
		public $jsonTables = array();
		public $jsonTableClass = array();
		public $default_host_name = 'localhost';  //in mysqlCall file

		public function __construct($create, $jsonTableClass = 'dz') {

			//load db_user, db_pass, db_name
			if($create === true){
				$configFile = $this->configPath . 'configDB.php';
				if (file_exists ($configFile))
					die(json_encode(array("OKERR"=>false,"msg"=>"To create new, 
							first manually delete old configDB file on server.")));
			}

			$this->jsonTableClass = ($jsonTableClass === 'dz')?
				new Json_Table_Class(false, false) : $jsonTableClass;

			if($this->jsonTableClass->configCLfileExists == false){
				//..VIDI kako system error
				die('Check config and language');
			};

		}




/*************************************************************************************************
**
** CREATE
**
*************************************************************************************************/

		public function createJsonServerStructureDB($data){
			//create folders
			$this->jsonPath = $this->jsonPathBasic . $data['db'].'/';
			$this->jsonPathDefault =  $this->jsonPathBasic . $data['db'].'/'.'default/';
			try{
				if(!file_exists($this->jsonPath) && !mkdir($this->jsonPath)){
					echo json_encode(array('OKERR'=>false, 'msg'=>'Error creating jsonPath a dir: '.$this->jsonPath));
					return false;
				}
			}catch(Exception $e){
				echo json_encode(array('OKERR' => false, 'msg' => 'MKDIR error: '.$e) );
				return false;
			}
			try{
				if(!file_exists($this->jsonPathDefault) && !mkdir($this->jsonPathDefault)){
					echo json_encode(array('OKERR'=>false, 'msg'=>'Error creating jsonPathDefault a dir: '.$this->jsonPathDefault));
					return false;
				}
			}catch(Exception $e){
				echo json_encode(array('OKERR' => false, 'msg' => 'MKDIR error: '.$e) );
				return false;
			}
			//create configDB with this default user and pass
			$filename = $this->configPath . 'configDB.php';
			$str_data = "<?php \r\nfunction configDB(){\r\n ";
            $str_data .= "\treturn array(\r\n\t\t\"".$this->defaultConfigSuperAdminName.'"=>array( '.
            		'"db_host"=>"'.$this->default_host_name.'",'.
            		'"db_user"=>"'.$data['user'].'",'.
            		'"db_pass"=>"'.$data['pass'].'",'.
            		'"db_name"=>"'.$data['db'].'" ), '."\r\n\t\t".
					'"admin"=>array( '.
            		'"db_host"=>"'.$this->default_host_name.'",'.
            		'"db_user"=>"'.$data['user'].'",'.
            		'"db_pass"=>"'.$data['pass'].'",'.
					'"db_name"=>"'.$data['db'].'" ), '."\r\n\t\t".
					'"regular"=>array( '.
            		'"db_host"=>"'.$this->default_host_name.'",'.
            		'"db_user"=>"'.$data['user'].'",'.
            		'"db_pass"=>"'.$data['pass'].'",'.
					'"db_name"=>"'.$data['db'].'" )'.
            	" \r\n\t);  \r\n}  \r\n?>";
            $fp=fopen($filename,'w');
            fwrite($fp, $str_data);
            fclose($fp);
			return true;
		}
		
		public function createConfigTables(){
			if(count($this->jsonTableClass->configTables) == 0){
				$this->configTableDefaults();
				$this->configTfileExists = true;

				//kopiraj next [props]
				$copyArr = ["adminTypes", "saSettings", "usersTable", "allowedTypeForDEFAULT", "newElementsDef"];
				for($i=0; $i<count($copyArr); $i++)
					if(array_key_exists($copyArr[$i], $this->jsonTableClass->configCreate))
						$this->jsonTableClass->configTables[$copyArr[$i]] = $this->jsonTableClass->configCreate[$copyArr[$i]];

				//kreiraj za svaki iz adminTypes /*adminSettings*/
				foreach($this->jsonTableClass->configCreate["adminTypes"] as $aName=>$val){
					$name = $aName.'Settings';
					$this->jsonTableClass->configTables[$name] = array(
						"pathToPublic"=>"../",
						"defaultTable"=>"", 
						"smallScreens"=>array(
							"icon"=>"menu.png", 
							"maxWidth"=>"730",
							"build"=>"hideColumns"
						),
						"callbackFns"=>array(
							"afterMainMenu"=>"afterMainMenu"
						),
						"mainMenu"=>array(),
						"allowed"=>array('queries'=>array())
					);
				}
				
				return true;
			}
		}
		public function createAllowedArrays($names){
			//
			$admin_types = array('regular');
			foreach($this->jsonTableClass->configCreate["adminTypes"] as $aName=>$val)
				array_push($admin_types, $aName);
			for($j=0; $j<count($admin_types); $j++){
				$at = $admin_types[$j];
				$this->jsonTableClass->configTables[$at.'Settings'] = array('allowed'=>array('queries'=>array()));
				$createdTablesTotal = count($names['result']);
				for($i=0; $i<$createdTablesTotal; $i++){
					$tn = $names['result'][$i]['TABLE_NAME'];
					if($at !== 'regular')
						$this->jsonTableClass->configTables[$at.'Settings']['allowed'][$tn] = array('GET', 'POST', 'PUT', 'DELETE');
					else
						$this->jsonTableClass->configTables[$at.'Settings']['allowed'][$tn] = array('GET');
					//$this->jsonTableClass->configTables[$at.'Settings']['allowed']['default_'.$tn] = array('GET');
				}
			}
			if(isset($this->jsonTableClass->configTables["usersTable"]) && isset($this->jsonTableClass->configTables["usersTable"]["table_name"])){
				for($j=0; $j<count($admin_types); $j++){
					$at = $admin_types[$j];
					array_push($this->jsonTableClass->configTables[$at.'Settings']['allowed']['queries'], 'userCheck');
				}
			}
		}
		public function addAllowedTableInConfigTables($tn){
			$admin_types = array('regular');
			foreach($this->jsonTableClass->configCreate["adminTypes"] as $aName=>$val)
				array_push($admin_types, $aName);
			for($j=0; $j<count($admin_types); $j++){
				$at = $admin_types[$j];
				if($at !== 'regular')
					$this->jsonTableClass->configTables[$at.'Settings']['allowed'][$tn] = array('GET', 'POST', 'PUT', 'DELETE');
				else
					$this->jsonTableClass->configTables[$at.'Settings']['allowed'][$tn] = array('GET');
			}
			$label = strtoupper(substr($tn, 0, 1)).substr($tn, 1);
			$this->jsonTableClass->configTables['adminSettings']['mainMenu'][$tn] = array(
				"viewName"=> $tn,
		 		"label"=> $label
			);
		}
		public function createJsonServerStructure2($sqlObj){
			$bool = $this->createJsonFile($this->jsonPathDefault . 'sql_fields.json', $this->jsonTableClass->sqlData);
			$bool = $bool && $this->createJsonFile($this->configPath . 'language.json', $this->jsonTableClass->languages);
			if($bool == true){
    			//save configTables file, because mainMenu for Admin has changed.
	            // $myfile = fopen($this->configPath . 'configTables.json', "w");
				// fwrite($myfile, $this->jsonTableClass->json2str($this->jsonTableClass->configTables));
				// fclose($myfile);
				$this->createJsonFile($this->configPath . 'configTables.json', $this->jsonTableClass->configTables);
				return 'created';
            }else
            	return 'FALSE_RESPONSE';
		}

		public function createJsonStructureFromDbTable($response){
			$tName = $response['data']['tableName'];
			$tType = $response['data']['tableType'];
			if($response['OKERR'] == false){
				$this->jsonTables[$tName] = 'FALSE_RESPONSE';
				die(json_encode($response));
			}else{
				$this->createJsonTablesStructure($tName, $tType, $response['result']);
				//$this->createJsonFile($this->jsonPathDefault . $tName.'.json', $this->jsonTableClass->formsData['default_'.$tName]);
				$this->createJsonFile($this->jsonPath . $tName.'.json', $this->jsonTableClass->formsData[$tName]);
				$this->createJsonFile($this->jsonPathDefault . 'sql_fields.json', $this->jsonTableClass->sqlData);
				$this->addAllowedTableInConfigTables($tName);
				$temp = $this->jsonTableClass->configTables['saSettings'];
				unset($this->jsonTableClass->configTables['saSettings']); 
				$this->createJsonFile($this->configPath . 'configTables.json', $this->jsonTableClass->configTables);
				$this->jsonTableClass->configTables['saSettings'] = $temp;
				$ret = array();	$ret[$tName] = 'created';
				die(json_encode($ret));
			}
		}

		public function createJsonFile($filename, $data){
			$str = $this->jsonTableClass->json2str($data);
			try{
				$myfile = fopen($filename, "w");
				fwrite($myfile, $str);
				fclose($myfile);
				return true;
			}catch(Exception $e){
				return false;
			}
        }


    	



/*************************************************************************************************
**
** ONE TABLE CREATE
**
*************************************************************************************************/




		public function createSqlFieldInJsonSqlFile($tableName, $line){
			$sqlColName = $line['COLUMN_NAME'];
			$fieldName = $tableName.'_field_'.$sqlColName;
			if(!array_key_exists($tableName, $this->jsonTableClass->sqlData['sqlTables'])) {
				echo $tableName.' doesn\'t exists. ';
				return;
			}
			if(array_search($fieldName, $this->jsonTableClass->sqlData['sqlTables'][$tableName]['fields']) === false)
				array_push($this->jsonTableClass->sqlData['sqlTables'][$tableName]['fields'], $fieldName);
			//check for primary
			if(array_search($fieldName, $this->jsonTableClass->sqlData['sqlTables'][$tableName]['sqlPrimKeyFieldNames']) === false)
				if(strpos($line['COLUMN_KEY'], 'PRI') !== false)
					array_push($this->jsonTableClass->sqlData['sqlTables'][$tableName]['sqlPrimKeyFieldNames'], $fieldName);
			//save this field
			$this->jsonTableClass->sqlData['sqlFields'][$fieldName] = array(
				'table'=>$tableName,
				'name'=>$sqlColName, 
				'orig_type'=>$line['DATA_TYPE'],
				'type'=>$line['DATA_TYPE'],
				'other'=>$line['EXTRA']
			);
		}

		public function createJsonTablesStructure($tableName, $tableType, $tableData){
			if(!isset($tableData)) return;

			$this->jsonTableClass->sqlData['sqlTables'][$tableName] = array(
				'fields'=>array(), 'sqlPrimKeyFieldNames'=>array()
			);
			$len = count($tableData);
			for($i=0; $i<$len; $i++){
				$line = $tableData[$i];
				$this->createSqlFieldInJsonSqlFile($tableName, $line);
			}

			//create basics
			$formsData = array();
			// $formsData['jsonTableName'] = 'default_'.$tableName;
			// $formsData['filename'] = $this->jsonPathDefault . $tableName.'.json';
			$formsData['jsonTableName'] = $tableName;
			$formsData['filename'] = $this->jsonPath . $tableName.'.json';

			$label = strtoupper(substr($tableName, 0, 1)).substr($tableName, 1);
			$this->jsonTableClass->configTables['adminSettings']['mainMenu'][$tableName] = array(
				"viewName"=> $tableName,
		 		"label"=> $label
			);
			if($this->jsonTableClass->configCreate['languagesForLabels'] === true){
				$this->jsonTableClass->configTables['adminSettings']['mainMenu'][$tableName]["labelLng"] = true;
				$title = 'menuTitle_'.$formsData['jsonTableName'];
				$this->jsonTableClass->configTables['adminSettings']['mainMenu'][$tableName]["label"] = $title;	
				//ovo sad mora da se doda i u languages
				$this->jsonTableClass->languages[$this->jsonTableClass->languages['default']][$title] = $label;
			}

			$formsData['tableName'] = $tableName;
			$formsData['tableType'] = $tableType;
			if($tableType === 'BASE TABLE')
				$formsData['types'] = ["input", "table", "search"];
			else
				$formsData['types'] = ["table", "search"];
			$formsData['inputTitle'] = $this->jsonTableClass->languages[$this->jsonTableClass->languages['default']]['addNew'];
			$formsData['searchTitle'] = $this->jsonTableClass->languages[$this->jsonTableClass->languages['default']]['search'];
			$formsData['tableTitle'] = $tableName;
			$formsData['linesPerRequest'] = $this->jsonTableClass->configCreate['linesPerRequest'];
			$formsData['tableSettings'] = array();
			$formsData['buttonsPerView'] = array();
			$formsData['tableSettings'] = $this->jsonTableClass->configCreate['tableSettings'];
			$formsData['buttonsPerView'] = $this->jsonTableClass->configCreate['buttonsPerView'];
			if($tableType === 'VIEW'){
				$formsData['tableSettings']['allFieldsLabel'] = true;
				$formsData['tableSettings']['tableWithInput'] = false;
				$formsData['tableSettings']['addNewButton'] = false;
				$formsData['tableSettings']['badFieldStar'] = false;
			}
			if($tableType === 'VIEW'){
				$formsData['buttonsPerView']['table'] = array();
			}

			$allFieldNames = array();
			$primKeys = array(); $primKeysOrder = array(); $uniKeysOrder = array();
			
			$formsData['fields'] = array();
			$len = count($tableData);
			for($i=0; $i<$len; $i++){
				$line = $tableData[$i];
				$field = $this->createJsonField($tableName, $line);
				$fieldName = $field['field']['name'];
				$formsData['fields'][$fieldName] = $field['field'];

				//check Primary or unique not null
				if(strpos($line['COLUMN_KEY'], 'PRI') !== false){
					$primKeys[$fieldName] = ($field['types']['sqlType'] == 'datetime')? 'DESC' : 'ASC';
					array_push($primKeysOrder, $fieldName);
				}
				if(strpos($line['COLUMN_KEY'], 'UNI') !== false){
					array_push($uniKeysOrder, $fieldName);
				}

				array_push($allFieldNames, $fieldName);
			}
			$formsData["callbackFns"] = array(
				"afterInsert" => '',
				"afterUpdate" => '',
				"afterDelete" => '',
				"afterHtmlTable" => ''
			);
			$formsData['orderBy'] = array(
				'inputOrder' => $allFieldNames,
				'tableOrder' => $allFieldNames,
				'searchOrder' => $allFieldNames,
				'sortOrder' => $primKeys,
				'primKeyOrder' => $primKeysOrder,
				'searchDefaultVal' => array("no_sql" => "") 
			);
			if(count($primKeysOrder) === 0){
				$formsData['orderBy']['sortOrder'][$allFieldNames[0]] = 'ASC';
				if(count($uniKeysOrder) > 0){
					$formsData['orderBy']['primKeyOrder'] = $uniKeysOrder;
					$this->jsonTableClass->sqlData['sqlTables'][$tableName]['sqlPrimKeyFieldNames'] = $uniKeysOrder;
				}else{
					$formsData['orderBy']['primKeyOrder'] = $allFieldNames;
					$this->jsonTableClass->sqlData['sqlTables'][$tableName]['sqlPrimKeyFieldNames'] = $allFieldNames;
				}
			}

			//$this->jsonTableClass->formsData['default_'.$tableName] = $formsData;
			$this->jsonTableClass->formsData[$tableName] = $formsData;
		}

		public function getJsonTypeFromSqlType($line){
			//STRING TYPE
			$orig_type = $line['DATA_TYPE'];
			$type = $orig_type;
			$sqlType = $orig_type;
			$restrictions = array();
			$attrList = array();
			if($orig_type == 'char' || $orig_type == 'varchar'){
				$type = 'text-short';
				$sqlType = 'text';
				$restrictions['len'] = '<='.$line['CHARACTER_MAXIMUM_LENGTH'];
				$attrList['maxlength'] = $line['CHARACTER_MAXIMUM_LENGTH'];
				if($orig_type == 'varchar' && strpos(strtolower($line['COLUMN_NAME']), 'password') !== false)
					$type = 'password';
			}
			if($orig_type == 'tinytext'){
				$type = 'text-short';
				$sqlType = 'text';
				$restrictions['len'] = '<=84';
				$attrList['maxlength'] = 84;
			}
			if($orig_type == 'text'){
				$type = 'text';
				$sqlType = 'text';
				$restrictions['len'] = '<=21844';
				$attrList['maxlength'] = 21844;
			}
			if($orig_type == 'mediumtext'){
				$type = 'text';
				$sqlType = 'text';
				$restrictions['len'] = '<=5592405';
				$attrList['maxlength'] = 5592405;
			}
			if($orig_type == 'longtext'){
				$type = 'text';
				$sqlType = 'text';
				$restrictions['len'] = '<=4294967295';
				$attrList['maxlength'] = 4294967295;
			}
			//INT TYPE
			if($orig_type == 'int' || $orig_type == 'smallint' || $orig_type == 'tinyint' || 
				$orig_type == 'mediumint' || $orig_type == 'bigint'){
				$type = 'int';
				$sqlType = 'int';
				$min_val = 0; $max_val = 0;
				if($orig_type == 'tinyint'){ $min_val = -128 ;$max_val = 127; }
				if($orig_type == 'smallint'){ $min_val = -32768 ;$max_val = 32767; }
				if($orig_type == 'mediumint'){ $min_val = -8388608 ;$max_val = 8388607; }
				if($orig_type == 'int'){ $min_val = -2147483648 ;$max_val = 2147483647; }
				//if($orig_type == 'bigint'){ $min_val = -9223372036854775808 ;$max_val = 9223372036854775807; }
				if(strpos($line['COLUMN_TYPE'], 'unsigned') >= 0){
					$max_val = $max_val - $min_val; $min_val = 0; 
				}
				$restrictions['val'] = '>='.$min_val.';<='.$max_val;
				$restrictions['type'] = $type;
			}	
			//BOOLEAN
			if($orig_type == 'tinyint' && $this->jsonTableClass->configCreate['createJsonSettings']['tinyintAsBool'] == true){
				$type = 'boolean';
			}

			//FLOAT TYPE
			if($orig_type == 'float' || $orig_type == 'double' || 
				$orig_type == 'real' || $orig_type == 'decimal' ){
				$type = 'float';
				$sqlType = 'float';
				$min_10 = (isset($line['NUMERIC_SCALE']) && !is_null($line['NUMERIC_SCALE']))?
					$line['NUMERIC_SCALE'] : 0;
				if(!is_numeric($min_10)) $min_10 = 0;
				$max_val = pow(10, $line['NUMERIC_PRECISION'] - $min_10);
				$restrictions['val'] = '<='.$max_val;
				$restrictions['type'] = $type;
			}

			//ENUM
			if($orig_type == 'enum'){
				$type = 'select';
				$sqlType = 'text';
			}

			//DATE
			if($orig_type == 'date' || $orig_type == 'datetime' || 
				$orig_type == 'time' || $orig_type == 'timestamp' || $orig_type == 'year'){
				$type = ($orig_type == 'timestamp')? 'datetime' : $orig_type;
				$sqlType = 'datetime';
				$restrictions['type'] = $type;
			}
			return array('sqlType' => $sqlType, 'type'=>$type, 'restrictions'=>$restrictions, 'attrList'=>$attrList );
		}

		public function createJsonDefaultViewStructure($tName, $fData){
			//not in use
			$structure = array(
				'types'=> ["custom", "search"],
				'linesPerRequest' => $fData['linesPerRequest'],
				'orderBy'=> array(
					'sortOrder'=> array(),
					'customOrder'=> array(),
					'searchOrder'=> array()
				),
				'fields'=> array()
			);
			$structure['orderBy']['sortOrder'] = $fData['orderBy']['sortOrder'];
			$structure['orderBy']['customOrder'] = $fData['orderBy']['tableOrder'];
			$structure['orderBy']['searchOrder'] = $fData['orderBy']['searchOrder'];

			foreach($fData['fields'] as $fieldName => $fn_value){
				$structure['fields'][$fieldName] = array(
					'name'=> $fData['fields'][$fieldName]['name'],
					'restrictions'=> array(),
					'attrList'=> array(),
					'sqlFieldName'=> $fData['fields'][$fieldName]['sqlFieldName'],
					'label'=> $fData['fields'][$fieldName]['label'],
					'customView'=> "DEFAULT",
					'customViewType'=> "label",
					'searchView'=> $fData['fields'][$fieldName]['searchView'],
					'searchViewType'=> $fData['fields'][$fieldName]['searchViewType'],
					'type'=> $fData['fields'][$fieldName]['type']
				);
				$structure['fields'][$fieldName]['restrictions'] = $fData['fields'][$fieldName]['restrictions'];
				$structure['fields'][$fieldName]['attrList'] = $fData['fields'][$fieldName]['attrList'];
				if($fData['fields'][$fieldName]['listValues'])
					$structure['fields'][$fieldName]['listValues'] = $fData['fields'][$fieldName]['listValues'];
			}

			return $structure;
		}
		public function createDefaultUserQuery(){
			//	if(isset($this->jsonTableClass->configTables["usersTable"]) && isset($this->jsonTableClass->configTables["usersTable"]["table_name"])){
			//  ????????????????????????????????????????????????????
			if(!isset($this->jsonTableClass->configTables["usersTable"]) || !isset($this->jsonTableClass->configTables["usersTable"]["table_name"])
			|| !isset($this->jsonTableClass->configTables["usersTable"]["col_user"]) || !isset($this->jsonTableClass->configTables["usersTable"]["col_pass"])
			|| $this->jsonTableClass->configTables["usersTable"]["table_name"]=='' || $this->jsonTableClass->configTables["usersTable"]["col_user"]==''
			|| $this->jsonTableClass->configTables["usersTable"]["col_pass"]==''){
				$this->jsonTableClass->sqlData['sqlQueries']['userCheck'] = array(
					"sqlQuery" => "SELECT * FROM table_users WHERE Username=? AND Password=?",
					"paramTypes" => "ss",
					"sqlQueryType" =>'get',
					"linesPerRequest" => 1
				);
			}else{
				$utn = $this->jsonTableClass->configTables["usersTable"]["table_name"];
				$ucu = $this->jsonTableClass->configTables["usersTable"]["col_user"];
				$ucp = $this->jsonTableClass->configTables["usersTable"]["col_pass"];
				$this->jsonTableClass->sqlData['sqlQueries']['userCheck'] = array(
					"sqlQuery" => "SELECT * FROM $utn WHERE $ucu=? AND $ucp=?",
					"paramTypes" => "ss",
					"sqlQueryType" =>'get',
					"linesPerRequest" => 1
				);
			}
			//echo $this->jsonTableClass->sqlData['sqlQueries'];
		}

/*************************************************************************************************
**
** ONE FIELD ADD, UPDATE
**
*************************************************************************************************/
		
		public function createJsonField($tableName, $line){
				$sqlColName = $line['COLUMN_NAME'];
				$fieldName = $tableName.'_field_'.$sqlColName;
				$field = array(
					'name'=> $fieldName, 
					'restrictions'=> array(),
						//len => '<=val;>=val',
						//notEmpty => true, 
						//val => '<=val;>=val'
						//type => whatType
					
					'attrList' => array(),
						//"class" => "joke",
						//"maxlength" => "4"
					'labelLng' => false,
					'label' => $line['COLUMN_NAME'],
					'sqlFieldName' => $fieldName,
					'inputView'=> 'DEFAULT',   
					'inputViewType' => '',  
					'tableView' => 'DEFAULT', 
					'tableViewType' => '', 
					'searchView' => 'DEFAULT', 
					'searchViewType' => ''
				);
				if($this->jsonTableClass->configCreate["languagesForLabels"] == true){
					$field['labelLng'] = true;
					$field['label'] = $fieldName;
					$this->jsonTableClass->languages[$this->jsonTableClass->languages['default']][$fieldName] = $line['COLUMN_NAME'];
				}
				//set basic TYPE, RESTRICTIONS and ATTR.LIST from one of sqltypes
				$retVals = $this->getJsonTypeFromSqlType($line);
				$this->jsonTableClass->sqlData['sqlFields'][$fieldName]['type'] = $retVals['sqlType'];
				$field['type'] = $retVals['type'];
				$field['restrictions'] = $retVals['restrictions'];
				$field['attrList'] = $retVals['attrList'];

				if($this->jsonTableClass->configCreate['tableSettings']['allFieldsRequired'] == true)
					$field['restrictions']['notEmpty'] = true;

				
				//set view and viewType from configCreate
				$elDef = $retVals['type'];
				if(isset($line['EXTRA']) && strpos($line['EXTRA'], 'auto_increment') !== false){
						$elDef = 'auto_increment';
						$field['restrictions'] = array();
					}
				if(isset($line['EXTRA']) && strpos($line['EXTRA'], 'on update') !== false){
						$elDef = 'auto_update';
						$field['restrictions'] = array();
					}
				//is this type defined in configCreate
				if(isset($this->jsonTableClass->configCreate['mysql2json'][$elDef])){
					$clientDef = $this->jsonTableClass->configCreate['mysql2json'][$elDef];
					foreach($clientDef as $prop => $val) 
						if(gettype($val) !== 'array')
							$field[$prop] = $val;
						else{
							$field[$prop] = array();
							foreach($val as $p_val=>$v_val)
								$field[$prop][$p_val] = $v_val;
						}

				}

				//set LIST VALUES FROM SQL DEF or from configCreate
				//ENUM LIST
				if($line['DATA_TYPE'] == 'enum'){
					$str = $line['COLUMN_TYPE'];
					$ct = explode(',', substr($str, 5));
					$field['listValues'] = array();
					for($j=0; $j<count($ct); $j++){
						$ct[$j] = substr($ct[$j], 1);
						$field['listValues'][$ct[$j]] = $ct[$j];
					}
				}else{
					if(isset($clientDef['listValues']) && gettype($clientDef['listValues']) == 'array')
						foreach($clientDef['listValues'] as $prop => $val)
							$field['listValues'][$prop] = $clientDef['listValues'][$prop];
				}
				return array('field'=>$field, 'types'=>$retVals);
		}

		
		public function configTableDefaults(){
			$this->jsonTableClass->configTables = json_decode('{
				"allowedTypeForDEFAULT": [
					"radiogroup", "radio", "label", "input", "password", "textarea", "number", "checkbox", "select"
				],	 "_comment":"this is inputViewType or searchViewType or tableViewType",
				
				"newElementsDef":{
					"browseAndUpload": {
						"jsSrc": [
							"plugins/browse_and_upload_moj/jquery.form.min.js", 
							"plugins/browse_and_upload_moj/upload_plugin.js?v14"
						],
						"cssSrc": ["plugins/browse_and_upload_moj/upload_plugin.css?v4"],
						"async": false
					},
					"jqDatePicker" : {
						"jsSrc": ["plugins/jquery-ui/jquery-ui.min.js"],
						"cssSrc": ["plugins/jquery-ui/jquery-ui.css", "plugins/jquery-ui/jquery-ui.theme.css"],
						"async": false
					},
					"jinxTimePicker" : {
						"jsSrc": ["plugins/time-picker/jinx_time_plugin.js"],
						"cssSrc": [],
						"async": false
					},
					"jinxPassword" : {
						"jsSrc": ["plugins/jinx-password/jinx_password.js"],
						"cssSrc": [],
						"async": false
					},
					"colorPicker" : {
						"jsSrc": ["plugins/color-picker/colpick.js"],
						"cssSrc": ["plugins/color-picker/colpick.css"],
						"async": false
					},
					"wysiwyg":{
						"jsSrc": [
							"plugins/jquery-ui/jquery-ui.min.js",
							"plugins/jinx-wysiwyg/bau/upload_plugin.js",
							"plugins/jinx-wysiwyg/html_editor_plugin.js?v1"
						],
						"cssSrc": [
							"plugins/jquery-ui/jquery-ui.css",
							"plugins/jquery-ui/jquery-ui.theme.css",
							"plugins/jinx-wysiwyg/html_editor_plugin.css?v1"
						],
						"async": false
					},
					"shortLabel":{
						"jsSrc": [],
						"cssSrc": [],
						"async": false
					},
					"inputSearchAll":{
						"jsSrc": [],
						"cssSrc": [],
						"async": false
					},
					"distinctGalFolder": {
						"jsSrc": [],
						"cssSrc": [],
						"async": true
					}
				}
			
			}', true);
		}

}