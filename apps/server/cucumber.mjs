import os from 'os';

export default {
    paths: ['test/features/**/*.feature'],
    require: ['test/**/*.ts'],
    requireModule: ['@swc-node/register'],
    format: ['progress-bar'],
    parallel: process.env.CI ? os.cpus().length : Math.ceil(os.cpus().length / 2),
    backtrace: true,
    retry: process.env.CI ? 1 : 0,
};
