// src/services/parentmatch.service.js

const axios = require('axios');

const predictParentMatch = async (answers) => {
  const mlUrl = process.env.ML_SERVICE_URL + '/predict';

  const response = await axios.post(mlUrl, { answers });

  if (!response.data || typeof response.data.score === 'undefined') {
    throw new Error('Invalid response from ML service');
  }

  return response.data; // { score, label }
};

module.exports = {
  predictParentMatch
};
