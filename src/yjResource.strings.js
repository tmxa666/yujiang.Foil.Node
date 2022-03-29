/**
 * @fileOverview
 * @author mustapha.wang
 * @see module:yjResource_strings
 */

/**
 * 资源字串
 * @exports yjResource_strings
 * @example <pre>
 * var yjRS=yjRequire("yujiang.Foil","yjResource.strings.js");
 * </pre>
 * @see nodejs::yjRequire
 */
module.exports = {
    'tm.err.foil.namespaceNotConfig' : "the directory of namespace '%s' not found in config file '%s'.",
    'tm.err.foil.notLogin':"You have not loged in!",
    'tm.err.foil.tokenNotProvided':'No token provided.',
    'tm.err.foil.tokenInvalid':'tokenInvalid.',
    'tm.err.foil.beyondLoginAuthority':'Login User beyond user authoority count.',
    'tm.err.foil.userNotAuthorized':"User '%s' is not authorized to execute process module:'%s'."
}
var yjResourceErrors=require("./yjResource.errors.js");
yjResourceErrors.addErrors(module.exports);