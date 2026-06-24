import { createClient } from '@supabase/supabase-js';
import pkg from 'pg';
const { Client } = pkg;
import fs from 'fs';

// Parse .env
const envContent = fs.readFileSync('.env', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let val = match[2] || '';
    if (val.startsWith('"') || val.startsWith("'")) val = val.slice(1, -1);
    env[match[1]] = val;
  }
});

// ── 1. Using pg (direct SQL) to add Super Admin role ──────────────────────────
const client = new Client({
  user: 'postgres.kmlhipcavrhhemwyipdt',
  host: 'aws-1-ap-northeast-1.pooler.supabase.com',
  database: 'postgres',
  password: 'Mohamad.rimex1310',
  port: 6543,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 8000,
});

async function main() {
  await client.connect();
  console.log("Connected to database!");

  // Show existing roles
  const existingRoles = await client.query('SELECT id, name FROM roles');
  console.log("Existing roles:", existingRoles.rows);

  // Check if Super Admin already exists
  const superAdminCheck = await client.query("SELECT id FROM roles WHERE name = 'Super Admin'");
  if (superAdminCheck.rows.length > 0) {
    console.log("Super Admin role already exists. ID:", superAdminCheck.rows[0].id);
    console.log("Updating its permissions to ensure all are enabled...");
    await client.query(
      `UPDATE roles SET permissions = $1 WHERE name = 'Super Admin'`,
      [JSON.stringify({
        canUpdateStatus : true,
        canEditTask     : true,
        canDeleteTask   : true,
        canCreateTask   : true,
        canAssignTask   : true,
        canManageUsers  : true,
        canCreateUser   : true,
        canManageRoles  : true,
      })]
    );
    console.log("Super Admin permissions updated!");
  } else {
    // Insert new Super Admin role
    const insertResult = await client.query(
      `INSERT INTO roles (name, permissions, built_in)
       VALUES ('Super Admin', $1, true)
       RETURNING *`,
      [JSON.stringify({
        canUpdateStatus : true,
        canEditTask     : true,
        canDeleteTask   : true,
        canCreateTask   : true,
        canAssignTask   : true,
        canManageUsers  : true,
        canCreateUser   : true,
        canManageRoles  : true,
      })]
    );
    console.log("Super Admin role created:", insertResult.rows[0]);
  }

  // Now get the Super Admin role ID
  const superAdminRole = await client.query("SELECT id FROM roles WHERE name = 'Super Admin'");
  const superAdminRoleId = superAdminRole.rows[0].id;
  console.log("Super Admin Role ID:", superAdminRoleId);

  // Assign the admin_new user to Super Admin role
  const adminUser = await client.query("SELECT * FROM profiles WHERE username = 'admin_new'");
  if (adminUser.rows.length > 0) {
    await client.query(
      `UPDATE profiles SET role_id = $1 WHERE username = 'admin_new'`,
      [superAdminRoleId]
    );
    console.log("admin_new user assigned to Super Admin role!");
  }

  // Also assign the 'mohamad' user to Super Admin role
  const mohamadUser = await client.query("SELECT * FROM profiles WHERE username = 'mohamad'");
  if (mohamadUser.rows.length > 0) {
    await client.query(
      `UPDATE profiles SET role_id = $1 WHERE username = 'mohamad'`,
      [superAdminRoleId]
    );
    console.log("'mohamad' user assigned to Super Admin role!");
  }

  // Show final roles
  const finalRoles = await client.query('SELECT id, name, permissions FROM roles');
  console.log("\nFinal roles:");
  finalRoles.rows.forEach(r => console.log(`  ${r.name}: ${JSON.stringify(r.permissions)}`));

  // Show final profiles
  const finalProfiles = await client.query(`
    SELECT p.username, r.name as role_name 
    FROM profiles p 
    LEFT JOIN roles r ON p.role_id = r.id
  `);
  console.log("\nFinal user -> role assignments:");
  finalProfiles.rows.forEach(p => console.log(`  ${p.username}: ${p.role_name}`));

  await client.end();
}

main().catch(err => {
  console.error(err);
  client.end();
});
