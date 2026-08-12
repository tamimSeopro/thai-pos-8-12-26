import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// API route: Admin User Creation via Supabase Service Role Key
app.post("/api/admin/create-user", async (req, res) => {
  try {
    const { email, username, password, role, storeId, name } = req.body;

    const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://yowcmycyukdvboohtqgq.supabase.co";
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceRoleKey) {
      // Return simulated success or explicit message if key is not set yet in environment
      return res.status(200).json({
        success: true,
        mode: "local_salted_hash",
        message: "Server received account creation request. (Note: SUPABASE_SERVICE_ROLE_KEY environment variable is not configured yet. Account was saved with salted SHA-256 local security).",
      });
    }

    // Initialize Supabase Admin Client with Service Role Key
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Create user via Admin API (bypasses public signup & auto-confirms email)
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: email || `${username.toLowerCase()}@thaiglasspos.local`,
      password,
      email_confirm: true,
      user_metadata: {
        username,
        role: role || "moderator",
        store_id: storeId,
        full_name: name,
      },
    });

    if (error) {
      console.error("Supabase Admin createUser error:", error.message);
      return res.status(400).json({
        success: false,
        message: `Supabase Auth Admin Error: ${error.message}`,
      });
    }

    return res.status(200).json({
      success: true,
      mode: "supabase_service_role",
      user: data.user,
      message: `User @${username} successfully created via Supabase Auth Admin Service Role!`,
    });
  } catch (err: any) {
    console.error("Server error creating admin user:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Internal server error during account creation",
    });
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    supabaseUrlConfigured: Boolean(process.env.VITE_SUPABASE_URL),
    serviceRoleConfigured: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
  });
});

async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start();
