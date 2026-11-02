import * as migration_20261102_145913_initial from './20261102_145913_initial';
import * as migration_20261102_151718_users_roles_media from './20261102_151718_users_roles_media';
import * as migration_20261102_152958_pages from './20261102_152958_pages';
import * as migration_20261102_153922_content_collections from './20261102_153922_content_collections';
import * as migration_20261102_154300_globals from './20261102_154300_globals';
import * as migration_20261102_154803_page_layout_blocks from './20261102_154803_page_layout_blocks';

export const migrations = [
  {
    up: migration_20261102_145913_initial.up,
    down: migration_20261102_145913_initial.down,
    name: '20261102_145913_initial',
  },
  {
    up: migration_20261102_151718_users_roles_media.up,
    down: migration_20261102_151718_users_roles_media.down,
    name: '20261102_151718_users_roles_media',
  },
  {
    up: migration_20261102_152958_pages.up,
    down: migration_20261102_152958_pages.down,
    name: '20261102_152958_pages',
  },
  {
    up: migration_20261102_153922_content_collections.up,
    down: migration_20261102_153922_content_collections.down,
    name: '20261102_153922_content_collections',
  },
  {
    up: migration_20261102_154300_globals.up,
    down: migration_20261102_154300_globals.down,
    name: '20261102_154300_globals',
  },
  {
    up: migration_20261102_154803_page_layout_blocks.up,
    down: migration_20261102_154803_page_layout_blocks.down,
    name: '20261102_154803_page_layout_blocks'
  },
];
