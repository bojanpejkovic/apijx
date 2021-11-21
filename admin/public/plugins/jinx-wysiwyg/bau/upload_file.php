<?php
    ini_set('display_errors', 1);
    ini_set('display_startup_errors', 1);
    error_reporting(E_ALL);
    $type = $_POST['file-type'];
    $target_dir = $_POST['file-path'];
    $file_dest = $_POST['file-dest'];
    $target_file = $target_dir . basename($_FILES["fileToUpload"]["name"]);
    $imageFileType = strtolower ( pathinfo($target_file, PATHINFO_EXTENSION) );
    $uploadOk = 1;
    if(isset($_POST["submit"])) {
        if($type == 'image'){
            // Check if image file is a actual image or fake image
            $check = getimagesize($_FILES["fileToUpload"]["tmp_name"]);
            if($check !== false) {
                $uploadOk = 1;
            } else {
                echo "Error: File is not an image.";
                $uploadOk = 0;
            }
            if($uploadOk == 1){
                if($imageFileType != "jpg" && $imageFileType != "png" && 
                    $imageFileType != "jpeg" && $imageFileType != "gif" ) {
                    echo "Error: Only JPG, JPEG, PNG & GIF files are allowed.";
                    $uploadOk = 0;
                }
            }
        }
        
        if($type == 'excel'){
            if($imageFileType != "xls" && $imageFileType != "xlsx"){
                echo "Error: Only XLS or XLSX files are allowed.";
                $uploadOk = 0;
            }
        }
    }
    // Check file size
    if ($_FILES["fileToUpload"]["size"] > 10000000) {
        echo "Error: File is too large.";
        $uploadOk = 0;
    }
    

    if ($uploadOk == 0)  exit;

    if (move_uploaded_file($_FILES["fileToUpload"]["tmp_name"], $target_file)) {
            //if (copy('bau/'.$target_file, $file_dest.$target_file)) {
                echo "The file ". basename( $_FILES["fileToUpload"]["name"]). " has been uploaded to:".$target_file;
                //unlink($target_file);
                //echo "The file ". $copyto. " has been uploaded.";
            // } else {
            //      echo "Error: 1.step COPY SUCC, File is not copied from ".$target_file.' to '.$file_dest.$target_file." \n ";
            //  }
    } else {
            echo "Error: Sorry, there was an error uploading your file. FROM: ".$_FILES["fileToUpload"]["tmp_name"]." <br> TO: ".$target_file;
    }

?> 