<?php
	require_once('checkRestrictions.php');
	require_once('user_def_fns.php');
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// 
    class DB {
        public $_conn; //connection to DB
		public $_connOpened = false;
        public $_results; //returned rows(data) from database
        public $_arr;   //returned rows converted in array
        public $_msg;   //error message (if any)
		public $_last_id; //id of last row that was inserted in database
		public $db_data = array('host'=>'', 'name'=>'', 'pass'=>'', 'db_name'=>'', 'port'=>'');
        public $restrictions;
		public $jsonTableClass;
		public $apostropheTypes = array('text', 'text-short', 'varchar', 'date', 'time', 'datetime');
		public $numberTypes = array('int', 'float', 'bigint', 'real', 'decimal');
		public $defaultUserTableData = array(
			"table_name"=>"jinx_users", "col_user"=>"Username", "col_pass"=>"Password", "col_type"=>"JinxAdminType"
		);
        public $userAppId = 0; 

		/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// 
        //create a connection to database.
        public function __construct($jtc) {
			$this->_conn = false;
        	$this->restrictions = new Restriction_Class();
			$this->jsonTableClass = $jtc;  
			$this->db_data['host'] = $this->jsonTableClass->default_host_name;   	
        }
        public function setDBdata($host, $user, $pass, $dbname, $port=''){
        	$this->db_data['host'] = $host;
        	$this->db_data['name'] = $user;
        	$this->db_data['pass'] = $pass;
        	$this->db_data['db_name'] = $dbname;
        	$this->db_data['port'] = $port;           
            
        }
        public function openDB($host, $user, $pass, $dbname, $port=''){
        	$this->_connOpened = false;
        	try{
                if($port != '')
                    $this->_conn = new mysqli($host, $user, $pass, $dbname, $port );
                else
                    $this->_conn = new mysqli($host, $user, $pass, $dbname ); 
                if ($this->_conn->connect_error){ 
	                $this->_conn = false;
	                echo json_encode(array('OKERR' => false, 'msg' => 'Connect_error: Wrong username, password and/or DB name.'.
	                	'<br />Details:' . $this->_conn->connect_error) );
	                return false;
	            }

            }catch(Exception $e){
                $this->_conn = false;
                echo json_encode(array('OKERR' => false, 'msg' => 'Connect_error: Wrong username, password and/or DB name.') ); // . $e
                return false;
            }
            
            $this->_conn->set_charset("utf8mb4");
            $this->_connOpened = true;
            return true;
        }
        public function closeDB($c = true){
            return;
        	if($this->_connOpened === false) return;
        	if($c === false) return;
    		if($c === true){
				$this->_conn->close();
				$this->_conn = false;
				$this->_connOpened = false;
    		}
        }
        public function startDB(){
        	//if($this->_connOpened === true && $this->_conn !== false) 
        	//	return array('OKERR' => true); //$this->_conn->close();
        	if($this->openDB($this->db_data['host'], $this->db_data['name'], $this->db_data['pass'],
        					 $this->db_data['db_name'], $this->db_data['port']) === false){
                return array('OKERR' => false, 'msg' => "Error 1 in database connection. Check your user, pass and db_name!");
            }
            if($this->_conn === false) //if it is still false
            	return array('OKERR' => false, 'msg' => "Error 2 in database connection. Check your user, pass and db_name!");
           	return array('OKERR' => true);
        }


/******************************************************************************************************************
******************************************************************************************************************
******************************************************************************************************************
******************************************************************************************************************/

public function resolveModelQuery($arrPath, $method, $data, $userType){
	$queryName = ($arrPath[1] == 'sqlQuery' || $arrPath[1] == 'sqlParamQuery')? $data['sqlQuery'] : $arrPath[2];	
    // die(json_encode(['usao2'.$userType]));
    if($arrPath[1] == 'model'){
		$jsonName = $arrPath[2];
		if(!array_key_exists($jsonName, $this->jsonTableClass->formsData)){
			return array(
				'data'=>$data, 'OKERR'=>false, 
				'msg'=>$jsonName." Does not exists as json file "
			);
		}
		$data['sqlTableName'] = $this->jsonTableClass->formsData[$jsonName]['tableName'];
		$data['tableName'] = $arrPath[2];
		$data['viewType'] = $arrPath[3];		
		if($method == 'GET' || $method == 'PUT' || $method == 'DELETE'){
			//for only one row
			if($arrPath[3] && substr($arrPath[3],0,1) == ':'){ 
				$arrKeys = array();
				for($i=3; $i<count($arrPath); $i++)
					if(substr($arrPath[$i], 0, 1) == ':')
						array_push($arrKeys, substr($arrPath[$i], 1));
				$data['whereCols'] = $this->createJsonFromPrimKeys(
					$data['sqlTableName'], $arrKeys
				);
				$data['whereCompGroup'] = array();
				$data['viewType'] = ($method == 'GET')? 'table' : 'input';
			}
		}
    }
    if($userType == 'regular' || $userType == 'admin'){
        $cn = $this->checkIsQueryAllowed($userType, $method, $arrPath[1], $queryName, $data);
        if($cn === false){
            return array(
                'data'=>$data, 'OKERR'=>false, 
                'msg'=>"You are not allowed to execute this query ".$userType.' - '.$method.' - '.$arrPath[1].' - '.$queryName
            );
        }
        if($cn[0] === false){
            return array(
                'data'=>$data, 'OKERR'=>false, 
                'msg'=>"Err ".$cn[1].". You are not allowed to execute this query ".$arrPath[1].' - '. $queryName
            );
        }
	}
	if($arrPath[1] == 'sqlQuery' || $arrPath[1] == 'sqlParamQuery'){
        return $this->preparedQuery($arrPath[1], $data);
	}
	if($arrPath[1] == 'model'){
		if($method == 'GET'){
			return $this->sqlSelectAndCreateWhere($data);
		}
		if($method == 'POST'){
			return $this->sqlInsertFromCols($data);
		}
		if($method == 'PUT'){
			return $this->sqlUpdateAndCreateWhere($data);
		}
		if($method == 'DELETE'){
			return $this->sqlDeleteFromCols($data);
		}
	}
	
}


public function getSqlQuery($data){
	$sql = array();
	if($data['queryType'] == 'get_table_type'){
		$sql['query'] = "SELECT TABLE_TYPE FROM information_schema.TABLES WHERE ".
				"TABLE_SCHEMA = '".$this->db_data['db_name']."' AND ".
				"TABLE_NAME = '".$data['tableName']."';";  
		$sql['type'] = 'get';
	}
	if($data['queryType'] == 'get_table_names'){
		$sql['query'] = "SELECT TABLE_NAME, TABLE_TYPE FROM information_schema.TABLES WHERE ".
				"TABLE_SCHEMA = '".$this->db_data['db_name']."'";
		$sql['type'] = 'get';
	}
	if($data['queryType'] == 'get_table_info'){
		$sql['query'] = "SELECT COLUMN_NAME, DATA_TYPE, COLUMN_TYPE, CHARACTER_MAXIMUM_LENGTH, ".
				"COLUMN_KEY, EXTRA, ORDINAL_POSITION, NUMERIC_PRECISION, NUMERIC_SCALE ".
				"FROM information_schema.COLUMNS ".
				"WHERE TABLE_SCHEMA = '".$this->db_data['db_name']."' AND TABLE_NAME = '".$data['tableName']."' ".
				"ORDER BY ORDINAL_POSITION";
		$sql['type'] = 'get';
	}
	if($data['queryType'] == 'get_field_info'){
		$sql['query'] = "SELECT COLUMN_NAME, DATA_TYPE, COLUMN_TYPE, CHARACTER_MAXIMUM_LENGTH, ".
				"COLUMN_KEY, EXTRA, ORDINAL_POSITION, NUMERIC_PRECISION, NUMERIC_SCALE ".
				"FROM information_schema.COLUMNS ".
				"WHERE TABLE_SCHEMA = '".$this->db_data['db_name']."'".
				" AND TABLE_NAME = '".$data['tableName']."' ".
				" AND COLUMN_NAME = '".$data['fieldName']."'";
		$sql['type'] = 'get';
	}
	if($data['queryType'] == 'get_user_login'){
		$sql['query'] = "SELECT * FROM ".$data['tableName']." WHERE ".
				$data['col_user']." LIKE '".$data['user']."' AND ".
				$data['col_pass']." LIKE '".$data['pass']."';";
		$sql['type'] = 'get';
	}
	if($data['queryType'] == 'create_table_users'){
		$sql['query'] = "CREATE TABLE IF NOT EXISTS ".$this->defaultUserTableData['table_name']." (".
			$this->defaultUserTableData['col_user']." varchar(20) COLLATE utf8_unicode_ci NOT NULL, ".
			$this->defaultUserTableData['col_pass']." varchar(20) COLLATE utf8_unicode_ci NOT NULL, ".
			$this->defaultUserTableData['col_type']." varchar(20) COLLATE utf8_unicode_ci NOT NULL, ".
			" PRIMARY KEY (".$this->defaultUserTableData['col_user'].")) DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;";
		$sql['type'] = 'exec';
	}
	if($data['queryType'] == 'insert_default_admin_user'){
		$sql['query'] = "INSERT INTO ".$this->defaultUserTableData['table_name']."(".
			$this->defaultUserTableData['col_user'].", ".
			$this->defaultUserTableData['col_pass'].", ".
			$this->defaultUserTableData['col_type'].") VALUES (".
			"'admin', 'admin', '".$data['db_val']."')";
		$sql['type'] = 'exec';
	}
	if($data['queryType'] == 'add_col_adminType'){
		$tableName = $this->jsonTableClass->configCreate['usersTable']['table_name'];
		$sql['query'] = "ALTER TABLE `".$tableName."` ADD `".$this->defaultUserTableData['col_type']."` VARCHAR(20) NOT NULL;";
		$sql['type'] = 'exec';
	}
	if($data['queryType'] == 'get_user_adminType'){
		$tableName = $this->jsonTableClass->configTables['usersTable']['table_name'];
		$colName = $this->jsonTableClass->configTables['usersTable']['col_user'];
		$colAdminType = $this->jsonTableClass->configTables['usersTable']['col_type'];
		$sql['query'] = "SELECT $colAdminType AS AdminType FROM $tableName WHERE $colName LIKE '".$data['name']."';";
		$sql['type'] = 'get';
	}
	if($data['queryType'] == 'get_user_language'){
		$tableName = $this->jsonTableClass->languages['getLanguage']['language']['table'];
		$colLng = $this->jsonTableClass->languages['getLanguage']['language']['colLng'];
		$colUser = $this->jsonTableClass->languages['getLanguage']['language']['colUser'];
		$sql['query'] = "SELECT $colLng AS Language FROM $tableName WHERE $colUser LIKE '".$data['user']."';";
		$sql['type'] = 'get';
	}
	if($data['queryType'] == 'set,insert,update,delete'){
		$sql['query'] = 'INSERT';
		$sql['type'] = 'exec';
	}
	if($data['queryType'] == 'get'){
		$sql['query'] = 'SELECT';
		$sql['type'] = 'get';
	}

	return $sql;
}

        //$this->_conn->real_escape_string($data["nickname"]);
		
/******************************************************************************************************************
******************************************************************************************************************
******************************************************************************************************************
******************************************************************************************************************/

		public function execTrans($data, $userType){
            $this->_conn->autocommit(FALSE);
			$responses = array();
			for($i=0; $i<count($data['sqlQueries']); $i++){
				$data['sqlQueries'][$i]['close'] = false;
				$data['sqlQueries'][$i]['open'] = false;

				$colType = '';
				if(isset($data['sqlQueries'][$i]['cols']))  $colType = 'cols'; 
				if(isset($data['sqlQueries'][$i]['whereCols']))  $colType = 'whereCols';
				//echo ' colType:'.$colType;
				if($colType !== ''){
				$where_len = count($data['sqlQueries'][$i][$colType]);	
				//echo ' where_len:'.$where_len;
                    foreach($data['sqlQueries'][$i][$colType] as $j => $line){   //for($j=0;$j<$where_len; $j++){
                        if($colType == 'cols'){
                            $val = $line;
                        }
                        if($colType == 'whereCols'){
                            if(!isset($line['colVal'])) continue;
                            $val = $line['colVal'];
                        }
                        if(substr($val, 0, strlen('prevSelect')) === 'prevSelect' || substr($val, 0, strlen('prevInsert')) === 'prevInsert'){
                            preg_match_all('/\[([^]]+)\]/', $val, $arr);
                            //echo ' Usao 0.';

                            if(count($arr) == 2 && count($arr[1]) == 2){
                                //echo ' Usao 1.';
                                try{ $n = intval ( $arr[1][0] ); }catch(Exception $e){
                                    return $this->transErr('sqlQueries['.$i.'] '.$colType.'['.$j.'] colVal:'.$val.' error: first index not a number '.$arr[1][0] );
                                }
                                if($n >= $i){
                                    return $this->transErr('sqlQueries['.$i.'] '.$colType.'['.$j.'] colVal:'.$val.' error: first index not a number '.$arr[1][0]);
                                }
                                $c = $arr[1][1];
                                if(substr($val, 0, strlen('prevInsert')) === 'prevInsert'){
                                    //echo ' Usao 2.';
                                    if(isset($responses[$n]) && isset($responses[$n]['insertedLine']) && isset($responses[$n]['insertedLine'][$c])){
                                        //echo ' Usao 3.';
                                        //finally, everything is OK for previous INSERT
                                        $data['sqlQueries'][$i][$colType][$j] = $responses[$n]['insertedLine'][$c]; 
                                    }else{
                                        return $this->transErr('sqlQueries['.$i.'] '.$colType.'['.$j.'] colVal:'.$val.' error: '.$c.' does not exists in '.$responses[$n]['insertedLine']);
                                    }
                                } 
                                if(substr($val, 0, strlen('prevSelect')) === 'prevSelect'){
                                    if(isset($responses[$n]) && $responses[$n]['OKERR'] == true && isset($responses[$n]['lines'][0][$c])){
                                        //finally, everything is OK for previosu SELECT
                                        $data['sqlQueries'][$i][$colType][$j]['colVal'] = $responses[$n]['lines'][0][$c]; 
                                    }else{
                                        return $this->transErr('sqlQueries['.$i.'] '.$colType.'['.$j.'] colVal:'.$val.' error: '.$c.' does not exists in '.$responses[$n]);
                                    }
                                } 
                            }else{
                                return $this->transErr('sqlQueries['.$i.'] '.$colType.'['.$j.'] colVal:'.$val.' error: length not 2-2, but '.count($arr).' - '.count($arr[1]) );
                            }
                        }
                    }
				}
					
				$arrPath = explode('/', 'apijx/'.$data['sqlQueries'][$i]['path']);
				$method = $_SERVER['REQUEST_METHOD'];
				if(array_key_exists('apijxMethod', $data['sqlQueries'][$i]))
					$method = $data['sqlQueries'][$i]['apijxMethod'];
				$responses[$i] = $this->resolveModelQuery($arrPath, $method, $data['sqlQueries'][$i], $userType); 
				if($responses[$i]['OKERR'] !== true){
					if($this->_conn && $this->_connOpened === true)
                        return $this->transErr($responses[$i]);
				}
	
			}
			try{ 
				$this->_conn->commit();
                $this->_conn->autocommit(TRUE);
                $this->closeDB();
				return array('OKERR'=>true, 'responses'=>$responses);
			} catch (Exception $e) {
				return $this->transErr('COMMIT failed! '.$e);
			}
		}
		public function transErr($msg){
            // echo "<br>RADIM ROLLBACK<br>";
			$this->_conn->rollback();
            $this->_conn->autocommit(TRUE);
            $this->closeDB();
			return array('OKERR'=>false, 'msg'=> $msg);
		}
        //work with tables:
		public function execSql($data, $open = false){
			//mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT); 
			// if($open===true && (!isset($data['open']) || ($data['open'] !== false && $data['open'] !== "false"))){
            //     echo "<br>OTVORIO 1 za ".json_encode($data)."<br>";
            //     $sdb = $this->startDB();  if($sdb['OKERR'] === false) return $sdb;
                
            // }
            if($open===true){
                //echo "<br>OTVORIO 1 za ".json_encode($data)."<br>";
                $sdb = $this->startDB();  if($sdb['OKERR'] === false) return $sdb;                
            }
			return $this->execQ($data);
		}


		public function execQ($data){
			$sql = (array_key_exists('sql', $data))? $data['sql'] : $this->getSqlQuery($data);            
            $this->_results = $this->exec1Query($data);
            if ($this->_results === false or (gettype($this->_results) == 'array' and $this->_results['OKERR'] === false)){
                $err = (isset($this->_results['error']))? $this->_results['error'] : $this->_conn->error;
            	$ret = array(
                	'data'=>$data, 'OKERR'=>false, 
                	'msg'=>"Error 1 in sql query: ".$err.' - '.$sql['query'],
                    'all'=>$data
                );
                // if(!array_key_exists('close', $data) || $data['close'] === true)  
            	// 	$this->closeDB();
                return $ret;
            }
       		//is it select
            if($sql['type'] == 'get'){
            	if($this->_results->num_rows == 0){
            		// if(!isset($data['close']) || $data['close'] === true)  
            		// 	$this->closeDB();
                	return array('data'=>$data, 'OKERR'=>false, 'msg'=>'Empty rows.');
            	}
	            for ( $this->_arr = array(); $tmp = $this->_results->fetch_array();) {
	                $this->_arr[] = $tmp;
	            }
            	// if(!isset($data['close']) || $data['close'] === true)  
            	// 	$this->closeDB();
	            return array('data'=>$data, 'OKERR'=>true, 'result'=>$this->_arr);
            }
            //insert, update, delete
            if($sql['type'] == 'exec' || $sql['type'] == 'post' || $sql['type'] == 'put' ||$sql['type'] == 'delete'){
            	$ret = array('data'=>$data, 'OKERR'=>true, 
                'result'=>(isset($this->_results['changedRows']))? 
                    $this->_results['changedRows'] : $this->_conn->affected_rows);
            	if(isset($this->_conn->insert_id) && $this->_conn->insert_id > 0)
            		$ret['insertId'] = $this->_conn->insert_id;
            	// if(!array_key_exists('close',$data) || $data['close'] === true)  
            	// 	$this->closeDB();
            	return $ret;
            }
		}

		public function exec1Query($data){
            $sql = (array_key_exists('sql', $data))? $data['sql'] : $this->getSqlQuery($data);

            if(isset($sql['paramQuery']) && $sql['paramQuery'] == true){
				$params = array(&$data['whereTypes']);
				for($i=0; $i<count($data['whereCols']); $i++){					
                    $params[] = &$data['whereCols'][$i];
                }
				$prepared = $this->_conn->prepare($sql['query']); 
				if($prepared==false)	
					return array('OKERR'=>false, 'msg'=>'Error 1 in prepared', 'query'=>$sql['query']);
				$rc = call_user_func_array(array($prepared, 'bind_param'), $params);
                if ( false===$rc ) {
                    return ['OKERR'=>false, 'error'=>$prepared->error];
                }
                if($sql['type'] !== 'get'){
				    if(!$prepared->execute()){                        
                        return ['OKERR'=>false, 'error'=>$prepared->error];
                    }else{ 
                        return ['OKERR'=>true, 'changedRows'=>$prepared->affected_rows];
                    }
                }
                $prepared->execute();
				return $prepared->get_result();                
			}else
		    	return $this->_conn->query($sql['query']);
		}



/******************************************************************************************************************
******************************************************************************************************************
******************************************************************************************************************
******************************************************************************************************************/
		public function getQuery_SELECTFROM($qn){
				if(!array_key_exists($qn, $this->jsonTableClass->sqlData["sqlQueries"])){
		    		$ret = array('OKERR'=>false,"msg"=>"SqlQuery ".$qn." is not registered!");
		    		echo json_encode($ret);   		
		    		exit;
		    	}
		    	$sqlQ = $this->jsonTableClass->sqlData["sqlQueries"][$qn];
		    	if(!array_key_exists("SELECT", $sqlQ) || !array_key_exists("FROM", $sqlQ)){
		    		$ret = array('OKERR'=>false,"msg"=>"SqlQuery ".$qn." must have SELECT and FROM defined!");
		    		echo json_encode($ret);  		
		    		exit;
		    	}
		    	return $sqlQ;
		}
		
		public function sqlSelectAndCreateWhere($obj){
			//echo 'whereCols<br />';
			//echo json_encode($obj['whereCols']);
			//create where
			//ime sql tabele je $data['sqlTableName']
			//ime tabele u fieldsData je $data['tableName']

			$jsonName = $obj['tableName'];
			if($this->jsonTableClass->formsData[$jsonName]['tableType'] === 'QUERY'){
				$qn = $this->jsonTableClass->formsData[$jsonName]['queryName'];
				$sqlQ = $this->getQuery_SELECTFROM($qn);
				$obj['SELECT'] = $sqlQ['SELECT'];
				$obj['FROM'] = $sqlQ['FROM'];
				if(isset($sqlQ['GROUP_BY']))
					$obj['GROUP_BY'] = $sqlQ['GROUP_BY'];
			}
				
			$obj = $this->setSqlDefaults($obj);
			$obj['whereSqlCols'] = array();
			$tn = (array_key_exists('join', $obj))? '' : $jsonName;
			if(array_key_exists('whereCols', $obj)){
				for($i=0; $i<count($obj['whereCols']); $i++){
					$obj['whereSqlCols'][$i] = array();
					foreach($obj['whereCols'][$i] as $prop=>$val) 
						$obj['whereSqlCols'][$i][$prop] = $val;
					$sqlName = $this->getSqlFieldNameFromCol($tn, $obj['whereCols'][$i]['colName']);
					if($sqlName !== false)
						$obj['whereSqlCols'][$i]['colName'] = $sqlName;
				}
			}
			$obj['sqlWhereCond'] = $this->sqlWhereFromCols(
				$obj['whereSqlCols'], $obj['whereCompGroup']
			);
			if(!array_key_exists('SELECT', $obj))
				$obj['strCols'] = $this->sqlNamesFromCols($tn, $obj['selCols']);
			else
				$obj['strCols'] = $obj['SELECT'];
			if(array_key_exists('join', $obj)){
				$obj['FROM'] = $this->createJoin($jsonName, $obj['join']);
                if(isset($obj['FROM']['OKERR']) && $obj['FROM']['OKERR'] == false) return $obj['FROM'];
            }
			if(!array_key_exists('FROM', $obj))
				$obj['sqlTableName'] = '`'.$obj['sqlTableName'].'`';
			else
				$obj['sqlTableName'] = $obj['FROM'];
			return $this->sqlSelectFromCols($obj);
		}

		/*zahtev:
			['fotografije', 'galerije'] =>
				(`fotografije` LEFT JOIN galerije ON fotografije.galerija_id=galerije.id)

			fotografije je osnova iz model/fotografije/table

			[ 'galerije', ['galerije', 'nesto_trece' ], 'nesto_drugo' ] =>
				(`fotografije` LEFT JOIN galerije ON fotografije.galerija_id=galerije.id)
					LEFT JOIN nesto_drugo ON fotografije.nesto_drugo_id=nesto_drugo.id
		*/
		//reseno za 2 stringa
		public function createJoin($baseTbl, $tbls){
			$str = "";
			for($i=0;$i<count($tbls);$i++) $str .= "(";
			//prvi podatak svedi na string
			if(gettype($tbls[0]) == 'string'){
				$str .= $baseTbl;
			}else{
				if(gettype($tbls[0]) == 'array'){
					$ind = (count($tbls[0]) == 3)? $tbls[0][2] : 0;
					$str .= $tbls[0][$ind];
					$tbls[0] = $tbls[0][1-$ind];
				}
			}
			for($i=0; $i<count($tbls);$i++){
				$str .= " LEFT JOIN ";
				//svaki podatak svedi na [tbl1, tbl2]
				if(gettype($tbls[$i]) == 'string'){
					$str .= $tbls[$i];
					$tbls[$i] = [$baseTbl, $tbls[$i]];
				}else{
					if(gettype($tbls[$i]) == 'array'){
						$ind = (count($tbls[$i]) == 3)? $tbls[$i][2] : 0;
						$str .= $tbls[$i][$ind];
					}
				}
				$str .= " ON ";
				$jt = $this->findFieldsToJoin($tbls[$i]);
				if(count($jt) == 0) return ['OKERR'=>false, 'msg'=>'Greska 5']; //greska
				$sqlNames = [
					$this->getSqlNameFromCol($tbls[$i][0], $jt['foreign_key']),
					$this->getSqlNameFromCol($jt['to_table'], $jt['to_key'])
				];
				if($sqlNames[0] === false || $sqlNames[1] === false) 						
                    return ['OKERR'=>false, 'msg'=>'Greska 6'];
				//greska
				$str .= '`'.$tbls[$i][0].'`.`'.$sqlNames[0].'`';
				$str .= ' = `'.$tbls[$i][1].'`.`'.$sqlNames[1].'` ';
				$str .= ")";
			}
			return $str;
		}

		public function findFieldsToJoin($tbls){
			if(array_key_exists($tbls[0], $this->jsonTableClass->sqlData["joinTables"])){
				$arr = $this->jsonTableClass->sqlData["joinTables"][$tbls[0]];
				for($j = 0; $j<count($arr); $j++)
					if($arr[$j]['to_table'] === $tbls[1])
						return $arr[$j];
				return [];
			}
			return [];
		}
		

		//php sql_insert
		public function sqlInsertFromCols($obj){  
			//obj have: tableName and cols.
			//cols are pairs {colName:colVal, ...}
            $fns = (isset($obj["userDefFn"]))? $obj["userDefFn"] : [];
			$restrObj = $this->checkRestrictions(
				$obj['tableName'], $obj['cols'], $fns
			);
			if($restrObj['OKERR'] == false){
				return array(
					'OKERR' => false,
					'falseCols'=> $restrObj['falseCols'],
					'updateInsFail' => true,
					'errCode'=>1
				);
			}
			$sqlNames = ''; $sqlVals = '';			
			$comma = ''; 
			foreach($obj['cols'] as $fieldName => $fn_value) {
				$sqlFieldName = $this->getSqlFieldNameFromCol($obj['tableName'], $fieldName);
				if($sqlFieldName === false) continue;
				$sqlName = $this->jsonTableClass->sqlData['sqlFields'][$sqlFieldName]['name'];
				$type = $this->jsonTableClass->sqlData['sqlFields'][$sqlFieldName]['type'];
				$colVal = $fn_value;
                if(isset($fns[$fieldName])){
                    $colVal = $this->call_user_fn($fns[$fieldName], $colVal); 
                }else
                    if(array_search ($type, $this->apostropheTypes) !== false || 
                        (array_search ($type, $this->numberTypes) !== false && $colVal == '')) 
                                $colVal = "'".$this->mysqlRealEscapeString($colVal,3 )."'";
				$sqlNames .= $comma . '`'. $sqlName.'`';
				$sqlVals .= $comma . $colVal;
				$comma = ', '; 
			}
			$sql = "INSERT INTO ".'`'.$obj['sqlTableName'].'`'."(".$sqlNames.") VALUES (".$sqlVals.")";
			$sd = array('sql'=>array('query'=>$sql, 'type'=>'exec'), 'close'=>false);
			if(isset($obj['open'])) $sd['open'] = $obj['open'];
			$resp = $this->execSql($sd); 
            return $this->execInsert($resp, $obj, $sql);
        }

        public function execInsert($resp, $obj, $sql){
			if($resp['OKERR'] == false){
				$resp['updateInsFail'] = true;
				$resp['errCode']=2;
            	// if(!array_key_exists('close',$obj) || $obj['close'] === true){
                //     // echo "<br>ZATVORIO<br>";
				// 	$this->closeDB();
                // }
				return $resp;
			}
			//line is inserted, get that line and return it
			$pk = '';
			if(array_key_exists('insertId', $resp)) {
				$pk = $this->createJsonFromPrimKeys($obj['sqlTableName'], 
							array($resp['insertId']));
			}else{
				$ilVals = array();  //for lastLine after succ insert
				$pkArr = $this->jsonTableClass->formsData[$obj['tableName']]['orderBy']['primKeyOrder'];
				$len = count($pkArr);
				for($i=0; $i<$len; $i++)
					array_push($ilVals, $obj['cols'][$pkArr[$i]]);
				$pk = $this->createJsonFromPrimKeys($obj['sqlTableName'], $ilVals);
			}

			//opcja 1
			$jsonName = $obj['tableName'];
			if($this->jsonTableClass->formsData[$jsonName]['tableType'] === 'QUERY'){
				$qn = $this->jsonTableClass->formsData[$jsonName]['queryName'];
				$sqlQ = $this->getQuery_SELECTFROM($qn);
				$sqlSel = 'SELECT '.$sqlQ['SELECT'];
				$sqlSel .= ' FROM '.$sqlQ['FROM'];
			}else{
				$sqlSel = "SELECT * FROM ".'`'.$obj['sqlTableName'].'`';
			}
			$sqlSel .= " WHERE " . $this->sqlWhereFromCols($pk, array());
			
			$sd = array('sql'=>array('query'=>$sqlSel, 'type'=> 'get'), 'open'=>false);
			if(isset($obj['close'])) $sd['close'] = $obj['close'];
			$respSel = $this->execSql($sd); 
			if($respSel['OKERR'] === false)
				return $respSel;
			return array(
				'OKERR'=>true,
				'insertedLine'=>$respSel['result'][0],
				'sql_query'=>$sql,
				'sql_query_for_line'=>$sqlSel
			);
		}

		//php sql_update
		public function sqlUpdateAndCreateWhere($obj){
            $fns = (isset($obj['userDefFn']))? $obj['userDefFn'] : [];
			$restrObj = $this->checkRestrictions(
				$obj['tableName'], $obj['cols'], $fns
			);
			if($restrObj['OKERR'] == false){
				return array(
					'OKERR'=>false,
					'falseCols'=>$restrObj['falseCols'],
					'updateInsFail'=>true,
					'errCode'=>3
				);
			}
			$sql = "UPDATE ".'`'.$obj['sqlTableName'].'`'." SET ";
			$sql .= $this->sqlCreateSetForUpdateFromCols($obj['tableName'], $obj['cols'], $fns);
			$whereCompGroup = (isset($obj['whereCompGroup']))? $obj['whereCompGroup'] : [];
			$sql .= " WHERE ".$this->sqlWhereFromCols($obj['whereCols'], $whereCompGroup);

			$sd = array('sql'=>array('query'=>$sql, 'type'=> 'exec'));
			if(isset($obj['open'])) $sd['open'] = $obj['open'];
			if(isset($obj['close'])) $sd['close'] = $obj['close'];
			$resp = $this->execSql($sd); 
			if($resp['OKERR'] == false){
				$resp['updateInsFail'] = true;
				$resp['errCode'] = 4;
				return $resp;
			}
			if(isset($obj['returnAffected']) && $obj['returnAffected'] === true){
				$len = count($obj['whereCols']);
				for($i=0;$i<$len;$i++){
					$fieldName = $obj['whereCols'][$i]['colName'];
					if(isset($obj['cols'][$fieldName]))
						$obj['whereCols'][$i]['colVal'] = $obj['cols'][$fieldName];
				}
				return $this->sqlSelectAndCreateWhere($obj);
			}else{
				return array(
					"OKERR"=>true,
					"sql_query"=>$sql,
					"changedRows"=>$resp['result'] //['changedRows'],
					//"affectedRows"=>$resp['result']['affectedRows']
				);
			}
		}

		//php sql_delete
		public function sqlDeleteFromCols($obj){
			if(!isset($obj['whereCompGroup'])) $obj['whereCompGroup'] = array();
			$sql = "DELETE FROM ".'`'.$obj['sqlTableName'].'`'." WHERE ".
					$this->sqlWhereFromCols($obj['whereCols'], $obj['whereCompGroup']);
			$sd = array('sql'=>array('query'=>$sql, 'type'=> 'exec'));
			if(isset($obj['open'])) $sd['open'] = $obj['open'];
			if(isset($obj['close'])) $sd['close'] = $obj['close'];
			$resp = $this->execSql($sd); 
			if($resp['OKERR'] == false)
				return $resp;
			else
				return array(
					"OKERR"=>true,
					"sql_query"=>$sql,
					"affectedRows"=>$resp['result']
				);
		}


/******************************************************************************************************************
******************************************************************************************************************
******************************************************************************************************************
******************************************************************************************************************/
		
    	public function setSqlDefaults($obj){
			if(!isset($obj['selCols']) || count($obj['selCols']) === 0)
				$obj['selCols'] = $this->jsonTableClass->formsData[$obj['tableName']]['orderBy'][$obj['viewType'].'Order'];
			if(!isset($obj['linesPerRequest']))
				$obj['linesPerRequest'] = $this->jsonTableClass->formsData[$obj['tableName']]['linesPerRequest'];
			if(!isset($obj['pageNumber']))
				$obj['pageNumber'] = 0;
			if(!isset($obj['orderBy']))
				$obj['orderBy'] = $this->jsonTableClass->formsData[$obj['tableName']]['orderBy']['sortOrder'];
			if(!isset($obj['whereCols']))
				$obj['whereCols'] = array();
			if(!isset($obj['whereCompGroup']))
				$obj['whereCompGroup'] = array();
			return $obj;
		}
		
		public function sqlNamesFromCols($tableName, $cols){
			if(isset($cols) && count($cols) > 0){
				$len = count($cols); 
				$strCols = '';
				$comma = '';
				for($i=0;$i<$len;$i++){
					$sqlFieldName = $this->getSqlFieldNameFromCol($tableName, $cols[$i]);
					if($sqlFieldName === false) continue;
					$sqlTabName = $this->jsonTableClass->sqlData['sqlFields'][$sqlFieldName]['table'];
					$sqlName = '`'.$sqlTabName.'`.`'.$this->jsonTableClass->sqlData['sqlFields'][$sqlFieldName]['name'].'`';
					$strCols .= $comma . $sqlName;
					if($tableName == '')
						$strCols .= ' AS '.$cols[$i];
					$comma = ', ';
				}
				return $strCols;
			}else
				return '*';
		}
		//php sql_select
		public function sqlSelectFromCols($obj){
			//obj must have: sqlTableName, strCols, sqlWhereCond, orderBy, linesPerRequest, pageNumber  
			
			$sqlPart2 = ($obj['sqlWhereCond'] !== '')? " WHERE ".$obj['sqlWhereCond'] : '';

			if(isset($obj['orderBy']) && gettype($obj['orderBy']) == 'array'){
				$orderBy = " ORDER BY "; 
				$comma = '';
				$tn = (array_key_exists('join', $obj))? '' : $obj['tableName'];
				foreach($obj['orderBy'] as $fieldName => $f_value) {
					$sqlFieldName = $this->getSqlFieldNameFromCol($tn, $fieldName);
					if($sqlFieldName === false) continue;
					$sqlTabName = $this->jsonTableClass->sqlData['sqlFields'][$sqlFieldName]['table'];
					$sqlName = $sqlTabName.'.'.$this->jsonTableClass->sqlData['sqlFields'][$sqlFieldName]['name'];
					$orderBy .= $comma.$sqlName.' '.$f_value;
					$comma = ', ';
				}
			}
			if(isset($obj['GROUP_BY'])) $sqlPart2 .= " GROUP BY ".$obj['GROUP_BY'];
			if($orderBy !== " ORDER BY ")  $sqlPart2 .= $orderBy; 
			$sql = "SELECT ".$obj['strCols'].' FROM '.$obj['sqlTableName'] . $sqlPart2;

			$lines = array();
			if($obj['linesPerRequest'] > 0 && $obj['pageNumber'] > 0){
				$sql_no = "SELECT count(*) AS total_lines FROM ".$obj['sqlTableName']." ".$sqlPart2;
				$sd = array('sql'=>array('query'=>$sql_no, 'type'=>'get'), 'close'=>false);
				if(isset($obj['open'])) $sd['open'] = $obj['open'];
				$resp = $this->execSql($sd); 
				if($resp['OKERR'] === false){
            		// if(!array_key_exists('close',$obj) || $obj['close'] === true)  
					// 	$this->closeDB();
					return $resp;
				}
				$totalLineNumber = $resp['result'][0]['total_lines']; 
				if($totalLineNumber > 0){
					if($obj['linesPerRequest'] * ($obj['pageNumber']-1) + 1 > $totalLineNumber)
						$obj['pageNumber'] = ceil($totalLineNumber / $obj['linesPerRequest']);
					$start = $obj['linesPerRequest'] * ($obj['pageNumber']-1);
					$sql .= " LIMIT ".$start.", ".$obj['linesPerRequest'];
					$sd = array('sql'=>array('query'=>$sql, 'type'=> 'get'), 'close'=>false ); 
					if(isset($obj['open'])) $sd['open'] = $obj['open'];
					$resp = $this->execSql($sd);
					$ret = ($resp['OKERR'] == true)?
					array(
						"OKERR" =>true,
						"linesPerRequest"=>$obj['linesPerRequest'],
						"pageNumber"=>$obj['pageNumber'],
						"total_lines"=>$totalLineNumber,
						"lines"=>$resp['result'],
						"orderBy"=>$obj['orderBy'],
						"searchBy"=>$obj['whereCols'],
						"searchByGroups"=>$obj['whereCompGroup'],
						"sql_query"=>$sql 
					) : $resp;
				}else{
					$ret = array( 
						"OKERR"=>false, 
						'msg'=>'Empty rows.', 
						"orderBy"=>$obj['orderBy'],
						"searchBy"=>$obj['whereCols'],
						"searchByGroups"=>$obj['whereCompGroup'],
						'sql_query'=>$sql
					);
				}	
            	// if(!array_key_exists('close',$obj) || $obj['close'] === true)  
				// 	$this->closeDB();
				return $ret;		
			}else{
				$sd = array('sql'=>array('query'=>$sql, 'type'=> 'get' ));
				if(isset($obj['open'])) $sd['open'] = $obj['open'];
				if(isset($obj['close'])) $sd['close'] = $obj['close'];
				$resp = $this->execSql($sd);
				$ret = ($resp['OKERR'] == true)?
					array(
						"OKERR" => true,
						"linesPerRequest"=> $obj['linesPerRequest'],
						"pageNumber"=> $obj['pageNumber'],
						"total_lines"=> count($resp['result']),
						"lines"=> $resp['result'],
						"orderBy"=> $obj['orderBy'],
						"searchBy"=> $obj['whereCols'],
						"searchByGroups"=> $obj['whereCompGroup'],
						"sql_query"=> $sql 
					) : $resp;
				// if(!array_key_exists('close',$obj) || $obj['close'] === true)  
				// 	$this->closeDB();
				return $ret;		
			}
		}

		public function preparedQuery($path1, $obj){
			if(!array_key_exists($obj['sqlQuery'], $this->jsonTableClass->sqlData["sqlQueries"])){
				$ret = array('OKERR'=>false,"msg"=>"SqlQuery ".$obj['sqlQuery']." is not registered!");
				return $ret;
			}
			$sqlQ = $this->jsonTableClass->sqlData["sqlQueries"][$obj['sqlQuery']];
			$linesPerRequest = (isset($sqlQ['linesPerRequest']))? $sqlQ['linesPerRequest'] : 0;
			$pageNumber = (isset($obj['pageNumber']))? $obj['pageNumber'] : 0;
			$orderBy = (isset($obj['orderBy']))? $obj['orderBy'] : 
						((isset($sqlQ['orderBy']))? $sqlQ['orderBy']: '');
            
			$sql = (isset($obj['replaceAsString']))? $this->replaceInQuery($sqlQ["sqlQuery"], $obj['replaceAsString']) : $sqlQ["sqlQuery"];
			$wc = (isset($obj['whereCols']))? $obj['whereCols'] : array();                  
			$wg = (isset($obj['whereCompGroup']))? $obj['whereCompGroup'] : array();
			$type = (array_key_exists('sqlQueryType', $sqlQ))? $sqlQ['sqlQueryType'] : 'get';
			$resp = array(); $total_lines = 0;
			$data = array();
			if($path1 == 'sqlQuery'){
				$w = $this->sqlWhereInQuery($wc, $wg);
				if($w !== ''){
					$bef = (!isset($sqlQ["WHERE"]))? '' : $sqlQ["WHERE"]." ".$wc[0]['logicOper'];
					$sql .= " WHERE ".$bef." ".$w;	
				} 
				if(isset($sqlQ['GROUP_BY'])) $sql .= " GROUP BY ".$sqlQ['GROUP_BY'];				
				$data = array('sql'=>array('query'=>$sql, 'type'=> $type ) );
			}
			if($path1 == 'sqlParamQuery'){
                if(isset($sqlQ['userDefFn'])){
                    for($i=0; $i<count($sqlQ['userDefFn']); $i++) {
                        $param_ind = $sqlQ['userDefFn'][$i][0];
                        $fn = $sqlQ['userDefFn'][$i][1];
                        if(isset($wc[$param_ind])){                            
                            $wc[$param_ind] = $this->call_user_fn($fn, $wc[$param_ind]);
                        }else{                            
                            return array('OKERR'=>false, 'msg'=>'Index '.$param_ind.' does not exists in params.');
                        }
                    }
                }      
				$sql_t = $sqlQ["paramTypes"];
				if(count($wc) !== strlen($sql_t)) 
					return array('OKERR'=>false, 'msg'=>'Must send exactly '.strlen($sql_t).' param(s) for this query.');
				$data = array(
                    'sql'=>array('query'=>$sql, 'type'=>$type, 'paramQuery'=>true), 
                    'whereTypes'=>$sql_t, 'whereCols'=> $wc
                );           
                if($type == 'post' || $type == 'put' || $type == 'delete'){
                    return $this->execSql($data);  
                }
			}
			if(isset($obj['open'])) $data['open'] = $obj['open'];
			if(isset($obj['close'])) $data['close'] = $obj['close'];
			if($linesPerRequest > 0 && $pageNumber > 0){
				//izvrsi odmah za total
				$resp_total = $this->execSql( $data );	
				$total_lines = count($resp_total['result']);
				//ako je 0
				if($total_lines == 0)
					return array("sql_query"=> $sql, 'whereCols'=>$wc, 'OKERR'=>false, 'msg'=>'Empty rows.',"total_lines"=> 0);
				//dodaj orderby
				if($orderBy !== '') $sql .= ' ORDER BY '.$orderBy;
				//dodaj limit
				$start = $linesPerRequest * ($pageNumber-1);
				$sql .= " LIMIT ".$start.", ".$linesPerRequest;
				//izvrsi opet
				$data['sql']['query'] = $sql;
				$resp = $this->execSql($data); 
				if($resp['OKERR'] == true)
					$total_lines = count($resp['result']); 
				else
					return $resp;
			}else{
				//dodaj orderby
				if($orderBy !== '') $sql .= ' ORDER BY '.$orderBy;
				//izvrsi
				$data['sql']['query'] = $sql;
				$resp = $this->execSql($data); 
				if($resp['OKERR'] == true){
					if($type == 'get')
						$total_lines = count($resp['result']); 
				}else{
					return $resp;
				}
			}	
			// if(!array_key_exists('close',$obj) || $obj['close'] === true)  
			// 	$this->closeDB();	
			return ($resp['OKERR'] == true)?
				array(
					"OKERR" => true,
					"linesPerRequest"=> $linesPerRequest,
					"pageNumber"=> $pageNumber,
					"total_lines"=> $total_lines,
					"lines"=> $resp['result'],
					"orderBy"=> $orderBy,
					"searchBy"=> $wc,
					"searchByGroups"=> $wg,
					"sql_query"=> $sql 
				) : $resp;
		}
		public function replaceInQuery($sql, $replace){
			for($i=0; $i<count($replace); $i++){
				$sql = str_replace($replace[$i][0], $replace[$i][1], $sql);
			}
			return $sql;
		}
		public function createOpenCloseBrackets($whereCompGroup){
			$openBracket = array();
			$closeBracket = array();
			if(isset($whereCompGroup) && count($whereCompGroup) > 0){
				$lenb = count($whereCompGroup);
				for($i=0;$i<$lenb; $i++){
					$bothBrack = explode('-', $whereCompGroup[$i]);
					if(count($bothBrack) == 2){
						$bothBrack[0]--; $bothBrack[1]--;
						if(!isset($openBracket[$bothBrack[0]]))
							$openBracket[$bothBrack[0]] = '';
                        if(!isset($closeBracket[$bothBrack[1]]))
							$closeBracket[$bothBrack[1]] = '';
						$openBracket[$bothBrack[0]] .= '(';
						$closeBracket[$bothBrack[1]] .= ')';
					}
				}
			}
			return array('openBracket'=>$openBracket, 'closeBracket'=>$closeBracket);
		}
		
		//php sql_create_where
		public function sqlWhereFromCols($whereCols, $whereCompGroup){
			$oc = $this->createOpenCloseBrackets($whereCompGroup);
			$openBracket = $oc['openBracket'];
			$closeBracket = $oc['closeBracket'];
			$sqlWhereCond = '';
			if(isset($whereCols) && count($whereCols) > 0){
				$lenc = count($whereCols);
				for($i=0; $i<$lenc; $i++){

					$sqlFieldName = $whereCols[$i]['colName'];
					if(!array_key_exists($sqlFieldName, $this->jsonTableClass->sqlData['sqlFields'])) continue; 	
					if($sqlFieldName == 'no_sql') continue; 	
					
					$sqlTabName = $this->jsonTableClass->sqlData['sqlFields'][$sqlFieldName]['table'];
					$sqlName = '`'.$sqlTabName.'`.`'.$this->jsonTableClass->sqlData['sqlFields'][$sqlFieldName]['name'].'`';
					$type = $this->jsonTableClass->sqlData['sqlFields'][$sqlFieldName]['type'];
					$colVal = $whereCols[$i]['colVal'];
                    if(isset($whereCols[$i]['userDefFn'])){ 
                        $fn = $whereCols[$i]['userDefFn'];
                        if(gettype($whereCols[$i]['userDefFn']) == 'array') 
                            $fn = $whereCols[$i]['userDefFn'][1];
                        $colVal = $this->call_user_fn($fn, $colVal);
                    }else
                        if($colVal !== 'is null')
                            if(array_search ($type, $this->apostropheTypes) !== false && trim($whereCols[$i]['oper']) !== 'IN')
                                $colVal = "'".$this->mysqlRealEscapeString($colVal, 2)."'";
                    
					if($i > 0)
						$sqlWhereCond .= ' '.$whereCols[$i]['logicOper'].' ';
					if(array_key_exists($i, $openBracket))
						$sqlWhereCond .= $openBracket[$i];
					$sqlWhereCond .= $sqlName . ' '.$whereCols[$i]['oper'] . ' '.$colVal;
					if(array_key_exists($i, $closeBracket))
						$sqlWhereCond .= $closeBracket[$i];		
				}
			}
			return $sqlWhereCond;
		}
		
		//'where' part for sql_field.json => sqlQueries
		public function sqlWhereInQuery($whereCols, $whereCompGroup){
			$oc = $this->createOpenCloseBrackets($whereCompGroup);
			$openBracket = $oc['openBracket'];
			$closeBracket = $oc['closeBracket'];
			$sqlWhereCond = '';
			if(isset($whereCols) && count($whereCols) > 0){
				$lenc = count($whereCols);
				for($i=0; $i<$lenc; $i++){
					$sqlName = $whereCols[$i]['colName'];
                    if(isset($whereCols[$i]['userDefFn'])){ 
                        $fn = $whereCols[$i]['userDefFn'];
                        if(gettype($whereCols[$i]['userDefFn']) == 'array') 
                            $fn = $whereCols[$i]['userDefFn'][1];
                        $colVal = $this->call_user_fn($fn, $whereCols[$i]['colVal']);
                    }else
                        if(trim($whereCols[$i]['oper']) !== 'IN')
                            $colVal = "'".$this->mysqlRealEscapeString($whereCols[$i]['colVal'], 2)."'";
                        else
                            $colVal = $whereCols[$i]['colVal'];
					if($i > 0)
						$sqlWhereCond .= ' '.$whereCols[$i]['logicOper'].' ';
					if(array_key_exists($i, $openBracket))
						$sqlWhereCond .= $openBracket[$i];
					$sqlWhereCond .= $sqlName . ' '.$whereCols[$i]['oper'] . ' '.$colVal;
					if(array_key_exists($i, $closeBracket))
						$sqlWhereCond .= $closeBracket[$i];		
				}
			}
			return $sqlWhereCond;
		}
		//php sql_create_set
		public function sqlCreateSetForUpdateFromCols($tableName, $cols, $fns){ 
			$sql = '';
			$comma = ''; 
			foreach($cols as $fieldName => $fn_value){
				$sqlFieldName = $this->getSqlFieldNameFromCol($tableName, $fieldName);
				if($sqlFieldName === false) continue;

				$sqlName = '`'.$this->jsonTableClass->sqlData['sqlFields'][$sqlFieldName]['name'].'`';
				$type = $this->jsonTableClass->sqlData['sqlFields'][$sqlFieldName]['type'];
				$colVal = $fn_value;
                if(isset($fns[$fieldName])){ 
                    $fn = $fns[$fieldName];
                    $colVal = $this->call_user_fn($fn, $colVal);
                }else
                    if(array_search ($type, $this->apostropheTypes) !== false) 
                        $colVal = "'".$this->mysqlRealEscapeString($colVal, 1)."'";
				$sql .= $comma . $sqlName . '=' . $colVal;
				$comma = ', '; 
			}
			return $sql;
		}
		public function createJsonFromPrimKeys($sqlTableName, $vals){
			$primKeys = $this->jsonTableClass->sqlData['sqlTables'][$sqlTableName]['sqlPrimKeyFieldNames'];
			$len = count($primKeys);
			$ret = array();
			for($i=0;$i<$len;$i++)
				array_push($ret, array('colName'=>$primKeys[$i], 'colVal'=>$vals[$i], 'oper'=>'=', 'logicOper'=>'AND' ));
			return $ret;
		}
		
		public function checkRestrictions($tName, $cols, $userFns){
			$restrObj = array( 
				'OKERR'=>true,
				'falseCols'=>array()
			);
			foreach($cols as $fieldName => $val){
				$structure = $this->jsonTableClass->formsData[$tName]['fields'][$fieldName];
				$sqlType = (array_key_exists($fieldName, $this->jsonTableClass->sqlData['sqlFields'])) ?
					$this->jsonTableClass->sqlData['sqlFields'][$fieldName]['type'] : '';
				$check = true;
				if(!array_key_exists($fieldName, $this->jsonTableClass->sqlData['sqlFields']) ||
				   $this->jsonTableClass->sqlData['sqlFields'][$fieldName] == 'no_sql') $check = false;
				if($check == true){
                    if(isset($userFns[$fieldName]))
                        $ret = $this->call_user_fn($userFns[$fieldName], [$tName, $val]);
                    else
					    $ret = $this->restrictions->checkRestrictionField($cols, $fieldName, $structure, $sqlType);
					$restrObj['OKERR'] = $ret[0] && $restrObj['OKERR'];
					if($ret[0] == false){
						$restrObj['falseCols'][$fieldName] = $ret[1];
					}
				}
			}
			return $restrObj;
		}

        public function checkIsQueryAllowed($userType, $method, $queryType, $queryName, $data){
			$arr = $this->jsonTableClass->configTables[$userType.'Settings']['allowed'];
            if($queryType == 'model'){
                //if table does not exists
				if(!array_key_exists($queryName, $arr))
					return [false, 1];
                //if method does not exists as key or string inside table
                $method = strtoupper($method);
				if(!array_key_exists($method, $arr[$queryName]) && array_search($method, $arr[$queryName]) === false)
					return [false, 2];
                //if method exists in allowed->table_name
                if(array_key_exists($method, $arr[$queryName])){
                    $in_data = $arr[$queryName][$method];                    
                    if(isset($in_data['reqFields'])){
                            $f = $in_data['reqFields'];
                            for($j=0; $j<count($f); $j++){
                                if($f[$j] === 'userAppId'){
                                    //is user logged
                                    if(!$this->check_userAppIDLog()) return [false, 5];
                                }else{
                                    if($method=='GET' && !isset($data['whereCols'])) return [false, "6-whereCols missing in ".json_encode($data)]; 
                                    if($method=='POST' && !isset($data['cols'])) return [false, "6-cols missing"]; 
                                    if($method=='PUT' && !isset($data['whereCols'])) return [false, "6-put whereCols missing"];
                                    if($method=='PUT' && !isset($data['cols'])) return [false, "6-put cols missing"];
                                    // $wc = (isset($data['whereCols']))? $data['whereCols'] : [];
                                    // if((isset($data['cols']))? $data['cols'] : []);
                                    $ima = false;
                                    if((isset($data['whereCols'])))
                                        for($k=0; $k<count($data['whereCols']); $k++)
                                            $ima  = $ima || ($data['whereCols'][$k]['colName'] == $f[$j]);
                                    if((isset($data['cols'])))
                                        foreach($data['cols'] as $kol=>$val)
                                            $ima  = $ima || ($kol == $f[$j]);
                                    if(!$ima) return [false, "6-".$f[$j].' missing'];
                                }
                            }
                    }
                    if(isset($in_data['userDefFn'])){
                            $f = $in_data['userDefFn'];
                            for($j=0; $j<count($f); $j++){
                                $wc1 =  (isset($data['whereCols']))? $data['whereCols'] : [];
                                $wc2 =  (isset($data['cols']))? $data['cols'] : [];
                                $odg = $this->call_user_fn($f[$j], [
                                    'queryName'=>$queryName, 
                                    'method'=>$method, 
                                    'whereCols'=>$wc1,
                                    'cols'=>$wc2
                                ]);
                                if(isset($odg['whereCols'])) $data['whereCols'] = $odg['whereCols'];
                                if(isset($odg['cols'])) $data['cols'] = $odg['cols'];
                                // $data['whereCols'] = $this->call_user_fn($f[$j], [
                                //     'queryName'=>$queryName, 
                                //     'method'=>$method, 
                                //     'whereCols'=>$wc1
                                // ]);
                                // $data['cols'] = $this->call_user_fn($f[$j], [
                                //     'queryName'=>$queryName, 
                                //     'method'=>$method, 
                                //     'cols'=>$wc2
                                // ]);
                                // echo  ("<br>POSLE 2: ".json_encode($data['cols']));
                            }
                    }
                    if(isset($in_data['checkQuery'])){
                            // later
                    }
                    if(isset($in_data['checkParamQuery'])){
                            $f = $in_data['checkParamQuery'];
                            $wc = $f['whereCols'];
                            for($l = 0; $l<count($wc); $l++){                      
                                if(isset($data['whereCols']))      
                                    for($k=0; $k<count($data['whereCols']); $k++)
                                        if($data['whereCols'][$k]['colName'] === $wc[$l])
                                            $wc[$l] = $data['whereCols'][$k]['colVal'];                           
                                if(isset($data['cols']))      
                                    foreach($data['cols'] as $kol=>$val)
                                        if($kol === $wc[$l])
                                            $wc[$l] = $val;
                            }
                            // die(json_encode($wc));
                            $obj = ['sqlQuery'=>$f['sqlQuery'], 'whereCols'=>$wc];
                            $ret = $this->resolveModelQuery(['apijx','sqlParamQuery'], 'GET', $obj, $userType);
                            //proveri ovo - ako ima/nema rezultata 
                            if($ret['OKERR'] == false)
                                return [false, '9-checkParamQuery - '.$f['sqlQuery'].' - '.json_encode($ret). ' - '];
                    }
                }
				return [true];
			}
			if($queryType == 'sqlQuery' || $queryType == 'sqlParamQuery'){
                if(array_search($queryName, $arr['queries']) === false)
					return  [false, 'HERE '.$queryName];
				return true;
			}
			return  [false, 'HERE 2 '.$queryType];
		}

        public function call_user_fn($fn, $val){
            if(is_callable( $fn, false, $callable_name)){
                $retVals = $fn($val);
                if(!isset($retVals) || $retVals == false)
                    die(json_encode([false, "Error: ".$fn." returned NOTHING!"]));
                if(gettype($retVals) !== "array")
                    die(json_encode([false, "Error: ".$fn." returned NOT array type!"]));
                if($retVals[0] == false)
                    if(!isset($retVals[1]))
                        die(json_encode([false, "Error: ".$fn." returned false, no msg!"]));
                    else    
                        die(json_encode([false, "Error: ".$fn." - ".$retVals[1]]));
                if($retVals[0] == true)
                    if(!isset($retVals[1]))
                        die(json_encode([false, "Error: ".$fn." returned true, no array!"]));
                    else{
                        // echo ("<br>POSLE: ".json_encode($retVals));
                        return $retVals[1];
                    }
                die(json_encode([false,  "Error: ".$fn." undefined value returned!"]));
            }else{
                die(json_encode([false,  'Error: Function '.$fn.' is not callable. (Probably not defined in user_def_fns.php)']));
            }
        }



		public function getSqlFieldNameFromCol($tableName, $colName){
			if($tableName == '')
				$tableName = $this->jsonTableClass->sqlData['sqlFields'][$colName]['table'];
			if($tableName == '') return false;
			if(!array_key_exists($colName, $this->jsonTableClass->formsData[$tableName]['fields'])) 
				return false; 
			$sqlFieldName = $this->jsonTableClass->formsData[$tableName]['fields'][$colName]['sqlFieldName'];		
			if($sqlFieldName == 'no_sql') 
				return false;
			if(!array_key_exists($sqlFieldName, $this->jsonTableClass->sqlData['sqlFields'])) 
				return false;
			return $sqlFieldName;
		}

		public function getSqlNameFromCol($tableName, $colName){
			if(!array_key_exists($colName, $this->jsonTableClass->formsData[$tableName]['fields'])) 
				return false; 
			if(!array_key_exists($colName, $this->jsonTableClass->sqlData['sqlFields'])) 
				return false;
			$sqlName = $this->jsonTableClass->sqlData['sqlFields'][$colName]['name'];		
			if($sqlName == 'no_sql') 
				return false;
			return $sqlName;
		}

        public function set_userAppId($val){
            $this->userAppId = $val;
        }
        
        public function check_userAppID($val){
            return $val == $this->userAppId && $this->userAppId > 0;
        }
        public function check_userAppIDLog(){
            return $this->userAppId > 0;
        }

		public function ocistiInput($data) {
			$data = trim($data);
			$data = addslashes($data);
			//$data = htmlspecialchars($data);
			return $data;
		}
		public function mysqlRealEscapeString($value, $ko) {
			if($this->_conn !== false)
				//return mysqli_real_escape_string($this->_conn, $value); //
				return $this->_conn->real_escape_string($value);
			else 
				return $this->ocistiInput($value);
		}
		    // $return = '';
		    // if(gettype($value) == 'array'){
		    // 	echo 'array in escapeString: '.var_dump($value);
		    // 	return '';
		    // }
		    // for($i = 0; $i < strlen($value); ++$i) {
		    //     $char = $value[$i];
		    //     $ord = ord($char);
		    //     if($char !== "'" && $char !== "\"" && $char !== '\\' && $ord >= 32 && $ord <= 126)
		    //         $return .= $char;
		    //     else
		    //         $return .= '\\x' . dechex($ord);
		    // }
		    // return $return;
			//}
		/*
		//FJA sql_get_last_line 
		//proveri i u php gde se koristi

		public function change_password($user, $new_pass){
			$sql = "SET PASSWORD FOR '$user'@'".$this->default_host_name."' = PASSWORD('$new_pass')";
			try{
				$odg = $this->sql_exec_update_delete($sql);
			}catch(Exception $e){
				$odg = false;
				$this->_msg = $e->getMessage();
			}
			return $odg;
		}
		*/

		
	}
	
?>