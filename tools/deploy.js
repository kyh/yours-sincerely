const { spawn, exec } = require('child_process');
const inquirer = require('inquirer');
const DEPLOY_LOCATIONS = require('./heroku-mappings');

function execLog(command) {
  return new Promise((resolve, reject) => {
    console.log(`Running: ${command}`);
    const childProcess = spawn(command, { stdio: 'inherit', shell: true });

    childProcess.on('exit', (code) => {
      if (code !== 0) return reject();
      return resolve();
    });
  });
}

function execPromise(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) return reject(error);
      return resolve(stdout);
    });
  });
}

function beforeDeploy(answers) {
  return Promise.resolve();
}

function deploy(location, branch) {
  return execLog(`git push -f ${location} ${branch}:master`);
}

console.log('Fetching the latest branches and tags...');
exec('git fetch origin', () => {
  inquirer
    .prompt([
      {
        type: 'list',
        name: 'location',
        message: 'Where would you like to deploy to?',
        choices: Object.values(DEPLOY_LOCATIONS),
        default: DEPLOY_LOCATIONS.dev.value,
      },
      {
        type: 'input',
        name: 'branch',
        message: 'What branch do you want to deploy?',
        default: () => execPromise('git rev-parse --abbrev-ref HEAD'),
        filter: (val) => val.replace(/\n$/, ''),
      },
    ])
    .then(async (answers) => {
      await beforeDeploy(answers);

      if (answers.location === DEPLOY_LOCATIONS.dev.value) {
        console.log('Deploying YS to dev:');
        await deploy(answers.location, answers.branch);
      }

      if (answers.location === DEPLOY_LOCATIONS.prod.value) {
        console.log('Deploying YS to prod:');
        await deploy(answers.location, answers.branch);
      }
    });
});
