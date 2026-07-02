require("dotenv").config();

const apiUrl = process.env.EXPO_PUBLIC_API_URL;

module.exports = ({ config }) => ({
  ...config,
  extra: {
    ...(config.extra || {}),
    apiUrl,
  },
});
