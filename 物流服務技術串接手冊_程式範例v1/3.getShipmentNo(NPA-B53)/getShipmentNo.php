<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API 範例 </title>
</head>

<body>
    <div class="container">
        <!--查詢物流寄件單資訊 -->
        <h1>API 範例</h1>
            <form action="getShipmentNoAPI.php" method="post">
                <fieldset>
                    <legend>參數輸入</legend>
                    <table border="1">
                        <tr>
                            <td>API網址：</td>
                            <td><input name="url" value="https://ccore.newebpay.com/API/Logistic/getShipmentNo" size="60" required><span style="color:red;">※必填</span></td>
                        </tr>
                        <tr>
                            <td rowspan="15">商店訂單編號</td>
                            <td><input name="MerchantOrderNo[]" maxlength="30" required><span style="color:red;">※必填，一次最多10筆</span></td>
                        </tr>
                        <tr>
                            <td><input name="MerchantOrderNo[]" maxlength="30"></td>
                        </tr>
                        <tr>
                            <td><input name="MerchantOrderNo[]" maxlength="30"></td>
                        </tr>
                        <tr>
                            <td><input name="MerchantOrderNo[]" maxlength="30"></td>
                        </tr>
                        <tr>
                            <td><input name="MerchantOrderNo[]" maxlength="30"></td>
                        </tr>
                        <tr>
                            <td><input name="MerchantOrderNo[]" maxlength="30"></td>
                        </tr>
                        <tr>
                            <td><input name="MerchantOrderNo[]" maxlength="30"></td>
                        </tr>
                        <tr>
                            <td><input name="MerchantOrderNo[]" maxlength="30"></td>
                        </tr>
                        <tr>
                            <td><input name="MerchantOrderNo[]" maxlength="30"></td>
                        </tr>
                        <tr>
                            <td><input name="MerchantOrderNo[]" maxlength="30"></td>
                        </tr>
                        <tr>
                            <td><input name="MerchantOrderNo[]" maxlength="30">
                            <span style="color:red;">超過10筆會發生錯誤</span></td>
                        </tr>
                        <tr>
                            <td><input name="MerchantOrderNo[]" maxlength="30"></td>
                        </tr>
                        <tr>
                            <td><input name="MerchantOrderNo[]" maxlength="30"></td>
                        </tr>
                        <tr>
                            <td><input name="MerchantOrderNo[]" maxlength="30"></td>
                        </tr>
                        <tr>
                            <td><input name="MerchantOrderNo[]" maxlength="30"></td>
                        </tr>
                        <tr>
                            <td>串接程式版本</td>
                            <td><input name="Version" value="1.0" maxlength="5" required><span style="color:red;">※必填(固定為1.0)</span></td>
                        </tr>
                        <tr>
                            <td>時間戮記</td>
                            <td><input name="TimeStamp" value="<?= time(); ?>" maxlength="50" required><span style="color:red;">※必填</span></td>
                        </tr>
                        <tr>
                            <td>回傳格式</td>
                            <td><input name="RespondType" value="JSON" maxlength="6" required><span style="color:red;">※必填(請帶JSON)</span></td>
                        </tr>
                        <tr>
                            <td>商店代號</td>
                            <td><input name="UID_" maxlength="15" required><span style="color:red;">※必填(此為NWP商店代號)</span></td>
                        </tr>
                        <tr>
                            <td>key</td>
                            <td><input name="key" size="32" required><span style="color:red;">※必填</span></td>
                        </tr>
                        <tr>
                            <td>iv</td>
                            <td><input name="iv" minlength="16" maxlength="16" required><span style="color:red;">※必填</span></td>
                        </tr>
                        <tr>
                            <td colspan="2" align="center"><input type="submit" value="參數轉換"></td>
                        </tr>
                    </table>
                </fieldset>
            </form>
            <a href="../">回上一頁</a>
    </div>
</body>

</html>