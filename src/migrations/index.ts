import * as migration_20261102_145913_initial from './20261102_145913_initial';

export const migrations = [
  {
    up: migration_20261102_145913_initial.up,
    down: migration_20261102_145913_initial.down,
    name: '20261102_145913_initial'
  },
];
