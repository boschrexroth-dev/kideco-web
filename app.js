import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  Timestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAcZQkcEKCCMRNqZymaYxTo-6yyAwX0Olw",
  authDomain: "kideco-c8b84.firebaseapp.com",
  projectId: "kideco-c8b84",
  storageBucket: "kideco-c8b84.firebasestorage.app",
  messagingSenderId: "86143681200",
  appId: "1:86143681200:web:5ada6543863833591b3175"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

window.login = async function () {
  const usernameInput = document.getElementById("email").value.trim();
  const passwordInput = document.getElementById("password").value.trim();
  const messageEl = document.getElementById("message");

  try {
    const q = query(
      collection(db, "users"),
      where("email", "==", usernameInput),
      where("password", "==", passwordInput)
    );

    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const userData = querySnapshot.docs[0].data();

      sessionStorage.setItem("isLoggedIn", "true");
      sessionStorage.setItem("userId", querySnapshot.docs[0].id);
      sessionStorage.setItem("userRole", userData.role);
      sessionStorage.setItem("userEmail", userData.email);

      window.location.href = "monitor.html";
    } else {
      messageEl.innerText = "Username atau Password salah!";
    }
  } catch (error) {
    console.error("Login Error:", error);
    messageEl.innerText = "Error: " + error.message;
  }
};

window.logout = function () {
  sessionStorage.clear();
  window.location.href = "index.html";
};

window.checkSession = function () {
  if (sessionStorage.getItem("isLoggedIn") !== "true") {
    window.location.href = "index.html";
  } else {
    if (window.location.pathname.includes("monitor.html")) {
      loadDashboards();
      setupAdminButton();
    }
  }
};

function setupAdminButton() {
  const userRole = sessionStorage.getItem("userRole");
  const btnAdmin = document.getElementById("btnAdminPanel");
  if (btnAdmin) {
    btnAdmin.style.display = userRole === "admin" ? "inline-block" : "none";
  }
}

window.loadDashboards = async function () {
  const container = document.getElementById("dashboardContainer");
  container.innerHTML = "<p>Loading dashboards...</p>";

  try {
    const q = query(
      collection(db, "dashboards"),
      orderBy("timestamp", "desc")
    );

    const snapshot = await getDocs(q);
    container.innerHTML = "";

    if (snapshot.empty) {
      container.innerHTML = "<p>No dashboards found. Click '+ Add Dashboard' to create one.</p>";
      return;
    }

    snapshot.forEach(docSnap => {
      const d = docSnap.data();
      const name = d.name || "";
      const desc = d.description || "";
      const url = d.url || "";
      addDashboardCard(container, docSnap.id, name, desc, url);
    });
  } catch (error) {
    console.error("Error loading dashboards:", error);
    container.innerHTML = `<p style="color:red;">Failed to load dashboards: ${error.message}</p>`;
  }
};

function addDashboardCard(container, docId, name, desc, url) {
  const card = document.createElement("div");
  card.className = "dashboard-box";
  card.dataset.docId = docId;

  card.innerHTML = `
    <h4 style="margin:0 0 5px 0; color:#15243D;">${escHtml(name)}</h4>
    ${desc ? `<p style="margin:0 0 10px 0; color:#555; font-size:14px;">${escHtml(desc)}</p>` : ""}
    <div class="dashboard-actions" style="margin-top:10px; display:flex; gap:10px;">
      <button
        onclick="window.open('${escAttr(url)}', '_blank')"
        style="flex:1; background:#00A5E3; color:#fff; border:none; padding:8px; cursor:pointer; border-radius:4px;">
        Open
      </button>
      <button
        onclick="confirmDeleteDashboard('${escAttr(docId)}')"
        style="flex:1; background:#E4002B; color:#fff; border:none; padding:8px; cursor:pointer; border-radius:4px;">
        Delete
      </button>
    </div>
  `;

  container.appendChild(card);
}

