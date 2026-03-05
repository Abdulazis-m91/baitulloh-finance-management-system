import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAdmin.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) throw new Error("Not authenticated");

    const caller = { id: claimsData.claims.sub as string };

    if (!caller) throw new Error("Not authenticated");

    const { data: isAdmin } = await supabaseAdmin.rpc("has_role", {
      _user_id: caller.id,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Not authorized");

    const { action, ...payload } = await req.json();

    if (action === "create") {
      const { email, password, display_name, phone, role } = payload;

      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { display_name },
      });
      if (createError) throw createError;

      // Update profile with phone
      await supabaseAdmin
        .from("profiles")
        .update({ display_name, phone })
        .eq("user_id", newUser.user.id);

      // Assign role
      await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: newUser.user.id, role });

      return new Response(JSON.stringify({ success: true, user_id: newUser.user.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "update") {
      const { user_id, email, password, display_name, phone, role } = payload;

      const updateData: any = { email };
      if (password) updateData.password = password;
      
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user_id, updateData);
      if (updateError) throw updateError;

      await supabaseAdmin
        .from("profiles")
        .update({ display_name, phone })
        .eq("user_id", user_id);

      await supabaseAdmin
        .from("user_roles")
        .update({ role })
        .eq("user_id", user_id);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "delete") {
      const { user_id } = payload;

      await supabaseAdmin.from("user_roles").delete().eq("user_id", user_id);
      await supabaseAdmin.from("profiles").delete().eq("user_id", user_id);
      const { error } = await supabaseAdmin.auth.admin.deleteUser(user_id);
      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "list") {
      const { data: roles } = await supabaseAdmin
        .from("user_roles")
        .select("user_id, role");

      if (!roles || roles.length === 0) {
        return new Response(JSON.stringify({ users: [] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const userIds = roles.map((r) => r.user_id);

      const { data: profiles } = await supabaseAdmin
        .from("profiles")
        .select("user_id, display_name, phone")
        .in("user_id", userIds);

      // Get emails from auth
      const users = [];
      for (const r of roles) {
        const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(r.user_id);
        const profile = profiles?.find((p) => p.user_id === r.user_id);
        if (user) {
          users.push({
            user_id: r.user_id,
            email: user.email,
            display_name: profile?.display_name || user.email,
            phone: profile?.phone || "",
            role: r.role,
          });
        }
      }

      return new Response(JSON.stringify({ users }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Invalid action");
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
