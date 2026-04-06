import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const demoUsers = [
    { email: "admin@demo.com", password: "demo123456", full_name: "Admin User", role: "admin" },
    { email: "analyst@demo.com", password: "demo123456", full_name: "Analyst User", role: "analyst" },
    { email: "viewer@demo.com", password: "demo123456", full_name: "Viewer User", role: "viewer" },
  ];

  const results = [];

  for (const u of demoUsers) {
    // Check if user exists
    const { data: existing } = await supabaseAdmin.auth.admin.listUsers();
    const found = existing?.users?.find((x) => x.email === u.email);

    let userId: string;
    if (found) {
      userId = found.id;
      results.push({ email: u.email, status: "already exists" });
    } else {
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: { full_name: u.full_name },
      });
      if (error) {
        results.push({ email: u.email, status: "error", error: error.message });
        continue;
      }
      userId = data.user.id;
      results.push({ email: u.email, status: "created" });
    }

    // Upsert role
    await supabaseAdmin.from("user_roles").upsert(
      { user_id: userId, role: u.role },
      { onConflict: "user_id,role" }
    );
  }

  // Seed financial records if none exist
  const { count } = await supabaseAdmin.from("financial_records").select("*", { count: "exact", head: true });
  
  if (!count || count === 0) {
    const { data: cats } = await supabaseAdmin.from("categories").select("id, name");
    const catMap = Object.fromEntries((cats || []).map((c) => [c.name, c.id]));
    
    const { data: adminUsers } = await supabaseAdmin.auth.admin.listUsers();
    const adminUser = adminUsers?.users?.find((u) => u.email === "admin@demo.com");
    const adminId = adminUser?.id;

    const records = [
      { amount: 5000, type: "income", category_id: catMap["Salary"], date: "2026-01-15", description: "January Salary", created_by: adminId },
      { amount: 5000, type: "income", category_id: catMap["Salary"], date: "2026-02-15", description: "February Salary", created_by: adminId },
      { amount: 5000, type: "income", category_id: catMap["Salary"], date: "2026-03-15", description: "March Salary", created_by: adminId },
      { amount: 1200, type: "income", category_id: catMap["Freelance"], date: "2026-01-20", description: "Web design project", created_by: adminId },
      { amount: 800, type: "income", category_id: catMap["Freelance"], date: "2026-02-25", description: "Logo design", created_by: adminId },
      { amount: 350, type: "income", category_id: catMap["Investment"], date: "2026-01-10", description: "Stock dividends", created_by: adminId },
      { amount: 200, type: "income", category_id: catMap["Other Income"], date: "2026-03-05", description: "Tax refund", created_by: adminId },
      { amount: 1500, type: "expense", category_id: catMap["Rent"], date: "2026-01-01", description: "January rent", created_by: adminId },
      { amount: 1500, type: "expense", category_id: catMap["Rent"], date: "2026-02-01", description: "February rent", created_by: adminId },
      { amount: 1500, type: "expense", category_id: catMap["Rent"], date: "2026-03-01", description: "March rent", created_by: adminId },
      { amount: 120, type: "expense", category_id: catMap["Utilities"], date: "2026-01-05", description: "Electric bill", created_by: adminId },
      { amount: 95, type: "expense", category_id: catMap["Utilities"], date: "2026-02-05", description: "Water bill", created_by: adminId },
      { amount: 450, type: "expense", category_id: catMap["Food"], date: "2026-01-12", description: "Groceries", created_by: adminId },
      { amount: 380, type: "expense", category_id: catMap["Food"], date: "2026-02-14", description: "Groceries", created_by: adminId },
      { amount: 520, type: "expense", category_id: catMap["Food"], date: "2026-03-10", description: "Groceries + dining", created_by: adminId },
      { amount: 60, type: "expense", category_id: catMap["Transport"], date: "2026-01-08", description: "Bus pass", created_by: adminId },
      { amount: 45, type: "expense", category_id: catMap["Transport"], date: "2026-02-08", description: "Gas", created_by: adminId },
      { amount: 150, type: "expense", category_id: catMap["Entertainment"], date: "2026-01-22", description: "Concert tickets", created_by: adminId },
      { amount: 75, type: "expense", category_id: catMap["Entertainment"], date: "2026-03-18", description: "Movie + dinner", created_by: adminId },
      { amount: 200, type: "expense", category_id: catMap["Healthcare"], date: "2026-02-20", description: "Doctor visit", created_by: adminId },
    ];

    await supabaseAdmin.from("financial_records").insert(records);
  }

  return new Response(JSON.stringify({ results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
