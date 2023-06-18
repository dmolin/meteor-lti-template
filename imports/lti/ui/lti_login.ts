import { Meteor } from "meteor/meteor";
import { Accounts } from "meteor/accounts-base";
import { JwtPayload } from "jsonwebtoken";

export function loginWithLTI (token: JwtPayload, callback: () => void) {
  Accounts.callLoginMethod({
    methodArguments: [{ lti: { token } }],
    userCallback: callback
  });
}

// @ts-ignore
Meteor.loginWithLTI = loginWithLTI;
