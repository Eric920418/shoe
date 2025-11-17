<?php
//串接網址
$api_url = $_POST['url'];

//POST參數
$post_str = [
    'UID_' => $_POST['UID_'],
    'EncryptData_' => $_POST['EncryptData_'],
    'HashData_' => $_POST['HashData_'],
    'Version_' => $_POST['Version_'],
    'RespondType_' => $_POST['RespondType_']
];

// curl 結果
$result = curl_(http_build_query($post_str), $api_url);
$result = json_decode($result['web_info'], true) ?? $result;
?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API 回傳結果</title>
</head>

<body>
    <fieldset>
        <legend>程式範例：</legend>
        <pre>
//串接網址
$api_url = $_POST['url'];

//POST參數
$post_str = [
    'UID_' => $_POST['UID_'],
    'EncryptData_' => $_POST['EncryptData_'],
    'HashData_' => $_POST['HashData_'],
    'Version_' => $_POST['Version_'],
    'RespondType_' => $_POST['RespondType_']
];

// curl 結果
$result = curl_(http_build_query($post_str), $api_url);
$result = json_decode($result['web_info'], true)??$result;

//curl 函式
function curl_($curl_str = '', $curl_url)
{
    //curl init
    $ch = curl_init();
    //curl set option
    curl_setopt($ch, CURLOPT_URL, $curl_url);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $curl_str);
    curl_setopt($ch, CURLOPT_HEADER, false);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, FALSE);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, FALSE);
    curl_setopt($ch, CURLOPT_HTTP_VERSION, CURL_HTTP_VERSION_1_1);
    //execute
    $result = curl_exec($ch);
    $retcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curl_error = curl_errno($ch);
    //close
    curl_close($ch);

    $return_array = [
        'url' => $curl_url,
        'send_parameter' => $curl_str,
        'http_status' => $retcode,
        'curl_error_no' => $curl_error,
        'web_info' => $result
    ];

    return $return_array;
}
        </pre>
    </fieldset>
    <fieldset>
        <legend>API回應訊息:：</legend>
        <pre>
            <?php print_r($result); ?>
        </pre>
    </fieldset>
    <a href="trace.php">回本頁</a>
</body>

</html>

<?php

//curl 函式
function curl_($curl_str = '', $curl_url)
{
    //curl init
    $ch = curl_init();
    //curl set option
    curl_setopt($ch, CURLOPT_URL, $curl_url);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $curl_str);
    curl_setopt($ch, CURLOPT_HEADER, false);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, FALSE);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, FALSE);
    curl_setopt($ch, CURLOPT_HTTP_VERSION, CURL_HTTP_VERSION_1_1);
    //execute
    $result = curl_exec($ch);
    $retcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curl_error = curl_errno($ch);
    //close
    curl_close($ch);

    $return_array = [
        'url' => $curl_url,
        'send_parameter' => $curl_str,
        'http_status' => $retcode,
        'curl_error_no' => $curl_error,
        'web_info' => $result
    ];

    return $return_array;
}
