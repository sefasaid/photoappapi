require("dotenv").config();
const express = require("express");
const multer = require("multer");
const { Client } = require("@microsoft/microsoft-graph-client");
const moment = require("moment");
const fetch = require("isomorphic-fetch");
const { getAccessToken } = require("./auth");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(
  cors({
    origin: "*",
    credentials: true,
    methods: "GET,POST,PUT,DELETE",
  })
);
var bodyParser = require("body-parser");
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));
const upload = multer({ storage: multer.memoryStorage() });

// Initialize Microsoft Graph client with dynamic token
let accessToken;
async function initializeClient() {
  accessToken = await getAccessToken();
  axios.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
  axios.defaults.baseURL = "https://graph.microsoft.com/v1.0";
}

// Initialize client on startup
initializeClient().catch(console.error);

// Refresh token every 50 minutes (tokens typically expire after 1 hour)
setInterval(() => {
  initializeClient().catch(console.error);
}, 50 * 60 * 1000);

async function ensureFolderExists(folderPath) {
  const folderUrl = `/drives/${process.env.DRIVE_ID}/root:/Photos/${folderPath}:/`;
  console.log(folderUrl);
  return new Promise(async (resolve, reject) => {
    // 1. Check if the folder exists
    axios
      .get(folderUrl)
      .then((res) => {
        if (res.status === 200) {
          resolve(true);
        }
      })
      .catch((err) => {
        if (err.response.status === 404) {
          const parentPath = folderPath.split("/").slice(0, -1).join("/") || "";
          const folderName = folderPath.split("/").pop();
          console.log(parentPath, folderName);
          const createUrl = `/drives/${process.env.DRIVE_ID}/root:/${parentPath}:/children`;

          axios
            .post(createUrl, {
              name: folderName,
              folder: {},
              "@microsoft.graph.conflictBehavior": "fail",
            })
            .then((res) => {
              if (res.status === 201) {
                resolve(true);
              } else {
                reject(false);
              }
            })
            .catch((err) => {
              console.log(err.response.data);
              reject(false);
            });
        } else {
          reject(false);
        }
      });
  });

  //   if (checkResponse.status === 200) {
  //     console.log(`✅ Folder '${folderPath}' already exists.`);
  //     resolve(true);
  //   } else if (checkResponse.status === 404) {
  //     console.log(`📂 Folder '${folderPath}' does not exist. Creating it...`);

  //     // 2. Create the folder
  //     const parentPath = folderPath.split("/").slice(0, -1).join("/") || "";
  //     const folderName = folderPath.split("/").pop();

  //     const createUrl = `/drives/${process.env.DRIVE_ID}/root:/${parentPath}:/children`;

  //     const createResponse = await axios.post(createUrl, {
  //       name: folderName,
  //       folder: {},
  //       "@microsoft.graph.conflictBehavior": "fail",
  //     });

  //     if (createResponse.status === 201) {
  //       console.log(`✅ Folder '${folderPath}' created successfully.`);
  //       resolve(true);
  //     } else {
  //       console.error("❌ Error creating folder:", createResponse.status);
  //       reject(false);
  //     }
  //   } else {
  //     console.error("⚠️ Error checking folder:", checkResponse.status);
  //     reject(false);
  //   }
  // });
}

// Upload image endpoint
app.post("/upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided" });
    }

    const date = req.body.date || moment().format("YYYY-MM-DD");
    await ensureFolderExists(date);

    const fileName = `${Date.now()}-${req.file.originalname}`;
    const filePath = `/Photos/${date}/${fileName}`;

    const uploadSessionResponse = await axios.post(
      `/drives/${process.env.DRIVE_ID}/root:/${filePath}:/createUploadSession`,
      {
        item: {
          "@microsoft.graph.conflictBehavior": "replace",
          name: fileName,
        },
      }
    );
    console.log(uploadSessionResponse.data);
    const uploadUrl = uploadSessionResponse.data.uploadUrl;
    const fileSize = req.file.buffer.length;

    const uploadResp = await axios.put(uploadUrl, req.file.buffer, {
      headers: {
        "Content-Length": fileSize,
        "Content-Range": `bytes 0-${fileSize - 1}/${fileSize}`,
      },
    });

    if (uploadResp.status > 299) {
      throw new Error("Failed to upload file");
    }

    res.json({
      message: "Image uploaded successfully",
      fileName,
      date,
    });
  } catch (error) {
    console.log(error);
    console.error("Upload error:", error.message);
    res.status(500).json({ error: "Failed to upload image" });
  }
});

app.get("/images/:date", async (req, res) => {
  try {
    const { date } = req.params;
    const folderPath = `/Photos/${date}`;

    const response = await axios.get(
      `/drives/${process.env.DRIVE_ID}/root:${folderPath}:/children`
    );

    const images = response.data.value.map((item) => ({
      name: item.name,
      webUrl: item.webUrl,
      downloadUrl: item["@microsoft.graph.downloadUrl"],
      createdDateTime: item.createdDateTime,
    }));

    res.json({ images });
  } catch (error) {
    if (error.status === 404) {
      res.status(200).json({ images: [] });
    } else {
      console.error("Get images error:", error);
      res.status(500).json({ error: "Failed to retrieve images" });
    }
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
