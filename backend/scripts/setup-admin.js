import bcrypt from "bcryptjs";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { pool } from "../src/config/db.js";

async function main() {
  const rl = readline.createInterface({ input, output });

  try {
    console.log("=== CrediFit Safe Administrator Setup Utility ===");

    // Fetch existing ADMIN users
    const [existingAdmins] = await pool.query(
      `SELECT u.user_id, u.full_name, u.email, u.account_status, r.role_code
       FROM users u
       JOIN roles r ON u.role_id = r.role_id
       WHERE r.role_code = 'ADMIN'`
    );

    if (existingAdmins.length > 0) {
      console.log(`\nExisting Administrator Accounts Found (${existingAdmins.length}):`);
      existingAdmins.forEach((adm) => {
        console.log(` - ID: ${adm.user_id} | Name: ${adm.full_name} | Email: ${adm.email} | Status: ${adm.account_status}`);
      });
      console.log("\nNote: Existing admin credentials will NOT be overwritten.");
    } else {
      console.log("\nNo existing administrator accounts found in the database.");
    }

    const choice = (await rl.question("\nWould you like to register a new administrator account? (yes/no): ")).trim().toLowerCase();

    if (choice !== "yes" && choice !== "y") {
      console.log("No changes made. Exiting.");
      return;
    }

    const email = (await rl.question("Enter Admin Email: ")).trim().toLowerCase();
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      console.log("Invalid email format. Aborted.");
      return;
    }

    // Check if this email already exists
    const [checkUser] = await pool.execute("SELECT user_id, email FROM users WHERE email = ? LIMIT 1", [email]);
    if (checkUser[0]) {
      console.log(`\nAn account with email '${email}' already exists in the database!`);
      console.log("Per safety rules, existing user credentials will not be overwritten.");
      return;
    }

    const fullName = (await rl.question("Enter Admin Full Name: ")).trim();
    const password = await rl.question("Enter Admin Password (min 8 chars): ");

    if (password.length < 8) {
      console.log("Password too short. Minimum 8 characters required. Aborted.");
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [roleRows] = await pool.execute("SELECT role_id FROM roles WHERE role_code = 'ADMIN' LIMIT 1");
    const adminRoleId = roleRows[0]?.role_id || 4;

    const [insertResult] = await pool.execute(
      `INSERT INTO users (role_id, full_name, email, password_hash, phone_country_code, phone, account_status, email_verified, created_at)
       VALUES (?, ?, ?, ?, '+91', NULL, 'ACTIVE', 1, CURRENT_TIMESTAMP)`,
      [adminRoleId, fullName, email, passwordHash]
    );

    const newUserId = insertResult.insertId;

    await pool.execute(
      `INSERT INTO staff_profiles (user_id, employee_code, department, designation, created_at)
       VALUES (?, ?, 'Administration', 'System Administrator', CURRENT_TIMESTAMP)`,
      [newUserId, `ADM-${newUserId}`]
    );

    console.log(`\n Administrator account created successfully!`);
    console.log(`User ID: ${newUserId}`);
    console.log(`Name:    ${fullName}`);
    console.log(`Email:   ${email}`);
    console.log("You can now log in at http://localhost:5173/login");
  } catch (err) {
    console.error("Setup error:", err.message);
  } finally {
    rl.close();
    await pool.end();
  }
}

main();
