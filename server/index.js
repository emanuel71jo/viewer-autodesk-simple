var express = require("express");
var Axios = require("axios");
var bodyParser = require("body-parser");
var cors = require("cors");

var app = express();
app.use(bodyParser.json());
app.use(cors());

app.set("port", 3333);
var server = app.listen(app.get("port"), function () {
  console.log("Server listening on port " + server.address().port);
});

var FORGE_CLIENT_ID = process.env.FORGE_CLIENT_ID || "";
var FORGE_CLIENT_SECRET = process.env.FORGE_CLIENT_SECRET || "";
var access_token = "";
var scopes = "data:read data:write data:create bucket:create bucket:read";
const querystring = require("querystring");

// // Route /api/forge/oauth
app.get("/api/forge/oauth", function (req, res) {
  Axios({
    method: "POST",
    url: "https://developer.api.autodesk.com/authentication/v1/authenticate",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    data: querystring.stringify({
      client_id: FORGE_CLIENT_ID,
      client_secret: FORGE_CLIENT_SECRET,
      grant_type: "client_credentials",
      scope: scopes,
    }),
  })
    .then(function (response) {
      // Success
      access_token = response.data.access_token;
      console.log(response);
      res.redirect("/api/forge/datamanagement/bucket/create");
    })
    .catch(function (error) {
      // Failed
      console.log(error);
      res.send("Failed to authenticate");
    });
});

// Route /api/forge/oauth/public
app.get("/api/forge/oauth/public", function (req, res) {
  Axios({
    method: "POST",
    url: "https://developer.api.autodesk.com/authentication/v1/authenticate",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    data: querystring.stringify({
      client_id: FORGE_CLIENT_ID,
      client_secret: FORGE_CLIENT_SECRET,
      grant_type: "client_credentials",
      scope: "viewables:read",
    }),
  })
    .then(function (response) {
      console.log(response);
      res.json({
        access_token: response.data.access_token,
        expires_in: response.data.expires_in,
      });
    })
    .catch(function (error) {
      console.log(error);
      res.status(500).json(error);
    });
});

const bucketKey = FORGE_CLIENT_ID.toLowerCase() + "_tutorial_bucket";
const policyKey = "transient";

// Route /api/forge/datamanagement/bucket/create
app.get("/api/forge/datamanagement/bucket/create", function (req, res) {
  Axios({
    method: "POST",
    url: "https://developer.api.autodesk.com/oss/v2/buckets",
    headers: {
      "content-type": "application/json",
      Authorization: "Bearer " + access_token,
    },
    data: JSON.stringify({
      bucketKey: bucketKey,
      policyKey: policyKey,
    }),
  })
    .then(function (response) {
      console.log(response);
      res.redirect("/api/forge/datamanagement/bucket/detail");
    })
    .catch(function (error) {
      if (error.response && error.response.status == 409) {
        console.log("Bucket already exists, skip creation.");
        res.redirect("/api/forge/datamanagement/bucket/detail");
      }
      console.log(error);
      res.send("Failed to create a new bucket");
    });
});

// Route /api/forge/datamanagement/bucket/detail
app.get("/api/forge/datamanagement/bucket/detail", function (req, res) {
  Axios({
    method: "GET",
    url:
      "https://developer.api.autodesk.com/oss/v2/buckets/" +
      encodeURIComponent(bucketKey) +
      "/details",
    headers: {
      Authorization: "Bearer " + access_token,
    },
  })
    .then(function (response) {
      console.log(response);
      res.json({ message: "/upload.html" });
    })
    .catch(function (error) {
      console.log(error);
      res.send("Failed to verify the new bucket");
    });
});

var Buffer = require("buffer").Buffer;
String.prototype.toBase64 = function () {
  return new Buffer(this).toString("base64");
};

var multer = require("multer");
var { join } = require("path");

var upload = multer({
  storage: multer.diskStorage({
    destination: join(__dirname, "tmp"),
    filename: (req, file, cb) => {
      const fileName = `${Date.now()}-${file.originalname}`;

      cb(null, fileName);
    },
  }),
});

// Route /api/forge/datamanagement/bucket/upload
app.post(
  "/api/forge/datamanagement/bucket/upload",
  upload.single("file"),
  function (req, res) {
    var fs = require("fs");

    fs.readFile(req.file.path, function (err, filecontent) {
      Axios({
        method: "PUT",
        url:
          "https://developer.api.autodesk.com/oss/v2/buckets/" +
          encodeURIComponent(bucketKey) +
          "/objects/" +
          encodeURIComponent(req.file.originalname),
        headers: {
          Authorization: "Bearer " + access_token,
          "Content-Disposition": req.file.originalname,
          "Content-Length": filecontent.length,
        },
        data: filecontent,
      })
        .then(function (response) {
          console.log(response);
          var urn = response.data.objectId.toBase64();
          res.redirect("/api/forge/modelderivative/" + urn);
        })
        .catch(function (error) {
          console.log(error);
          res.send("Failed to create a new object in the bucket");
        });
    });
  }
);

// Route /api/forge/modelderivative
app.get("/api/forge/modelderivative/:urn", function (req, res) {
  var urn = req.params.urn;
  var format_type = "svf";
  var format_views = ["2d", "3d"];
  Axios({
    method: "POST",
    url: "https://developer.api.autodesk.com/modelderivative/v2/designdata/job",
    headers: {
      "content-type": "application/json",
      Authorization: "Bearer " + access_token,
    },
    data: JSON.stringify({
      input: {
        urn: urn,
      },
      output: {
        formats: [
          {
            type: format_type,
            views: format_views,
          },
        ],
      },
    }),
  })
    .then(function (response) {
      console.log(response);
      res.json({ message: "/viewer.html?urn=", urn });
    })
    .catch(function (error) {
      console.log(error);
      res.send("Error at Model Derivative job.");
    });
});
