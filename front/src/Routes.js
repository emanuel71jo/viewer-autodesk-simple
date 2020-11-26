import React from "react";
import { Route, BrowserRouter, Switch } from "react-router-dom";

import Index from "./Viewer/Index";
import Upload from "./Viewer/Upload";
import Viewer from "./Viewer/Viewer";

function Routes() {
  return (
    <BrowserRouter>
      <Switch>
        <Route exact path="/" component={Index} />
        <Route exact path="/upload" component={Upload} />
        <Route exact path="/viewer/:urn" component={Viewer} />
      </Switch>
    </BrowserRouter>
  );
}

export default Routes;
