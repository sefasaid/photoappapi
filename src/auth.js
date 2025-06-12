async function getAccessToken() {
  try {
    const tenantId = "3e5db9ac-4879-4bc1-b014-d973c4d7dacf"; // Your Azure AD tenant ID
    const apiUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
    const tokenResponse = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `grant_type=client_credentials&client_id=${process.env.CLIENT_ID}&client_secret=${process.env.CLIENT_SECRET}&scope=https%3A%2F%2Fgraph.microsoft.com%2F.default`,
    });
    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    return accessToken;
  } catch (error) {
    console.error("Error getting access token:", error);
    if (error.errorMessage) {
      console.error("Error message:", error.errorMessage);
    }
    if (error.stack) {
      console.error("Stack trace:", error.stack);
    }
    throw error;
  }
}

module.exports = { getAccessToken };
