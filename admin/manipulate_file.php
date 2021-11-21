<?php
    ini_set('display_errors',1);
    error_reporting(E_ALL);


    $base_folder = '../img/';
    // if(isset($_REQUEST['who']) && $_REQUEST['who'] == 'pdf')
    //     $base_folder = '../slike/pdfs/';
    $what = (isset($_REQUEST['what']))? $_REQUEST['what'] : '';
    if($what == 'copyImg'){
        // echo "usp";
        copyImg($_REQUEST['name'], $_REQUEST['folder']);
    }
    if($what == 'copyImgs'){
        $r = [];
        for($i=0; $i<count($_REQUEST['names']); $i++)
            array_push($r, copyImg($_REQUEST['names'][$i], $_REQUEST['folders'][$i], true));
        echo json_encode($r);
    }
    if($what == 'makeDir'){
        $f = (isset($_REQUEST['folder']))? $base_folder.$_REQUEST['folder'] : '';
        if($f !== '')
            mkdir($f);
    }

    if($what == 'delImg'){
        $del = $base_folder.$_REQUEST['folder'].'/'.$_REQUEST['name'];
        unlink($del);
    }
    if($what == 'delImgs'){
        for($i=0; $i<count($_REQUEST['names']); $i++){
            $del = $base_folder.$_REQUEST['folders'][$i].'/'.$_REQUEST['names'][$i];
            unlink($del);
        }
    }
    if($what == 'delDir'){
        $del = $base_folder.$_REQUEST['folder'];
        deleteDir($del);
        //array_map('unlink', glob("$del/*.*"));
        //rmdir($del);
    }

    function copyImg($name, $folder,$ret=false){
        global $base_folder;
        $copyfrom = $base_folder.'uploaded/'.$name;
        $imageFileType = strtolower ( pathinfo($copyfrom, PATHINFO_EXTENSION) );
        $target_dir = $base_folder.$folder;
        if(!is_dir($target_dir))
            mkdir($target_dir);
        $copyto = $target_dir.'/'.$name;
        
        // ako vec postoji - 
        $path_parts = pathinfo($copyto);
        $name_no_ext_base = $path_parts['filename']; 
        $name_no_ext_base = str_replace(" ", "_", $name_no_ext_base);
        $j = 0;
        while(file_exists($copyto))
            $copyto = $target_dir ."/". $name_no_ext_base."(".(++$j). ")." . $imageFileType;
        if (copy($copyfrom, $copyto)) {
            unlink($copyfrom);
            $r = ["OKERR"=> true, 'filename'=>$name, 'full_filename'=>$copyto];            
        } else {
            $r = ["OKERR"=> false, "msg"=>"Error: File is not copied from ".$copyfrom.' to '.$copyto." \n "];
        }
        if(!$ret) echo json_encode($r); else return $r;
    }
    function deleteDir($dir) {
        if (! is_dir($dir)) {
            echo  "$dir nije dir ili ne postoji!";
            exit;
        }
        $dir_files = scandir($dir); 
        if(count($dir_files)>2)
            for ($i=0;$i<count($dir_files);$i++)
                if(substr($dir_files[$i], 0,1)!='.')
                    unlink($dir.'/'.$dir_files[$i]);
        rmdir($dir);
    }
?> 