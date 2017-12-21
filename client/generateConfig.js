const baseConfig = require('./base-app.json');

console.log('Application configuration loaded from base-app.json');

const config = Object.assign({}, baseConfig);

const fs = require('fs');
const path = require('path');

// Create an array of env files
const dotEnvFiles = [path.join(__dirname, '.env'),];

console.log('Environment configuration settings loaded from', dotEnvFiles);

// Load env files, supress warnings
dotEnvFiles.forEach(dotEnvFile => {
  if (fs.existsSync(dotEnvFile)) {
    // eslint-disable-next-line
    require('dotenv').config({
      path: dotEnvFile,
    });
  }
});

// We will only use REACT_NATIVE_APP_* environment variables
const REACT_NATIVE_APP = /^REACT_NATIVE_APP_/i;

console.log('Using environment configurations that match', REACT_NATIVE_APP);

const getClientEnvironment = () => {
  const env = {};
  Object.keys(process.env)
    .filter(key => REACT_NATIVE_APP.test(key))
    .forEach(key => {
      env[key] = process.env[key];
    });
  return env;
};

config.expo.extra = getClientEnvironment();

console.log('Configuration contents generated, writing to app.json');

fs.writeFileSync('app.json', JSON.stringify(config, null, 2), 'utf8');
