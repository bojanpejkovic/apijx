<?php 
function configDB(){
 	return array(
		"sa"=>array( "db_host"=>"localhost","db_user"=>"root","db_pass"=>"","db_name"=>"ocupio" ), 
		"admin"=>array( "db_host"=>"localhost","db_user"=>"admin","db_pass"=>"admin","db_name"=>"ocupio" ), 
		"regular"=>array( "db_host"=>"localhost","db_user"=>"regular","db_pass"=>"regular","db_name"=>"ocupio" ) 
	);  
}  
?>