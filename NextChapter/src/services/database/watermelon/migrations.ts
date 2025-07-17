import { schemaMigrations } from '@nozbe/watermelondb/Schema/migrations';

export const migrations = schemaMigrations({
  migrations: [
    // Initial schema - version 1 is created by the schema itself
    // Future migrations would go here
    // Example:
    // {
    //   toVersion: 2,
    //   steps: [
    //     addColumns({
    //       table: 'profiles',
    //       columns: [
    //         { name: 'avatar_url', type: 'string', isOptional: true }
    //       ]
    //     })
    //   ]
    // }
  ]
});