/**
 * This script scaffolds React component(s) inside a package.
 *
 * For the following command:
 *
 * `npm run create:components package-name ComponentName ComponentName2`
 *
 * The following file tree will be generated:
 *
 * /components/pacakage-name
 * ├── /src/
 * |   │── ComponentName.js
 * |   └── ComponentName2.js
 * ├── /stories/
 * |   │── ComponentName.stories.js
 * |   └── ComponentName2.stories.js
 * └── index.js
 *
 */
const path = require('path');
const fs = require('fs-extra');
const task = require('./task');

const componentTemplate = require('./component-template');
const storyTemplate = require('./component-story-template');

const packageName = process.argv[2];

function getIndexContent(componentNames) {
  return componentNames
    .map(
      (componentName) =>
        `export { default as ${componentName} } from './src/${componentName}';`,
    )
    .join('\n');
}

function initialIsCapital(word) {
  return word[0] !== word[0].toLowerCase();
}

function create({ componentName, componentPath, template }) {
  if (!componentName) {
    throw new Error(
      'Missing component name argument, use: `npm run create:components [package-name] [ComponentName]`',
    );
  }

  if (!initialIsCapital(componentName)) {
    throw new Error(
      `Wrong format for '${componentName}': use CamelCase for ComponentName`,
    );
  }

  return fs.writeFile(path.join(componentPath), template({ componentName }));
}

function createComponent({ componentName, packageDir }) {
  const componentPath = path.join(packageDir, 'src', `${componentName}.js`);
  return create({
    componentName,
    componentPath,
    template: componentTemplate,
  });
}

function createStory({ componentName, packageDir }) {
  const componentPath = path.join(
    packageDir,
    'stories',
    `${componentName}.stories.js`,
  );
  return create({
    componentName,
    componentPath,
    template: storyTemplate,
  });
}

module.exports = task('create-package-components', async () => {
  const componentNames = [...process.argv];
  componentNames.splice(0, 3);

  if (!packageName) {
    throw new Error(
      'Missing package name argument, use: `npm run create:components [package-name] [ComponentName]`',
    );
  }

  const packageDir = path.join('client/components', packageName);

  // Check if directory already exist
  const packageDirExistsAlready = await fs.pathExists(packageDir);

  const srcDir = path.join(packageDir, 'src');
  const storiesDir = path.join(packageDir, 'stories');
  const indexDir = path.join(packageDir, 'index.js');
  const rootIndexDir = path.join('client/components', 'index.js');

  const indexContent = getIndexContent(componentNames);

  if (packageDirExistsAlready) {
    console.info(`Package already exists: ${packageDir}`);
    // Append new components to package index
    await fs.appendFile(indexDir, indexContent);
  } else {
    // Create directory
    console.info('Package name will be:', packageName);
    await fs.ensureDir(packageDir);
    // Create `src` dir in package
    await fs.ensureDir(srcDir);
    // Create `stories` dir in package
    await fs.ensureDir(storiesDir);
    // Create index in root of package
    await fs.writeFile(indexDir, indexContent);
    // Append new packages to end of index.js
    await fs.appendFile(rootIndexDir, `export * from './${packageName}';`);
  }

  await Promise.all(
    componentNames.map((componentName) =>
      createComponent({ componentName, packageDir }),
    ),
  );

  await Promise.all(
    componentNames.map((componentName) =>
      createStory({ componentName, packageDir }),
    ),
  );
});
