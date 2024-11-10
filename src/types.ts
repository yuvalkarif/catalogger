export type DependencyMap = { direct: 'dependencies' ; dev: 'devDependencies' ; peer: 'peerDependencies' ; optional: 'optionalDependencies' };

export type DependencyType = keyof DependencyMap;

export type PackageDependency = {
  packageName: string;
  version: string;
  packagePath: string;
  dependencyType: DependencyType;
};

export type DependencyPresenceDetails = {
  dependencyName: string;
  highestVersion: string;
  packages: PackageDependency[];
};
