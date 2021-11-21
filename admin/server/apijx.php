<?php
	require_once('main.php');
	session_start();
	/*set_error_handler(function ($errno, $errstr, $errfile, $errline ,array $errcontex) {
	    throw new ErrorException($errstr, 0, $errno, $errfile, $errline);
	});
	*/
	if(!isset($_SESSION['main'])){
		$_SESSION['main'] = new Main();
		exit;
	}else{
		$_SESSION['main']->getUserRequest();  
		//5 requests can pass without login check:
		
		//0.regular user for web-site
		if($_SESSION['main']->userRequest['arrPath'][1] === 'regularUser'){
			unset($_SESSION['main']);
			$_SESSION['main'] = new Main();
			exit;
		}
		//1.open or refresh loginPage
		if($_SESSION['main']->userRequest['arrPath'][1] === 'loginPage'){
			unset($_SESSION['main']);
			$_SESSION['main'] = new Main();
			exit;
		}
		//2.check login credentials
		if($_SESSION['main']->userRequest['arrPath'][1] === 'login'){
			$_SESSION['main']->setDefaultUserTableNames();
			$log = $_SESSION['main']->login($_SESSION['main']->userRequest['body']);
			echo json_encode($log);  
			exit;
		}
		//3.create ALL
		if($_SESSION['main']->userRequest['arrPath'][1] == 'createJsonServerStructure'){
			$_SESSION['main']->jsonTableClassCreate = new Json_Table_Class_Create(true, $_SESSION['main']->jsonTableClass);   
			$_SESSION['main']->mysqlCall->jsonTableClass = $_SESSION['main']->jsonTableClass;
			$_SESSION['main']->createJsonServerStructure($_SESSION['main']->userRequest['body']);  
			exit;	
		}
		//4.setLanguage (ie. for login page)
		if($_SESSION['main']->userRequest['arrPath'][1] == 'setLanguage'){
			if($_SESSION['main']->jsonTableClass->languages === null){
				exit;
			}
			$_SESSION['main']->sendLanguage($_SESSION['main']->userRequest['arrPath'][2]);
			exit;
		}
		//5.reset all
		if($_SESSION['main']->userRequest['arrPath'][1] == 'resetAll'){
			if($_SESSION['main']->user['type'] !== '' && $_SESSION['main']->user['type'] !== 'regular'){
				$u = $_SESSION['main']->user['name'];
				$p = $_SESSION['main']->user['pass'];
				unset($_SESSION['main']);
				$_SESSION['main'] = new Main();
				$_SESSION['main']->setDefaultUserTableNames();
				$log = $_SESSION['main']->login(['user'=>$u, 'pass'=>$p]);
				echo json_encode($log);  
				exit;
			}else{
				echo json_encode($log);
				exit;
			}
		}

		$ret = true;
		if($_SESSION['main']->jsonTableClass->configTables['usersTable']['type'] === 'other' ||
		$_SESSION['main']->jsonTableClass->configTables['usersTable']['type'] === 'other_and_db'){
			$fn = $_SESSION['main']->jsonTableClass->configTables['usersTable']['fn'];
			$ret = call_user_func($fn);
		}
		
		//check login SESSION credentials
		if($_SESSION['main']->jsonTableClass->configTables['usersTable']['type'] === 'db' || 
		($_SESSION['main']->jsonTableClass->configTables['usersTable']['type'] === 'other_and_db'
		&& $ret === false)){
			if($_SESSION['main']->checkUser() == false){ //die(); //knock, knock, who is it? (set type too)
					$_SESSION['main']->language = 'EN';  //vidi za language
					$_SESSION['main']->login(array(
						'user'=>$_SESSION['main']->jsonTableClass->configDB['regular']['db_user'], 
						'pass'=>$_SESSION['main']->jsonTableClass->configDB['regular']['db_pass']
					));
			}
		}

		//exec request
		$res = $_SESSION['main']->execRequest($_SESSION['main']->userRequest['body'], $_SESSION['main']->userRequest['arrPath'] );
		if($_SESSION['main']->userRequest['arrPath'][1] === 'model') 
			echo json_encode($res);
	}
?>

