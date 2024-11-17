import { cwd as getCwd } from 'node:process';
import { defineCommand, runMain } from 'citty';
import { getPackagesByDependencies } from './catalogger';
import { reportAsJson, reportAsText } from './reporters';
import { updateDependencies } from './updaters';

const main = defineCommand({
  meta: {
    name: 'catalogger',
    description: 'Find pnpm catalog candidates in your monorepos',
  },
  args: {
    json: {
      type: 'boolean',
      description: 'Output as JSON',
      alias: ['j'],
      default: false,
      valueHint: 'boolean',
    },
    update: {
      type: 'boolean',
      description: 'Update packages versions and workspace file',
      alias: ['u'],
      default: false,
      valueHint: 'boolean',
    },
    interactive: {
      type: 'boolean',
      description: 'Update while in interactive mode',
      alias: ['i'],
      default: false,
      valueHint: 'boolean',
    },

    cwd: {
      type: 'positional',
      description: 'Current working directory',
      valueHint: 'string',
      required: false,
    },
  },

  run: async (context) => {
    const { args } = context;
    const { json: outputAsJson, update: shouldUpdate, cwd = getCwd(), interactive = false } = args;

    const dependenciesDetails = await getPackagesByDependencies({ cwd });

    if (shouldUpdate) {
      await updateDependencies({ dependenciesDetails, cwd });
    }

    if (outputAsJson) {
      return reportAsJson({ dependenciesDetails });
    }

    reportAsText({ dependenciesDetails, shouldUpdate });
  },
});

runMain(main);
