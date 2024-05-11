import React from "react";
import LTILaunch from "/imports/lti/ui/LTILaunch";
import LTIContent from "./LTIContent";

export default [
  {
    path: "/lti/launch/:sessionId",
    element: <LTILaunch />,
  },
  {
    path: "/lti/content",
    element: <LTIContent />,
  },
];
