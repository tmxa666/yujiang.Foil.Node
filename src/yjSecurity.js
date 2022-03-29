/**
 * @author mustapha.wang
 * @fileOverView
 * 与安全相关的模组。在nodejs和browser环境都可使用。
 * @see module:yjSecurity
 */
var g_ENCRYPTION_RANGE = 256;
var g_ENCRYPTION_KEY = "esirporcA";
if (typeof module !== 'undefined' && module.exports) {
	// /前面不能加var,否则在
	var yjUtils = require("./client/js/yjUtils.js");
	var NodeRSA = require('node-rsa');
	var yjDiffieHellman = require("./yjDiffie-Hellman.js");
}

// /<param Name="ASource">需要加密的byte阵列</param>
// /<param Name="ARandomNumber">byte,一个加密的随机数</param>
// /<param
// Name="AIsOldFunction">boolean,是否是旧函数,兼容Delphi旧函数（字符包含0或255时有一个bug）</param>
// /<returns>byte[],返回加密后的byte阵列</returns>
function _encryptBytes(ASource, ARandomNumer, AIsOld) {
	function outputByte(AByte) {
		var s = AByte.toString(16).toUpperCase();
		if (s.length == 1) {
			sOutput[index] = '0'.charCodeAt();
			sOutput[index + 1] = s[0].charCodeAt();
		} else {
			sOutput[index] = s[0].charCodeAt();
			sOutput[index + 1] = s[1].charCodeAt();
		}
	}

	if (ASource == null | ASource.length <= 0) {
		return new Array();
	}
	var sKey, s;
	var sOutput;
	var nKeyLen, nKeyPos, nSrcASC, nOffset, index;

	sKey = g_ENCRYPTION_KEY;
	nKeyLen = sKey.length;
	nKeyPos = 0;

	nOffset = ARandomNumer;
	index = 0;
	sOutput = new Array(2 + ASource.length * 2);
	outputByte(nOffset);
	index = index + 2;
	for ( var i in ASource) {
		nSrcASC =
			(ASource[i] + nOffset)
				% ((AIsOld == true) ? (g_ENCRYPTION_RANGE - 1)
					: g_ENCRYPTION_RANGE);
		nSrcASC = nSrcASC ^ (sKey[nKeyPos].charCodeAt());
		if (nKeyPos < nKeyLen - 1)
			nKeyPos++;
		else
			nKeyPos = 0;
		outputByte(nSrcASC);
		index = index + 2;
		nOffset = nSrcASC;
	}
	return sOutput;
}

function _encryptStr_Ansi(AAnsiStr, AIsOldFunction) {
	var n = Math.floor(Math.random() * g_ENCRYPTION_RANGE);
	var a = yjUtils.ansiStr2ByteArray(AAnsiStr);
	var encryped = _encryptBytes(a, n, AIsOldFunction);
	var s = yjUtils.byteArray2AnsiStr(encryped);
	return s;
}

// /<param Name="ADecryptedBytes">byte[],需要解密的byte阵列</param>
// /<param Name="AIsOldFunction">boolean,是否是旧函数</param>
// /<returns>byte[],返回解密后的byte阵列</returns>
function _decryptBytes(ADecryptedBytes, AIsOldFunction) {
	if ((ADecryptedBytes == null) | (ADecryptedBytes.length == 0)) {
		return new Array();
	}
	var sKey, s;
	var nKeyLen, nKeyPos, nSrcPos, nSrcASC, nTmpASC, nOffset;
	var sOutput = new Array(ADecryptedBytes.length / 2 - 1);
	var index;

	sKey = g_ENCRYPTION_KEY;
	nKeyLen = sKey.length;
	nKeyPos = 0;
	index = 0;
	s =
		String.fromCharCode(ADecryptedBytes[index])
			+ String.fromCharCode(ADecryptedBytes[index + 1]);
	index = index + 2;
	nOffset = parseInt(s, 16);
	nSrcPos = 2;
	do {
		s =
			String.fromCharCode(ADecryptedBytes[index])
				+ String.fromCharCode(ADecryptedBytes[index + 1]);
		index = index + 2;
		nSrcASC = parseInt(s, 16);
		nTmpASC = nSrcASC ^ (sKey[nKeyPos].charCodeAt());
		if (nKeyPos < nKeyLen - 1)
			nKeyPos++;
		else
			nKeyPos = 0;
		if (nTmpASC < nOffset)
			nTmpASC =
				nTmpASC
					+ ((AIsOldFunction == true) ? (g_ENCRYPTION_RANGE - 1)
						: g_ENCRYPTION_RANGE) - nOffset;
		else
			nTmpASC = nTmpASC - nOffset;

		sOutput[nSrcPos / 2 - 1] = nTmpASC;
		nOffset = nSrcASC;
		nSrcPos = nSrcPos + 2;
	} while (nSrcPos < ADecryptedBytes.length);
	return sOutput;
}

