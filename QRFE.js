//--------------------------------------------------------------------------
//　　　　グローバル変数・オブジェクト
//--------------------------------------------------------------------------
var testMode = "on"; // on or off

var codeKey;
var digit;
var oldCodeKey;
var oldQRCode;
var oldQRHash;
//var position;
var QRCode;
var QRHash;
var returnMSG;
var str1;
var tmpId;

var delQRTimer;
var indiQRTimer;
var meetingTimer;

var meetingObj;
var oldMeetingObj;
var obj = new Object();
var tmpIdArray;

//--------------------------------------------------------------------------
//　　　　HTMLファイルを開いたときの処理
//--------------------------------------------------------------------------
function htmlOpen(){
	obj["digit"] = "makeQR";
	ajax(obj);
}

//--------------------------------------------------------------------------
//　　　　phpファイルを開いたときの処理
//--------------------------------------------------------------------------
function phpOpen(){
	
	var str = document.forms["domForm"].elements["str1"].value;
	str = decodeURIComponent(str);
	obj = JSON.parse(str);
	digit = obj["digit"];
	returnMSG = obj["returnMSG"];
	QRHash = obj["QRHash"];
	codeKey = obj["codeKey"];
	tmpId = obj["tmpId"];
	tmpIdArray = obj["tmpIdArray"];
	meetingObj = obj["meetingObj"];
//	position = obj["position"];
	
	if(testMode == "on"){
		var testConsol =
		"digit:" + digit +
		"<br>returnMSG:" + returnMSG +
		"<br>QRHash:" + QRHash +
		"<br>codeKey:" + codeKey +
		"<br>tmpId:" + tmpId +
		"<br>tmpIdArray:" + JSON.stringify(tmpIdArray) +
		"<br>meetingObj:" + JSON.stringify(meetingObj);
		
		document.getElementById("testConsol").innerHTML = "【テスト中】<br>テスト用コンソールを表示中です。<br>" + testConsol;
	}
	
	indiTitleBar();
	indiMyMessage();
	if(digit == "getPair"){
		if(returnMSG === "QRLoginOk"){
			// ペアリングが成立したらQRHashをローカルに保存
			saveQRLocal();
			indiMain();
		}else if(returnMSG === "doubleCheck"){
			alert("二重送信と判定されました。");
			indiMain();
		}else if(returnMSG === "noHash"){
			document.getElementById("dom1").innerHTML =
			"<table>" +
				"<tr>" +
					"<td class = 'grayText'>タイムオーバーです。<br>再度ＱＲコードを読み取ってください。</td>" +
				"</tr>" +
			"</table>";
			document.getElementById("dom2").innerHTML = "";
			document.getElementById("dom3").innerHTML = "";
		}
	}else if(digit === "submitPhp"){
		if(returnMSG === "submitPhpOk"){
			indiMain();
		}
	}else if(digit === "meeting"){
		if(returnMSG === "meetingOk"){
//			indiMain();
			reLoadSubmit(); // 通常の二重送信は防止しているが、発言を削除（Ajax）した後に二重送信すると同じ発言が再登録されてしまうのを防ぐため書き込み後すぐに再読込させる
		}else if(returnMSG === "doubleCheck"){
			alert("二重送信と判定されました。");
			indiMain();
		}else if(returnMSG === "noUser"){
			indiNoPairMSG(); // ペアリングが解消されています
		}
	}else if(digit === "addQR"){
		if(returnMSG === "addQROk"){
			reLoadSubmit(); // 二重送信による多重登録防止のためにすぐに再読込させる（再読込ならその後二重送信されてもOK）
		}else if(returnMSG === "doubleCheck"){
			reLoadSubmit(); // それでも二重送信された場合は、もう一度カラサブミット
		}else if(returnMSG === "noFile"){
			document.getElementById("dom1").innerHTML =
			"<table>" +
				"<tr>" +
					"<td class = 'grayText'>タイムオーバーです。<br>再度ＱＲコードを読み取ってください。</td>" +
				"</tr>" +
			"</table>";
			document.getElementById("dom2").innerHTML = "";
			document.getElementById("dom3").innerHTML = "";
		}
	}else if(digit === "reLoadSubmit"){
		if(returnMSG === "reLoadSubmitOk"){
			indiMain();
		}else if(returnMSG == "nothingMeetingFile"){
			indiMain();
		}
	}else if(digit === "getPairByCodeKey"){
		if(returnMSG === "codeKeyError"){
			alert("コードキーが違うかタイムオーバーです。\nCode key Error or Time over !");
			htmlOpen();
		}
	}else{
//		alert("ログインしていません");
		document.getElementById("titleBar").innerHTML = "";
		document.getElementById("dom1").innerHTML = "";
		document.getElementById("dom2").innerHTML = "";
		document.getElementById("dom3").innerHTML = "";
		
		htmlOpen();
	}
}

//------------------------------------------------------------------------
//　　　　Ajax通信
//------------------------------------------------------------------------
function ajax(obj){
	
	$.ajax({
		type:"POST",
		url:"ajaxQR.php",
		data:obj, // オブジェクトのままでOK
		crossDomain:false,
		dataType:"json",
		scriptCharset:"UTF-8"
	}).done(function(data){
		digit = data["digit"]; // グローバル変数に渡す
		returnMSG = data["returnMSG"];
		QRCode = data["QRCode"];
		QRHash = data["QRHash"];
		oldQRHash = data["oldQRHash"];
		codeKey = data["codeKey"];
		oldCodeKey = data["oldCodeKey"];
		tmpId = data["tmpId"];
		tmpIdArray = data["tmpIdArray"];
		meetingObj = data["meetingObj"];
//		position = data["position"];
		
		ajaxOpen();
	}).fail(function(XMLHttpRequest,textStatus,errorThrown){
		if(errorThrown == ""){
//			alert("通信が切断されました。");
		}else{
			alert(JSON.stringify(errorThrown));
		}
	});
}

//--------------------------------------------------------------------------
//　　　　ajax通信を受けた後の処理
//--------------------------------------------------------------------------
function ajaxOpen(){
	if(testMode == "on"){
		var indiTest =
		"digit:" + digit +
		"<br>returnMSG:" + returnMSG +
		"<br>QRCode:" + QRCode +
		"<br>oldQRCode:" + oldQRCode +
		"<br>codeKey:" + codeKey +
		"<br>oldCodeKey:" + oldCodeKey +
		"<br>QRHash:" + QRHash +
		"<br>oldQRHash:" + oldQRHash +
		"<br>tmpId:" + tmpId +
		"<br>tmpIdArray:" + JSON.stringify(tmpIdArray) +
		"<br>oldMeetingObj:" + JSON.stringify(oldMeetingObj) +
		"<br>meetingObj:" + JSON.stringify(meetingObj);
		
		document.getElementById("testConsol").innerHTML = "【テスト中】<br>テスト用コンソールを表示中です。<br>" + indiTest;
	}
	
	
	if(digit === "makeQR"){
		if(returnMSG === "makeQROk"){
			indiQR();
		}else{
			alert("QRコードを表示できません。\n QR-Code cannot be displayed !");
		}
	}else if(digit === "reLoadQR"){
		if(returnMSG === "reLoadQROk"){
			indiQR();
		}else if(returnMSG === "readQR"){
			// ペアリングが成立したらQRHashをローカルに保存
			saveQRLocal();
			
			submitPhp();
		}else if(returnMSG === "noHash"){
			htmlOpen();
		}
	}else if(digit === "reLoadMeeting"){
		if(returnMSG === "reLoadMeetingOk"){
			indiMain();
		}else if(returnMSG === "nothingMeetingFile"){
			indiMain();
		}
	}else if(digit === "delMSG"){
		if(returnMSG === "delMSGOk"){
			alert("削除しました。\n Deleted");
			indiMain();
		}else if(returnMSG === "noFile"){
			alert("データがありません。\n No data !");
			indiMain();
		}
	}else if(digit === "changeName"){
		if(returnMSG === "changeNameOk"){
			indiTitleBar();
			indiMain();
		}else if(returnMSG === "doubleCheck"){
			alert("その名前は他で使用されています。\n Used name ! \n Please regist another name");
			indiTitleBar();
			indiMain();
		}
	}else if(digit === "callAddQR"){
		if(returnMSG === "callAddQROk"){
			indiAddQR();
		}
	}else if(digit === "reLogin"){
		if(returnMSG === "reLoginOk"){
			
			indiMyMessage();
			indiMain();
			
			
		}else if(returnMSG === "noId"){
			alert("コードキーの有効期限が切れています。\n The code key has expired.");
		}else if(returnMSG === "nothingMeetingFile"){
//			indiTitleBar();
			indiMyMessage();
			indiMain();
/*			var innerArea =
				"<table class = 'back2'>" +
					"<tr>" +
						"<td><div id = 'innerArea' class = 'area4'></div></td>" +
					"</tr>" +
				"</table>";
			var inner =
				"<table>" +
					"<tr>" +
						"<td class = 'grayText'>Code Key : " + QRHash + "</td>" +
					"</tr>" +
				"</table>";
			
			document.getElementById("dom2").innerHTML = innerArea;
			document.getElementById("innerArea").innerHTML = inner;*/
		}
	}
}

