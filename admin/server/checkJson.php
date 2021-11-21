<?php 

class Check_JSON {

	public function  __construct() {}

	public $sqlTypeToJsonType = array (
		"auto_increment", "auto_update", "text-short", "text", "password", 
		"int", "boolean", "float", "select", "date", "datetime", "time", "year"
	);


    public function checkDBconfig($obj){
		//must have sa, must have admin
		$admin_types = array('sa', 'admin');
		for($i=0;$i<2;$i++){
			$np = $admin_types[$i];
			if(array_key_exists($np, $obj) === false) 
				return array( 'OKERR'=>false, 'msg'=>'admin profile "'.$np.'" must be defined: "'.$np.'":{} ');
		}
		foreach ($obj as $np => $value){
			if(array_key_exists('db_user', $value) === false) 
				return array( 'OKERR'=>false, 'msg'=>$np.'.db_user must be defined.');
			if(array_key_exists('db_pass', $value) === false) 
				return array( 'OKERR'=>false, 'msg'=>$np.'.db_pass must be defined.');
			if(array_key_exists('db_name', $value) === false) 
				return array( 'OKERR'=>false, 'msg'=>$np.'.db_name must be defined.');
			if(trim($value['db_user']) === '' || trim($value['db_name']) === '') 
				return array( 'OKERR'=>false, 'msg'=>$np.'.db_user and '.$np.'.db_name can NOT be an empty string.');
		}
		//call checkDBData twice. One for sa, second for admin credentials
		return array( 'OKERR'=>true );
	}

	public function checkDBData($data, $obj){
    	try{
            if(!is_null($data))
                $this->_conn = new mysqli($data['host'], $data['user'], $data['pass'], $data['db']);
            else
                $this->_conn = new mysqli($obj['db_host'], $obj['db_user'],  $obj['db_pass'], $obj['db_name']);
            
            if ($this->_conn->connect_error){ 
            	$msg = 'Connect_error: ' . $this->_conn->connect_error;
                $this->_conn = false;
                return array('OKERR' => false, 'msg' => $msg);
            }

        }catch(Exception $e){
            $msg = 'Connect_error: ' . $e;
            $this->_conn = false;
            return array('OKERR' => false, 'msg' => $msg);
        }
        
        $this->_conn->set_charset("utf8");
        return array('OKERR' => true);
    }


