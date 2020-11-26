import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

import Api from "../services/Api";

const Autodesk = window.Autodesk;

function Viewer() {
  const { urn } = useParams();

  const [viewer, setViewer] = useState(null);
  const [options, setOptions] = useState({});
  const [documentId, setDocumentId] = useState("");

  useEffect(() => {
    if (urn) {
      setOptions((o) => ({
        env: "AutodeskProduction",
        api: "derivativeV2",
        getAccessToken: getForgeToken,
      }));

      setDocumentId((d) => `urn:${urn}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urn]);

  useEffect(() => {
    if (options) {
      Autodesk.Viewing.Initializer(options, function onInitialized() {
        var htmlElement = document.getElementById("MyViewerDiv");
        if (htmlElement) {
          setViewer(
            (v) =>
              new Autodesk.Viewing.GuiViewer3D(htmlElement, {
                extensions: [
                  "Autodesk.Viewing.MarkupsCore",
                  "Autodesk.Viewing.MarkupsGui",
                ],
              })
          );
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options]);

  useEffect(() => {
    if (viewer && documentId) {
      viewer.start();

      Autodesk.Viewing.Document.load(
        documentId,
        onDocumentLoadSuccess,
        onDocumentLoadFailure
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewer, documentId]);

  const onDocumentLoadSuccess = async (doc) => {
    var viewable = doc.getRoot().getDefaultGeometry();
    if (viewable) {
      await viewer.loadDocumentNode(doc, viewable);
    }
  };

  const onDocumentLoadFailure = (viewerErrorCode) => {
    console.error("onDocumentLoadFailure() - errorCode: " + viewerErrorCode);
  };

  const getForgeToken = (callback) => {
    Api.get("/api/forge/oauth/public").then(
      ({ data: { access_token, expires_in } }) => {
        callback(access_token, expires_in);
      }
    );
  };

  async function screenShot() {
    const dataUrl = await getScreenshotDataUrl(
      viewer,
      viewer.container.clientWidth,
      viewer.container.clientHeight
    );

    const image = new Image();
    image.src = dataUrl;

    document.getElementById("overlay").appendChild(image);

    let tab = window.open();
    tab.document.body.innerHTML = `<img src="${dataUrl}" width=${viewer.container.clientWidth} height=${viewer.container.clientHeight}>`;
  }

  async function getScreenshotDataUrl(viewer, width, height) {
    const markupExt = await viewer.getExtension("Autodesk.Viewing.MarkupsCore");
    return new Promise(function (resolve, reject) {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      const image = new Image();
      image.onload = function () {
        context.drawImage(image, 0, 0);
        markupExt.renderToCanvas(context, function () {
          resolve(canvas.toDataURL("image/png"));
        });
      };
      viewer.getScreenShot(width, height, (blob) => (image.src = blob));
    });
  }

  return (
    <>
      <div id="overlay">
        <button
          onClick={() => {
            screenShot();
          }}
        >
          Take a screenshot
        </button>
      </div>
      <div id="MyViewerDiv"></div>
    </>
  );
}

export default Viewer;