//--------------------------------------------------------------------------
//　　　　タイトルバーを表示させる関数
//--------------------------------------------------------------------------
function indiTitleBar(){
	if((digit == "getPair" || digit == "addQR" || digit == "reLoadSubmit" || digit == "reLoadMeeting" || digit == "meeting" ||
		digit == "submitPhp" || digit == "changeName" || digit == "delMSG" || digit == "reLogin") && returnMSG != "noHash"){
		
		if(tmpIdArray){
			var tmpIdCount = tmpIdArray.length;
			for(var i = 0;i < tmpIdCount;i++){
				var targetObj = tmpIdArray[i];
				if(Object.keys(targetObj)[0] == tmpId){
					var indiName = targetObj[tmpId];
					break;
				}
			}
			var titleBar =
			"<table class = 'bar'>" +
				"<input type = 'hidden' name = 'indiName' value = '" + indiName + "'>" +
				"<tr>" +
					"<td class = 'backL'>" +
						"<table border = '0' class = 'bar'>" +
							"<tr>" +
								"<td><img src = './logo.png'></td>" +
								"<td class = 'back50R' onClick = 'changeName()'><b>" + indiName + "</b></td>" +
								"<td class = 'backR'>（" + tmpIdCount + "）</td>" +
								"<td class = 'back8R'><input type = 'button' value = '＋👤' name = 'indiQRBtn' onClick = 'callAddQR()' class = 'btn5' style = 'height:30px;'></td>" +
							"</tr>" +
						"</table>" +
					"</td>" +
				"</tr>" +
			"</table>";
		}else{
			var titleBar =
			"<table class = 'bar'>" +
				"<tr>" +
					"<td class = 'back50L'><img src = './logo.png'></td>" +
				"</tr>" +
			"</table>";
		}
	}else{
		var titleBar =
		"<table class = 'bar'>" +
			"<tr>" +
				"<td class = 'back50L'><img src = './logo.png'></td>" +
			"</tr>" +
		"</table>";
	}
	
	document.getElementById("titleBar").innerHTML = titleBar;
}

//--------------------------------------------------------------------------
//　　　　自分の表示名を変更する
//--------------------------------------------------------------------------
function changeName(){
	
	clearTimeout(meetingTimer);
	
	var tmpIdCount = tmpIdArray.length;
	for(var i = 0;i < tmpIdCount;i++){
		var targetObj = tmpIdArray[i];
		if(Object.keys(targetObj)[0] == tmpId){
			var indiName = targetObj[tmpId];
			break;
		}
	}
	if((digit == "getPair" || digit == "addQR" || digit == "reLoadSubmit" || digit == "reLoadMeeting" || digit == "meeting" ||
		digit == "submitPhp" || digit == "changeName" || digit == "reLogin") && returnMSG != "noHash"){
		var titleBar =
		"<table class = 'bar'>" +
			"<tr>" +
				"<td class = 'backL'>" +
					"<table border = '0' class = 'bar'>" +
						"<tr>" +
							"<td><img src = './logo.png'></td>" +
							"<td class = 'back50R'><input type = 'text' name = 'userName' onBlur = 'doChangeName()'></td>" +
							"<td class = 'backR'>（" + tmpIdCount + "）</td>" +
							"<td class = 'back8R'><input type = 'button' value = '＋👤' name = 'indiQRBtn' onClick = 'callAddQR()' class = 'btn5' style = 'height:30px;'></td>" +
						"</tr>" +
					"</table>" +
				"</td>" +
			"</tr>" +
		"</table>";
	}else{
		var titleBar =
		"<table class = 'bar'>" +
			"<tr>" +
				"<td class = 'back50L'><img src = './logo.png'></td>" +
			"</tr>" +
		"</table>";
	}
	document.getElementById("titleBar").innerHTML = titleBar;
	document.forms["domForm"].elements["userName"].focus();
	document.forms["domForm"].elements["userName"].value = indiName;
}

//--------------------------------------------------------------------------
//　　　　自分の表示名を変更する
//--------------------------------------------------------------------------
function doChangeName(){
	var tmpIdCount = tmpIdArray.length;
	for(var i = 0;i < tmpIdCount;i++){
		var targetObj = tmpIdArray[i];
		if(Object.keys(targetObj)[0] == tmpId){
			var indiName = targetObj[tmpId];
			break;
		}
	}
	var newName = document.forms["domForm"].elements["userName"].value;
	if(indiName == newName){
		indiTitleBar();
		reLoadMeeting();
	}else if(newName == ""){
		alert("名前が入力されていません。\n No name !");
		indiTitleBar();
		reLoadMeeting();
	}else{
		obj = new Object();
		obj["digit"] = "changeName";
		obj["tmpId"] = tmpId;
		obj["newName"] = newName;
		obj["QRHash"] = QRHash;
		obj["codeKey"] = codeKey;
		ajax(obj);
	}
}

//--------------------------------------------------------------------------
//　　　　ＱＲコードを表示させる関数
//--------------------------------------------------------------------------
function indiQR(i){ // i=1ならコードキー手入力フォームからの戻り
	
	indiTitleBar();
	
	if(oldQRCode != QRCode || i == 1){ // 画面のちらつきを抑えるため、ＱＲコードが更新になっているときだけここを通過（１分間隔）
		if(testMode == "on"){
			var QR = "<td class = 'backC'><a href = './QRFE.php?digit=getPair&hash=" + QRHash + "' target = '_blanc'><img src = '" + QRCode + "' alt = 'ＱＲコード'></a></td>";
		}else if(testMode == "off"){
			var QR = "<td class = 'backC'><img src = '" + QRCode + "' alt = 'ＱＲコード'></td>";
		}
		var msg = 
		"<table border = '0' class = 'back3'>" +
			"<tr>" +
				"<td>" +
					"<table class = 'back3'>" +
						"<tr>" +
							"<td class = 'title'>撮った写真をその場で共有</td>" +
						"</tr>" +
						"<tr>" +
							"<td class = 'grayText'>Read QR-Code to connect with this device.</td>" +
						"</tr>" +
						"<tr>" +
							"<td class = 'subTitle'>" +
							"<br>「写真をシェアしたいけどSNSアカウントは教えたくない」というときに便利<br>" +
							"QRコードを別のスマホなどで読み取るだけでペアリングが完了します<br>" +
							"ペアリングは一晩で解消されるので、気軽につながることができます" +
							"</td>" +
						"</tr>" +
					"</table>" +
				"</td>" +
			"</tr>" +
			"<tr>" +
				"<td>" +
					"<table border = '0' class = 'back3'>" +
						"<tr>" + QR + "</tr>" +
						"<tr>" +
							"<td class = 'backC' style = 'color:#0066cc;' onClick = 'indiInputCodeKeyForm()'>Code Keyでペアリング（Connect by Code Key）</td>" +
						"</tr>" +
					"</table>" +
				"</td>" +
			"</tr>" +
			"<tr>" +
				"<td class = 'backR'>" +
					"<input type = 'button' value = 'Re-Login' onClick = 'indiReLoginCode()' class = 'btn1'>" +
				"</td>" +
			"</tr>" +
		"</table>"; 
		document.getElementById("dom1").innerHTML = msg;
	}
	if(i != 1){
		indiNoticeMSG();
	}
}

//--------------------------------------------------------------------------
//　　　　コードキーを手入力するフォームを表示させる関数
//--------------------------------------------------------------------------
function indiInputCodeKeyForm(){
	
//	clearTimeout(indiQRTimer);
	
	var inputCodeKeyForm =
	"<table class = 'backC'>" +
		"<tr>" +
			"<td>" +
				"<table class = 'backL'>" +
					"<tr>" +
						"<td class = 'title'>Code Key：" + codeKey + "</td>" +
					"</tr>" +
					"<tr>" +
						"<td>このCode Keyを相手に教えて端末に入力してもらうか、相手の端末に表示されているCode Keyを下のフォームに入力し「Pairing」ボタンを押してください。</td>" +
					"</tr>" +
				"</table>" +
			"</td>" +
		"</tr>" +
		"<tr>" +
			"<td>" +
				"<table class = 'backC'>" +
					"<tr>" +
						"<td class = 'col2C'>Code Key</td>" +
						"<td class = 'row3C'><input type = 'text' name = 'codeKey' class = 'inputL'></td>" +
						"<td class = 'row3C'><input type = 'button' value = 'Pairing' onClick = 'sendCodeKey()' class = 'btn1'></td>" +
						"<td class = 'row3C'><input type = 'button' value = 'Cancel' onClick = 'indiQR(1)' class = 'btn1'></td>" +
					"</tr>" +
				"</table>" +
			"</td>" +
		"</tr>" +
	"</table>";
	document.getElementById("dom1").innerHTML = inputCodeKeyForm;
}