	public function checkConfigCreate($obj){
		$must_have = array("createJsonSettings", "sqlTypeToJsonType", "tableSettings", "buttonsPerView", "mysql2json", "usersTable", "adminTypes", "languagesForLabels"
		);  
		for($i=0; $i<count($must_have); $i++){
			$attr = $must_have[$i];
			if(array_key_exists($attr, $obj) === false)
				return array('OKERR'=>false, 'msg'=>$attr.' must be defined.');
		}
		for($i=0; $i<count($obj['sqlTypeToJsonType']); $i++)
			array_push($this->sqlTypeToJsonType, $obj['sqlTypeToJsonType'][$i]);
		//must be array
		if(!is_array($obj['adminTypes']))
			return array('OKERR'=>false, 'msg'=>'adminTypes must be Array.');
		if(count($obj['adminTypes']) < 1)
			return array('OKERR'=>false, 'msg'=>'adminTypes must have "admin" member at least.');

		if( !array_key_exists('pageNumbersSide', $obj['tableSettings']) || 
		!is_array($obj['tableSettings']['pageNumbersSide']) || 
		count($obj['tableSettings']['pageNumbersSide']) !== 4 )
			return array('OKERR'=>false, 'msg'=>'tableSettings.pageNumbersSide must be Array '.
										  'with 4 boolean elements - true or false.');
		

		$obj['adminTypes']['sa'] = array('db_val'=>' ');
		foreach($obj['adminTypes'] as $adminType=>$adminObj){
			if(array_key_exists('db_val', $adminObj) === false)
				return array('OKERR'=>false, 'msg'=>$adminType.' defined in adminTypes must have db_val attribute defined. ');
		}

		if($obj['buttonsPerView']['input'] && !is_array($obj['buttonsPerView']['input']))
			return array('OKERR'=>false, 'msg'=>'buttonsPerView.input must be Array' );
		if($obj['buttonsPerView']['table'] && !is_array($obj['buttonsPerView']['table']))
			return array('OKERR'=>false, 'msg'=>'buttonsPerView.table must be Array' );
		if($obj['buttonsPerView']['search'] && !is_array($obj['buttonsPerView']['search']))
			return array('OKERR'=>false, 'msg'=>'buttonsPerView.search must be Array' );
		foreach($obj['mysql2json'] as $prop=>$p){
			$check = array("inputView", "tableView", "searchView");
			$allowedVals = array("", "HIDDEN", "DEFAULT", "NEW-ELEMENT", "FN");
			for($i=0; $i<3; $i++){
				$val = $p[$check[$i]];
				if( array_search($val, $allowedVals) === false)
					return array( 'OKERR'=>false, 'msg'=>'mysql2json.'.$prop.'.'.$check[$i].' does not have '.'allowed value("", "HIDDEN", "DEFAULT", "FN" or "NEW-ELEMENT").' );
			}
		}
		unset($obj['adminTypes']['sa']);

		//usersTable
		if(array_key_exists('type', $obj['usersTable']) === false){
			return array('OKERR'=>false, 'msg'=>'usersTable must have type defined.');
		}
		if($obj['usersTable']['type'] === 'db'){
			$must_have = array( "table_name", "col_user", "col_pass", "col_type");
			for($i=0; $i<count($must_have); $i++){
				$p = $must_have[$i];
				if(array_key_exists($p, $obj['usersTable']) === false)
					return array('OKERR'=>false, 'msg'=>'usersTable must have '.$p.' defined, when type is "db".');
			}
		}
		return array( 'OKERR'=>true );
	}