window.showAddDashboardModal = function () {
  removeModal("addDashboardModal");

  const overlay = document.createElement("div");
  overlay.id = "addDashboardModal";
  overlay.style.cssText = `
    position:fixed; inset:0; background:rgba(0,0,0,0.5);
    display:flex; align-items:center; justify-content:center; z-index:9999;
  `;

  overlay.innerHTML = `
    <div style="background:#fff; border-radius:8px; padding:24px; width:90%; max-width:400px; box-shadow:0 4px 20px rgba(0,0,0,0.3);">
      <h3 style="margin:0 0 16px 0;">Add Dashboard</h3>
      <input id="addDashName" type="text" placeholder="Dashboard Name"
        style="width:100%; box-sizing:border-box; padding:8px; margin-bottom:10px; border:1px solid #ccc; border-radius:4px;"/>
      <input id="addDashDesc" type="text" placeholder="Description (Optional)"
        style="width:100%; box-sizing:border-box; padding:8px; margin-bottom:10px; border:1px solid #ccc; border-radius:4px;"/>
      <input id="addDashUrl" type="text" placeholder="Grafana URL"
        style="width:100%; box-sizing:border-box; padding:8px; margin-bottom:16px; border:1px solid #ccc; border-radius:4px;"/>
      <div style="display:flex; gap:10px; justify-content:flex-end;">
        <button onclick="removeModal('addDashboardModal')"
          style="padding:8px 16px; border:1px solid #ccc; background:#fff; border-radius:4px; cursor:pointer;">
          Cancel
        </button>
        <button onclick="saveDashboard()"
          style="padding:8px 16px; background:#00A5E3; color:#fff; border:none; border-radius:4px; cursor:pointer;">
          Save
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
};

window.saveDashboard = async function () {
  const name = document.getElementById("addDashName").value.trim();
  const desc = document.getElementById("addDashDesc").value.trim();
  const url = document.getElementById("addDashUrl").value.trim();
  const userId = sessionStorage.getItem("userId") || "";

  if (!name || !url) {
    alert("Name and URL cannot be empty");
    return;
  }

  try {
    await addDoc(collection(db, "dashboards"), {
      user_id: userId,
      name: name,
      description: desc,
      url: url,
      timestamp: Timestamp.now()
    });

    removeModal("addDashboardModal");
    alert("Dashboard saved to Cloud");
    loadDashboards();
  } catch (error) {
    console.error("Error saving dashboard:", error);
    alert("Cloud Error: " + error.message);
  }
};

window.confirmDeleteDashboard = async function (docId) {
  const confirmed = confirm("Are you sure you want to delete this dashboard?");
  if (!confirmed) return;

  try {
    await deleteDoc(doc(db, "dashboards", docId));
    const card = document.querySelector(`[data-doc-id="${docId}"]`);
    if (card) card.remove();
    alert("Dashboard deleted");
  } catch (error) {
    console.error("Error deleting dashboard:", error);
    alert("Failed to delete: " + error.message);
  }
};

window.showAdminPanel = async function () {
  removeModal("adminPanelModal");

  const overlay = document.createElement("div");
  overlay.id = "adminPanelModal";
  overlay.style.cssText = `
    position:fixed; inset:0; background:rgba(0,0,0,0.5);
    display:flex; align-items:center; justify-content:center;
    z-index:9999; padding:24px 16px; box-sizing:border-box;
  `;

  overlay.innerHTML = `
    <div style="
      background:#fff; border-radius:8px; width:90%; max-width:480px;
      box-shadow:0 4px 20px rgba(0,0,0,0.3);
      display:flex; flex-direction:column;
      max-height:calc(100vh - 48px); overflow:hidden;
    ">
      <!-- Header (sticky) -->
      <div class="ap-header">
        <h3 style="margin:0 0 16px 0;">Admin Panel</h3>

        <p style="font-weight:bold; margin:0 0 8px 0;">Add New User</p>
        <input id="apEmail" type="text" placeholder="Email / Username"
          style="width:100%; box-sizing:border-box; padding:10px; margin-bottom:8px; border:1px solid #ccc; border-radius:4px; font-size:14px;"/>
        <input id="apPass" type="password" placeholder="Password"
          style="width:100%; box-sizing:border-box; padding:10px; margin-bottom:10px; border:1px solid #ccc; border-radius:4px; font-size:14px;"/>

        <p style="margin:0 0 6px 0; font-size:14px;">Select Role:</p>
        <div style="display:flex; gap:20px; margin-bottom:14px;">
          <label style="display:flex; align-items:center; gap:6px; font-size:14px; cursor:pointer;">
            <input type="radio" name="apRole" value="user" checked /> User
          </label>
          <label style="display:flex; align-items:center; gap:6px; font-size:14px; cursor:pointer;">
            <input type="radio" name="apRole" value="admin" /> Admin
          </label>
        </div>

        <button onclick="addUserFromPanel()"
          style="width:100%; padding:10px; background:#00A5E3; color:#fff; border:none; border-radius:4px; cursor:pointer; font-size:14px; margin-bottom:16px;">
          Add User
        </button>

        <hr style="margin:0 0 14px 0; border:none; border-top:1px solid #ddd;"/>
        <p style="font-weight:bold; margin:0 0 10px 0;">Registered Users:</p>
      </div>

      <!-- Scrollable user list -->
      <div id="apUserContainer" style="
        flex:1; overflow-y:auto; padding:0 24px 12px 24px;
        display:flex; flex-direction:column; gap:8px;
      ">
        <p style="color:#888; margin:0;">Loading users...</p>
      </div>

      <!-- Footer (sticky) -->
      <div class="ap-footer">
        <button onclick="removeModal('adminPanelModal')">
          Close
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  await loadUsersInPanel();
};