//--------------------------------------------------------------------------
//　　　　コードキーを手入力しぺリングさせるときの処理
//--------------------------------------------------------------------------
function sendCodeKey(){
	var inputCodeKey = document.forms["domForm"].elements["codeKey"].value;
	if(codeKey == inputCodeKey || oldCodeKey == inputCodeKey){
		alert("自分とのペアリングはできません。\nCan't connect with yourself!");
	}else if(inputCodeKey == ""){
		alert("Code Keyが入力されていません。\nNo Code Key!");
	}else{
		document.forms["domForm"].elements["digit"].value = "getPairByCodeKey";
		document.forms["domForm"].elements["hash"].value = inputCodeKey;
		var target = document.getElementById("dom_php");
		target.action = "./QRFE.php";
		target.method = "get";
		target.submit();
	}
}

//--------------------------------------------------------------------------
//　　　　注意事項等への誘導メッセージなどを表示させる関数
//--------------------------------------------------------------------------
function indiNoticeMSG(){
	
	var notice =
	"<table>" +
		"<tr>" +
			"<td style = 'color:#0066cc;' onClick = 'indiManual()'><br>使い方（How to use）</td>" +
		"</tr>" +
		"<tr>" +
			"<td style = 'color:#0066cc;' onClick = 'indiNotice()'><br>注意事項等（Precautions）</td>" +
		"</tr>" +
		"<tr>" +
			"<td><br><a href = './blog/' target = '_blanc'>開発者ブログ</a></td>" +
		"</tr>" +
		"<tr>" +
			"<td><br><a href = 'https://github.com/onodera1235/karisome' target = '_blanc'>GitHub</a></td>" +
		"</tr>" +
	"</table>"; 
	document.getElementById("dom3").innerHTML = notice;
	
	indiQRTimer = setTimeout("reLoadQR()",5000);
}

//--------------------------------------------------------------------------
//　　　　禁止事項・免責事項等を表示させる関数
//--------------------------------------------------------------------------
function indiNotice(){
	
	clearTimeout(indiQRTimer);
	
	var notice =
	"<table class = 'backR'>" +
		"<tr>" +
			"<td><input type = 'button' value = 'English' onClick = 'indiEnglishNotice()'</td>" +
		"</tr>" +
	"</table>" +
	"<table>" +
		"<tr>" +
			"<td class = 'title'>１．注意事項</td>" +
		"</tr>" +
	"</table>" +
	"<table>" +
		"<tr>" +
			"<td class = 'subTitle'>　ペアリング情報や共有情報等データのクリア</td>" +
			"</td>" + 
		"</tr>" +
	"</table>" +
	"<table>" +
		"<tr>" +
			"<td>　</td>" +
			"<td>　ペアリング情報やチャットデータ・添付ファイルデータなどは、" +
			"日本時間の午前0時を経過すると、その日最初のペアリングが成立した時点ですべてクリアされます。<br>" +
			"　保存しておきたいデータなどはご自身で保存する等の対応をお願いします。" +
			"</td>" + 
		"</tr>" +
	"</table>" +
	"<table>" +
		"<tr>" +
			"<td class = 'title'>２．免責事項</td>" +
		"</tr>" +
	"</table>" +
	"<table>" +
		"<tr>" +
			"<td class = 'subTitle'>（１）データ漏洩</td>" +
			"</td>" + 
		"</tr>" +
	"</table>" +
	"<table>" +
		"<tr>" +
			"<td>　</td>" +
			"<td>　本アプリケーションは通信を暗号化するなどの対応を行っておりますが、" +
			"ハッキングや通信傍受などによりデータが窃取される可能性は排除しきれません。<br>" +
			"　万が一データが漏洩したことに伴い発生した損害については、本アプリケーション運営者は保証いたしかねますので、" +
			"ご理解の上ご利用ください。" +
			"</td>" + 
		"</tr>" +
	"</table>" +
	"<table>" +
		"<tr>" +
			"<td class = 'subTitle'>（２）データの消滅</td>" +
			"</td>" + 
		"</tr>" +
	"</table>" +
	"<table>" +
		"<tr>" +
			"<td>　</td>" +
			"<td>　利用者の操作またはシステムの動作の如何に関わらず、万が一データが消滅したことに伴い発生した損害については、" +
			"本アプリケーション運営者は保証いたしかねますので、ご理解の上ご利用ください。" +
			"</td>" + 
		"</tr>" +
	"</table>" +
	"<table>" +
		"<tr>" +
			"<td class = 'title'>３．著作権</td>" +
		"</tr>" +
	"</table>" +
	"<table>" +
		"<tr>" +
			"<td>　</td>" +
			"<td>　本アプリケーションの著作権は製作者である小野寺昭生に帰属します。<br>" +
			"　copyright(C) 2018.12.24 By Akio Onodera" +
			"</td>" + 
		"</tr>" +
	"</table>" +
	"<table>" +
		"<tr>" +
			"<td class = 'title'>４．その他</td>" +
		"</tr>" +
	"</table>" +
	"<table>" +
		"<tr>" +
			"<td>　</td>" +
			"<td>　ご意見ご要望などはmail@karisome.infoまでお寄せください。</td>" + 
		"</tr>" +
	"</table>";
	
	var btn =
	"<table>" +
		"<tr>" +
			"<td><input type = 'button' value = 'Back' onClick = 'indiNoticeMSG()' class = 'btn1'></td>" + 
		"</tr>" +
	"</table>";
	
	document.getElementById("dom3").innerHTML = btn + notice + btn;
}

function indiEnglishNotice(){
	
	var notice =
	"<table class = 'backR'>" +
		"<tr>" +
			"<td><input type = 'button' value = 'Japanene' onClick = 'indiNotice()'</td>" +
		"</tr>" +
	"</table>" +
	"<table>" +
		"<tr>" +
			"<td class = 'title'>1.Precautions</td>" +
		"</tr>" +
	"</table>" +
	"<table>" +
		"<tr>" +
			"<td class = 'subTitle'>　The connection state and data are cleared.</td>" +
			"</td>" + 
		"</tr>" +
	"</table>" +
	"<table>" +
		"<tr>" +
			"<td>　</td>" +
			"<td>　The connection state, chat data, attachment data, and so on, are cleared when the Japan time expires at midnight, when the first connection of the day is established. Please save your important data for yourself." +
			"</td>" + 
		"</tr>" +
	"</table>" +
	"<table>" +
		"<tr>" +
			"<td class = 'title'>2.Disclaimer</td>" +
		"</tr>" +
	"</table>" +
	"<table>" +
		"<tr>" +
			"<td class = 'subTitle'>Data leakage</td>" +
			"</td>" + 
		"</tr>" +
	"</table>" +
	"<table>" +
		"<tr>" +
			"<td>　</td>" +
			"<td>　This application is capable of encrypting communications, but it does not preclude the possibility of data being theft due to hacking or interception. The application operator cannot guarantee the damage incurred due to the leakage of data, please use it after understanding." +
			"</td>" + 
		"</tr>" +
	"</table>" +
	"<table>" +
		"<tr>" +
			"<td class = 'subTitle'>Data disappearing</td>" +
			"</td>" + 
		"</tr>" +
	"</table>" +
	"<table>" +
		"<tr>" +
			"<td>　</td>" +
			"<td>　This application operator cannot guarantee the damage caused by the disappearance of the data for the reason by the operation of the user or the reason due to the operation of the system, please use it after understanding." +
			"</td>" + 
		"</tr>" +
	"</table>" +
	"<table>" +
		"<tr>" +
			"<td class = 'title'>3.Copyright</td>" +
		"</tr>" +
	"</table>" +
	"<table>" +
		"<tr>" +
			"<td>　</td>" +
			"<td>　The copyright of this application belongs to Akio Onodera, the creator.<br>　Copyright (C) 2018.12.24 By Akio Onodera" +
			"</td>" + 
		"</tr>" +
	"</table>" +
	"<table>" +
		"<tr>" +
			"<td class = 'title'>4.Other</td>" +
		"</tr>" +
	"</table>" +
	"<table>" +
		"<tr>" +
			"<td>　</td>" +
			"<td>　Please send your opinion request to 'mail@karisome.info'. We may not be able to answer your request in a foreign language, so please use Japanese as much as possible or use easy and short English.</td>" + 
		"</tr>" +
	"</table>";
	
	var btn =
	"<table>" +
		"<tr>" +
			"<td><input type = 'button' value = 'Back' onClick = 'indiNoticeMSG()' class = 'btn1'></td>" + 
		"</tr>" +
	"</table>";
	
	document.getElementById("dom3").innerHTML = btn + notice + btn;
}