	public function checkConfigTables ($obj){
		$must_have = array("newElementsDef", "usersTable", "adminTypes", "allowedTypeForDEFAULT"); 
		for($i=0; $i<count($must_have); $i++){
			$attr = $must_have[$i];
			if(array_key_exists($attr, $obj) === false) 
				return array('OKERR'=>false, 'msg'=>$attr.' must be defined.');
		}
		
		//usersTable
		if(array_key_exists('type', $obj['usersTable']) === false){
			return array('OKERR'=>false, 'msg'=>'usersTable must have type defined.');
		}
		if($obj['usersTable']['type'] === 'db'){
			$must_have = array( "table_name", "col_user", "col_pass", "col_type");
			for($i=0; $i<count($must_have); $i++){
				$p = $must_have[$i];
				if(array_key_exists($p, $obj['usersTable']) === false)
					return array('OKERR'=>false, 'msg'=>'usersTable must have '.$p.' defined, when type is "db".');
			}
		}

		//newElementsDef
		/*
		foreach($obj['newElementsDef'] as $prop=>$value){
			$mustHave = array( "jsSrc", "cssSrc", "async");
			for($i=0; $i<3; $i++){
				if( array_key_exists($mustHave[$i], $obj['newElementsDef'][$prop]) === false)
					return array('OKERR'=>false, 'msg'=>'newElementsDef.'.$prop.' does not have '.$mustHave[$i].' defined.' );
			}
			if(!is_array($obj['newElementsDef'][$prop]['jsSrc']))
				return array('OKERR'=>false, 'msg'=>'newElementsDef.'.$prop.'.jsSrc must be Array[].' );
			if(!is_array($obj['newElementsDef'][$prop]['cssSrc']))
				return array('OKERR'=>false, 'msg'=>'newElementsDef.'.$prop.'.cssSrc must be Array[].' );
		}*/

		//adminTypes
		if(!is_array($obj['adminTypes']))
			return array('OKERR'=>false, 'msg'=>'adminTypes must be Array.');
		if(count($obj['adminTypes']) < 1)
			return array('OKERR'=>false, 'msg'=>'adminTypes must have "admin" member at least.');
		foreach($obj['adminTypes'] as $adminType=>$adminObj){
			if(array_key_exists('db_val', $adminObj) === false)
				return array('OKERR'=>false, 'msg'=>$adminType.' defined in adminTypes must have db_val attribute defined. ');
			if(array_key_exists($adminType.'Settings', $obj) === false)
				return array('OKERR'=>false, 'msg'=>$adminType.' defined in adminTypes does not have its settings. ');
			if(array_key_exists('mainMenu', $obj[$adminType.'Settings']) === false && $adminType !== 'sa')
				return array('OKERR'=>false, 'msg'=>$adminType.' defined in adminTypes does not have its settings with mainMenu as attribute.');
			
			if($adminType !== 'sa')
				foreach ($obj[$adminType.'Settings']['mainMenu'] as $view => $value){
					if((array_key_exists('viewName', $value) === false || 
					trim($value['viewName']) === '') && (!array_key_exists('fn', $value) ||
					trim($value['fn']) === ''))
						return array('OKERR'=>false, 'msg'=>$adminType.'Settings.mainMenu.'.$view.' must have viewName or fn defined (json file).');
					if(array_key_exists('label', $value) === false)
						return array('OKERR'=>false, 'msg'=>$adminType.'Settings.mainMenu.'.$view.' must have label defined.');
				}
		}
		return array( 'OKERR'=>true );
	}
	public function checkLanguageFile($obj){
		foreach ($obj as $lng => $arr) {
			if($lng === 'default' || substr($lng, 0, 11) == 'getLanguage') continue;
			foreach ($obj as $clng => $carr) {
				if($clng === 'default' || substr($clng, 0, 11) == 'getLanguage') continue;
				if($lng === $clng) continue;
				if(! is_array ($arr)) continue;
				if(! is_array ($carr)) continue;
                $d = array_diff_key ( $arr , $carr);
                if(count($d) > 0){
                	$s = '';
                	foreach($d as $n=>$v) $s .= $n.', ';
                	return array('OKERR'=>false, 'msg'=>"Language $clng doesn't have $s while $lng does." );
                }
			};
		};
		return array( 'OKERR'=>true );	
	}
	public function checkSqlFields($obj, $realSql){
		$this->sqlFields = $obj;
		return array( 'OKERR'=>true );	
	}

