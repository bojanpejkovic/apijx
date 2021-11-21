<?php 
     session_start(); 
?>
<!DOCTYPE html>
<html>
  	<head>
   	<meta http-equiv="content-type" content="text/html; charset=utf-8">
  	<title>LOGIN</title>
    <meta name="Author" content="www.pejkovicbojan.com" />  
    <link rel="stylesheet" type="text/css" href="css/reset.css" /> 
    <script type="text/javascript" src="js/jquery/jquery-1.11.0.min.js"></script>
    <script>
    	$(document).ready(function(){
            
            
            //ASK FOR LOGIN OR CREATE DIV
            jinxPage.loginPageOpen(function(){
                if(!jinxPage.LngMsg) return;
                $('#login_label').text(jinxPage.LngMsg.loginLabel);
                $('#user_label').text(jinxPage.LngMsg.userLabel);
                $('#pass_label').text(jinxPage.LngMsg.passLabel);
                $('#login').html(jinxPage.LngMsg.loginBtn);
            });

            //LOGIN
            $('input[name="user"]').on("keyup", function (ev) {
                var keycode = (ev.keyCode ? ev.keyCode : ev.which);
                if (keycode == '13') 
                    $('input[name="pass"]').focus();
            });
            $('input[name="pass"]').on('keyup', function (ev){
                var keycode = (ev.keyCode ? ev.keyCode : ev.which);
                if (keycode == '13') 
                    jinxPage.login($('#user'), $('#pass'), function(resp){
                        if(resp.adminVal)
                        alert('You made it to the not jinx admin user type!');
                    });
            })
            $('button#login').on('click', function(){
                jinxPage.login($('#user'), $('#pass'), function(resp){
                    if(resp.adminVal)
                      alert('You made it to the not jinx admin user type!');
                });
            });

            //CREATE STRUCTURE
            $('button#createJsonForms').on('click', function(){
                jinxPage.createStructureOnServer($('#db_user'), $('#db_pass'), $('#db_name'));
            });
            
        });        
    </script> 
    <style>
        body{text-align: center; background: url('img/bglogin.png'); }
        h1{  margin-top:30%; line-height:2em; font-size:26px; color:white;  }
        p{ line-height: 2em; }
        p span{ padding:1em; color:white; padding-right: 3em; }
        .sa_error_log .list{ display:none; color:white; }
        .a_error_log .list{ color:red; }
        #login_wrap, #new_structure{ display:none; }
    </style>
 	</head>
  	<body>
      	<div id="login_wrap">
            <h1 id="login_label"></h1>
            <p><span id="user_label"></span><input type="text" name="user" size="10" id="user" value="" /></p>
            <p><span id="pass_label"></span><input type="password" name="pass" size="10" id="pass" value="" /></p>
            <p><button id="login" value="" /></p>
        </div>
        <div id="new_structure">
            <h1>CREATE JSON STRUCTURE</h1>
            <p><span>DB USER:</span><input type="text" id="db_user" value="" /></p>
            <p><span>DB PASS:</span><input type="password" id="db_pass" /></p>
            <p><span>DB NAME:</span><input type="text" id="db_name" value="" /></p>
            <button id="createJsonForms">CREATE</button>
        </div>
        <div class="sa_error_log"><div class="list"></div></div>
        <div class="a_error_log"><div class="list"></div></div>
  	</body>


        <script type="text/javascript" src="js/jinx/jinx-page.js?v1"></script>
        <script type="text/javascript" src="js/jinx/jinx-view.js"></script>
        <script type="text/javascript" src="js/jinx/jinx-field.js"></script>
        <script type="text/javascript" src="js/jinx/jinx-fns-default.js"></script>
        <script type="text/javascript" src="js/jinx/jinx-fns-furnix.js"></script>
</html>