//--------------------------------------------------------------------------
//　　　　使い方を表示させる関数
//--------------------------------------------------------------------------
function indiManual(){
	
	clearTimeout(indiQRTimer);
	
	var msg =
	"<table class = 'backL' border = '0'>" +
		"<tr>" +
			"<td class = 'title'><br>使い方（How to use）</td>" + 
		"</tr>" +
		"<tr>" +
			"<td class = 'title'>1</td>" + 
		"</tr>" +
		"<tr>" +
			"<td><img src = './document/doc1.jpg'></td>" + 
		"</tr>" +
		"<tr>" +
			"<td>No user registration required.<br>" +
			"If someone reads this QR-Code on a device, that device connect to this device, chat, and file-pass.</td>" + 
		"</tr>" +
		"<tr>" +
			"<td class = 'title'><br>2</td>" + 
		"</tr>" +
		"<tr>" +
			"<td><img src = './document/doc2.jpg'></td>" + 
		"</tr>" +
		"<tr>" +
			"<td>This is the screen that reads the displayed QR-Code on another device.</td>" + 
		"</tr>" +
		"<tr>" +
			"<td class = 'title'><br>3</td>" + 
		"</tr>" +
		"<tr>" +
			"<td><img src = './document/doc3.jpg'></td>" + 
		"</tr>" +
		"<tr>" +
			"<td>This is state the device is connected to another.<br><br>" +
			"【caution!】<br>" +
			"This connection state will be eliminated when the first connection is established after midnight every day Japan time.<br>" +
			"If you send or receive a impotant file, please save it yourself.</td>" + 
		"</tr>" +
		"<tr>" +
			"<td class = 'title'><br>4</td>" + 
		"</tr>" +
		"<tr>" +
			"<td><img src = './document/doc4.jpg'></td>" + 
		"</tr>" +
		"<tr>" +
			"<td>You can send a sentence, a photo and so on.</td>" + 
		"</tr>" +
		"<tr>" +
			"<td class = 'title'><br>5</td>" + 
		"</tr>" +
		"<tr>" +
			"<td><img src = './document/doc5.jpg'></td>" + 
		"</tr>" +
		"<tr>" +
			"<td>You can show the QR-Code by pressing '＋👤button'. And you can add members by reading the QR-Code.</td>" + 
		"</tr>" +
		"<tr>" +
			"<td class = 'title'><br>6</td>" + 
		"</tr>" +
		"<tr>" +
			"<td><img src = './document/doc6.jpg'></td>" + 
		"</tr>" +
		"<tr>" +
			"<td>You can change your 'user-name view' by pressing 'user-name view'." +
		"</tr>" +
	"</table>";
	
	var btn =
	"<table>" +
		"<tr>" +
			"<td><input type = 'button' value = 'Back' onClick = 'indiNoticeMSG()' class = 'btn1'></td>" + 
		"</tr>" +
	"</table>";
	
	document.getElementById("dom3").innerHTML = btn + msg + btn;
}

//--------------------------------------------------------------------------
//　　　　QRコード再読込
//--------------------------------------------------------------------------
function reLoadQR(){
	clearTimeout(indiQRTimer);
	oldQRCode = QRCode; // QRコード情報を退避しておき、変化があるときのみ再表示させる
	obj["digit"] = "reLoadQR";
	obj["QRHash"] = QRHash;
	obj["oldQRHash"] = oldQRHash;
	obj["codeKey"] = codeKey;
	obj["oldCodeKey"] = oldCodeKey;
	ajax(obj);
}

//--------------------------------------------------------------------------
//　　　　メンバー追加用ＱＲコードを呼び出す関数
//--------------------------------------------------------------------------
function callAddQR(){
	clearTimeout(meetingTimer);
	obj["digit"] = "callAddQR";
	obj["QRHash"] = QRHash;
	obj["codeKey"] = codeKey;
	ajax(obj);
}

//--------------------------------------------------------------------------
//　　　　メンバー追加用ＱＲコードを表示する関数
//--------------------------------------------------------------------------
function indiAddQR(){
	if(testMode == "on"){
		var QR = "<td class = 'backC'><a href = './QRFE.php?digit=addQR&hash=" + QRHash + "' target = '_blanc'><img src = '" + QRCode + "' alt = 'ＱＲコード'></a></td>";
	}else if(testMode == "off"){
		var QR = "<td class = 'backC'><img src = '" + QRCode + "' alt = 'ＱＲコード'></td>";
	}
	var msg = 
		"<table border = '0' class = 'back3'>" +
			"<tr>" +
				"<td>" +
					"<table class = 'back3'>" +
						"<tr>" +
							"<td class = 'title'>メンバー追加</td>" +
						"</tr>" +
						"<tr>" +
							"<td class = 'grayText'>Read QR-Code to add member</td>" +
						"</tr>" +
						"<tr>" +
							"<td class = 'subTitle'>メンバー追加したい端末でＱＲコードを読み取るか、Code Keyを入力して下さい。</td>" +
						"</tr>" +
					"</table>" +
				"</td>" +
			"</tr>" +
			"<tr>" +
				"<td>" +
					"<table border = '0' class = 'back3'>" +
						"<tr>" + QR +"</tr>" +
						"<tr>" +
							"<td class = 'titleC'>Code Key:" + codeKey + "</td>" +
						"</tr>" +
						"<tr>" +
							"<td class = 'backC'><input type = 'button' value = '×' onClick = 'delQR()' class = 'btn5'></td>" +
						"</tr>" +
					"</table>" +
				"</td>" +
			"</tr>" +
		"</table>"; 
		document.getElementById("domAddQR").innerHTML = msg;
		
		delQRTimer = setTimeout("delQR()",60000);
		meetingTimer = setTimeout("reLoadMeeting()",5000);
}
function delQR(){
	document.getElementById("domAddQR").innerHTML = "";
	clearTimeout(delQRTimer);
}

//--------------------------------------------------------------------------
//　　　　ファイル共有画面を表示する関数
//--------------------------------------------------------------------------
function indiMyMessage(){
	if(tmpIdArray){
		var myMessage =
			"<table class = 'back3' border = '0'>" +
				"<tr>" +
					"<td>" +
						"<table class = 'back3' border = '0'>" +
							"<tr>" +
								"<td class = 'row2L'><input type = 'file' id = 'myFile' name = 'myFile' style = 'width:100%;'></td>" +
							"</tr>" +
							"<tr>" +
								"<td class = 'row2L'><input type = 'text' id = 'myMessage' onkeypress = 'onMeeting(event.keyCode)' style = 'width:99%;'></td>" +
							"</tr>" +
						"</table>" +
					"</td>" +
					"<td>" +
						"<table border = '0'>" +
							"<tr>" +
								"<td class = 'row2L'><input type = 'button' value = '📤' name = 'sendMessageBtn' onClick = 'sendMessage()' class = 'btn3' style = 'height:50px;'></td>" +
							"</tr>" +
						"</table>" +
					"</td>" +
				"</tr>" +
			"</table>";
		document.getElementById("dom1").innerHTML = myMessage;
	}
}

function indiMain(k,l){
	
	indiTitleBar();
	
	if(tmpIdArray && document.forms["domForm"].elements["indiName"]){
		
		var oldMeetingStr = JSON.stringify(oldMeetingObj);
		var meetingStr = JSON.stringify(meetingObj);
		if((oldMeetingStr != meetingStr) || digit == "reLogin"){
			
			var tmpIdCount = tmpIdArray.length;
			
			var innerArea =
				"<table class = 'back2'>" +
					"<tr>" +
						"<td><div id = 'innerArea' class = 'area4' onScroll = 'getPosition()'></div></td>" +
					"</tr>" +
				"</table>";
			
			var inner = "";
			if(meetingObj && meetingObj["record"]){
				var recordArray = meetingObj["record"];
				var recordCount = recordArray.length;
				if(recordCount > 0){
					for(var i = recordCount - 1;i >= 0;i--){
						var recordObj = recordArray[i];
						var targetId = recordObj["tmpId"];
						var message = recordObj["message"];
						message = message.split("amp;").join("");
						var timeStamp = recordObj["timeStamp"];
						// アップファイルの表示
						if(recordObj["fileName"]){
							var fileName = recordObj["fileName"];
							// 拡張子がjpg,gif,bmp,pngのときだけ画像を表示し、それ以外のときはリンクを表示する
							var extension = fileName.split(".")[1];
							if(extension == "bmp" || extension == "jpg" || extension == "JPG" || extension == "jpeg" ||
								extension == "gif" || extension == "png"){
								file = "<a href = './files/" + fileName + "' target = '_blanc'>" +
									"<img src = './files/" + fileName + "' alt = " + fileName + " style = 'width:100%;'></a>";
							}else{
								file = "<a href = './files/" + fileName + "' target = '_blanc'>ファイルを表示</a>";
							}
						}else{
							var file = "";
						}
						
						if(targetId === tmpId){
							// 自分の投稿
							inner = inner +
							"<table class = 'back2' style = 'width:97%;' border = '0'>" +
								"<tr>" +
									"<td style = 'width:40%;'></td>" +
									"<td class = 'meeting1'>" +
										"<table class = 'back1' border = '0'>" +
											"<tr>" +
												"<td style = 'text-align:center;'>" + file + "</td>" +
											"</tr>" +
											"<tr>" +
												"<td style = 'font-size:90%;'>" + message + "</td>" +
											"</tr>" +
											"<tr>" +
												"<td style = 'text-align:right;'><input type = 'button' value = '×' onClick = 'delMSG(" + i + ")' class = 'btn2'></td>" +
											"</tr>" +
										"</table>" +
									"</td>" +
									"<td style = 'width:0%;'></td>" +
								"</tr>" +
								"<tr>" +
									"<td></td>" +
									"<td class = 'row3R' style = 'font-size:70%;'>" + "（" + timeStamp + "）</td>" +
									"<td></td>" +
								"</tr>" +
							"</table><br>";
						}else{
							// 自分以外の投稿
							for(var j = 0;j < tmpIdCount;j++){
								var targetObj = tmpIdArray[j];
								if(Object.keys(targetObj)[0] == targetId){
									var indiName = targetObj[targetId];
									break;
								}
							}
							inner = inner +
							"<table class = 'back2' style = 'width:97%;' border = '0'>" +
								"<tr>" +
									"<td style = 'font-size:90%;width:20%;'>" +
										"<table>" +
											"<tr>" +
												"<td style = 'font-size:80%;'>" + indiName + "</td>" +
											"</tr>" +
											"<tr>" +
												"<td style = 'font-size:70%;'>" + "（" + timeStamp + "）</td>" +
											"</tr>" +
										"</table>" +
									"</td>" +
									"<td class = 'meeting2'>" +
										"<table class = 'back9' border = '0'>" +
											"<tr>" +
												"<td style = 'text-align:center;'>" + file + "</td>" +
											"</tr>" +
											"<tr>" +
												"<td style = 'font-size:90%;'>" + message + "</td>" +
											"</tr>" +
										"</table>" +
									"</td>" +
									"<td style = 'width:20%;'></td>" +
								"</tr>" +
							"</table><br>";
						}
					}
				}
			}
			
			// ログインしている人の情報
			var memberInfo =
			"<table>" +
				"<tr>" +
					"<td class = 'title'>参加者（Member）</td>" +
				"</tr>" +
			"</table>" +
			"<table>";
			for(var i = 0;i < tmpIdCount;i++){
				var targetObj = tmpIdArray[i];
				var innerKey = Object.keys(targetObj)[0];
				var member = targetObj[innerKey];
				memberInfo = memberInfo +
				"<tr>" +
					"<td>" + member + "</td>" +
				"</tr>";
			}
			memberInfo = memberInfo +
			"</table>";
			
			document.getElementById("dom2").innerHTML = innerArea + memberInfo;
			document.getElementById("innerArea").innerHTML = inner;
//			document.getElementById("innerArea").scrollTop = position;
		}
		meetingTimer = setTimeout("reLoadMeeting()",5000);
	}else{
		
		indiNoPairMSG();
	}
}

