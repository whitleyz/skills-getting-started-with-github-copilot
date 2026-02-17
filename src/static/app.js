document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      // Reset activity select to default option to avoid duplicates on re-fetch
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        // Participants section
        const participantsContainer = document.createElement("div");
        participantsContainer.className = "participants";

        const count = document.createElement("div");
        count.className = "participant-count";
        count.textContent = `${details.participants.length} participant${details.participants.length !== 1 ? "s" : ""}`;
        participantsContainer.appendChild(count);

        const ul = document.createElement("ul");
        ul.className = "participants-list";
        ul.setAttribute("role", "list");

        if (details.participants && details.participants.length > 0) {
          details.participants.forEach((p) => {
            const li = document.createElement("li");
            li.className = "participant";
            li.setAttribute("role", "listitem");

            const nameSpan = document.createElement("span");
            nameSpan.className = "participant-name";
            nameSpan.textContent = p;
            nameSpan.title = p;

            const removeBtn = document.createElement("button");
            removeBtn.className = "participant-remove";
            removeBtn.type = "button";
            removeBtn.setAttribute("aria-label", `Remove ${p} from ${name}`);
            removeBtn.textContent = "✖";

            removeBtn.addEventListener("click", async () => {
              removeBtn.disabled = true;
              try {
                const res = await fetch(
                  `/activities/${encodeURIComponent(name)}/signup?email=${encodeURIComponent(p)}`,
                  { method: "DELETE" }
                );
                const result = await res.json();
                if (res.ok) {
                  messageDiv.textContent = result.message;
                  messageDiv.className = "success";
                  // refresh list
                  fetchActivities();
                } else {
                  messageDiv.textContent = result.detail || "Failed to remove participant";
                  messageDiv.className = "error";
                  removeBtn.disabled = false;
                }
                messageDiv.classList.remove("hidden");
                setTimeout(() => {
                  messageDiv.classList.add("hidden");
                }, 5000);
              } catch (err) {
                console.error("Error unregistering participant:", err);
                messageDiv.textContent = "Network error. Try again.";
                messageDiv.className = "error";
                messageDiv.classList.remove("hidden");
                removeBtn.disabled = false;
              }
            });

            li.appendChild(nameSpan);
            li.appendChild(removeBtn);
            ul.appendChild(li);
          });
        } else {
          const li = document.createElement("li");
          li.className = "participants-empty";
          li.textContent = "No participants yet";
          ul.appendChild(li);
        }

        participantsContainer.appendChild(ul);
        activityCard.appendChild(participantsContainer);

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();

        // refresh activities to show updated participants/availability
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
