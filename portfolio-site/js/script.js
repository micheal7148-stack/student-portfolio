/* ============================================================
   COS 106 TERM PROJECT — SHARED SCRIPT
   This one file is linked from every page. It only runs the code
   that is relevant to the page it finds itself on, because each
   feature checks whether its target element exists before it
   does anything. This is what "wires" the site together.
   ============================================================ */

/* Run everything after the HTML has fully loaded */
document.addEventListener("DOMContentLoaded", function () {
  highlightActiveNavLink();
  initAcademicPlanner();
  initContactForm();
});

/* ------------------------------------------------------------
   1. NAVIGATION — mark the current page's nav link as active
   ------------------------------------------------------------ */
function highlightActiveNavLink() {
  // Get the current file name, e.g. "about.html". If we're at the
  // site root (no file name), treat it as the homepage.
  var currentPage = window.location.pathname.split("/").pop() || "index.html";

  var navLinks = document.querySelectorAll(".main-nav a");
  navLinks.forEach(function (link) {
    var linkPage = link.getAttribute("href");
    if (linkPage === currentPage) {
      link.setAttribute("aria-current", "page");
    }
  });
}

/* ------------------------------------------------------------
   2. ACADEMIC PLANNER (planner.html only)
      - Add tasks
      - Mark tasks as completed
      - Delete tasks
      Tasks are kept in an array in memory and saved to
      localStorage so the list survives a page refresh.
   ------------------------------------------------------------ */
function initAcademicPlanner() {
  var form = document.getElementById("task-form");
  var list = document.getElementById("task-list");

  // If this page doesn't have a planner, stop here.
  if (!form || !list) return;

  var taskInput = document.getElementById("task-input");
  var dueInput = document.getElementById("task-due-input");
  var emptyMessage = document.getElementById("planner-empty");
  var statTotal = document.getElementById("stat-total");
  var statDone = document.getElementById("stat-done");

  var STORAGE_KEY = "cos106-planner-tasks";

  // Load any tasks already saved in this browser, or start with
  // an empty array (arrays + functions requirement satisfied here).
  var tasks = loadTasks();

  // Render whatever we loaded as soon as the page opens
  renderTasks();

  // Handle the "Add Task" form submission
  form.addEventListener("submit", function (event) {
    event.preventDefault(); // stop the page from reloading

    var text = taskInput.value.trim();
    if (text === "") {
      taskInput.focus();
      return;
    }

    var newTask = {
      id: Date.now(),          // simple unique id
      text: text,
      due: dueInput.value || "",
      completed: false
    };

    tasks.push(newTask);
    saveTasks();
    renderTasks();

    form.reset();
    taskInput.focus();
  });

  // Build the <li> elements for every task in the array
  function renderTasks() {
    list.innerHTML = ""; // clear current list before redrawing

    if (tasks.length === 0) {
      emptyMessage.style.display = "block";
    } else {
      emptyMessage.style.display = "none";
    }

    tasks.forEach(function (task) {
      var item = document.createElement("li");
      item.className = "task-item" + (task.completed ? " completed" : "");
      item.dataset.id = task.id;

      var textSpan = document.createElement("span");
      textSpan.className = "task-text";
      textSpan.textContent = task.text;

      var dueSpan = document.createElement("span");
      dueSpan.className = "task-due";
      dueSpan.textContent = task.due ? "Due: " + task.due : "No due date";

      var actions = document.createElement("div");
      actions.className = "task-actions";

      var completeBtn = document.createElement("button");
      completeBtn.type = "button";
      completeBtn.textContent = task.completed ? "Undo" : "Mark done";
      completeBtn.addEventListener("click", function () {
        toggleComplete(task.id);
      });

      var deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "delete-btn";
      deleteBtn.textContent = "Delete";
      deleteBtn.addEventListener("click", function () {
        deleteTask(task.id);
      });

      actions.appendChild(completeBtn);
      actions.appendChild(deleteBtn);

      item.appendChild(textSpan);
      item.appendChild(dueSpan);
      item.appendChild(actions);

      list.appendChild(item);
    });

    updateStats();
  }

  // Flip a task between completed / not completed
  function toggleComplete(id) {
    tasks = tasks.map(function (task) {
      if (task.id === id) {
        task.completed = !task.completed;
      }
      return task;
    });
    saveTasks();
    renderTasks();
  }

  // Remove a task from the array entirely
  function deleteTask(id) {
    tasks = tasks.filter(function (task) {
      return task.id !== id;
    });
    saveTasks();
    renderTasks();
  }

  // Update the small "3 tasks / 1 completed" summary line
  function updateStats() {
    if (!statTotal || !statDone) return;
    var doneCount = tasks.filter(function (t) { return t.completed; }).length;
    statTotal.textContent = tasks.length;
    statDone.textContent = doneCount;
  }

  // Persist tasks to localStorage so a refresh doesn't lose them
  function saveTasks() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (err) {
      console.warn("Could not save tasks:", err);
    }
  }

  // Read tasks back out of localStorage on page load
  function loadTasks() {
    try {
      var stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (err) {
      console.warn("Could not load saved tasks:", err);
      return [];
    }
  }
}

