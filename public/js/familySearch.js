document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector(".admin-member-form");
  const blockSelect = document.getElementById("blockSelect");
  console.log("script loaded, blockSelect =", blockSelect);
  const nyaySelect = document.getElementById("nyaySelect");
  const villageSelect = document.getElementById("villageSelect");
  const resultsDiv = document.getElementById("familyResults");
  const filterBtn = document.getElementById("filter-btn");

      const hierarchy = {
    "रानीगंज": {
      "सुभाष नगर": ["आशापुर", "सुल्तानपुर"]
    },
    "गौरा": {
      "अंबेडकर नगर": ["रामपुर", "कुरेभार"],
      "सुल्तानपुर": ["सुल्तानपुर"]
    }
  };

  blockSelect.addEventListener("change", () => {
    nyaySelect.innerHTML = '<option value="">-- न्याय पंचायत चुनें --</option>';
    villageSelect.innerHTML = '<option value="">-- पहले न्याय पंचायत चुनें --</option>';
    nyaySelect.disabled = true;
    villageSelect.disabled = true;
    filterBtn.disabled = true;

    const block = blockSelect.value;
    if (block && hierarchy[block]) {
      nyaySelect.disabled = false;
      Object.keys(hierarchy[block]).forEach(nyay => {
        const opt = document.createElement("option");
        opt.value = nyay;
        opt.textContent = nyay;
        nyaySelect.appendChild(opt);
      });
    }
  });

  nyaySelect.addEventListener("change", () => {
    villageSelect.innerHTML = '<option value="">-- गांव चुनें --</option>';
    villageSelect.disabled = true;
    filterBtn.disabled = true;

    const block = blockSelect.value;
    const nyay = nyaySelect.value;

    if (nyay && hierarchy[block][nyay]) {
      villageSelect.disabled = false;
      hierarchy[block][nyay].forEach(village => {
        const opt = document.createElement("option");
        opt.value = village;
        opt.textContent = village;
        villageSelect.appendChild(opt);
      });
    }
  });

  villageSelect.addEventListener("change", () => {
    filterBtn.disabled = !villageSelect.value;
  });

  [blockSelect, nyaySelect, villageSelect].forEach(select => {
    select.addEventListener("change", () => {
      document.querySelector(".filter-btn").disabled =
        !blockSelect.value || !nyaySelect.value || !villageSelect.value;
    });
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const block = blockSelect.value;
    const nyayPanchayat = nyaySelect.value;
    const village = villageSelect.value;

    try {
      const res = await fetch(`/family/search?block=${block}&nyayPanchayat=${nyayPanchayat}&village=${village}`);
      const data = await res.json();

      if (!res.ok) {
        resultsDiv.innerHTML = `<p style="color:red;">${data.message || "कोई परिवार नहीं मिला"}</p>`;
        return;
      }

      if (data.length === 0) {
        resultsDiv.innerHTML = "<p>कोई परिवार नहीं मिला</p>";
      } else {
        resultsDiv.innerHTML = `
          <h3>परिवार:</h3>
          <ul>
            ${data.map(f => `
              <li>
                <strong>${f.lineageName}</strong> (${f.clan || "कुल"}), गांव: ${f.village}
              </li>
            `).join("")}
          </ul>
        `;
      }
    } catch (err) {
      resultsDiv.innerHTML = "<p style='color:red;'>सर्वर त्रुटि</p>";
    }
  });
});