async function loadUsersInPanel() {
  const container = document.getElementById("apUserContainer");
  if (!container) return;
  container.innerHTML = "<p style='color:#888;'>Loading...</p>";

  try {
    const snapshot = await getDocs(collection(db, "users"));
    container.innerHTML = "";

    if (snapshot.empty) {
      container.innerHTML = "<p>No users found.</p>";
      return;
    }

    const currentUserEmail = sessionStorage.getItem("userEmail") || "";

    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      const email = data.email || "";
      const role = data.role || "user";
      const isProtected = (email === currentUserEmail || role === "admin");

      const row = document.createElement("div");
      row.style.cssText = `
        display:flex; align-items:center; justify-content:space-between;
        padding:8px 10px; border:1px solid #ddd; border-radius:4px;
      `;

      row.innerHTML = `
        <div style="font-size:14px; line-height:1.5;">
          <strong>${escHtml(email)}</strong><br/>
          <span style="color:#666;">Role: ${escHtml(role)} (Cloud)</span>
        </div>
        <button
          onclick="deleteUserFromPanel('${escAttr(docSnap.id)}', '${escAttr(email)}', ${isProtected}, this)"
          style="
            padding:6px 12px; border:none; border-radius:4px; cursor:pointer; color:#fff;
            background:${isProtected ? "#aaa" : "#E4002B"};
          ">
          Del
        </button>
      `;

      container.appendChild(row);
    });
  } catch (error) {
    console.error("Error loading users:", error);
    container.innerHTML = `<p style="color:red;">Failed to load users: ${error.message}</p>`;
  }
}

window.addUserFromPanel = async function () {
  const email = document.getElementById("apEmail").value.trim();
  const pass = document.getElementById("apPass").value.trim();
  const roleEl = document.querySelector('input[name="apRole"]:checked');
  const role = roleEl ? roleEl.value : "user";

  if (!email || !pass) {
    alert("Please fill all fields");
    return;
  }

  if (email === "kdctmct") {
    alert("'admin' username is reserved for local");
    return;
  }

  try {
    await addDoc(collection(db, "users"), {
      email: email,
      password: pass,
      role: role
    });

    alert(`User added as ${role}`);
    document.getElementById("apEmail").value = "";
    document.getElementById("apPass").value = "";
    document.querySelector('input[name="apRole"][value="user"]').checked = true;
    await loadUsersInPanel();
  } catch (error) {
    console.error("Error adding user:", error);
    alert("Failed to add user");
  }
};

window.deleteUserFromPanel = async function (docId, email, isProtected, btn) {
  if (isProtected) {
    alert("Cannot delete admin or own account");
    return;
  }

  const confirmed = confirm(`Delete user "${email}"?`);
  if (!confirmed) return;

  try {
    await deleteDoc(doc(db, "users", docId));
    const row = btn.closest("div[style]");
    if (row) row.remove();
    alert("User deleted");
  } catch (error) {
    console.error("Error deleting user:", error);
    alert("Failed to delete user: " + error.message);
  }
};

window.removeModal = function (id) {
  const el = document.getElementById(id);
  if (el) el.remove();
};

function escHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escAttr(str) {
  return String(str).replace(/'/g, "\\'");
}

if (window.location.pathname.includes("monitor.html")) {
  if (sessionStorage.getItem("isLoggedIn") !== "true") {
    window.location.href = "index.html";
  } else {
    loadDashboards();
    setupAdminButton();
  }
}