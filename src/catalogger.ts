import { exec } from 'node:child_process';
import { cwd as getCwd } from 'node:process';
import { promisify } from 'node:util';
import { chain, map } from 'lodash-es';
import prompts from 'prompts';
import semver from 'semver';

const execAsync = promisify(exec);

export async function getPackagesByDependencies({ cwd = getCwd() }: { cwd?: string } = {}) {
  const { stdout } = await execAsync('pnpm -r ls --json', { cwd });
  const packagesDeps = JSON.parse(stdout);

  // Create the initial chain without async operations
  const dependenciesChain = chain(packagesDeps)
    .map(({ dependencies = {}, name: packageName, path: packagePath, devDependencies = {} }) => [
      ...map(dependencies, ({ version }, dependencyName) => ({ dependencyName, packageName, version, packagePath, isDevDependency: false })),
      ...map(devDependencies, ({ version }, dependencyName) => ({ dependencyName, packageName, version, packagePath, isDevDependency: true })),
    ])
    .flatten()
    .filter(({ version }) => semver.valid(version) !== null)
    .groupBy('dependencyName')
    .value();

  // Process async operations outside of the chain
  const dependenciesByPackages = [];
  for (const [_, dependencies] of Object.entries(dependenciesChain)) {
    const response = await prompts({
      type: 'autocompleteMultiselect',
      hint: 'zaza',
      choices: [{
        title: 'baba',
        description: 'asdfsa',
        value: 'adfsa',
      }],
      name: 'userInput',
      message: `Enter something for ${dependencies[0].dependencyName}:`,
    });

    dependenciesByPackages.push({
      dependencyName: dependencies[0].dependencyName,
      userInput: response.userInput,
      highestVersion: semver.maxSatisfying(map(dependencies, 'version'), '*') as unknown as string,
      packages: map(dependencies, ({ packageName, version, packagePath, isDevDependency }) => ({
        packageName,
        version,
        packagePath,
        isDevDependency,
      })),
    });
  }

  // Apply final filtering and sorting
  return chain(dependenciesByPackages)
    .filter(({ packages }) => packages.length > 1)
    .sortBy(({ packages }) => -packages.length)
    .value();
}
