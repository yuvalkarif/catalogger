import type { DependencyPresenceDetails, DependencyType } from './types';
import { exec } from 'node:child_process';
import { cwd as getCwd } from 'node:process';
import { promisify } from 'node:util';
import { chain, map } from 'lodash-es';
import semver from 'semver';

const execAsync = promisify(exec);

export async function getPackagesByDependencies({ cwd = getCwd() }: { cwd?: string } = { }) {
  const { stdout } = await execAsync('pnpm -r ls --json', { cwd });
  const packagesDeps = JSON.parse(stdout);

  const dependenciesByPackages: DependencyPresenceDetails[] = chain(packagesDeps)
    .map(({ dependencies = {}, name: packageName, path: packagePath, devDependencies = {}, peerDependencies = {}, optionalDependencies = {} }) => [
      ...map(dependencies, ({ version }, dependencyName) => ({ dependencyName, packageName, version, packagePath, dependencyType: 'direct' satisfies DependencyType } as const)),
      ...map(devDependencies, ({ version }, dependencyName) => ({ dependencyName, packageName, version, packagePath, dependencyType: 'dev' satisfies DependencyType } as const)),
      ...map(peerDependencies, ({ version }, dependencyName) => ({ dependencyName, packageName, version, packagePath, dependencyType: 'peer' satisfies DependencyType } as const)),
      ...map(optionalDependencies, ({ version }, dependencyName) => ({ dependencyName, packageName, version, packagePath, dependencyType: 'optional' satisfies DependencyType } as const)),
    ])
    .flatten()
    .filter(({ version }) => semver.valid(version) !== null)
    .groupBy('dependencyName')
    .map(dependencies => ({
      dependencyName: dependencies[0].dependencyName,
      highestVersion: semver.maxSatisfying(map(dependencies, 'version'), '*') as unknown as string,
      packages: map(dependencies, ({ packageName, version, packagePath, dependencyType }) => ({
        packageName,
        version,
        packagePath,
        dependencyType,
      })),
    }))
    .filter(({ packages }) => packages.length > 1)
    .sortBy(({ packages }) => -packages.length)
    .value();

  return dependenciesByPackages;
}
