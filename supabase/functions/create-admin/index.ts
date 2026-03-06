/**
 * Edge function to create the admin account.
 * Called once to seed admin@mims.com with password admin123.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Create admin user
    const { data: user, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: "admin@mims.com",
      password: "admin123",
      email_confirm: true,
      user_metadata: { full_name: "MIMS Administrator", role: "admin" },
    });

    if (createError) {
      // If user already exists, update the profile role
      if (createError.message.includes("already")) {
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
        const adminUser = existingUsers?.users?.find((u: any) => u.email === "admin@mims.com");
        if (adminUser) {
          await supabaseAdmin.from("profiles").update({ role: "admin", full_name: "MIMS Administrator" }).eq("id", adminUser.id);
          return new Response(JSON.stringify({ success: true, message: "Admin role updated" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
      throw createError;
    }

    // Update profile to admin role
    if (user?.user) {
      await supabaseAdmin.from("profiles").update({ role: "admin", full_name: "MIMS Administrator" }).eq("id", user.user.id);
    }

    return new Response(JSON.stringify({ success: true, message: "Admin created: admin@mims.com / admin123" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