/* ------------------------------------------------------------
   3. CONTACT FORM VALIDATION (contact.html only)
      Checks:
      - No field is empty
      - Email format is valid
      - Phone number contains only digits
   ------------------------------------------------------------ */
function initContactForm() {
  var form = document.getElementById("contact-form");
  if (!form) return;

  var nameField = document.getElementById("name");
  var emailField = document.getElementById("email");
  var phoneField = document.getElementById("phone");
  var messageField = document.getElementById("message");
  var successBox = document.getElementById("form-success");

  form.addEventListener("submit", function (event) {
    event.preventDefault(); // handle validation ourselves

    successBox.classList.remove("show");

    var isValid = true;
    isValid = validateRequired(nameField, "Please enter your name.") && isValid;
    isValid = validateEmail(emailField) && isValid;
    isValid = validatePhone(phoneField) && isValid;
    isValid = validateRequired(messageField, "Please enter a message.") && isValid;

    if (isValid) {
      successBox.textContent = "Thanks, " + nameField.value.trim() + "! Your message has been received.";
      successBox.classList.add("show");
      form.reset();
      clearAllErrors();
    }
  });

  // Generic "field must not be empty" check
  function validateRequired(field, message) {
    var value = field.value.trim();
    if (value === "") {
      showError(field, message);
      return false;
    }
    clearError(field);
    return true;
  }

  // Email must look like name@domain.tld
  function validateEmail(field) {
    var value = field.value.trim();
    var pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (value === "") {
      showError(field, "Please enter your email address.");
      return false;
    }
    if (!pattern.test(value)) {
      showError(field, "Please enter a valid email address (e.g. name@example.com).");
      return false;
    }
    clearError(field);
    return true;
  }

  // Phone number must contain digits only (no letters or symbols)
  function validatePhone(field) {
    var value = field.value.trim();
    var digitsOnly = /^[0-9]+$/;

    if (value === "") {
      showError(field, "Please enter your phone number.");
      return false;
    }
    if (!digitsOnly.test(value)) {
      showError(field, "Phone number must contain digits only, e.g. 08012345678.");
      return false;
    }
    clearError(field);
    return true;
  }

  function showError(field, message) {
    var wrapper = field.closest(".form-field");
    var errorEl = wrapper.querySelector(".form-error");
    wrapper.classList.add("invalid");
    errorEl.textContent = message;
  }

  function clearError(field) {
    var wrapper = field.closest(".form-field");
    var errorEl = wrapper.querySelector(".form-error");
    wrapper.classList.remove("invalid");
    errorEl.textContent = "";
  }

  function clearAllErrors() {
    [nameField, emailField, phoneField, messageField].forEach(clearError);
  }
}