//--------------------------------------------------------------------------
//　　　ペアリングが解消となっている旨のメッセージを表示させる関数
//--------------------------------------------------------------------------
function indiNoPairMSG(){
	document.getElementById("titleBar").innerHTML =
	"<table class = 'bar'>" +
		"<tr>" +
			"<td class = 'back50L'><img src = './logo.png'></td>" +
		"</tr>" +
	"</table>";
	document.getElementById("dom1").innerHTML = "";
	document.getElementById("dom2").innerHTML =
	"<table>" +
		"<tr>" +
			"<td class = 'grayText'>ペアリングが解消されています</td>" +
		"</tr>" +
		"<tr>" +
			"<td class = 'grayText'>Not connected</td>" +
		"</tr>" +
	"</table>";
}

//--------------------------------------------------------------------------
//　　　ミーティング情報を再読込する関数
//--------------------------------------------------------------------------
function reLoadMeeting(){
	clearTimeout(meetingTimer);
	oldMeetingObj = meetingObj; // meetingObjを退避しておき、変化があるときのみ再表示させる
	obj = new Object();
	obj["digit"] = "reLoadMeeting";
	obj["tmpId"] = tmpId;
//	obj["position"] = position;
	obj["QRHash"] = QRHash;
	obj["codeKey"] = codeKey;
	ajax(obj);
}

//--------------------------------------------------------------------------
//　　　「（メッセージ）発信」ボタンが押されたときの処理
//--------------------------------------------------------------------------
function sendMessage(){
	var myMessage = document.getElementById("myMessage").value;
	var myFile = document.getElementById("myFile").value;
	if(myMessage === "" && myFile === ""){
		alert("発言内容が入力されていません。\n No remark !");
		return;
	}else{
		myMessage = myMessage.split("<").join("&lt;");
		myMessage = myMessage.split(">").join("&gt;");
		var encMSG = encodeURIComponent(myMessage);
		var rnd = Math.random();
		var hash = MD5Main(rnd + encMSG);
		if(meetingObj && meetingObj["groupHash"]){
			var groupHash = meetingObj["groupHash"];
		}else{
			var groupHash = QRHash;
		}
		var sendObj = {
			"groupHash":groupHash,
			"record":{
				"tmpId":tmpId,
				"message":myMessage,
				"hash":hash
			}
		};
		obj["sendObj"] = sendObj;
//		obj["position"] = position;
		obj["digit"] = "meeting";
		
		send(obj);
	}
}

//--------------------------------------------------------------------------
//　　　「×」ボタン（発言削除）が押されたときの処理
//--------------------------------------------------------------------------
function delMSG(i){
	var recordArray = meetingObj["record"];
	var targetMSG = recordArray[i];
	var targetHash = targetMSG["hash"];
	obj = new Object();
	obj["digit"] = "delMSG";
	obj["tmpId"] = tmpId;
//	obj["position"] = position;
	obj["targetHash"] = targetHash;
	obj["QRHash"] = QRHash;
	obj["codeKey"] = codeKey;
	ajax(obj);
}

//--------------------------------------------------------------------------
//　　　画面の位置情報を取得する関数
//--------------------------------------------------------------------------
function getPosition(){
	if(document.getElementById("innerArea")){
		position = document.getElementById("innerArea").scrollTop;
	}else{
		position = 0;
	}
}

//--------------------------------------------------------------------------
//　　　　サブミット関数
//--------------------------------------------------------------------------
function send(obj){
	var str = JSON.stringify(obj);
	var encodeStr = encodeURIComponent(str);
	document.forms["domForm"].elements["str1"].value = encodeStr;
	var target = document.getElementById("dom_php");
	target.method = "post";
	target.action = "./QRFE.php";
	target.submit();
}

function submitPhp(){ // user1（QRコードを表示した側）がQRコードが読み取られていることを確認してメイン画面を開くためのサブミット関数
	obj["digit"] = "submitPhp";
	obj["tmpId"] = tmpId;
	obj["QRHash"] = QRHash;
	obj["codeKey"] = codeKey;
	send(obj);
}

function reLoadSubmit(){ // ３人目以降の追加メンバーが登録操作を二重送信しても多重登録にならないように再読込させる
	obj["digit"] = "reLoadSubmit";
	obj["tmpId"] = tmpId;
	obj["QRHash"] = QRHash;
	obj["codeKey"] = codeKey;
	send(obj);
}

//--------------------------------------------------------------------------
//　　　　キーが押されたときの処理
//--------------------------------------------------------------------------
function onMeeting(code){
	if(code == 13){
		document.forms["domForm"].elements["sendMessageBtn"].focus();
	}
}

//------------------------------------------------------------------------------
//　　　　ペアリングが成立した時点でQRHashをローカルに保存
//------------------------------------------------------------------------------
function saveQRLocal(){
	var name = "karisomeHash";
	var savedQRHashStr = loadLocal(name);
	if(savedQRHashStr){
		var savedQRHashArray = JSON.parse(savedQRHashStr);
	}else{
		var savedQRHashArray = new Array();
	}
	var nowObj = new Date();
	var nowMSecond = nowObj.getTime(); // 1970.1.1午前00:00:00を0としたミリ秒データ
	var newInnerArray = new Array;
	newInnerArray.push(nowMSecond);
	newInnerArray.push(QRHash);
	newInnerArray.push(tmpId);
	var savedQRHashCount = savedQRHashArray.length;
	var newArray = new Array();
	for(var i = 0;i < savedQRHashCount;i++){
		var targetArray = savedQRHashArray[i];
		if(targetArray[0] > (nowMSecond - 86400000)){ // 24時間以内のものだけを残す
			newArray.push(targetArray);
		}
	}
	newArray.push(newInnerArray);
	var newStr = JSON.stringify(newArray);
	saveLocal(name,newStr);
}

