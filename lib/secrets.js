/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable class-methods-use-this */
const AWS = require('aws-sdk');

const MAX_SSM_PARAMETERS_PER_REQUEST = 10;

class Secrets {
  constructor(secretList) {
    this.secretList = secretList;
    Object.keys(secretList).forEach((secret) => {
      this[secret] = secretList[secret];
    });
  }

  flattenParameters(params) {
    const flat = {};
    params.forEach((param) => {
      flat[param.Name.replace(/^.+\/(.+)$/, '$1')] = param.Value;
    });
    return flat;
  }

  init() {
    if (this.initPromise === undefined) {
      this.initPromise = new Promise((resolve, reject) => {
        const shouldLoadSecretsFromSsm = !process.env.IS_OFFLINE || process.env.IS_TEST;
        if (shouldLoadSecretsFromSsm) {
          this.loadSecrets().then(resolve, reject);
        } else {
          resolve();
        }
      });
    }
    return this.initPromise;
  }

  loadSecrets() {
    const ssm = new AWS.SSM();
    const secretNames = Object.keys(this.secretList).map(secret => process.env[secret]);

    // Create an array of promises of SSM getparameters requests.
    // Max 10 per call.
    const promises = [];
    while (secretNames.length > 0) {
      const subSet = secretNames.splice(0, MAX_SSM_PARAMETERS_PER_REQUEST);
      promises.push(ssm.getParameters({ Names: subSet, WithDecryption: true }).promise());
    }
    return Promise.all(promises)
      .then((secrets) => {
        const settingsArray = [];
        secrets.forEach((secretSet) => {
          settingsArray.push(...secretSet.Parameters);
        });
        const settings = this.flattenParameters(settingsArray);
        Object.keys(settings).forEach((setting) => {
          this[setting] = settings[setting];
        });
      });
  }
}

module.exports = Secrets;
