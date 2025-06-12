const dotenv = require("dotenv");
dotenv.config();
const fs = require("fs");

async function uploadFileToOneDrive(file, targetPath) {
  const tenantId = "3e5db9ac-4879-4bc1-b014-d973c4d7dacf"; // Your Azure AD tenant ID
  const resource = "https://graph.microsoft.com";
  const scope = "https://graph.microsoft.com/.default";
  const apiUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

  try {
    const tokenResponse = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `grant_type=client_credentials&client_id=${process.env.CLIENT_ID}&client_secret=${process.env.CLIENT_SECRET}&scope=https%3A%2F%2Fgraph.microsoft.com%2F.default`,
    });

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    const drivesRes = await fetch("https://graph.microsoft.com/v1.0/drives", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const drivesData = await drivesRes.json();

    const uploadResponse = await fetch(
      `https://graph.microsoft.com/v1.0/drives/${process.env.DRIVE_ID}/root:${targetPath}:/content`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/octet-stream",
        },
        body: file, // Assuming 'file' is the file data as a Buffer
      }
    );
    console.log(uploadResponse);

    if (uploadResponse.ok) {
      console.log("File uploaded successfully!");
    } else {
      console.error("Error uploading file:", uploadResponse.statusText);
    }
  } catch (error) {
    error.message;
    console.error("Error during upload:", error);
  }
}

// Example usage:
const localFile = "sample.zip";
const onedriveTarget = "/sample.zip"; // Target location in OneDrive
const fileBuffer = fs.readFileSync(localFile);
uploadFileToOneDrive(fileBuffer, onedriveTarget);
