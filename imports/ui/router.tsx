import React from "react";
import { createBrowserRouter } from "react-router-dom";

import ltiRoutes from "../lti/ui/routes";

export default createBrowserRouter([
  {
    path: "/",
    element: <div>Example Meteor-LTI integration</div>,
  },
  ...ltiRoutes
]);
