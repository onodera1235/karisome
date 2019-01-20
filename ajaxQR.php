<?php
	
	//**************************************************************************************************
	// テストモードの切り替え
		$testMode = 'on'; // on or off
	//**************************************************************************************************
	
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
	
	
	//------------------------------------------------------------------------------
	//　　　　リクエストレスポンス
	//------------------------------------------------------------------------------
	$request = isset($_SERVER['HTTP_X_REQUESTED_WITH'])
	? strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) : '';
	if($request === 'xmlhttprequest'){ // Ajaxからのアクセスかどうかで分岐
		
		// 常時
		$ipAddress = $_SERVER["REMOTE_ADDR"];
		$timeStamp = getTimeStamp();
		$digit = filter_input(INPUT_POST, 'digit');
		$QRHash = filter_input(INPUT_POST, 'QRHash');
		$oldQRHash = filter_input(INPUT_POST, 'oldQRHash');
		$codeKey = filter_input(INPUT_POST, 'codeKey');
		$oldCodeKey = filter_input(INPUT_POST, 'oldCodeKey');
		$tmpId = filter_input(INPUT_POST, 'tmpId');
		$newName = filter_input(INPUT_POST, 'newName');
//		$position = filter_input(INPUT_POST, 'position');
		$targetHash = filter_input(INPUT_POST, 'targetHash');
		$remainSecond = 60; // ＱＲコード情報などのログイン関連情報を一時保存しておく上限時間（秒）
		$remainSecond2 = 120; // 一世代前の情報を一時保存しておく上限時間（秒）
		$returnMSG = '';
		
		if($digit === 'makeQR'){
			// 一世代前のQRHashをoldQRHashとして引き継ぐ
			$oldQRHash = $QRHash;
			$oldCodeKey = $codeKey;
			// 新たなQRHashを生成
			$rand = mt_rand();
			$baseText = rawurlencode($rand.$timeStamp.'私は小野寺昭生です');
			$QRHash = hash('md5',$baseText);
			$codeKey = floor(hexdec($QRHash)/3403000000000000000000000000000);
			if($codeKey < 1){
				$codeKey = '00000000'.$codeKey;
			}else if($codeKey < 10){
				$codeKey = '0000000'.$codeKey;
			}else if($codeKey < 100){
				$codeKey = '000000'.$codeKey;
			}else if($codeKey < 1000){
				$codeKey = '00000'.$codeKey;
			}else if($codeKey < 10000){
				$codeKey = '0000'.$codeKey;
			}else if($codeKey < 100000){
				$codeKey = '000'.$codeKey;
			}else if($codeKey < 1000000){
				$codeKey = '00'.$codeKey;
			}else if($codeKey < 10000000){
				$codeKey = '0'.$codeKey;
			}
			$filename_QRHash = './hash/QRHash.txt';
			$savedHashStr = loadFile($filename_QRHash);
			if(isset($savedHashStr)){
				$savedHashArray = json_decode($savedHashStr,true);
				// 設定時間を経過したログイン用ハッシュ値を削除する
				if(isset($savedHashArray)){
					$savedHashCount = count($savedHashArray);
					for($i = 0;$i < $savedHashCount;$i++){
						$savedSecond = $savedHashArray[$i][0];
						$pastSecond = time() - $savedSecond;
						if($pastSecond > $remainSecond){
							unset($savedHashArray[$i]);
						}
					}
					$savedHashArray = array_values($savedHashArray);
				}
			}else{
				$savedHashArray = array();
			}
			$innerArray = array();
			$innerArray[] = time(); // ログイン処理が中断されるとごみが残るので一定時間を超えたら消去するためのタイムスタンプ
			$innerArray[] = $QRHash;
			$innerArray[] = $codeKey;
			$savedHashArray[] = $innerArray;
			$savedHashStr = json_encode($savedHashArray);
			saveFile($savedHashStr,$filename_QRHash,'w');
			
			// 一世代前のQRHashとして残しておくための処理
			$filename_oldHash = './hash/oldHash.txt';
			$savedOldHashStr = loadFile($filename_oldHash);
			if(isset($savedOldHashStr)){
				$savedOldHashArray = json_decode($savedOldHashStr,true);
				// タイムオーバーを削除
				$savedOldHashArray = json_decode($savedOldHashStr,true);
				if(isset($savedOldHashArray)){
					$savedOldHashCount = count($savedOldHashArray);
					for($i = 0;$i < $savedOldHashCount;$i++){
						$savedOldSecond = $savedOldHashArray[$i][0];
						$pastOldSecond = time() - $savedOldSecond;
						if($pastOldSecond > $remainSecond2){
							unset($savedOldHashArray[$i]);
						}
					}
					$savedOldHashArray = array_values($savedOldHashArray);
				}
			}else{
				$savedOldHashArray = array();
			}
			$savedOldHashArray[] = $innerArray;
			$savedOldHashStr = json_encode($savedOldHashArray);
			saveFile($savedOldHashStr,$filename_oldHash,'w');
			if($testMode == 'on'){
				$url = 'http:onodera1235.php.xdomain.jp/karisome/QRFE.php?digit=getPair&hash='.$QRHash;
			}else if($testMode == 'off'){
				$url = 'https://karisome.info/QRFE.php?digit=getPair&hash='.$QRHash;
			}
			$qr_text = urlencode($url);
			$QRCode = './qr/php/qr_img.php?d='.$qr_text.'&t=J&s=4';
			$returnMSG = 'makeQROk';
			
		}else if($digit === "reLoadQR"){
			// 一時保存されているログイン用QRハッシュ値を探す（タイムオーバーで消えている可能性もあり）
			$filename_QRHash = './hash/QRHash.txt';
			$filename_list = './files/list.txt';
			$savedHashStr = loadFile($filename_QRHash);
			if(isset($savedHashStr)){
				$savedHashArray = json_decode($savedHashStr,true);
				if(isset($savedHashArray)){
					// まず設定時間を経過したログイン用ハッシュ値を削除する
					$savedHashCount = count($savedHashArray);
					$returnMSG = 'noHash'; // 取り敢えずnoHashをセット
					$QRCode = '';
					$url = '';
					for($i = 0;$i < $savedHashCount;$i++){
						$savedSecond = $savedHashArray[$i][0];
						$pastSecond = time() - $savedSecond;
						if($pastSecond > $remainSecond){
							unset($savedHashArray[$i]);
						}
					}
					$savedHashArray = array_values($savedHashArray);
					// 次に残った配列の中からハッシュ値に合致する配列を探す
					$savedHashCount = count($savedHashArray);
					for($i = 0;$i < $savedHashCount;$i++){
						$targetHash = $savedHashArray[$i][1];
						if($targetHash === $QRHash){
							if($testMode == 'on'){
								$url = 'http:onodera1235.php.xdomain.jp/karisome/QRFE.php?digit=getPair&hash='.$QRHash;
							}else if($testMode == 'off'){
								$url = 'https://karisome.info/QRFE.php?digit=getPair&hash='.$QRHash;
							}
							$qr_text = urlencode($url);
							$QRCode = './qr/php/qr_img.php?d='.$qr_text.'&t=J&s=4';
							$returnMSG = 'reLoadQROk'; // ここを通過すれば$returnMSGが書き換わる
							break;
						}else{
							$QRCode = '';
							$url = '';
						}
					}
					
				}else{
					$returnMSG = 'noHash';
					$QRCode = '';
					$url = '';
				}
			}else{
				$returnMSG = 'noHash';
				$QRCode = '';
				$url = '';
			}
			
			// QRコードが読み取られているかをチェック
			$listStr = loadFile($filename_list);
			if(isset($listStr)){
				$listArray = json_decode($listStr,true);
				// 本日登録されたデータ以外は省く（ここでは省いた後のデータの保存はしない）
				$listCount = count($listArray);
				for($i = 0;$i < $listCount;$i++){
					if($listArray[$i][0] != getToday()){
						unset($listArray[$i]);
					}
				}
				$listArray = array_values($listArray);
				
				// 残った配列からhashが同じものを探す
				$listCount = count($listArray);
				$check = 0;
				for($i = 0;$i < $listCount;$i++){
					if($listArray[$i][1] === $QRHash){
						$codeKey = $listArray[$i][2];
						$check = 1;
					}else if($listArray[$i][1] === $oldQRHash){ // 一世代前のＱＲコードでもＯＫとする
						$QRHash = $oldQRHash;
						$codeKey = $listArray[$i][2];
						$check = 2;
					}
					if($check == 1 || $check == 2){
						
						$tmpId = 'user1'; // QRコードを表示した側
						
						// tmpIdArrayの処理
						$filename_idArray = './user/'.$QRHash.'.txt';
						$tmpIdStr = loadFile($filename_idArray);
						if(isset($tmpIdStr)){
							$tmpIdArray = json_decode($tmpIdStr,true);
						}else{
							$tmpIdarray = array();
						}
						$tmpArray =
						array(
							'user1' => 'user1',
							'ipAddress' => $ipAddress
						);
						$tmpIdArray[] = $tmpArray;
						$tmpIdStr = json_encode($tmpIdArray);
						saveFile($tmpIdStr,$filename_idArray,'w');
						
						$returnMSG = 'readQR';
						break;
					}
				}
			}
			
		}else if($digit === 'reLoadMeeting'){
			$filename_meeting = './files/'.$QRHash.'.txt';
			$meetingStr = loadFile($filename_meeting);
			if(isset($meetingStr)){
				$meetingObj = json_decode($meetingStr,true);
				$returnMSG = 'reLoadMeetingOk';
			}else{
				$returnMSG = 'nothingMeetingFile';
			}
		}else if($digit === 'delMSG'){
			$filename_meeting = './files/'.$QRHash.'.txt';
			$meetingStr = loadFile($filename_meeting);
			if(isset($meetingStr)){
				$meetingObj = json_decode($meetingStr,true);
				$recordArray = $meetingObj['record'];
				$recordCount = count($recordArray);
				for($i = 0;$i < $recordCount;$i++){
					$savedHash = $recordArray[$i]['hash'];
					if($savedHash === $targetHash){
						$targetUpFile = $recordArray[$i]['fileName'];
						if($targetUpFile != ''){
							$targetUpFileName = './files/'.$targetUpFile;
							unlink($targetUpFileName);
						}
						unset($recordArray[$i]);
						break;
					}
				}
				$recordArray = array_values($recordArray);
				$meetingObj['record'] = $recordArray;
				$meetingStr = json_encode($meetingObj);
				saveFile($meetingStr,$filename_meeting,'w');
				$returnMSG = 'delMSGOk';
			}else{
				$returnMSG = 'noFile';
			}
		}else if($digit === 'changeName'){
			$filename_idArray = './user/'.$QRHash.'.txt';
			$tmpIdStr = loadFile($filename_idArray);
			if(isset($tmpIdStr) === true){
				$tmpIdArray = json_decode($tmpIdStr,true);
				$tmpIdCount = count($tmpIdArray);
				$returnMSG = 'changeNameOk';
				// 希望する表示名が既に使われていないかをチェック
				for($i = 0;$i < $tmpIdCount;$i++){
					$key = key($tmpIdArray[$i]);
					if($tmpIdArray[$i][$key] == $newName){
						$returnMSG = 'doubleCheck';
						break;
					}
				}
				// 同じ名前が使われていなかったら名前を保存
				if($returnMSG == 'changeNameOk'){
					for($i = 0;$i < $tmpIdCount;$i++){
						if(key($tmpIdArray[$i]) == $tmpId){
							$tmpIdArray[$i][$tmpId] = $newName;
							$tmpIdStr = json_encode($tmpIdArray);
							saveFile($tmpIdStr,$filename_idArray,'w');
							break;
						}
					}
				}
				// meetingObjを返す
				$filename_meeting = './files/'.$QRHash.'.txt';
				$meetingStr = loadFile($filename_meeting);
				if(isset($meetingStr)){
					$meetingObj = json_decode($meetingStr,true);
				}
			}
		}else if($digit === 'callAddQR'){
			if($testMode == 'on'){
				$url = 'http:onodera1235.php.xdomain.jp/karisome/QRFE.php?digit=addQR&hash='.$QRHash;
			}else if($testMode == 'off'){
				$url = 'https://karisome.info/QRFE.php?digit=addQR&hash='.$QRHash;
			}
			$qr_text = urlencode($url);
			$QRCode = './qr/php/qr_img.php?d='.$qr_text.'&t=J&s=4';
			$returnMSG = 'callAddQROk';
		}else if($digit === 'reLogin'){
			$filename_idArray = './user/'.$QRHash.'.txt';
			$tmpIdStr = loadFile($filename_idArray);
			if(isset($tmpIdStr)){
				$tmpIdArray = json_decode($tmpIdStr,true);
				$tmpIdCount = count($tmpIdArray);
				$check = 0;
				for($i = 0;$i < $tmpIdCount;$i++){
					$key = key($tmpIdArray[$i]);
					if($key == $tmpId){
						$check = 1;
						break;
					}
				}
				if($check == 1){
					$filename_meeting = './files/'.$QRHash.'.txt';
					$meetingStr = loadFile($filename_meeting);
					if(isset($meetingStr)){
						$meetingObj = json_decode($meetingStr,true);
						$returnMSG = 'reLoginOk';
					}else{
						$returnMSG = 'nothingMeetingFile';
					}
				}else{
					$returnMSG = 'noId';
				}
			}else{
				$returnMSG = 'noId';
			}
			if($returnMSG != 'noId'){
				// codeKeyを探して返す
				$filename_list = './files/list.txt';
				$listStr = loadFile($filename_list);
				if(isset($listStr) === true){
					$listArray = json_decode($listStr,true);
					$listCount = count($listArray);
					for($i = 0;$i < $listCount;$i++){
						if($listArray[$i][1] == $QRHash){
							$codeKey = $listArray[$i][2];
							break;
						}
					}
				}
			}else{
				$codeKey = '';
			}
		}
		
		// 常時
		// ログの書き込み
		if($digit != 'reLoadQR' && $digit != 'reLoadMeeting'){
			$log = $timeStamp.'|'.$ipAddress.'|'.$digit.'|'.$returnMSG.'#';
			saveFile($log,'./log/log.txt','log');
		}
		// レスポンスオブジェクト
		$obj = array();
		$obj['digit'] = $digit;
		$obj['returnMSG'] = $returnMSG;
		if(isset($QRCode)){
			$obj['QRCode'] = $QRCode;
		}
		if(isset($QRHash)){
			$obj['QRHash'] = $QRHash;
		}
		if(isset($oldQRHash)){
			$obj['oldQRHash'] = $oldQRHash;
		}
		if(isset($codeKey)){
			$obj['codeKey'] = $codeKey;
		}
		if(isset($oldCodeKey)){
			$obj['oldCodeKey'] = $oldCodeKey;
		}
		if(isset($tmpId)){
			$obj['tmpId'] = $tmpId;
		}
		$filename_idArray = './user/'.$QRHash.'.txt';
		$tmpIdStr = loadFile($filename_idArray);
		if(isset($tmpIdStr)){
			$tmpIdArray = json_decode($tmpIdStr,true);
			$obj['tmpIdArray'] = $tmpIdArray;
		}
//		if(isset($position)){
//			$obj['position'] = $position;
//		}
		if(isset($meetingObj)){
			$obj['meetingObj'] = $meetingObj;
		}
		$str = json_encode($obj);
		header('Content-Type: application/json; charset=UTF-8');
		echo $str;
	}
?>
