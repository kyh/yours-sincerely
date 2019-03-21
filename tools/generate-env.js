/**
 * This tool generates .env.local, .env.dev, .env.prod files.
 *
 * It uses a Heroku app as a base, and overrides the Heroku config
 * for some environments.
 */

const _ = require('lodash');
const Promise = require('bluebird');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const writeFile = util.promisify(require('fs').writeFile);

const DEPLOY_LOCATIONS = require('./heroku-mappings');

const ENV_TO_APP_MAPPING = {
  local: DEPLOY_LOCATIONS.dev.herokuName,
  dev: DEPLOY_LOCATIONS.dev.herokuName,
  prod: DEPLOY_LOCATIONS.prod.herokuName,
};

const OVERRIDES = {
  local: {},
};

const getHerokuVars = async (app) => {
  const { stdout } = await exec(`heroku config -a ${app}`);
  return _.fromPairs(
    stdout
      .split('\n')
      .slice(1, -1)
      .map((line) => {
        const colonPos = line.indexOf(':');
        const key = line.substr(0, colonPos);
        const value = line.substr(colonPos + 1);

        return [key.trim(), value.trim()];
      }),
  );
};

const generateDotenv = (vars) =>
  _.map(vars, (value, key) => `${key}=${value}\n`).join('');

Promise.map(_.keys(ENV_TO_APP_MAPPING), async (env) => {
  const herokuVars = await getHerokuVars(ENV_TO_APP_MAPPING[env]);
  const vars = _.extend(herokuVars, OVERRIDES[env] || {});
  const fileContents = generateDotenv(vars);

  return writeFile(`config/.env.${env}`, fileContents);
});
