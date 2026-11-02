import * as migration_20261102_145913_initial from './20261102_145913_initial';
import * as migration_20261102_151718_users_roles_media from './20261102_151718_users_roles_media';

export const migrations = [
  {
    up: migration_20261102_145913_initial.up,
    down: migration_20261102_145913_initial.down,
    name: '20261102_145913_initial',
  },
  {
    up: migration_20261102_151718_users_roles_media.up,
    down: migration_20261102_151718_users_roles_media.down,
    name: '20261102_151718_users_roles_media'
  },
];
