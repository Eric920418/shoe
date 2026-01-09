<?php
//參數
$parameter = $_POST['EncryptData'];

$key = ''; //請輸入key
$iv = ''; //請輸入iv

$trade_info=create_aes_decrypt($parameter,$key,$iv);
$data = json_decode($trade_info, true);

// 交易回傳資訊寫入檔案
$log = fopen('log.txt', 'a');
fwrite($log, date('Y-m-d H:i:s') . PHP_EOL);
fwrite($log, print_r($_POST, true) . PHP_EOL);
fwrite($log, print_r($data, true) . PHP_EOL);
fwrite($log, '-----------------------------------------' . PHP_EOL);
fclose($log);

//交易資料經 AES 解密後取得
function create_aes_decrypt($parameter = "", $key = "", $iv = "")
{
    return strippadding(openssl_decrypt(
        hex2bin($parameter),
        'AES-256-CBC',
        $key,
        OPENSSL_RAW_DATA | OPENSSL_ZERO_PADDING,
        $iv
    ));
}

function strippadding($string)
{
    $slast = ord(substr($string, -1));
    $slastc = chr($slast);
    if (preg_match("/$slastc{" . $slast . "}/", $string)) {
        $string = substr($string, 0, strlen($string) - $slast);
        return $string;
    } else {
        return false;
    }
}
