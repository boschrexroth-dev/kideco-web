const supabaseUrl = "https://ruencijrqppsegvqepyu.supabase.co";
const supabaseKey = "sb_publishable_nAx4y8hMhzXg1CrxfkEiaQ_GvWyKEov";
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    document.getElementById("message").innerText = error.message;
  } else {
    window.location.href = "monitor.html";
  }
}

async function logout() {
  await supabase.auth.signOut();
  window.location.href = "index.html";
}

async function checkSession() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    window.location.href = "index.html";
  }
}

async function createUser() {
  const email = document.getElementById("newUserEmail").value;
  const password = document.getElementById("newUserPassword").value;
  const role = document.getElementById("newUserRole").value;

  const response = await fetch("https://your-backend-api.com/create-user", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email, password, role })
  });

  alert("User Created (if backend ready)");
}

async function deleteUser() {
  const userId = document.getElementById("deleteUserId").value;

  await fetch("https://your-backend-api.com/delete-user", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ userId })
  });

  alert("User Deleted (if backend ready)");
}

async function loadDashboards() {
  const { data: userData } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("dashboards")
    .select("*")
    .eq("user_id", userData.user.id);

  const container = document.getElementById("dashboardContainer");
  container.innerHTML = "";

  data.forEach(d => {
    container.innerHTML += `
      <div class="dashboard-box">
        <h4>${d.name}</h4>
        <iframe src="${d.grafana_url}" frameborder="0"></iframe>
      </div>
    `;
  });
}

async function addDashboard() {
  const name = document.getElementById("dashboardName").value;
  const url = document.getElementById("dashboardURL").value;

  const { data: userData } = await supabase.auth.getUser();

  await supabase.from("dashboards").insert([
    {
      user_id: userData.user.id,
      name: name,
      grafana_url: url
    }
  ]);

  closeModal();
  loadDashboards();
}

function showAddModal() {
  document.getElementById("modal").style.display = "block";
}

function closeModal() {
  document.getElementById("modal").style.display = "none";
}

async function checkRole() {
  const { data: userData } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .single();

  if (data && data.role === "admin") {
    document.getElementById("adminBtn").style.display = "inline-block";
  }
}

function openAdminPanel() {
  document.getElementById("adminModal").style.display = "block";
}

function closeAdminPanel() {
  document.getElementById("adminModal").style.display = "none";
}

if (window.location.pathname.includes("monitor.html")) {
  checkSession();
  checkRole();
  loadDashboards();
}