//------------------------------------------------------------------------------
//　　　　再ログインのためのコードキーを表示させる関数
//------------------------------------------------------------------------------
function indiReLoginCode(){
	
	clearTimeout(indiQRTimer);
	
	var savedQRHashStr = loadLocal("karisomeHash");
	if(savedQRHashStr){
		var title =
		"<table>" +
			"<tr>" +
				"<td class = 'title'>再ログイン用コードキー</td>" +
			"</tr>" +
			"<tr>" +
				"<td class = 'grayText'>Codekey for Re-Login</td>" +
			"</tr>" +
		"</table>";
		var subTitle =
		"<table>" +
			"<tr>" +
				"<td class = 'subTitle'>コードキーを選択し、「Login」ボタンを押してください</td>" +
			"</tr>" +
			"<tr>" +
				"<td class = 'grayText'>Select Codekey and press Login button.</td>" +
			"</tr>" +
		"</table>";
		var inner =
		"<table class = 'backC'>" +
			"<tr>" +
				"<td class = 'colC'></td>" +
				"<td class = 'colC'>Pairing date and time</td>" +
				"<td class = 'colC'>Code Key</td>" +
			"</tr>";
		
		var savedQRHashArray = JSON.parse(savedQRHashStr);
		var savedQRCount = savedQRHashArray.length;
		for(var i = 0;i < savedQRCount;i++){
			var mSecond = savedQRHashArray[i][0];
			var dateObj = new Date(mSecond);
			var YYYY = dateObj.getFullYear();
			var MM = dateObj.getMonth() + 1;
			var DD = dateObj.getDate();
			var hh = dateObj.getHours();
			if(hh < 10){
				hh = "0" + hh;
			}
			var mm = dateObj.getMinutes();
			if(mm < 10){
				mm = "0" + mm;
			}
			var ss = dateObj.getSeconds();
			if(ss < 10){
				ss = "0" + ss;
			}
			var timeStamp = YYYY + "-" + MM + "-" + DD + "　" + hh + ":" + mm + ":" + ss;
			var code = savedQRHashArray[i][1];
			tmpId = savedQRHashArray[i][2];
			inner = inner +
			"<tr>" +
				"<td class = 'rowC'><input type = 'radio' name = 'codeKey' id = 'codeKey_" + i + "'></td>" +
				"<td class = 'rowC'>" + timeStamp + "</td>" +
				"<td class = 'rowR'><div id = 'code_" + i + "'>" + code + "</div></td>" +
				"<input type = 'hidden' name = 'tmpId_" + i + "' value = '" + tmpId + "'>" +
			"</tr>";
		}
		inner = inner +
		"</table>";
		var btn =
		"<table class = 'backC'>" +
			"<tr>" +
				"<td><input type = 'button' value = 'Back' onClick = 'backQR()' class = 'btn1'></td>" +
				"<td><input type = 'button' value = 'Login' onClick = 'reLogin(" + i + ")' class = 'btn1'></td>" +
			"</tr>" +
		"</table>";
		document.getElementById("dom1").innerHTML = title + subTitle + inner + btn;
	}else{
		alert("保存されているコードキーがありません。\n Code key is not saved");
	}
}

//------------------------------------------------------------------------------
//　　　　「backQRボタン」が押されたときの処理
//------------------------------------------------------------------------------
function backQR(){
	oldQRCode = ""; // oldQRCodeとQRCodeを違うものにしないとindiQR関数が動作しない
	indiQR();
}

//------------------------------------------------------------------------------
//　　　　コードキーを選択して再ログインさせる関数
//------------------------------------------------------------------------------
function reLogin(i){ // iはコードキーの数
	var check = 0;
	for(var j = 0;j < i;j++){
		if(document.getElementById("codeKey_" + [j]).checked === true){
			var targetCode = document.getElementById("code_" + [j]).innerHTML;
			tmpId = document.forms["domForm"].elements["tmpId_" + [j]].value;
			obj = new Object();
			obj["digit"] = "reLogin";
			obj["tmpId"] = tmpId;
			obj["QRHash"] = targetCode;
			obj["codeKey"] = codeKey;
			ajax(obj);
			
			check = 1;
			break;
		}
	}
	if(check == 0){
		alert("コードキーが選択されていません。\n Select code key !");
	}
}

//------------------------------------------------------------------------------
//　　　　ローカルに保存
//------------------------------------------------------------------------------
function saveLocal(name,str){
	str = encodeURIComponent(str);
	if (typeof localStorage == "undefined") {
		document.cookie = name + "=" + str;
	}else{
		localStorage.setItem(name,str);
	}
}

//------------------------------------------------------------------------------
//　　　　ローカルから呼び出し
//------------------------------------------------------------------------------
function loadLocal(name){
	var result = null;
	if (typeof localStorage == "undefined") {
    	var cookieName = name + '=';
    	var allcookies = document.cookie;
    	var position = allcookies.indexOf( cookieName );
    	if( position != -1 ){
			var startIndex = position + cookieName.length;
			var endIndex = allcookies.indexOf( ";", startIndex );
			if( endIndex == -1 ){
				endIndex = allcookies.length;
			}
			result = allcookies.substring( startIndex, endIndex );
    	}
	}else{
		result = localStorage.getItem(name);
	}
	if(result == "null" || result == null){
		result = "";
	}else{
		result = decodeURIComponent(result);
	}
	return result;
}

//--------------------------------------------------------------------------
//　　　　カンマ区切り数字に直す関数
//--------------------------------------------------------------------------
function comma(price){
	var PRICE = String(price);
	var priceLength = PRICE.length;
	var innerStr;
	var i;
	if(PRICE.charAt(0) == "-"){ // 値がマイナスの場合
		innerStr = "▲";
		if(priceLength % 3 == 0){
			innerStr = innerStr + PRICE.substr(1,2)
			for(i = 3; i < priceLength;i = i + 3){
				innerStr = innerStr + ",";
				innerStr = innerStr + PRICE.substr(i,3);
			}
		}else if(priceLength % 3 == 1){
			innerStr = innerStr + PRICE.substr(1,3)
			for(i = 4; i < priceLength;i = i + 3){
				innerStr = innerStr + ",";
				innerStr = innerStr + PRICE.substr(i,3);
			}
		}else if(priceLength % 3 == 2){
			innerStr = innerStr + PRICE.substr(1,1)
			for(i = 2; i < priceLength;i = i + 3){
				innerStr = innerStr + ",";
				innerStr = innerStr + PRICE.substr(i,3);
			}
		}
	}else{ // 値がプラスの場合
		if(priceLength % 3 == 0){
			innerStr = PRICE.substr(0,3)
			for(i = 3; i < priceLength;i = i + 3){
				innerStr = innerStr + ",";
				innerStr = innerStr + PRICE.substr(i,3);
			}
		}else if(priceLength % 3 == 1){
			innerStr = PRICE.substr(0,1)
			for(i = 1; i < priceLength;i = i + 3){
				innerStr = innerStr + ",";
				innerStr = innerStr + PRICE.substr(i,3);
			}
		}else if(priceLength % 3 == 2){
			innerStr = PRICE.substr(0,2)
			for(i = 2; i < priceLength;i = i + 3){
				innerStr = innerStr + ",";
				innerStr = innerStr + PRICE.substr(i,3);
			}
		}
	}
	return innerStr;
}

//--------------------------------------------------------------------------
//　　　　Object.keys()を使うための関数
//--------------------------------------------------------------------------
if(!Object.keys){
	Object.keys = function(obj){
		var keys = [];
		for (var i in obj) {
			if (obj.hasOwnProperty(i)) {
				keys.push(i);
			}
		}
		return keys;
	}
}

//--------------------------------------------------------------------------
//　　　　JSONかどうかを判定するための関数
//--------------------------------------------------------------------------
var isJSON = function(arg) {
    arg = (typeof arg === "function") ? arg() : arg;
    if (typeof arg  !== "string") {
        return false;
    }
    try {
    arg = (!JSON) ? eval("(" + arg + ")") : JSON.parse(arg);
        return true;
    } catch (e) {
        return false;
    }
};

