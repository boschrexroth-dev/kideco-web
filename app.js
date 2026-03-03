// Inisialisasi Supabase hanya sekali
const SUPABASE_URL = "https://ruencijrqppsegvqepyu.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1ZW5jaWpycXBwc2VndnFlcHl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0OTE5MDYsImV4cCI6MjA4ODA2NzkwNn0.fXjGWt84W4YJFEwCeY5KXrPIplov_nEi8QYSMn4inYg"; 

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Login function
async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    document.getElementById("message").innerText = error.message;
  } else {
    window.location.href = "monitor.html";
  }
}

// Logout function
async function logout() {
  await supabaseClient.auth.signOut();
  window.location.href = "index.html";
}

// Check session
async function checkSession() {
  const { data } = await supabaseClient.auth.getUser();
  if (!data.user) {
    window.location.href = "index.html";
  }
}

// Load dashboards
async function loadDashboards() {
  const { data: userData } = await supabaseClient.auth.getUser();

  const { data, error } = await supabaseClient
    .from("dashboards")
    .select("*")
    .eq("user_id", userData.user.id);

  const container = document.getElementById("dashboardContainer");
  container.innerHTML = "";

  if (data && data.length > 0) {
    data.forEach(d => {
      container.innerHTML += `
        <div class="dashboard-box" onclick="window.open('${d.grafana_url}', '_blank')" style="cursor: pointer;">
          <h4>${d.name}</h4>
          <p>Click to open dashboard</p>
        </div>
      `;
    });
  } else {
    container.innerHTML = "<p>No dashboards found. Click '+ Add Dashboard' to create one.</p>";
  }
}

// Add dashboard
async function addDashboard() {
  const name = document.getElementById("dashboardName").value;
  const url = document.getElementById("dashboardURL").value;

  const { data: userData } = await supabaseClient.auth.getUser();

  await supabaseClient.from("dashboards").insert([
    {
      user_id: userData.user.id,
      name: name,
      grafana_url: url
    }
  ]);

  closeModal();
  loadDashboards();
}

// Modal functions
function showAddModal() {
  document.getElementById("modal").style.display = "block";
}

function closeModal() {
  document.getElementById("modal").style.display = "none";
}

// Initialize page
if (window.location.pathname.includes("monitor.html")) {
  checkSession();
  loadDashboards();
}
