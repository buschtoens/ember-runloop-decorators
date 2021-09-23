const NPMDependencyManagerAdapter = require('ember-try/lib/dependency-manager-adapters/npm');

// Maps arguments for `yarn` to their `pnpm` equivalents. A falsy value, like
// `undefined`, means that the argument is not supported by `pnpm` and will be
// dropped.
// https://github.com/ember-cli/ember-try/blob/v1.4.0/lib/dependency-manager-adapters/npm.js#L116-L123
const argsMap = {
  // > Don't read or generate a `yarn.lock` lockfile.
  // https://classic.yarnpkg.com/en/docs/cli/install/#toc-yarn-install-no-lockfile
  //
  // Normally we would enable `--frozen-lockfile`, however:
  // > If `true`, pnpm doesn't generate a lockfile and fails to install if the
  // > lockfile is out of sync with the manifest / an update is needed or no
  // > lockfile is present.
  // https://pnpm.io/cli/install#--frozen-lockfile
  //
  // Instead we use:
  // > When set to `false`, pnpm won't read or generate a `pnpm-lock.yaml` file.
  // https://pnpm.io/npmrc#lockfile
  '--no-lockfile': '--config.lockfile=false',

  // > Ignore engines check.
  // https://classic.yarnpkg.com/en/docs/cli/install/#toc-yarn-install-ignore-engines
  //
  // > During local development, pnpm will always fail with an error message, if
  // > its version does not match the one specified in the engines field.
  // >
  // > Unless the user has set the `engine-strict` config flag (see `.npmrc`),
  // > this field is advisory only and will only produce warnings when your
  // > package is installed as a dependency.
  // https://pnpm.io/package_json#engines
  //
  // ! This probably doesn't work as expected, because of the "during local
  // development" limitation.
  '--ignore-engines': '--config.engine-strict=false',
};

// Override the `init` method (= "`constructor`") of the `ember-try` dependency
// manager adapter for `npm`, so that `pnpm` support can be optionally enabled
// by setting `npmOptions: { manager: 'pnpm' }` in the `config/ember-try.js`.
//
// https://github.com/ember-cli/ember-try/blob/v1.4.0/lib/dependency-manager-adapters/npm.js#L13-L16
const originalInit = NPMDependencyManagerAdapter.prototype.init;
NPMDependencyManagerAdapter.prototype.init = function (...args) {
  originalInit.apply(this, args);

  // If `npmOptions.manager` is set to `"pnpm"`, then enable `pnpm` mode.
  //
  // `npmOptions` is passed in as `managerOptions`.
  // https://github.com/ember-cli/ember-try/blob/v1.4.0/lib/utils/dependency-manager-adapter-factory.js#L39
  if (this.managerOptions?.manager === 'pnpm') {
    // If `npmOptions` is an object with an `args` property, then let `args`
    // take the place of `managerOptions`, so that the upstream code can process
    // it.
    if (this.managerOptions.args instanceof Array)
      this.managerOptions = this.managerOptions.args;
    // If `npmOptions` itself already is an array (with an extra `manager`
    // property), then keep it as-is, so that the upstream code can process it.
    // If it isn't an array, and `args` is also not set, then unset
    // `managerOptions`, as `npmOptions` was only used to opt-in to `pnpm` mode.
    else if (!(this.managerOptions instanceof Array))
      this.managerOptions = undefined;

    // Enable the `yarn` code path, which is close to what we need for `pnpm`.
    this.useYarnCommand = true;

    // Substitute `yarn.lock` with `pnpm-lock.yaml` accordingly.
    this.yarnLock = 'pnpm-lock.yaml';

    // Note: the upstream convention is to append `.ember-try` _after_ the file
    // extension, however this breaks syntax highlighting, so I've chosen to
    // insert it right before the file extension.
    this.yarnLockBackupFileName = 'pnpm-lock.ember-try.yaml';

    // Patch the `run` method to replace `yarn` with `pnpm` and translate &
    // filter the arguments accordingly.
    const originalRun = this.run;
    this.run = (_cmd, args, opts) =>
      originalRun.call(
        this,
        'pnpm',
        args
          .map((arg) => (arg in argsMap ? argsMap[arg] : arg))
          .filter(Boolean),
        opts
      );
  }
};
