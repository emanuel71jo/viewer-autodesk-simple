import React from "react";
import { useHistory } from "react-router-dom";
import Api from "../services/Api";

function Index() {
  const history = useHistory();

  const handleAuthorization = () => {
    Api.get("/api/forge/oauth")
      .then((response) => {
        alert("Authentication authorized");
        history.push("/upload");
      })
      .catch((error) => {
        alert("Authentication did not authorized");
      });
  };

  return (
    <main id="main">
      <button type="button" onClick={handleAuthorization}>
        Authorize me!
      </button>
    </main>
  );
}
export default Index;
