<?php
//商店資訊
$mid = $_POST['UID_'];
$key = $_POST['key'];
$iv = $_POST['iv'];
$url = $_POST['url'];
//remove empty values
$_POST['MerchantOrderNo'] = array_filter($_POST['MerchantOrderNo'], function ($value) {
    return $value !== '';
});
unset($_POST['key'], $_POST['iv'], $_POST['url']);

$data1 = json_encode($_POST);

//加密
$edata1 = bin2hex(openssl_encrypt($data1, "AES-256-CBC", $key, OPENSSL_RAW_DATA, $iv));

//壓碼
$hashs = "HashKey=" . $key . "&" . $edata1 . "&HashIV=" . $iv;
$hash = strtoupper(hash("sha256", $hashs));
?>

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>參數轉換</title>
</head>

<body>
    <fieldset>
        <legend>程式範例：</legend>
        <pre>
//商店資訊
$mid = $_POST['UID_'];
$key = $_POST['key'];
$iv = $_POST['iv'];
$url = $_POST['url'];
unset($_POST['key'], $_POST['iv'], $_POST['url']);

$data1 = json_encode($_POST);

//加密
$edata1 = bin2hex(openssl_encrypt($data1, "AES-256-CBC", $key, OPENSSL_RAW_DATA, $iv));

//壓碼
$hashs = "HashKey=" . $key . "&" . $edata1 . "&HashIV=" . $iv;
$hash = strtoupper(hash("sha256", $hashs));
    </pre>
    </fieldset>

    <form action="getShipmentNoResult.php" method="post">
    <input type="hidden" name="url" value="<?= $url; ?>">
        <fieldset>
            <legend>Post 參數</legend>
            <table>
                <tr>
                    <td>商店代號</td>
                    <td><input name="UID_" value="<?= $mid; ?>" readonly></td>
                </tr>
                <tr>
                    <td>串接程式版本</td>
                    <td><input name="Version_" value="<?= $_POST['Version']; ?>"></td>
                </tr>
                <tr>
                    <td>回傳格式</td>
                    <td><input name="RespondType_" value="<?= $_POST['RespondType']; ?>" readonly></td>
                </tr>
                <tr>
                    <td colspan="2">加密資料</td>

                </tr>
                <tr>
                    <td colspan="2"><textarea name="EncryptData_" cols="100" rows="7"><?= $edata1; ?></textarea></td>

                </tr>
                <tr>
                    <td colspan="2">雜湊資料</td>

                </tr>
                <tr>
                    <td colspan="2"><textarea name="HashData_" cols="100" rows="2"><?= $hash; ?></textarea></td>

                </tr>
                <tr>
                    <td colspan="2"><input type=submit value="交易測試"></td>

                </tr>
            </table>
        </fieldset>
    </form>
    <a href="getShipmentNo.php">回上一頁</a>
</body>

</html>