import { supabase } from "./src/lib/supabase";
async function run() {
  const { data } = await supabase.from("track_stats").select("*").eq("track_id", 101);
  console.log("track_stats for 101:", data);
}
run();
