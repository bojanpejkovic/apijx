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

?>