function _decryptStr_Ansi(AAnsiStr, AIsOldFunction) {
	var a1 = yjUtils.ansiStr2ByteArray(AAnsiStr);
	var a2 = _decryptBytes(a1, AIsOldFunction);
	var s = yjUtils.byteArray2AnsiStr(a2);
	return s;
}

function _encryptStr_Unicode(AUnicodeStr, AIsOldFunction) {
	var n = Math.floor(Math.random() * g_ENCRYPTION_RANGE);
	var a = yjUtils.unicodeStr2ByteArray(AUnicodeStr);
	var encryped = _encryptBytes(a, n, AIsOldFunction);
	var s = yjUtils.byteArray2AnsiStr(encryped);
	return s;
}

function _decryptStr_Unicode(AAnsiStr, AIsOldFunction) {
	var a1 = yjUtils.ansiStr2ByteArray(AAnsiStr);
	var a2 = _decryptBytes(a1, AIsOldFunction);
	var s = yjUtils.byteArray2UnicodeStr(a2);
	return s;
}

/**
 * 在browser中引入yjSecurity.js文件，直接使用变量yjSecurity
 * @global
 * @name browser::yjSecurity
 * @see yjSecurity
 */

/**
 * 与安全相关的模组。
 * @exports yjSecurity
 * @example <pre>
 * var yjSecurity=yjRequire("yujiang.Foil","yjSecurity.js");
 * </pre>
 * @see nodejs::yjRequire
 */
