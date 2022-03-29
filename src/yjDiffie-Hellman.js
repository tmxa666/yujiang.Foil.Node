/**
 * @fileOverview
 * @author mustapha.wang
 * @see module:yjDiffie-HellMan
 */
/**
 * Diffie-Hellman非对称加密算法秘钥。私钥要绝对保密。4个是一组，pkcs1和pkcs8可以互相转换。
 * @exports yjDiffie-HellMan
 * @example <pre>
 * var yjDH=yjRequire("yujiang.Foil","yjDiffie-Hellman.js");
 * </pre>
 * @see nodejs::yjRequire
 */
module.exports={
	/**
	 * pkcs1私钥。保密。
	 * @ignore
	 * @field
	 * @type {string}
	 */
	privateKey_pkcs1:
		 '-----BEGIN RSA PRIVATE KEY-----\n'
		+'MIIEpAIBAAKCAQEAnsqXaNUvpJ6Sd+E+qIpcZlq2jtO5kjkdXoWGW9mf566LMVe3\n'
		+'wW/OvJmKmO5EjpQr9HG0/F9Dy3xxlQJgDdYUxDAT1I0hTwZv7OabJs4MmeLaDZIA\n'
		+'dzgEKQ0Id9nlcyrzfpsQ6LOVqbSnUPlCLyAxVejbcIfPOB5ECBh7jNa+TrFS+mh3\n'
		+'7Dou8aQqfRTh1r+x5cpAu1awSoav4bRLJlk7Ko7KPTPuXPuq+oWhLTZPTBGi2dnD\n'
		+'o3zVmtGTRFDfcBgi4UE5XP6kLgZb4FMi585C4mg1r2zkPHh4mv6Z5bkldOxqa1uc\n'
		+'hdtYKS8TWvbcWFCN0YqanpSCPzQNMe/paEmSUwIDAQABAoIBAQCGi45jS0/FIn9k\n'
		+'iDw5PpMwPui0eH2igjZ6YpUHuowdGO3j7zlJ89yuPUMMdcctMCtWQgpiVK3y+wya\n'
		+'f5q33o9V9I646KQye3fWuUb5SFmxAmBUY0N1wMb1qY9lTgF25gvPWMCpC5FibCnh\n'
		+'GHKVz6c97cIRxWE1YZ+vZF87ZLF3pr5FIHdvNmwxeD5qg9Tq7n/aXw3h+vMjYiJp\n'
		+'fnfUHZcGIoyOillqQn4F76yFc+sph3hrMMuV0gyfj8VyMAzNx+KDhjB6MEjwhASy\n'
		+'30xVh0zwuIXI1KEPnVZVSoyDm0rnRA70Dg8uV850LE6Q7Ur25+fU5hoAWe/kDvYo\n'
		+'ebLV647BAoGBANTdj/sJWnPNgmn4PZMQAySZzfAa3iDdxly69nMidI1bG8LgyBUt\n'
		+'g7iUtjjLK2yvNBhp8OJ9ZdQofzvCkB+ohln+nu/LGIzWHLJ6igKn3WrRoIroVI1Z\n'
		+'qOksvP2Y0OOsCSW6/ifXXdoSxHrqPg3EZmqNUA3HjBdhhRHqLP4HS+rxAoGBAL73\n'
		+'7KZg+HsbaFCnyzj8QOVKcQ97JxzaQRPDji2kEerb3JtGvYV/7L9hT+YfmXR4ZXv3\n'
		+'sMoH4tOFuB6ScaKIo13JIwB/bVjQCfIFdjiiLMhaqgpGVR6mjf7RSW4iSszxeIim\n'
		+'mvoM8BP4zoMGdZLNUzVOi+VtC+bN8M3KTV+vS+mDAoGAAm+erDLJNDYP3gKXQc2X\n'
		+'G54e+zZzgFDJalpBY8PrLYrzYGGOKJ/iuAQLqc65an7+y6C6vvzMY4crHZX2bEZT\n'
		+'c0g0rW3XlBUHMwuv9KPTJtvLSIusHAoAotp+NzC+gzx+xk3DhtUyH8LDONzhZOrw\n'
		+'eRuw5Nd5xPK6wR+68BVJSyECgYEAr3mo3okkShq5E8PbHRXNm+N3WD5VhlGWks6S\n'
		+'iqXEQQaeA6BQ7abKqGCGxnIq07b9qZfDvyDX8H1i3dS6zhq34qm7m+17UKx5NwaF\n'
		+'xyxd8gw9Swutk2h/+bHdw3GHQiJwG0DcDwBsai2ptQPubWJ2Hvl52usEkKSTrMVD\n'
		+'q7SsEHkCgYAxJWGIbO2kWpkiaYAEUdLC+4Xaf3vG3HG1VP5Q7sn3PEOW/lT85PnL\n'
		+'v603Ngo4DBYNfLxj2zhX71ACWotTqGiBuOtmFRiCYm+yIzWLTZ+m47aSoeUZp8ZJ\n'
		+'C33NgGVZPVMH2Db2YGBoVnRmbZArTRmL0gwfVFnGm727XQBJpa3Edg==\n'
		+'-----END RSA PRIVATE KEY-----',
	/**
	 * pkcs1公钥。
	 * @field
	 * @type {string}
	 */
	publicKey_pkcs1:
		 '-----BEGIN RSA PUBLIC KEY-----\n'
		+'MIIBCgKCAQEAnsqXaNUvpJ6Sd+E+qIpcZlq2jtO5kjkdXoWGW9mf566LMVe3wW/O\n'
		+'vJmKmO5EjpQr9HG0/F9Dy3xxlQJgDdYUxDAT1I0hTwZv7OabJs4MmeLaDZIAdzgE\n'
		+'KQ0Id9nlcyrzfpsQ6LOVqbSnUPlCLyAxVejbcIfPOB5ECBh7jNa+TrFS+mh37Dou\n'
		+'8aQqfRTh1r+x5cpAu1awSoav4bRLJlk7Ko7KPTPuXPuq+oWhLTZPTBGi2dnDo3zV\n'
		+'mtGTRFDfcBgi4UE5XP6kLgZb4FMi585C4mg1r2zkPHh4mv6Z5bkldOxqa1uchdtY\n'
		+'KS8TWvbcWFCN0YqanpSCPzQNMe/paEmSUwIDAQAB\n'
		+'-----END RSA PUBLIC KEY-----',
	/**
	 * pkcs8公钥。
	 * @field
	 * @type {string}
	 */
	publicKey_pkcs8:
		 '-----BEGIN PUBLIC KEY-----\n'
		+'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAnsqXaNUvpJ6Sd+E+qIpc\n'
		+'Zlq2jtO5kjkdXoWGW9mf566LMVe3wW/OvJmKmO5EjpQr9HG0/F9Dy3xxlQJgDdYU\n'
		+'xDAT1I0hTwZv7OabJs4MmeLaDZIAdzgEKQ0Id9nlcyrzfpsQ6LOVqbSnUPlCLyAx\n'
		+'VejbcIfPOB5ECBh7jNa+TrFS+mh37Dou8aQqfRTh1r+x5cpAu1awSoav4bRLJlk7\n'
		+'Ko7KPTPuXPuq+oWhLTZPTBGi2dnDo3zVmtGTRFDfcBgi4UE5XP6kLgZb4FMi585C\n'
		+'4mg1r2zkPHh4mv6Z5bkldOxqa1uchdtYKS8TWvbcWFCN0YqanpSCPzQNMe/paEmS\n'
		+'UwIDAQAB\n'
		+'-----END PUBLIC KEY-----',
	/**
	 * pkcs8私钥。保密。
	 * @field
	 * @ignore
	 * @type {string}
	 */
	privateKey_pkcs8:
		 '-----BEGIN PRIVATE KEY-----\n'
		+'MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCeypdo1S+knpJ3\n'
		+'4T6oilxmWraO07mSOR1ehYZb2Z/nrosxV7fBb868mYqY7kSOlCv0cbT8X0PLfHGV\n'
		+'AmAN1hTEMBPUjSFPBm/s5psmzgyZ4toNkgB3OAQpDQh32eVzKvN+mxDos5WptKdQ\n'
		+'+UIvIDFV6Ntwh884HkQIGHuM1r5OsVL6aHfsOi7xpCp9FOHWv7HlykC7VrBKhq/h\n'
		+'tEsmWTsqjso9M+5c+6r6haEtNk9MEaLZ2cOjfNWa0ZNEUN9wGCLhQTlc/qQuBlvg\n'
		+'UyLnzkLiaDWvbOQ8eHia/pnluSV07GprW5yF21gpLxNa9txYUI3RipqelII/NA0x\n'
		+'7+loSZJTAgMBAAECggEBAIaLjmNLT8Uif2SIPDk+kzA+6LR4faKCNnpilQe6jB0Y\n'
		+'7ePvOUnz3K49Qwx1xy0wK1ZCCmJUrfL7DJp/mrfej1X0jrjopDJ7d9a5RvlIWbEC\n'
		+'YFRjQ3XAxvWpj2VOAXbmC89YwKkLkWJsKeEYcpXPpz3twhHFYTVhn69kXztksXem\n'
		+'vkUgd282bDF4PmqD1Oruf9pfDeH68yNiIml+d9QdlwYijI6KWWpCfgXvrIVz6ymH\n'
		+'eGswy5XSDJ+PxXIwDM3H4oOGMHowSPCEBLLfTFWHTPC4hcjUoQ+dVlVKjIObSudE\n'
		+'DvQODy5XznQsTpDtSvbn59TmGgBZ7+QO9ih5stXrjsECgYEA1N2P+wlac82Cafg9\n'
		+'kxADJJnN8BreIN3GXLr2cyJ0jVsbwuDIFS2DuJS2OMsrbK80GGnw4n1l1Ch/O8KQ\n'
		+'H6iGWf6e78sYjNYcsnqKAqfdatGgiuhUjVmo6Sy8/ZjQ46wJJbr+J9dd2hLEeuo+\n'
		+'DcRmao1QDceMF2GFEeos/gdL6vECgYEAvvfspmD4extoUKfLOPxA5UpxD3snHNpB\n'
		+'E8OOLaQR6tvcm0a9hX/sv2FP5h+ZdHhle/ewygfi04W4HpJxooijXckjAH9tWNAJ\n'
		+'8gV2OKIsyFqqCkZVHqaN/tFJbiJKzPF4iKaa+gzwE/jOgwZ1ks1TNU6L5W0L5s3w\n'
		+'zcpNX69L6YMCgYACb56sMsk0Ng/eApdBzZcbnh77NnOAUMlqWkFjw+stivNgYY4o\n'
		+'n+K4BAupzrlqfv7LoLq+/MxjhysdlfZsRlNzSDStbdeUFQczC6/0o9Mm28tIi6wc\n'
		+'CgCi2n43ML6DPH7GTcOG1TIfwsM43OFk6vB5G7Dk13nE8rrBH7rwFUlLIQKBgQCv\n'
		+'eajeiSRKGrkTw9sdFc2b43dYPlWGUZaSzpKKpcRBBp4DoFDtpsqoYIbGcirTtv2p\n'
		+'l8O/INfwfWLd1LrOGrfiqbub7XtQrHk3BoXHLF3yDD1LC62TaH/5sd3DcYdCInAb\n'
		+'QNwPAGxqLam1A+5tYnYe+Xna6wSQpJOsxUOrtKwQeQKBgDElYYhs7aRamSJpgARR\n'
		+'0sL7hdp/e8bccbVU/lDuyfc8Q5b+VPzk+cu/rTc2CjgMFg18vGPbOFfvUAJai1Oo\n'
		+'aIG462YVGIJib7IjNYtNn6bjtpKh5RmnxkkLfc2AZVk9UwfYNvZgYGhWdGZtkCtN\n'
		+'GYvSDB9UWcabvbtdAEmlrcR2\n'
		+'-----END PRIVATE KEY-----',
	/**
	 * 创建https服务时的证书。
	 * @field
	 * @type {string}
	 */
	certificate:
		 '-----BEGIN CERTIFICATE-----\r\n'
	    +'MIID2jCCAsICCQDr1+latH9NSjANBgkqhkiG9w0BAQsFADCBrjELMAkGA1UEBhMC\r\n'
	    +'Q04xEDAOBgNVBAgMB1NoYWFuWGkxDTALBgNVBAcMBFhpQW4xLDAqBgNVBAoMI05p\r\n'
	    +'bmdCbyBUZWNobWF0aW9uIFNvZnR3YXJlIENvLixMdGQuMRQwEgYDVQQLDAtYaUFu\r\n'
	    +'IEJyYW5jaDETMBEGA1UEAwwKVGVjaG1hdGlvbjElMCMGCSqGSIb3DQEJARYWaW5m\r\n'
	    +'b0B0ZWNobWF0aW9uLmNvbS5jbjAeFw0xNzA1MTMwNzUxMDdaFw0yNzA1MTEwNzUx\r\n'
	    +'MDdaMIGuMQswCQYDVQQGEwJDTjEQMA4GA1UECAwHU2hhYW5YaTENMAsGA1UEBwwE\r\n'
	    +'WGlBbjEsMCoGA1UECgwjTmluZ0JvIFRlY2htYXRpb24gU29mdHdhcmUgQ28uLEx0\r\n'
	    +'ZC4xFDASBgNVBAsMC1hpQW4gQnJhbmNoMRMwEQYDVQQDDApUZWNobWF0aW9uMSUw\r\n'
	    +'IwYJKoZIhvcNAQkBFhZpbmZvQHRlY2htYXRpb24uY29tLmNuMIIBIjANBgkqhkiG\r\n'
	    +'9w0BAQEFAAOCAQ8AMIIBCgKCAQEAnsqXaNUvpJ6Sd+E+qIpcZlq2jtO5kjkdXoWG\r\n'
	    +'W9mf566LMVe3wW/OvJmKmO5EjpQr9HG0/F9Dy3xxlQJgDdYUxDAT1I0hTwZv7Oab\r\n'
	    +'Js4MmeLaDZIAdzgEKQ0Id9nlcyrzfpsQ6LOVqbSnUPlCLyAxVejbcIfPOB5ECBh7\r\n'
	    +'jNa+TrFS+mh37Dou8aQqfRTh1r+x5cpAu1awSoav4bRLJlk7Ko7KPTPuXPuq+oWh\r\n'
	    +'LTZPTBGi2dnDo3zVmtGTRFDfcBgi4UE5XP6kLgZb4FMi585C4mg1r2zkPHh4mv6Z\r\n'
	    +'5bkldOxqa1uchdtYKS8TWvbcWFCN0YqanpSCPzQNMe/paEmSUwIDAQABMA0GCSqG\r\n'
	    +'SIb3DQEBCwUAA4IBAQBZ9zd0RcaAfH/2HOE8XLPyqhlADgN0sU3rHnpF08cNLx6T\r\n'
	    +'KFTsV19B94N+kvVtvr9o4Tht8O1KffJ+oEbqFDSOkbUrH/XKBOzAvCUe1aLQZHtQ\r\n'
	    +'zr5ISs0FeewTjNCCMScr81Gi4cnumXoi7MqamVRHF5ZTDoQuKBdh/VkRoFMbvzqs\r\n'
	    +'jNKrHL293jCHBtruZH8MAA5hBk6vrBtOfSCcCiuOBMeTAtTF6Y+ds20ukIORQqAJ\r\n'
	    +'kGK6Ky93Rirsvt7c3BB3KyRiOQ31I5FxoBtCf5wKqnEDh/k6mgK1FDUJwgMQwjqR\r\n'
	    +'tc67yvqUvjxhCPiiIPy/FG9rEeWuXxNCh1Dps0pB\r\n'
	    +'-----END CERTIFICATE-----'
}