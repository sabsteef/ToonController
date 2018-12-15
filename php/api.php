<?php
session_start();
/*
    Safely controll your toon thermostat with a secure connection.

    MADE BY: Sander Jonk 2018 ( update by Stefan Ringelberg)

*/


// SETTINGS - CHANGE THESE \/\/\/\/\/\/\/\/\/

$PASSWORD = 'Password'; // PASSWORD TO GET ACCESS TO TOON CONTROLLS
$PASSWORD_VERSION = 1; // INCREASE WHEN NEW PASSWORD (ALSO CHANGE IN INDEX.PHP)
$ADRESS = '10.3.0.52'; // LOCAL IP ADRESS OF TOON SERVER
$VERSION = '4.9'; // TOON VERSION (SUPPORTED: 4.8 / 4.9)
// END SETTINGS /\/\/\/\/\/\/\/\



function buildUrl($adress, $get) {
    global $VERSION;
    if ($VERSION == "4.9") {
        return 'http://'. $adress .'/happ_thermstat?'. http_build_query($get);
    } else {
        return 'http://'. $adress .'/happ_thermostat?'. http_build_query($get);
    }
}

function buildUrlELC($adress, $get) {
    global $VERSION;
    if ($VERSION == "4.9") {
        return 'http://'. $adress . '/happ_pwrusage?'. http_build_query($get);
    } else {
        return 'http://'. $adress . '/happ_pwrusage?'. http_build_query($get);
    }
}

function BuildURLGAS($adress, $get) {
    global $VERSION;
    if ($VERSION == "4.9") {
        return 'http://'. $adress . '/hcb_rrd?'. http_build_query($get);
    } else {
        return 'http://'. $adress . '/hcb_rrd?'. http_build_query($get);
    }
}



function getData($url) {
    return json_decode(file_get_contents($url));
}

function isRemembered() {
    if (isset($_COOKIE['toon_remember'])) {
        $rememberedData = unserialize(file_get_contents('../data/remember.dat'));
        if (!is_array($rememberedData)) {
            $rememberedData = array();
        }
        $rememberId = $_COOKIE['toon_remember'];
        if (isset($rememberedData[$rememberId]) && $rememberedData[$rememberId] > $PASSWORD_VERSION) {
            return true;
        } else {
            return false;
        }
    } else {
        return false;
    }
}

function random_str($length = 10) {
    $characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    $charactersLength = strlen($characters);
    $randomString = '';
    for ($i = 0; $i < $length; $i++) {
        $randomString .= $characters[rand(0, $charactersLength - 1)];
    }
    return $randomString;
}

function remember() {
    global $PASSWORD_VERSION;
    $hash = sha1(random_str(16) . (string) microtime());
    $rememberedData = unserialize(file_get_contents('../data/remember.dat'));
    if (!is_array($rememberedData)) {
        $rememberedData = array();
    }
    $rememberedData[$hash] = $PASSWORD_VERSION;
    file_put_contents('../data/remember.dat', serialize($rememberedData));

    setcookie(
        "toon_remember",
        $hash,
        time() + (10 * 365 * 24 * 60 * 60),
        "/"
    );
    return $hash;
}

function isLoggedin() {
    if (isset($_SESSION['loggedin']) && $_SESSION['loggedin'] == true) {
        return true;
    } else {
        if (isRemembered()) {
            $_SESSION['loggedin'] = true;
        } else {
            return false;
        }
    }
}

$output = array(
    "success"=>false,
    "error"=>"UNKNOWN"
);

if (!isset($_POST['command'])) {
    $output['error'] = 'MISSING_COMMAND';
} else {
    // Handle commands

    $command = strtoupper($_POST['command']);

    if ($command == 'LOGIN') {
        if (!isset($_POST['password']) || $_POST['password'] !== $PASSWORD) {
            // Invalid password
            $_SESSION['loggedin'] = false;
            $output['error'] = 'INVALID_LOGIN';
        } else {
            // Valid password
            $_SESSION['loggedin'] = true;
            $output['success'] = true;
            $output['error'] = 'LOGGEDIN';
            remember();
        }
    }
     elseif ($command == 'APP' || $command == 'GAS' || $command == 'GCP') {

        if (!isLoggedin()) {
            $output['error'] = 'NO_PERMISSION';
        }
        if ($command == 'APP'){

            $url = buildUrl($ADRESS, $_GET);
          }
          if ($command == 'GCP') {
              $url = buildUrlELC($ADRESS, $_GET);
            }

            if ($command == 'GAS') {
                $url = BuildURLGAS($ADRESS, $_GET);
              }
            // Parse to toon
            $data = getData($url);
            $output['return'] = $data;
            $output['success'] = true;
            $output['error'] = 'NONE';
        }
    else {
        $output['error'] = 'INVALID_COMMAND';
    }
}

echo json_encode($output);


?>
