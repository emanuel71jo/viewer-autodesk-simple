import React, { useState } from "react";
import { useHistory } from "react-router-dom";

import Api from "../services/Api";

function Upload() {
  const [file, setFile] = useState(null);
  const history = useHistory();

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append("file", file);

    Api.post("/api/forge/datamanagement/bucket/upload", data)
      .then(({ data: { urn } }) => {
        history.push(`/viewer/${urn}`);
      })
      .catch((error) => {
        alert("error");
      });
  };

  const handleInputFile = (e) => {
    setFile(e.target.files[0]);
  };

  return (
    <main id="main">
      <form onSubmit={handleSubmit}>
        <input type="file" name="fileToUpload" onChange={handleInputFile} />
        <button type="submit">Submit</button>
      </form>
    </main>
  );
}

export default Upload;