var yjSecurity = {
	/**
	 * @description 把Ansi字串加密。但字串中包含ASCII0或255时，有bug。保留此函数只是为了兼容旧程序（如旧iNet系统中Delphi加解密的数据库）。
	 * @param {string} AStr 需要加密的字串
	 * @returns {string} 返回加密后的字串，不会出现双字节字符
	*/
	encryptStr0_Ansi : function(AAnsiStr) {
		return _encryptStr_Ansi(AAnsiStr, true);
	},
	/**
	 * 把Ansi字串加密
	 * @param {string} AStr 需要加密的字串
	 * @returns {string} 返回加密后的字串，不会出现双字节字符
	 */
	encryptStr_Ansi : function(AAnsiStr) {
		return _encryptStr_Ansi(AAnsiStr, false);
	},
	/**
	 * 把字串解密。<br/>
	 * 但字串中包含ASCII0或255时，有bug。保留此函数只是为了兼容旧程序（如旧iNet系统中Delphi加解密的数据库）。
	 * @param {string} AAnsiStr 需要解密的字串。
	 * @returns {string} 返回解密后的Ansi字串。
	 */
	decryptStr0_Ansi : function(AAnsiStr) {
		return _decryptStr_Ansi(AAnsiStr, true);
	},
    /**
	 * 把字串解密
	 * @param {string} AAnsiStr 需要解密的字串
	 * @return {string} 返回解密后的Ansi字串
	 */
	decryptStr_Ansi : function(AAnsiStr) {
		return _decryptStr_Ansi(AAnsiStr, false);
	},
    /**
	 * 把Unicode字串加密。但字串中包含ASCII0或255时，有bug。保留此函数只是为了兼容旧程序（如旧iNet系统中Delphi加解密的数据库）。
	 * @param {string} AUnicodeStr 需要加密的字串
	 * @returns {string} 返回加密后的Ansi字串
     */
	encryptStr0_Unicode : function(AUnicodeStr) {
		return _encryptStr_Unicode(AUnicodeStr, true);
	},
    /**
	 * 把Unicode字串加密
	 * @param {string} AUnicodeStr 需要加密的字串
	 * @returns {string} 返回加密后的Ansi字串
	 */
	encryptStr_Unicode : function(AUnicodeStr) {
		return _encryptStr_Unicode(AUnicodeStr, false);
	},
    /**
	 * 把字串解密。但字串中包含ASCII0或255时，有bug。保留此函数只是为了兼容旧程序（如旧iNet系统中Delphi加解密的数据库）。
	 * @param {string} AAnsiStr 需要解密的字串
	 * @returns {string} 返回解密后的Unicode字串
	 */
	decryptStr0_Unicode : function(AAnsiStr) {
		return _decryptStr_Unicode(AAnsiStr, true);
	},
    /**
	 * 把字串解密
	 * @param {string} AAnsiStr 需要解密的字串
	 * @returns {string} 返回解密后的Unicode字串
	 */
	decryptStr_Unicode : function(AAnsiStr) {
		return _decryptStr_Unicode(AAnsiStr, false);
	},

	/**
	 * Diffie-Hellman非对称加密元件。
	 * @name Diffie-Hellman
	 * @type {yjDiffie-Hellman}
	 */
	/**	 
	 * <pre>Diffie-Hellman非对称加密元件。
	 * 内部元件，不能创建实例。</pre>
	 * @global
	 * @class yjDiffie-Hellman
	 * @private
	 * @example <pre>
	 * var yjSecurity=yjRequire("yujiang.Foil","yjSecurity.js");
	 * var DH=yjSecurity["Diffie-Hellman"];
	 * var encryptedStr=DH.encrypt("abc");
	 * </pre>
	 * @see nodejs::yjRequire
	 */
	"Diffie-Hellman" : {
		/**
		 * 公钥加密
		 * @memberof yjDiffie-Hellman
		 * @field
		 * @param {string} str 要加密的字串
		 * @return {string} 加密后的字串。
		 */
		encrypt : function(str) {
			var encoder = new NodeRSA(yjDiffieHellman.publicKey_pkcs8,{encryptionScheme: 'pkcs1'});
			var encryptedStr = encoder.encrypt(str, "base64", "utf8");
			return encryptedStr;
		},
		/** 
		 * 私钥解密
		 * @memberof yjDiffie-Hellman
		 * @param {string} str 要解密的字串
		 * @return {string} 解密后的字串
		 */
		decrypt : function(str) {
			var decoder = new NodeRSA(yjDiffieHellman.privateKey_pkcs1,{encryptionScheme: 'pkcs1'});
			var strRaw = decoder.decrypt(str, "utf8");
			return strRaw;
		},
		/**
		 * 私钥签名。为字串计算一个较短的特征字串。
		 * @memberof yjDiffie-Hellman
		 * @param {string} str 要签名的字串
		 * @return {string} 签名后的字串 		 
		 */
		sign : function(str) {
			var encoder = new NodeRSA(yjDiffieHellman.privateKey_pkcs1,{signingScheme:'pkcs1'});
			var signedStr = encoder.sign(str, "base64", "utf8");
			return signedStr;
		},
		/**
		 * 公钥验证。验证字串是不是与某个签名匹配。
		 * @memberof yjDiffie-Hellman
		 * @param {string} str 要验证的字串。
		 * @param {string} signature 签名。
		 * @return {boolean} 是否匹配。
		 */
		verify : function(str, signature) {
			var decoder = new NodeRSA(yjDiffieHellman.publicKey_pkcs8,{signingScheme: 'pkcs1'});
			return decoder.verify(str, signature, "utf8", "base64");
		}
	}
}

if (typeof module !== 'undefined' && module.exports) {
	// 如果用module.exports = yjSecurity;
	// qunit的机制,需要用code:{path:"./source/yjSecurity.js",namespace:"yjSecurity"}
	// 如果用exports。yjSecurity；qunit直接用
	module.exports = yjSecurity;
}