	public function checkJsonTable($name, $obj, $newElDefs, $allowDefTypes){
		$must_have = array("jsonTableName", "tableName", "types", "tableTitle", 
		"linesPerRequest", "tableSettings", "buttonsPerView", "fields", "orderBy");
		for($i=0; $i<count($must_have); $i++){
			$attr = $must_have[$i];
			if(array_key_exists($attr, $obj) === false) 
				return array('OKERR'=>false, 'msg'=>$name.'.json must have '.$attr.' defined.');
		}
		if(!is_array($obj['types']))
			return array('OKERR'=>false, 'msg'=>$name.'.json: field "types" must be Array[].' );
		if($name !== $obj['jsonTableName'])
			return array('OKERR'=>false, 'msg'=>$name.'.json field "jsonTableName" must be '.$name );
		if(trim($obj['tableName']) === '')
			return array('OKERR'=>false, 'msg'=>$name.'.json field "tableName" can not be empty string.' );
		if(count($obj['types']) < 1)
			return array('OKERR'=>false, 'msg'=>$name.'.json field "types" must have at least one type defined (input or table)' );
		$allowed = array("input","table","search");
		for($i=0; $i<count($obj['types']); $i++)
			if(array_search($obj['types'][$i], $allowed) === false)
				return array('OKERR'=>false, 'msg'=>$name.'.json field "types" have value '.$obj['types'][$i].
					' that is not allowed. Only "input","table" and "search" are allowed values. ');
		if( array_search('input', $obj['types']) === false && array_search('table', $obj['types']) === false )
			return array('OKERR'=>false, 'msg'=>$name.'.json field "types" must have at least one "input" or "table" defined.' );
		if($obj['linesPerRequest'] < 0)
			return array('OKERR'=>false, 'msg'=>$name.'.json field "linesPerRequest" must be >= 0' );

		$must_have = array("allFieldsLabel", "tableWithInput", "tableWithSearch", "openTableAfterInput", 
			"tablePageNumbersPos", "pageNumbers", "pageNumbersSide", "resetSortButton", 
			"addNewButton", "badFieldStar");
		for($i=0; $i<count($must_have); $i++){
			$attr = $must_have[$i];
			if($obj['tableSettings'] === false) 
				return array('OKERR'=>false, 'msg'=>$name.'.json must have tableSettings.'.$attr.' defined.');
		}
		if(!is_array($obj['tableSettings']['pageNumbersSide']))
			return array('OKERR'=>false, 'msg'=>$name.'.json: field "tableSettings.pageNumbersSide" must be Array[].' );
		if($obj['tableSettings']['tablePageNumbersPos'] !== "header" 
			&& $obj['tableSettings']['tablePageNumbersPos'] !== "footer"
			&& $obj['tableSettings']['tablePageNumbersPos'] !== "both")
			return array('OKERR'=>false, 'msg'=>$name.'.json: field "tableSettings.tablePageNumbersPos" must be "both", "header" or "footer".' );
		//buttonsPerView
		$allowed = array( "input","table","search","details");
		$allBtns = array("save","edit","reset","delete","search", "details");
		foreach($obj['buttonsPerView'] as $prop=>$val){
			if( array_search($prop, $allowed) === false)
				return array('OKERR'=>false, 'msg'=>$name.'.json field "buttonsPerView" have value '.$prop.
					' that is not allowed. Only "input","table" and "search" are allowed values. ');
			if(!is_array($obj['buttonsPerView'][$prop]))
				return array('OKERR'=>false, 'msg'=>$name.'.json: field "buttonsPerView.'.$prop.'" must be Array[].' );
			
			/*for($i=0;$i<count($obj['buttonsPerView'][$prop]);$i++)
				if( array_search($obj['buttonsPerView'][$prop][$i], $allBtns) === false)
					return array('OKERR'=>false, 'msg'=>$name.'.json: field "buttonsPerView.'.$prop.'" have value '.$obj['buttonsPerView'][$prop][$i].' that is not allowed. '.
					    'Only "save","edit","reset" or "delete" are allowed.');*/
		}
		if($obj['tableType'] == 'VIEW' && array_search('input', $obj['types']) !== false)
				return array('OKERR'=>false, 'msg'=>$name.'.json: types have value "input" which is not allowed for sql VIEW!' );
		if($obj['tableType'] == 'VIEW' && count($obj['buttonsPerView']['table']) > 0)
				return array('OKERR'=>false, 'msg'=>$name.'.json: table have default buttons, which is not allowed for sql VIEW!' );
		//fields
		$must_have = array("name", "attrList", "label", "sqlFieldName", 
			"inputView", "inputViewType", "tableView", "tableViewType", 
			"searchView", "searchViewType", "type", "sortCol");
		$checkNewEls = array();
		$checkDefEls = array();
		foreach($obj['fields'] as $prop=>$field){
			for($i=0; $i<count($must_have); $i++){
				$attr = $must_have[$i];
				if(!array_key_exists($attr, $field)) 
					return array('OKERR'=>false, 'msg'=>$name.'.json fields.'.$prop.' must have '.$attr.' defined.');
			}
			$check = array("inputView", "tableView", "searchView");
			$allowedVals = array("", "HIDDEN", "DEFAULT", "NEW-ELEMENT", "FN");
			for($i=0; $i<3; $i++){
				$val = $field[$check[$i]];
				if(array_search($val, $allowedVals) === false)
					return  array('OKERR'=>false, 'msg'=>$name.'.json fields.'.$prop.'.'.$check[$i].' does not have '.'allowed value ("", "HIDDEN", "DEFAULT", "FN" or "NEW-ELEMENT").' );
				if($val == "NEW-ELEMENT")
					array_push($checkNewEls, $field[$check[$i].'Type']);
				if($val == "DEFAULT" && trim($field[$check[$i].'Type']) !== '')
					array_push($checkDefEls, $field[$check[$i].'Type']);
			}
			if(array_search($field['type'], $this->sqlTypeToJsonType) === false)
				return array(
					'OKERR'=>false, 'msg'=>$name.'.json fields.'.$prop.'.type have value '.$field['type'].
					' which is not allowed type. Allowed types are defined in configCreate.sqlTypeToJsonType.'
				);
			if(substr($field['sqlFieldName'], 0, 16) !== "thisquery_field_")
				if( array_key_exists($field['sqlFieldName'], $this->sqlFields['sqlFields']) === false)
					return array(
						'OKERR'=>false, 'msg'=>$name.'.json fields.'.$prop.'.sqlFieldName have value '.
							$field['sqlFieldName'].' which does not exists in sql fields. '.
							'If field does not exists in DB it should have value "no_sql".'
					);
		}

		$must_have = array("sortOrder", "primKeyOrder");
		//"inputOrder", "tableOrder", "searchOrder", 
		for($i=0; $i<count($obj['types']); $i++)
			array_push($must_have, $obj['types'][$i].'Order');
		for($i=0; $i<count($must_have); $i++){
			$attr = $must_have[$i];
			if(!array_key_exists($attr, $obj['orderBy'])) 
				return array('OKERR'=>false, 'msg'=>$name.'.json orderBy.'.$attr.' must be defined.');
			if($attr !== "sortOrder"){
				if(!is_array($obj['orderBy'][$attr]))
					return array('OKERR'=>false, 'msg'=>$name.'.json orderBy.'.$attr.' must be Array[].' );
			}else{
				foreach($obj['orderBy']['sortOrder'] as $prop=>$value)
					if($value !== 'ASC' && $value !== 'DESC')
						return array('OKERR'=>false, 'msg'=>$name.'.json orderBy.sortOrder.'.$prop.' must be "ASC" or "DESC".' );
			}
		}
		if( count($obj['orderBy']['sortOrder']) === 0)
			return array('OKERR'=>false, 'msg'=>$name.'.json orderBy.sortOrder must have at least one key defined.' );
		$pko = count($obj['orderBy']['primKeyOrder']);
		if( $pko === 0 && $obj['tableType'] == 'BASE TABLE')
			return array('OKERR'=>false, 'msg'=>$name.'.json orderBy.primKeyOrder must have at least one key defined.' );

		if(count($obj['buttonsPerView']['table']) > 0)
			for($i=0; $i<$pko; $i++)
				if(array_search($obj['orderBy']['primKeyOrder'][$i], $obj['orderBy']['tableOrder']) === false){
					return array('OKERR'=>false, 'msg'=>$name.'.json: all fields from orderBy.primKeyOrder must exists in orderBy.tableOrder too, if you want to have SAVE, EDIT or DELETE BUTTON. If you dont want to show PrimaryKey, it can be HIDDEN, but included in tableOrder' );
				}


		for($i=0; $i<count($checkDefEls); $i++)
			if(array_search($checkDefEls[$i], $allowDefTypes) === false)
				return array( 'OKERR'=>false, 'msg'=>$name.'.json have '.$checkDefEls[$i].' in fields as DEFAULT, but it is not defined in allowedTypeForDEFAULT.' );
		
		/*for($i=0; $i<count($checkNewEls); $i++)
			if(!array_key_exists($checkNewEls[$i], $newElDefs))
				return array( 'OKERR'=>false, 'msg'=>$name.'.json have '.$checkNewEls[$i].' in fields as NEW-ELEMENT, but it is not defined in newElementsDef.' );
		*/

		return array( 'OKERR'=>true );
	}
}

?>