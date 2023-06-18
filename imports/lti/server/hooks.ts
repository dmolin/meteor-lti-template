import moment from "moment";
import { Meteor } from "meteor/meteor";
import { Accounts } from "meteor/accounts-base";
import _ from "lodash";
const log = require("debug")("app:main");

/**
 * Login handler for LTI-HBP auto-logins
 */
export function ltiLoginHandler (options: any) {
  const fn = `ltiLoginHandler(t=${_.get(options, "lti.token")})`;

  // we only consider login requests carrying an lti payload
  if (_.isEmpty(_.get(options, "lti.token"))) {
    return;
  }

  const token = _.get(options, "lti.token");

  // locate user account by lti session token
  const account = Meteor.users.findOne({ "services.lti.session.id": token });
  if (!account) {
    log(`${fn}: No user account found for sessionId token`);
    return;
  }

  const session = _.get(account, "services.lti.session", {});
  // check if the session is still valid
  if (session.expiresAt && moment().isAfter(session.expiresAt)) {
    log(`${fn}: Launch request took too long. expired at ${moment(session.expiresAt)}`);
    return;
  }

  // clean up the session block and launch data from the service area
  Meteor.users.update({ _id: account._id }, { $unset: { "services.lti.session": true } });

  log(`${fn}: Loggin user ${account._id} in via LTI connection`);

  // session is valid. confirm login
  return {
    userId: account._id,
    token: Accounts._generateStampedLoginToken()
  };
}

Meteor.startup(function registerLTILoginHandler () {
  log("==> registering LTI login handler");
  Accounts.registerLoginHandler("lti", ltiLoginHandler);
});
