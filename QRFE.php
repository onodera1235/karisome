<!DOCTYPE html>
<html>

<head>
<title>Karisome</title>
<meta name="viewport" content="width=device-width,initial-scale=1.0,minimum-scale=1.0,maximum-scale=1.0,user-scalable=no">

<?php
	//----------------------------------------------------------------
	//　　　　ユーザー定義関数
	//----------------------------------------------------------------
	// 現在のタイムスタンプを生成する関数--------------
	function getTimeStamp(){
		date_default_timezone_set('Asia/Tokyo');
		$dateData = date('Y-n-j H:i:s'); // 加減算するときは、date('Y-n-j H:i:s',strtotime('+1 minute'))のようにします。minuteのところをyear,month,day,hour,secondに変えたり、('+1 minute')のところは($i.'minute')のように変数を使うこともできます
		return $dateData;
	}
	
	// 本日の日付データを生成する関数--------------
	function getToday(){
		date_default_timezone_set('Asia/Tokyo');
		$dateData = date('Y-n-j');
		return $dateData;
	}
	
	// 指定されたファイルを返す関数----------------------------------
	function loadFile($filename){
		$DATA = array();
		if(is_readable($filename) === TRUE){
			if(($fp = fopen($filename, 'r')) !== FALSE){
				while(($tmp = fgets($fp)) !== FALSE){
					$DATA[] = htmlspecialchars($tmp, ENT_QUOTES, 'UTF-8');
				}
				fclose($fp);
			}
		}
		foreach($DATA as $data){
			$str = $data;
		}
		if(isset($str)){
			$str = rawurldecode($str);
			return $str;
		}
	}
	
	// ファイルを保存する関数----------------------------------
	function saveFile($targetFile,$filePass,$type){
		if($type === 'log'){ // ログを保存する場合はエンコードしない
			$type = 'a';
		}else{
			$targetFile = rawurlencode($targetFile);
		}
		if(($fp = fopen($filePass,$type)) !== FALSE){
			if(fwrite($fp, $targetFile) === FALSE){
				print 'ファイル書き込み失敗:  '.$filePass;
			}
			fclose($fp);
		}
	}
	
	// テスト用ファイルを保存する関数----------------------------------
	function saveTestFile($targetFile){
		if(($fp = fopen('./test/test.txt','w')) !== FALSE){
			if(fwrite($fp, $targetFile) === FALSE){
				print 'ファイル書き込み失敗:  '.$filePass;
			}
			fclose($fp);
		}
	}
	
	//--------------------------------------------------------------------
	//　　　　常時実行処理
	//--------------------------------------------------------------------
	$ipAddress = $_SERVER["REMOTE_ADDR"];
	$timeStamp = getTimeStamp();
	
	if($_SERVER['REQUEST_METHOD'] === 'GET'){
		//----------------------------------------------------------------
		//　　　　ＧＥＴ渡しされてきたデータの処理
		//----------------------------------------------------------------
		if(isset($_GET['hash'])){
			$QRHash = $_GET['hash'];
		}else{
			$QRHash = '';
		}
		if(isset($_GET['digit'])){
			$digit = $_GET['digit'];
		}else{
			$digit = '';
		}
		$codeKey = '';
		// コードキーを入力してきた場合の特殊処理（最初のペアリングか既にペアリングが成立している場合の追加かで処理が分かれる）
		if($digit == 'getPairByCodeKey'){
			$codeKey = $QRHash;
			
			$filename_list = './files/list.txt';
			$listStr = loadFile($filename_list);
			if(isset($listStr)){
				// listに保存されているかを確認
				$listArray = json_decode($listStr,true);
				$listCount = count($listArray);
				$check = 0;
				for($i = 0;$i < $listCount;$i++){
					if($listArray[$i][2] == $codeKey){
						$targetArray = $listArray[$i];
						$QRHash = $targetArray[1];
						$filename_idArray = './user/'.$QRHash.'.txt';
						$idStr = loadFile($filename_idArray);
						if(isset($idStr)){
							// ペアリング成立済み
							$digit = 'addQR';
							$check = 1;
							break;
						}
					}
				}
			}else{
				// listがない場合
				$check = 0;
			}
			
			if($check == 0){
				// ペアリングが成立していないので、
				// QRHashにあるかどうかを探す
				$filename_QRHash = './hash/QRHash.txt';
				$QRHashStr = loadFile($filename_QRHash);
				if(isset($QRHashStr)){
					$QRHashArray = json_decode($QRHashStr,true);
					$QRHashCount = count($QRHashArray);
					for($i = 0;$i < $QRHashCount;$i++){
						if($QRHashArray[$i][2] == $codeKey){
							$targetArray = $QRHashArray[$i];
							$QRHash = $targetArray[1];
							$digit = 'getPair';
							$check = 1;
							break;
						}
					}
				}
				if($check == 0){
					// oldQRHashにあるかどうかを探す
					$filename_oldQRHash = './hash/oldHash.txt';
					$oldQRHashStr = loadFile($filename_oldQRHash);
					if(isset($oldQRHashStr)){
						$oldQRHashArray = json_decode($oldQRHashStr,true);
						$oldQRHashCount = count($oldQRHashArray);
						for($i = 0;$i < $oldQRHashCount;$i++){
							if($oldQRHashArray[$i][2] == $codeKey){
								$targetArray = $oldQRHashArray[$i];
								$QRHash = $targetArray[1];
								$digit = 'getPair';
								$check = 1;
								break;
							}
						}
					}
				}
			}
		}
		
		if($digit == 'getPairByCodeKey'){
			if($check == 0){
				// 最終的に見つからなかった場合
				$returnMSG = 'codeKeyError';
				$tmpId = '';
			}
		}else if($digit == 'getPair'){
			// 二重送信を防ぐ（同じQRHashのtmpIdArrayが存在していれば二重送信）
			$filename_idArray = './user/'.$QRHash.'.txt';
			$idStr = loadFile($filename_idArray);
			$filename_list = './files/list.txt';
			if(isset($idStr) == true){
				$returnMSG = 'doubleCheck';
				$tmpId = 'user2'; // ここに来るということはuser2（ペアリングが成立していない状態の初めてのユーザー）
			}else{
				$returnMSG = 'noHash';
				$filename_QRHash = './hash/QRHash.txt';
				$QRHashStr = loadFile($filename_QRHash);
				$listStr = loadFile($filename_list);
				if(isset($listStr)){
					$listArray = json_decode($listStr,true);
				}else{
					$listArray = array();
				}
				if(isset($QRHashStr)){
					$QRHashArray = json_decode($QRHashStr,true);
					$QRHashCount = count($QRHashArray);
					for($i = 0;$i < $QRHashCount;$i++){
						if($QRHashArray[$i][1] === $QRHash){
							$targetArray = $QRHashArray[$i];
							$targetArray[0] = getToday(); // タイムスタンプを更新（YYYY-MM-DD）
							$listArray[] = $targetArray;
							$listStr = json_encode($listArray);
							// $listを保存*********************************************************************
							saveFile($listStr,$filename_list,'w');
							// ********************************************************************************
							
							// $QRHashArrayから該当の配列を削除
							unset($QRHashArray[$i]);
							$QRHashArray = array_values($QRHashArray);
							$QRHashStr = json_encode($QRHashArray);
							// $QRHashを保存
							saveFile($QRHashStr,$filename_QRHash,'w');
							$returnMSG = 'QRLoginOk';
							break;
						}
					}
				}
				
				// 結果がタイムオーバーで'noHash'となったときにoldHashを探しに行く
				if($returnMSG == 'noHash'){
					$filename_oldHash = './hash/oldHash.txt';
					$oldHashStr = loadFile($filename_oldHash);
					if(isset($oldHashStr)){
						$oldHashArray = json_decode($oldHashStr,true);
						$oldHashCount = count($oldHashArray);
						for($i = 0;$i < $oldHashCount;$i++){
							if($oldHashArray[$i][1] == $QRHash){
								$targetArray = $oldHashArray[$i];
								$targetArray[0] = getToday(); // タイムスタンプを更新（YYYY-MM-DD）
								$listArray[] = $targetArray;
								$listStr = json_encode($listArray);
								// $listを保存*********************************************************************
								saveFile($listStr,$filename_list,'w');
								// ********************************************************************************
								
								// $oldHashArrayから該当の配列を削除
								unset($oldHashArray[$i]);
								$oldHashArray = array_values($oldHashArray);
								$oldHashStr = json_encode($oldHashArray);
								// $oldHashを保存
								saveFile($oldHashStr,$filename_oldHash,'w');
								$returnMSG = 'QRLoginOk';
								break;
							}
						}
					}
				}
				if($returnMSG == 'QRLoginOk'){
					// tmpIdArrayを作成・保存
					$tmpId = 'user2'; // QRコードを読み取った側
					$tmpIdArray =
					array(
						array(
							'user2' => $tmpId,
							'ipAddress' => $ipAddress
						)
					);
					$tmpIdStr = json_encode($tmpIdArray);
					saveFile($tmpIdStr,$filename_idArray,'w');
					
					// codeKeyを探し出して返す
					$listCount = count($listArray);
					for($i = 0;$i < $listCount;$i++){
						if($listArray[$i][1] == $QRHash){
							$codeKey = $listArray[$i][2];
							break;
						}
					}
				}else{
					$tmpId = '';
				}
			}
			
		}else if($digit == 'addQR'){
			$filename_idArray = './user/'.$QRHash.'.txt';
			$tmpIdStr = loadFile($filename_idArray);
			if(isset($tmpIdStr) === true){
				$tmpIdArray = json_decode($tmpIdStr,true);
				$tmpIdCount = count($tmpIdArray);
				// 同じipAddressからの送信でないかをチェック（二重登録防止）
				for($i = 0;$i < $tmpIdCount;$i++){
					$targetObj = $tmpIdArray[$i];
					$savedIpAddress = $targetObj['ipAddress'];
					if($savedIpAddress == $ipAddress){
						$returnMSG = 'doubleCheck';
						$tmpId = 'user2';
						break;
					}
				}
				if($returnMSG != 'doubleCheck'){
					$tmpId = 'user'.($tmpIdCount + 1);
					$innerArray =
					array(
						$tmpId => $tmpId,
						'ipAddress' => $ipAddress
					);
					$tmpIdArray[] = $innerArray;
					$tmpIdStr = json_encode($tmpIdArray);
					saveFile($tmpIdStr,$filename_idArray,'w');
					$returnMSG = 'addQROk';
				}
			}else{
				$returnMSG = 'noFile';
				$tmpId = '';
			}
		}else{
			$returnMSG = '';
			$tmpId = '';
		}
		
		// 常時実行処理
		$obj =
		array(
			'digit' => $digit,
			'returnMSG' => $returnMSG,
			'QRHash' => $QRHash,
			'codeKey' => $codeKey,
			'tmpId' => $tmpId
		);
	}
	
	if($_SERVER['REQUEST_METHOD'] === 'POST'){
		//----------------------------------------------------------------
		//　　　　POST渡しされたデータを格納する変数の指定
		//----------------------------------------------------------------
		$str1 = $_POST['str1'];
		$str1 = rawurldecode($str1);
		$obj = json_decode($str1,true);
		if(isset($obj['digit'])){
			$digit = $obj['digit'];
		}
		if(isset($obj['QRHash'])){
			$QRHash = $obj['QRHash'];
		}
		if(isset($obj['codeKey'])){
			$codeKey = $obj['codeKey'];
		}
		if(isset($obj['tmpId'])){
			$tmpId = $obj['tmpId'];
		}
		if(isset($obj['sendObj'])){
			$sendObj = $obj['sendObj'];
		}
//		if(isset($obj['position'])){
//			$position = $obj['position'];
//		}
		//----------------------------------------------------------------
		//　　　　ＰＯＳＴ渡しされてきたデータの処理
		//----------------------------------------------------------------
		
		if($digit === 'submitPhp'){ // user1がQRコードが読み取られていることを確認してメイン画面を開く段階
			// ここでファイルに保存されている古いデータを削除する
			// listの確認
			$filename_list = './files/list.txt';
			$listStr = loadFile($filename_list); // [[YYYY-MM-DD,QRHash],[],･････]
			if(isset($listStr)){
				$listArray = json_decode($listStr,true);
				$listCount = count($listArray);
				$today = getToday();
				$eraseArray = array(); // 削除対象データ（前日以前分）を入れるための配列
				for($i = 0;$i < $listCount;$i++){
					$dateStamp = $listArray[$i][0];
					if($dateStamp != $today){
						$eraseArray[] = $listArray[$i];
						unset($listArray[$i]); // listの該当箇所を削除
					}
				}
				$listArray = array_values($listArray);
				$listStr = json_encode($listArray);
				// $listを保存**********************************************************************
				saveFile($listStr,$filename_list,'w'); // 該当箇所削除後のlistを保存
				// ********************************************************************************
			}
			// ミーティングファイルとアップされているファイルとtmpIdArrayの削除
			$eraseCount = count($eraseArray);
			for($i = 0;$i < $eraseCount;$i++){
				$targetQRHash = $eraseArray[$i][1];
				$targetMeetingFile = './files/'.$targetQRHash.'.txt'; // ミーティングファイル
				$targetMeetingStr = loadFile($targetMeetingFile);
				if(isset($targetMeetingStr)){
					$targetMeetingArray = json_decode($targetMeetingStr,true);
					$recordArray = $targetMeetingArray['record'];
					$recordCount = count($recordArray);
					for($j = 0;$j < $recordCount;$j++){
						if($recordArray[$j]['fileName'] != ''){
							$upFile = $recordArray[$j]['fileName'];
							$upFileName = './files/'.$upFile;
							unlink($upFileName); // アップされているファイルを削除
						}
					}
				}
				if(isset($targetMeetingStr)){
					unlink($targetMeetingFile); // ミーティングファイルを削除
				}
				$targetIdFile = './user/'.$targetQRHash.'.txt';
				$targetIdStr = loadFile($targetIdFile);
				if(isset($targetIdStr) === true){
					unlink($targetIdFile); // tmpIdArrayファイルを削除
				}
			}
			
			$returnMSG = 'submitPhpOk';
			
		}else if($digit === 'meeting'){
			// 最初にグループ（ペアリング）が削除されていないかをチェック
			$groupHash = $sendObj['groupHash']; // {"groupHash":groupHash,"record":{"tmpId":tmpId,"message":myMessage,"hash":hash}}
			$filename_list = './files/list.txt';
			$listStr = loadFile($filename_list);
			if(isset($listStr) === true){
				$listArray = json_decode($listStr,true);
				$listCount = count($listArray);
				$check = 0;
				for($i = 0;$i < $listCount;$i++){
					if($listArray[$i][1] == $groupHash){
						$check = 1;
						break;
					}
				}
				if($check == 1){
					$filename_meeting= './files/'.$QRHash.'.txt';
					$meetingStr = loadFile($filename_meeting);
					if(isset($meetingStr)){
						$meetingObj = json_decode($meetingStr,true);
						$recordArray = $meetingObj['record'];
						$recordCount = count($recordArray);
						// 二重送信チェックのため自分の投稿のみを配列に入れる
						$tmpArray = array();
						for($i = 0;$i < $recordCount;$i++){
							if($recordArray[$i]['tmpId'] == $tmpId){
								$tmpArray[] = $recordArray[$i];
							}
						}
						$tmpCount = count($tmpArray);
						if($tmpCount > 0){
							$lastHash = $tmpArray[$tmpCount - 1]['hash'];
						}else{
							$lastHash = '';
						}
					}else{
						$meetingObj = array();
						$lastHash = '';
					}
					
					$sendRecordObj = $sendObj['record'];
					$sendMessage = $sendRecordObj['message'];
					$sendHash = $sendRecordObj['hash'];
					if($lastHash == $sendHash){
						$returnMSG = 'doubleCheck';
					}else{
						
						// 添付ファイルがある場合の処理
						if(is_uploaded_file($_FILES['myFile']['tmp_name'])){
							$innerArray = explode('.',$_FILES['myFile']['name']);
							$extension = $innerArray[1]; // 送られてきたファイルの拡張子
							// ファイルに名前を付けてフォルダに保存----------------------------------------------
							move_uploaded_file($_FILES['myFile']['tmp_name'], './files/'.$sendHash.'.'.$extension);
							$fileName = $sendHash.'.'.$extension;
						}else{
							$fileName = '';
						}
						
						$recordArray =
						array(
							'timeStamp' => $timeStamp,
							'tmpId' => $tmpId,
							'message' => $sendMessage,
							'hash' => $sendHash,
							'fileName' => $fileName
						);
						$meetingObj['record'][] = $recordArray;
						$meetingStr = json_encode($meetingObj);
						saveFile($meetingStr,$filename_meeting,'w');
						$returnMSG = 'meetingOk';
					}
				}else{
					$returnMSG = 'noUser';
				}
			}else{
				$returnMSG = 'noUser';
			}
		}else if($digit === 'reLoadSubmit'){ // ３人目以降の追加メンバーが登録操作を二重送信しても多重登録にならないように再読込させる
			$filename_meeting = './files/'.$QRHash.'.txt';
			$meetingStr = loadFile($filename_meeting);
			if(isset($meetingStr)){
				$meetingObj = json_decode($meetingStr,true);
				$returnMSG = 'reLoadSubmitOk';
			}else{
				$returnMSG = 'nothingMeetingFile';
			}
		}
		
	}
	
	//--------------------------------------------------------------------
	// 常時実行処理
	//--------------------------------------------------------------------
	// ログの書き込み
	if($digit != 'reLoadSubmit'){
		$log = $timeStamp.'|'.$ipAddress.'|'.$digit.'|'.$returnMSG.'#';
		saveFile($log,'./log/log.txt','log');
	}
	// レスポンスオブジェクト
	$filename_meeting = './files/'.$QRHash.'.txt';
	$meetingStr = loadFile($filename_meeting);
	if(isset($meetingStr)){
		$meetingObj = json_decode($meetingStr,true);
	}else{
		$meetingObj = array();
	}
	$obj['meetingObj'] = $meetingObj;
	$obj['returnMSG'] = $returnMSG;
	if(isset($tmpId)){
		$obj['tmpId'] = $tmpId;
	}
	$filename_idArray = './user/'.$QRHash.'.txt';
	$tmpIdStr = loadFile($filename_idArray);
	if(isset($tmpIdStr)){
		$tmpIdArray = json_decode($tmpIdStr,true);
		$obj['tmpIdArray'] = $tmpIdArray;
	}
	$str1 = json_encode($obj);
	$str1 = rawurlencode($str1);
	
