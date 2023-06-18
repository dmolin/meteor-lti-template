import { Meteor } from "meteor/meteor";
// @ts-ignore
import { JwtPayload } from "jsonwebtoken";

// @ts-ignore
import { Provider, Platform } from "@hubroeducation/ltijs";
import { WebApp } from "meteor/webapp";
import { Promise } from "meteor/promise";
import { processLaunch } from "/imports/lti/server/launch";

const log = require("debug")("app:main");
let provider: any;

export const getPlatformKey = async (url: string, clientId: string) => {
  const platform = await Provider.getPlatform(url, clientId);
  return platform.platformJSONConfig();
};

export function getProvider () {
  return provider;
}

function registerLMSIntegration () {
  Promise.await(
    Provider.registerPlatform({
      url: "https://canvas.instructure.com",
      // this will be provided by Canvas (in the Developer key, once the tool has been configured)
      // so we'll probably need a UI on our side to input this data and use it to feed this function.
      // To make this work locally we'll need to use a tunnel to expose our local env to the outside world.
      // in production we'll take the URL of our app from Meteor settings more likely
      clientId: "242930000000000006",
      name: "Canvas LMS",
      authenticationEndpoint: `${Meteor.settings.lmsUrl}/authorize_redirect`,
      accesstokenEndpoint: `${Meteor.settings.lmsUrl}/login/oauth2/token`,
      authConfig: {
        method: "JWK_SET",
        key: `${Meteor.settings.lmsUrl}/api/lti/security/jwks`
      }
    })
  );
}

async function launchHandler (token: JwtPayload, _req: any, res: any) {
  log("============> LTI launch received", token);
  processLaunch(token);
}

/**
 * Initialize the whole LMS integration layer, by setting up the interface between our app and any LMS platform
 */
export async function ltiInit () {
  const ltiSignKey = Meteor.settings?.private?.lti?.signKey;

  if (!ltiSignKey) {
    throw new Meteor.Error("Cannot initialize LTI. No sign key present in settings");
  }

  log("===> LTI Setup");
  // ideally we get this from process.env.MONGO_URL
  const ltiDB = "mongodb://127.0.0.1:3001/lti";
  const cookies = {
    secure: false, // Set secure to true if the testing platform is in a different domain and https is being used
    sameSite: "None", // set it to "None" if the testing platform is in a different domain and https is being used
    ...Meteor.settings?.private?.lti?.cookies
  };

  provider = Provider.setup(ltiSignKey, {
    url: ltiDB
  }, {
    // options
    appRoute: "/launch",
    loginRoute: "/login",
    keysetRoute: "/keys",
    cookies,
    devMode: true, // set it to false when in production and using https,
    // dynamic registration doesn't seem to work in Canvas
    // dynRegRoute: "/register",
    // dynReg: {
    //   url: `${Meteor.settings?.public?.baseUrl}/ltitool`,
    //   name: `${Meteor.settings?.private?.lti?.toolName || "LTI Tool"}`,
    //   description: `${Meteor.settings?.private?.lti?.toolDesc || "External LTI Tool"}`,
    //   redirectUris: [],
    //   autoActivate: true
    // }
  });

  // deploy the LTI provider
  await Provider.deploy({ serverless: true, path: "/ltitool" });
  WebApp.rawConnectHandlers.use("/ltitool", Provider.app);

  Provider.onConnect(launchHandler);
  // if you need deep linking too:
  // Provider.onDeepLinking(deepLinkingHandler);

  // register the platform we're interfacing with
  registerLMSIntegration();
}
