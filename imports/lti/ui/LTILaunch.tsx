import { Meteor } from "meteor/meteor";
import React, { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import _ from "lodash";

export const LTILaunch = () => {
  const { sessionId } = useParams();

  // console.log("sessionId", sessionId);
  const [error, setError] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);

  useEffect(() => {
    // kickstart the whole process, by setting "loggingIn" to true.
    // this will allow us to delay processing of the logged in user until the check is completed
    setLoggingIn(true);
  }, []);


  useEffect(() => {
    if (!loggingIn) return;

    // try to auto login
    // @ts-ignore
    Meteor.loginWithLTI(sessionId, (err: any) => {
      setLoggingIn(false);
      if (err) {
        setError("Login failed");
        return;
      }
    });
  }, [loggingIn]);

  const user = Meteor.user();

  if (error) {
    return (
      <div>
        <h1>{error}</h1>
      </div>
    );
  }

  return (
    <div>
      <h1>Logging in user and accessing content...</h1>
      {user &&
        <Navigate to={"/lti/ui/LTIContent"} />
      }
    </div>
  );
}

export default LTILaunch;
