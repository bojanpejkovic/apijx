<?php
// when this function is for paramQuery, DO NOT surround value with apostrophes
//in all other cases, INCLUDE apostrophes!!!
    
    function create_uuid($val){
        // Generate 16 bytes (128 bits) of random data or use the data passed into the function.
        $data = $data ?? random_bytes(16);
        assert(strlen($data) == 16);

        // Set version to 0100
        $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
        // Set bits 6-7 to 10
        $data[8] = chr(ord($data[8]) & 0x3f | 0x80);

        // Output the 36 character UUID.
        return [true, vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4))];
    }
    function my_password_hash($v){
        $pepper = "biber";
        // return  [true, hash_hmac("sha256", $v, $pepper), base64_encode(hash_hmac("sha256", $v, $pepper, true))];
        return  [true, hash_hmac("sha256", $v, $pepper)];

    }
    function mysqlNOW($val){
        return  [true, "NOW()"];
    }
    function mysqlUTC_TIMESTAMP($val){
        return  [true, "UTC_TIMESTAMP()"];
    }
    function mysqlCURTIME($val){
        return  [true, "CURTIME()"];
    }
    function get_userAppID(){
        if(isset($_SESSION['main']) && isset($_SESSION['main']->mysqlCall->userAppId)){
            return [true, $_SESSION['main']->mysqlCall->userAppId];
        }else
            die("NOPE - no userAppId");
    }

    
    function check_get_userAppID($arr){
        // die(json_encode($arr));
        $user_fn = ($arr['queryName'] !== 'boards')? $arr['queryName'].'_field_user_id' : 'boards_field_creator_user_id';
        if(isset($arr['whereCols'])){
            for($k=0; $k<count($arr['whereCols']); $k++){
                if($arr['whereCols'][$k]['colName'] === $user_fn){
                    $user_id = $arr['whereCols'][$k]['colVal'];
                    if($_SESSION['main']->mysqlCall->userAppId != $user_id || !($_SESSION['main']->mysqlCall->userAppId > 0))
                        return [false, 'Your sent_id '.$user_id.' is not your log_id '.$_SESSION['main']->mysqlCall->userAppId.'!'];
                }
            }
        }
        if(isset($arr['cols'])){
            if(isset($arr['cols'][$user_fn])){
                $user_id = $arr['cols'][$user_fn];
                if($_SESSION['main']->mysqlCall->userAppId != $user_id || !($_SESSION['main']->mysqlCall->userAppId > 0))
                    return [false, 'Your sent_id '.$user_id.' is not your log_id '.$_SESSION['main']->mysqlCall->userAppId.'!'];
            }
        }
        return [true, $arr];
    }

    function check_group_users_post($arr){
        // echo "<br>1.".(json_encode($arr))."<br>";
        if(isset($arr['cols'])){
            if($arr['cols']['group_users_field_status_id'] > 0){
                $resp = $_SESSION['main']->mysqlCall->_conn->query("SELECT creator_user_id FROM groups where id=".$arr['cols']['group_users_field_group_id']);
                $podaci = $resp->fetch_all(MYSQLI_ASSOC);
                if(isset($podaci[0]) && $podaci[0]['creator_user_id'] == $arr['cols']['group_users_field_user_id'])
                    return [true, $arr];
                else
                    return [false, 'You can not set yourself a status'];
            }
        }
        return [true, $arr];
    }


    function check_group_users_put($arr){
        // echo "<br>1.".(json_encode($arr))."<br>";
        if(isset($arr['whereCols']) && isset($arr['cols'])){
            $gid = "";
            for($k=0; $k<count($arr['whereCols']); $k++)
                if($arr['whereCols'][$k]['colName'] === 'group_users_field_group_id')
                    $gid = $arr['whereCols'][$k]['colVal'];
            if($arr['cols']['group_users_field_status_id'] > 0){
                // set admin role ili prima usera u grupu
                $upit = "SELECT status_id FROM group_users where group_id=".$gid." AND user_id=".$_SESSION['main']->mysqlCall->userAppId;
                // echo "<br>2.".$upit."<br>";
                $resp = $_SESSION['main']->mysqlCall->_conn->query($upit);
                if($resp){
                    $podaci = $resp->fetch_all(MYSQLI_ASSOC);
                    if(isset($podaci[0]) && $podaci[0]['status_id'] >= 2)
                        return [true, $arr['cols']];
                    else
                        return [false, 'Nope. You can not do that 1'];
                }else
                    return [false, 'Nope. You can not do that 2'];
            }else{
                //hoce da ga iskljuce iz grupe
                //ili on sam 
                if($_SESSION['main']->mysqlCall->userAppId == $arr['cols']['group_users_field_user_id'])
                    return [true, $arr['cols']];
                // hoce admin
                $resp = $_SESSION['main']->mysqlCall->_conn->query("SELECT status_id FROM group_users where group_id=".$gid." AND user_id=".$_SESSION['main']->mysqlCall->userAppId);
                $podaci = $resp->fetch_all(MYSQLI_ASSOC);
                if(isset($podaci[0]) && $podaci[0]['status_id'] >= 2)
                    return [true, $arr['cols']];
                else
                    return [false, 'Nope. You can not do that 3'];
            }
        }
        return [true, $arr];
    }
?>