?>

<link rel = "stylesheet" href = "./style.css" />
<link rel = "shortcut icon" href = "./favicon.ico" type = "image/x-icon">
<link rel = "apple-touch-icon" href = "./apple-touch-icon.png" sizes = "180x180">
<link rel = "icon" type = "image/png" href = "android-touch-icon.png" sizes = "192x192">
<!--
<link rel="shortcut icon" href="./favicon.ico" type="image/vnd.microsoft.icon">
<link rel="icon" href="./favicon.ico" type="image/vnd.microsoft.icon">
-->
<script src = "./QRFE.js"></script>
<script src = "./json2.js"></script>
<script src = "./jquery.js"></script>

</head>

<body class = "body" onLoad = "phpOpen()">
<form name = "domForm" id = "dom_php" enctype = "multipart/form-data" onsubmit = "return false">
 <input type = "hidden" name = "digit">
 <input type = "hidden" name = "hash">
 <input type = "hidden" name = "str1" value = '<?php echo $str1; ?>'>
  <table class = "barBack">
  <tr>
   <td><div id = "titleBar"></div></td>
  </tr>
 </table>
 <table class = "backL">
  <tr>
   <td><div id = "testConsol"></div></td>
  </tr>
 </table>
 <table class = "backL">
  <tr>
   <td><div id = "domAddQR"></div></td>
  </tr>
 </table>
 <table class = "back3">
  <tr>
   <td><div id = "dom1"></div></td>
  </tr>
 </table>
 <table class = "back3">
  <tr>
   <td><div id = "dom2"></div></td>
  </tr>
 </table>
 <table class = "back3">
  <tr>
   <td><div id = "dom3"></div></td>
  </tr>
 </table>
</form>

</body>

</html>