//-----------------------------------------------------------------------
//　　　　ハッシュ関数（ＭＤ５）ライブラリ
//-----------------------------------------------------------------------
    var MD5Round1S;
    var MD5Round2S;
    var MD5Round3S;
    var MD5Round4S;
    var MD5PADDING;
        // RFC1321 P10 の S11～S44 の define
    MD5Round1S = new Array(7,12,17,22);
    MD5Round2S = new Array(5,9,14,20);
    MD5Round3S = new Array(4,11,16,23);
    MD5Round4S = new Array(6,10,15,21);
        // RFC1321 P10 の PADDING[64]
    MD5PADDING = new Array(128,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);
        // グローバルなスコープを持つ変数
        // MD5Main() で初期化する
            // 入力文字のコードを格納する配列
    var MD5IntInputData;
        // MD5 の結果(コード)を格納する配列
    var MD5digest;
        // RFC1321 context 構造体の count 配列
        // これの単位は bit
    var MD5contextCount;
        // RFC1321 context 構造体の state 配列
        // RFC1321 P4 の word A,B,C,D
    var MD5contextState;
        // RFC1321 context 構造体の buffer 配列
    var MD5contextBuffer;
        ///////////////////////////////////////
        // RFC1321 P10 で define されている F()
    function MD5F(x,y,z){
     var ans;
     var temp;
     temp = BitNot(x);
     temp = temp & 0xffffffff;
     ans = BitOr(BitAnd(x,y),BitAnd(temp,z));
     return ans;
    }
        ///////////////////////////////////////
        // RFC1321 P10 で define されている G()
    function MD5G(x,y,z){
     var ans;
     var temp;
     temp = BitNot(z);
     temp = temp & 0xffffffff;
     ans = BitOr(BitAnd(x,z),BitAnd(y,temp));
     return ans;
    }
        ///////////////////////////////////////
        // RFC1321 P10 で define されている H()
    function MD5H(x,y,z){
     var ans;
     
     ans = BitXor(BitXor(x,y),z);
     return ans;
    }
        ///////////////////////////////////////
        // RFC1321 P10 で define されている I()
    function MD5I(x,y,z){
     var ans;
     var temp;
     temp = BitNot(z);
     temp = temp & 0xffffffff;
     ans = BitXor(y,BitOr(x,temp));
     return ans;
    }
        ///////////////////////////////////////
        // RFC1321 P10 で define されている ROTATE_LEFT()
    function MD5ROTATE_LEFT(x,n){
     var ans;
     var ans1;
     var ans2;
     // ans1 = (x << n) & 0xffffffff;
     // ans2 = (x >>> (32-n)) & 0xffffffff;
     // ans = ans1 | ans2;
     ans1 = (x * Math.pow(2,n)) % 4294967296;
     ans2 = Math.floor(x / Math.pow(2,32-n));
     ans = ans1 + ans2;
     return ans;
    }
        ///////////////////////////////////////
        // RFC1321 P10 で define されている FF()
    function MD5FF(a,b,c,d,x,s,ac){
     var ans;
     ans = (a + MD5F(b,c,d) + x + ac) % 4294967296;
     ans = MD5ROTATE_LEFT(ans,s);
     ans = (ans + b) % 4294967296;
     return ans;
    }
        ///////////////////////////////////////
        // RFC1321 P11 で define されている GG()
    function MD5GG(a,b,c,d,x,s,ac){
     var ans;
     ans = (a + MD5G(b,c,d) + x + ac) % 4294967296;
     ans = MD5ROTATE_LEFT(ans,s);
     ans = (ans + b) % 4294967296;
     return ans;
    }
        ///////////////////////////////////////
        // RFC1321 P11 で define されている HH()
    function MD5HH(a,b,c,d,x,s,ac){
     var ans;
     ans = (a + MD5H(b,c,d) + x + ac) % 4294967296;
     ans = MD5ROTATE_LEFT(ans,s);
     ans = (ans + b) % 4294967296;
     return ans;
    }
        ///////////////////////////////////////
        // RFC1321 P11 で define されている II()
    function MD5II(a,b,c,d,x,s,ac){
     var ans;
     ans = (a + MD5I(b,c,d) + x + ac) % 4294967296;
     ans = MD5ROTATE_LEFT(ans,s);
     ans = (ans + b) % 4294967296;
     return ans;
    }
        ///////////////////////////////////////
        // RFC1321 P11 の MD5Update()
        // inputLen の単位は byte
    function MD5Update(input,inputLen){
        // myIndex の単位は byte
     var i;
     var myIndex;
     var partLen;
        // contextCount[0] を byte 単位に変換して
        // 64byte 単位で余りが myIndex
     // myIndex = (MD5contextCount[0] >>> 3) & 0x3f;
     myIndex = (MD5contextCount[0] / 8) % 64;
        // bit 単位にして格納
     // MD5contextCount[0] += inputLen <<< 3;
     MD5contextCount[0] += inputLen * 8;

     // if(MD5contextCount[0] < inputLen <<< 3){
     if(MD5contextCount[0] < inputLen * 8){
      MD5contextCount[1]++;
     }
        // 8倍(3bit シフト)した場合、
        // 上の 3bit のデータが捨てられる可能性がある
        // その値を格納
     MD5contextCount[1] += (inputLen >>> 29) & 0x07;
        // 64 の余り
     partLen = 64 - myIndex;
     if(partLen <= inputLen){
      MD5Memcpy(myIndex,input,0,partLen);
      MD5Transform(MD5contextState,MD5contextBuffer,0);
      for(i=partLen;i+63<inputLen;i+=64){
       MD5Transform(MD5contextState,input,i);
      }
      myIndex = 0;
     }else{
      i=0;
     }
     MD5Memcpy(myIndex,input,i,inputLen-i);
    }
        ///////////////////////////////////////
        // RFC1321 P12 の MD5Final()
    function MD5Final(){
     var bits;
     var myIndex;
     var padLen;
     bits = new Array(8);
     MD5Encode(bits,MD5contextCount,8);
        // 8 で割って(bitをbyteにして)64で割った余り
     // myIndex = (MD5contextCount[0] >>> 3) & 0x3f;
     myIndex = (MD5contextCount[0] / 8) % 64;
     if(myIndex < 56){
      padLen = 56 - myIndex;
     }else{
      padLen = 120 - myIndex;
     }
     MD5Update(MD5PADDING,padLen);
     MD5Update(bits,8);
     MD5Encode(MD5digest,MD5contextState,16);
    }
        ///////////////////////////////////////
        // RFC1321 P15 の MD5_memcpy()
        // MD5contextBuffer へコピー
    function MD5Memcpy(iti1,input,iti2,len){
     var i;
     for(i=0;i<len;i++){
      MD5contextBuffer[iti1+i] = input[iti2+i];
     }
    }
        ///////////////////////////////////////
        // RFC1321 P13 の MD5Transform()
    function MD5Transform(state,block,i){
     var a;
     var b;
     var c;
     var d;
     var x;
     var i;
     a = state[0];
     b = state[1];
     c = state[2];
     d = state[3];
     x = new Array(16);
     MD5Decode(x,block,64);
     ///////////////////////////////////////
     // Round1
     a = MD5FF(a,b,c,d,x[0],MD5Round1S[0],0xd76aa478);
     d = MD5FF(d,a,b,c,x[1],MD5Round1S[1],0xe8c7b756);
     c = MD5FF(c,d,a,b,x[2],MD5Round1S[2],0x242070db);
     b = MD5FF(b,c,d,a,x[3],MD5Round1S[3],0xc1bdceee);
     a = MD5FF(a,b,c,d,x[4],MD5Round1S[0],0xf57c0faf);
     d = MD5FF(d,a,b,c,x[5],MD5Round1S[1],0x4787c62a);
     c = MD5FF(c,d,a,b,x[6],MD5Round1S[2],0xa8304613);
     b = MD5FF(b,c,d,a,x[7],MD5Round1S[3],0xfd469501);
     a = MD5FF(a,b,c,d,x[8],MD5Round1S[0],0x698098d8);
     d = MD5FF(d,a,b,c,x[9],MD5Round1S[1],0x8b44f7af);
     c = MD5FF(c,d,a,b,x[10],MD5Round1S[2],0xffff5bb1);
     b = MD5FF(b,c,d,a,x[11],MD5Round1S[3],0x895cd7be);
     a = MD5FF(a,b,c,d,x[12],MD5Round1S[0],0x6b901122);
     d = MD5FF(d,a,b,c,x[13],MD5Round1S[1],0xfd987193);
     c = MD5FF(c,d,a,b,x[14],MD5Round1S[2],0xa679438e);
     b = MD5FF(b,c,d,a,x[15],MD5Round1S[3],0x49b40821);
     ///////////////////////////////////////
     // Round2
     a = MD5GG(a,b,c,d,x[1],MD5Round2S[0],0xf61e2562);
     d = MD5GG(d,a,b,c,x[6],MD5Round2S[1],0xc040b340);
     c = MD5GG(c,d,a,b,x[11],MD5Round2S[2],0x265e5a51);
     b = MD5GG(b,c,d,a,x[0],MD5Round2S[3],0xe9b6c7aa);
     a = MD5GG(a,b,c,d,x[5],MD5Round2S[0],0xd62f105d);
     d = MD5GG(d,a,b,c,x[10],MD5Round2S[1],0x2441453);
     c = MD5GG(c,d,a,b,x[15],MD5Round2S[2],0xd8a1e681);
     b = MD5GG(b,c,d,a,x[4],MD5Round2S[3],0xe7d3fbc8);
     a = MD5GG(a,b,c,d,x[9],MD5Round2S[0],0x21e1cde6);
     d = MD5GG(d,a,b,c,x[14],MD5Round2S[1],0xc33707d6);
     c = MD5GG(c,d,a,b,x[3],MD5Round2S[2],0xf4d50d87);
     b = MD5GG(b,c,d,a,x[8],MD5Round2S[3],0x455a14ed);
     a = MD5GG(a,b,c,d,x[13],MD5Round2S[0],0xa9e3e905);
     d = MD5GG(d,a,b,c,x[2],MD5Round2S[1],0xfcefa3f8);
     c = MD5GG(c,d,a,b,x[7],MD5Round2S[2],0x676f02d9);
     b = MD5GG(b,c,d,a,x[12],MD5Round2S[3],0x8d2a4c8a);
     ///////////////////////////////////////
     // Round3
     a = MD5HH(a,b,c,d,x[5],MD5Round3S[0],0xfffa3942);
     d = MD5HH(d,a,b,c,x[8],MD5Round3S[1],0x8771f681);
     c = MD5HH(c,d,a,b,x[11],MD5Round3S[2],0x6d9d6122);
     b = MD5HH(b,c,d,a,x[14],MD5Round3S[3],0xfde5380c);
     a = MD5HH(a,b,c,d,x[1],MD5Round3S[0],0xa4beea44);
     d = MD5HH(d,a,b,c,x[4],MD5Round3S[1],0x4bdecfa9);
     c = MD5HH(c,d,a,b,x[7],MD5Round3S[2],0xf6bb4b60);
     b = MD5HH(b,c,d,a,x[10],MD5Round3S[3],0xbebfbc70);
     a = MD5HH(a,b,c,d,x[13],MD5Round3S[0],0x289b7ec6);
     d = MD5HH(d,a,b,c,x[0],MD5Round3S[1],0xeaa127fa);
     c = MD5HH(c,d,a,b,x[3],MD5Round3S[2],0xd4ef3085);
     b = MD5HH(b,c,d,a,x[6],MD5Round3S[3],0x4881d05);
     a = MD5HH(a,b,c,d,x[9],MD5Round3S[0],0xd9d4d039);
     d = MD5HH(d,a,b,c,x[12],MD5Round3S[1],0xe6db99e5);
     c = MD5HH(c,d,a,b,x[15],MD5Round3S[2],0x1fa27cf8);
     b = MD5HH(b,c,d,a,x[2],MD5Round3S[3],0xc4ac5665);
     ///////////////////////////////////////
     // Round4
     a = MD5II(a,b,c,d,x[0],MD5Round4S[0],0xf4292244);
     d = MD5II(d,a,b,c,x[7],MD5Round4S[1],0x432aff97);
     c = MD5II(c,d,a,b,x[14],MD5Round4S[2],0xab9423a7);
     b = MD5II(b,c,d,a,x[5],MD5Round4S[3],0xfc93a039);
     a = MD5II(a,b,c,d,x[12],MD5Round4S[0],0x655b59c3);
     d = MD5II(d,a,b,c,x[3],MD5Round4S[1],0x8f0ccc92);
     c = MD5II(c,d,a,b,x[10],MD5Round4S[2],0xffeff47d);
     b = MD5II(b,c,d,a,x[1],MD5Round4S[3],0x85845dd1);
     a = MD5II(a,b,c,d,x[8],MD5Round4S[0],0x6fa87e4f);
     d = MD5II(d,a,b,c,x[15],MD5Round4S[1],0xfe2ce6e0);
     c = MD5II(c,d,a,b,x[6],MD5Round4S[2],0xa3014314);
     b = MD5II(b,c,d,a,x[13],MD5Round4S[3],0x4e0811a1);
     a = MD5II(a,b,c,d,x[4],MD5Round4S[0],0xf7537e82);
     d = MD5II(d,a,b,c,x[11],MD5Round4S[1],0xbd3af235);
     c = MD5II(c,d,a,b,x[2],MD5Round4S[2],0x2ad7d2bb);
     b = MD5II(b,c,d,a,x[9],MD5Round4S[3],0xeb86d391);
     ///////////////////////////////////////
     state[0] = (state[0] + a) % 4294967296;
     state[1] = (state[1] + b) % 4294967296;
     state[2] = (state[2] + c) % 4294967296;
     state[3] = (state[3] + d) % 4294967296;
    }
        ///////////////////////////////////////
        // RFC1321 P15 の Decode()
        // 4つの文字コードを 32bit(4*8bit)の整数にする
        // 入力配列は、4 の倍数である事
    function MD5Decode(output,input,len){
     var i;
     var j;
     for(i=0;4*i<len+3;i++){
      j = 4*i;
      output[i] = input[j] + (input[j+1] *256) + (input[j+2] * 65536) + (input[j+3] *16777216);
     }
    }
        ///////////////////////////////////////
        // RFC1321 P15 の Encode()
        // 32bit 整数から、4つの文字にする
    function MD5Encode(output,input,len){
     var temp;
     for(i=0;4*i<len+3;i++){
      j = 4*i;
      temp = input[i];
      output[j] = temp & 0xff;
      output[j+1] = (temp >>> 8) & 0xff;
      output[j+2] = (temp >>> 16) & 0xff;
      output[j+3] = (temp >>> 24) & 0xff;
     }
    }
        ///////////////////////////////////////
        // MD5 の外部からアクセスされるインターフェイス・メソッド
        // 引数に MD5 ハッシュにしたい[文字列]を格納する
