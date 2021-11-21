<?php
	
	class Login{
		public $jsonTableClass; 
		public $mysqlCall;
		public $user = array('host'=>'', 'name'=>'', 'pass'=>'', 'type'=>'');

		public function __construct($jsonTableClass, $mysqlCall) {
			$this->jsonTableClass = $jsonTableClass;
			$this->mysqlCall = $mysqlCall;
		}

		//when user tries to login, is his credentials in configDB
		public function configDBloginCheck($data){
			//proveri da li je username i pass u configDB->"sa"
			//jeste : vodi ga na superadmin page.
			$sa = $this->jsonTableClass->defaultConfigSuperAdminName;

			if($data['user'] == $this->jsonTableClass->configDB[$sa]['db_user']
			&& $data['pass'] == $this->jsonTableClass->configDB[$sa]['db_pass']){
				$this->user['host'] = $this->jsonTableClass->configDB[$sa]['db_host'];
				$this->user['name'] = $data['user'];
				$this->user['pass'] = $data['pass'];
				$this->user['type'] = $sa;
				return array("OKERR"=>true,"link"=>"superadmin/");
			};

			//vidi da li moze sa admin parametrima 
			foreach($this->jsonTableClass->configDB as $prop=>$val){
				if($data['user'] == $val['db_user']
				&& $data['pass'] == $val['db_pass']){
					$this->user['host'] = $this->jsonTableClass->configDB[$prop]['db_host'];
					$this->user['name'] = $data['user'];
					$this->user['pass'] = $data['pass'];
					$this->user['type'] = $prop;
					return array("OKERR"=>true,"link"=>"admin/");
				};
			}
			return array("OKERR"=>false);
		}

		//when user tries to login, is his credentials in DB table
		public function login($data){
			//check user-pass
			$loginTable = $this->mysqlCall->execSql(array(
				'queryType'=>'get_user_login',
				'tableName'=>$this->jsonTableClass->configTables['usersTable']['table_name'],
				'col_user'=>$this->jsonTableClass->configTables['usersTable']['col_user'],
				'user'=>$data['user'],
				'col_pass'=>$this->jsonTableClass->configTables['usersTable']['col_pass'],
				'pass'=>$data['pass']
			));
			//var_dump( $loginTable );
			if($loginTable['OKERR'] !== true){
				//http_response_code(401);
				return array("OKERR"=>false, "msg"=>'wrongLogin');
			}else{
				$this->user['name'] = $data['user'];
				$this->user['pass'] = $data['pass'];
				$ret = $this->setUserType();
				if($this->user['type'] === ''){
					//if user['type'] is still empty, type is not defined in this table.
					$this->user['type'] = 'admin';
					return array("OKERR"=>true,"link"=>"admin/","adminVal"=>$ret); 					
				}else{
					return array("OKERR"=>true,"link"=>"admin/");
				}
			}
		}

		public function checkUser(){
			if($this->user['name'] === ''){
				//http_response_code(401);
				echo json_encode(array("OKERR"=>false,"msg"=>'Wrong permissions!')); 
				//include('my_404.php'); // provide your own HTML for the error page
				return false;
			}
			
			if($this->user['type'] === ''){
				$ret = $this->setUserType();
				if($ret === false || $this->user['type'] === '') 
					return false;
			}
			return true;
		}
		public function setUserType(){
			/*
			//set user admin type - sa or admin...
			$sa = $this->jsonTableClass->defaultConfigSuperAdminName;

			if($this->user['name'] == $this->jsonTableClass->configDB[$sa]['db_user']
			&& $this->user['pass'] == $this->jsonTableClass->configDB[$sa]['db_pass']){
				$this->user['type'] = $sa;
				return true;
			}else{
				if($this->user['name'] == $this->jsonTableClass->configDB['admin']['db_user']
				&& $this->user['pass'] == $this->jsonTableClass->configDB['admin']['db_pass']){
					$this->user['type'] = 'admin';
					return true;
				}else{*/
					$this->user['type'] = '';
					$colAdminType = $this->jsonTableClass->configTables['usersTable']['col_type'];
					if($colAdminType === '') return true;

					$ret = $this->mysqlCall->execSql(array(
						'queryType'=>'get_user_adminType', 'name'=>$this->user['name']
					));
					if($ret['OKERR'] == true){
						$db_val = $ret['result'][0]['AdminType'];
						foreach($this->jsonTableClass->configTables['adminTypes'] as $adminType=>$obj)
							if($obj['db_val'] === $db_val){
								$this->user['type'] = $adminType;
								return true;
							}
						return $db_val; 
					}else 
						return false;
				//}
			//};
		}
		
	}
?>