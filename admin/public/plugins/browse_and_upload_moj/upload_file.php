<?php
    
    $type = $_POST['file-type'];
    $target_dir = $_POST['file-path'];
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
            echo "The file ". basename( $_FILES["fileToUpload"]["name"]). " has been uploaded.";
    } else {
            echo "Error: Sorry, there was an error uploading your file.";
    }

?> 