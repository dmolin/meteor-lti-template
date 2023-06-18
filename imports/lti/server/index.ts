import { ltiInit } from "/imports/lti/server/init";

try {
  ltiInit();
} catch (err) {
  console.error("ltiInit(): error", err);
}