//--------------------------------------------------------------------------
//　　　　ここからがメインの関数
//--------------------------------------------------------------------------
    function MD5Main(input){
     var myStr;
     var myChar;
     var len;
     var i;
     var j;
     var iti;
     var seedStr;
     var err;
     var ans;
        // MD5 のグローバル変数の初期化
        // RFC1321 P11 の MD5Init() メソッドを含み
        // MD5Update() を経て、MD5Final() まで処理し、
        // 結果を文字列にデコードして出力する
     MD5contextCount = new Array(0,0);
     MD5contextState = new Array(0x67452301,0xefcdab89,0x98badcfe,0x10325476);
     MD5contextBuffer = new Array(64);
     MD5IntInputData = new Array();
     MD5digest = new Array(16);
        // ローカル変数の初期化
     j = 0;
                // 文字列を整数(文字コード)の配列にする
        // %nn にならない文字のコード
        // これに、33 を加えるとコードになる。
        // 「\」「`」は %nn になるので、テキトーな文字(A)で埋めている
     seedStr = '' + '!"#$%&';
     seedStr = "" + seedStr + "'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ";
     seedStr = "" + seedStr + "[A]^_Aabcdefghijklmnopqrstuvwxyz{|}~";
     err = 0;
        // %nn に変換
     myStr = escape(input);
        // 数値の配列へ置き換え
     for(i=0;i<myStr.length;i++){
      myChar = "" + myStr.charAt(i);
      if(myChar == '%'){
       myChar = "" + myStr.charAt(i+1) + myStr.charAt(i+2);
       i+=2;
       myChar = parseInt(myChar,16);
      }else{
       iti = seedStr.indexOf(myChar,0);
       if(iti < 0){
        err = 1;
       }else{
        myChar = 33 + iti;
       }
      }
      if(err == 0){
       MD5IntInputData[j] = myChar;
       j++;
      }else{
       break;
      }
     }
     if(err == 0){
        // MD5Update() を実行
      MD5Update(MD5IntInputData,MD5IntInputData.length);
        // MD5Final() を実行
      MD5Final();
        // 結果を文字列にデコード
      myChar = "" + "";
      ans = "" + "";
      for(i=0;i<16;i++){
       myChar = "" + "0" + MD5digest[i].toString(16);
       myChar = myChar.substring(myChar.length-2,myChar.length);
       ans = ans + myChar;
      }
      myChar = unescape(myChar);
     }else{
        // ここに、エラー処理
        // %nn 処理がおかしい。%nn にならない文字列でリストにないヤツがいる
      ans = "";
     }
     return ans;
    }


        // 符合なし 32bit ビット演算
        // From http://rocketeer.dip.jp/sanaki/free/javascript/freejs18.htm
        // 32bit 符合なしビット演算(反転)
        // 入力値 : 0 <= s <= 4294967295
        // 戻り値 : 0 <= 戻り値 <= 4294967295
    function BitNot(s){
     var s1;
     var s2;
     var ans;
     s1 = s & 0xffff;
     s2 = (s >>> 16) & 0xffff;
     s1 = ~s1;
     s2 = ~s2;
     s1 = s1 & 0xffff;
     s2 = s2 & 0xffff;
     ans = BitSub(s1,s2);
     return ans;
    }
        // 32bit 符合なしビット演算(OR)
        // 入力値 : 0 <= s <= 4294967295
        // 入力値 : 0 <= t <= 4294967295
        // 戻り値 : 0 <= 戻り値 <= 4294967295
    function BitOr(s,t){
     var s1;
     var s2;
     var t1;
     var t2;
     var ans1;
     var ans2;
     var ans;
     s1 = s & 0xffff;
     s2 = (s >>> 16) & 0xffff;
     t1 = t & 0xffff;
     t2 = (t >>> 16) & 0xffff;
     ans1 = (s1 | t1) & 0xffff;
     ans2 = (s2 | t2) & 0xffff;
     ans = BitSub(ans1,ans2);
     return ans;
    }
        // 32bit 符合なしビット演算(AND)
        // 入力値 : 0 <= s <= 4294967295
        // 入力値 : 0 <= t <= 4294967295
        // 戻り値 : 0 <= 戻り値 <= 4294967295
    function BitAnd(s,t){
     var s1;
     var s2;
     var t1;
     var t2;
     var ans1;
     var ans2;
     var ans;
     s1 = s & 0xffff;
     s2 = (s >>> 16) & 0xffff;
     t1 = t & 0xffff;
     t2 = (t >>> 16) & 0xffff;
     ans1 = (s1 & t1) & 0xffff;
     ans2 = (s2 & t2) & 0xffff;
     ans = BitSub(ans1,ans2);
     return ans;
    }
        // 32bit 符合なしビット演算(XOR)
        // 入力値 : 0 <= s <= 4294967295
        // 入力値 : 0 <= t <= 4294967295
        // 戻り値 : 0 <= 戻り値 <= 4294967295
    function BitXor(s,t){
     var s1;
     var s2;
     var t1;
     var t2;
     var ans1;
     var ans2;
     var ans;
     s1 = s & 0xffff;
     s2 = (s >>> 16) & 0xffff;
     t1 = t & 0xffff;
     t2 = (t >>> 16) & 0xffff;
     ans1 = (s1 ^ t1) & 0xffff;
     ans2 = (s2 ^ t2) & 0xffff;
     ans = BitSub(ans1,ans2);
     return ans;
    }
        // 32bit 符合なしビット演算補助
        // 16bit ずつに分割してビット演算した値を
        // もとの32bit の値になるように結合
        // 入力値 : 0 <= s <= 65535
        // 入力値 : 0 <= t <= 65535
        // 戻り値 : 0 <= 戻り値 <= 4294967295
    function BitSub(s,t){
     return (s + (65536 * t));
    }

