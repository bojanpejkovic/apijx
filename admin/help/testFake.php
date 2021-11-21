<?php


    session_start();
    require_once('server/main.php');

    $_REQUEST['path'] = 'apijx/regularUser';
    $main = new Main(true);

//SELECT
    $_SERVER['REQUEST_METHOD'] = 'GET';
    $main->userRequest['arrPath'] = ['apijx', 'model', 'some_table', 'table'];
    $main->userRequest['body'] = array();
    $resp = $main->execRequest($main->userRequest['body'], $main->userRequest['arrPath'] );
    var_dump($resp);

//INSERT

    // $_SERVER['REQUEST_METHOD'] = 'POST';
    // $_SESSION['main']->userRequest['arrPath'] = ['apijx','model','proizvodi_grupe','input'];
    // $_SESSION['main']->userRequest['body'] = array('cols'=>array(), 'returnAffected'=>true);
    // $_SESSION['main']->userRequest['body']['cols']["proizvodi_grupe_field_ProizvodId"] = $id;
    // $_SESSION['main']->userRequest['body']['cols']["proizvodi_grupe_field_GrupaSifra"] = $g;
    // $resp = $_SESSION['main']->execRequest($_SESSION['main']->userRequest['body'], $_SESSION['main']->userRequest['arrPath'] );




?>