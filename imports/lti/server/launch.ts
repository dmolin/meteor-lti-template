import _ from "lodash";
import moment from "moment";
// @ts-ignore
import { JwtPayload } from "jsonwebtoken";
import { Meteor } from "meteor/meteor";
import { Random } from "meteor/random";

function makeSub (token: JwtPayload) {
  return `${token.iss}:${token.user}`;
}

function decodeRole (roleClaim: string) {
  if (!roleClaim) return null;

  // check for multiple role sources: institution roles, context roles
  const rolePrefixes = [
    "http://purl.imsglobal.org/vocab/lis/v2/institution/person#",
    "http://purl.imsglobal.org/vocab/lis/v2/membership#"
  ];
  const allowedRoles: string[] = ["Instructor", "Learner", "Student"];
  const profileType = _(rolePrefixes)
    .map(prefix => roleClaim.startsWith(prefix) && allowedRoles.includes(roleClaim.substring(prefix.length)))
    .compact()
    .first();
  if (!profileType) {
    console.error(`decodeRole(${roleClaim}): Invalid LTI role claim received in payload`);
    return null;
  }
  return profileType;
}

function getClaim (token: JwtPayload, claim: string) {
  if (!token || !claim) return null;
  return token[`https://purl.imsglobal.org/spec/lti/claim/${claim}`];
}

function provisionAccount (uniqueId: string, token: JwtPayload) {
  const existing = Meteor.users.findOne({ "services.lti.sub": uniqueId });
  if (existing) {
    // existing user. just sync the data coming from the LMS (if changed) and return the user
    // return existing user
    return existing;
  }

  // create a new account, add the lti data to it  and return it
  console.log("creating new LTI account from payload");
  const roles: string[] = getClaim(token, "roles");
  if (_.isEmpty(roles)) {
    console.error(`provisionAccount: Account not provisioned for user ${token.user}. role missing in payload`);
    throw new Meteor.Error("Invalid LTI role");
  }

  const userId = Meteor.users.insert({
    profile: {
      firstName: token.given_name || "participant",
      lastName: token.family_name || "lastname",
      role: decodeRole(_.first(roles)!)
    },
    services: {
      lti: {
        sub: makeSub(token),
      },
      session: {
        id: Random.secret(),
        expiresAt: moment().add(5, "minutes").toDate(),
        issuedAt: moment().toDate(),
      }
    }
  });
  return Meteor.users.findOne({ _id: userId });
}

export function processLaunch(res: any, token: JwtPayload) {
  // pick account data from payload and fetch or create account on the platform
  // we use the platform iss(uer) + platform user to generate a unique id
  const account = provisionAccount(makeSub(token), token);

  if (!account) {
    console.error("failed to provision account");
    // throw exception or return a redirect to an error page
    res.redirect("/lti/error");
  }

  // generate a unique session id for this launch (will expire shortly) and then redirect to a launch page
  // that will log this user in
  console.log(`Redirect to /lti/launch/${account.services.lti.session.id}`);
  res.redirect(`/lti/launch/${account.services.lti.session.id}`);
}
