document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector(".admin-member-form");
  const blockSelect = document.getElementById("blockSelect");
  const nyaySelect = document.getElementById("nyaySelect");
  const villageSelect = document.getElementById("villageSelect");
  const resultsDiv = document.getElementById("familyResults");
  const filterBtn = document.getElementById("filter-btn");
  const backBtnSection = document.querySelector(".back__btn");
  const backBtn = document.getElementById("backBtn");
  const form_section = document.querySelector('.admin-member-form-container');
  const familt_result_section = document.getElementById("family-results-section");

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
        familt_result_section.style.display = "block";
        backBtnSection.style.display = "block"; 
        form_section.style.display = "none";
        document.querySelector(".family-list").style.display = "none";
        resultsDiv.innerHTML = `<p style="color:red;">${"कोई परिवार नहीं मिला"}</p>`;
        resultsDiv.style.textAlign = "center";
        return;
      }

      if (data.length === 0) {
        familt_result_section.style.display = "block";
        backBtnSection.style.display = "block"; 
        resultsDiv.innerHTML = "<p>कोई परिवार नहीं मिला</p>";
      } else {
        backBtnSection.style.display = "block";
        familt_result_section.style.display = "block"; 
        form_section.style.display = "none";
        document.querySelector(".family-list").style.display = "none";
        resultsDiv.innerHTML = `
            <h3 style="text-align:center">परिवार सूची:</h3>
            <div class="table-container">
              <table class="family-table">
                <thead>
                  <tr>
                    <th>वंश</th>
                    <th>नाम</th>
                    <th>पिता</th>
                    <th>क्षत्रिय</th>
                    <th>ग्राम</th>
                    <th>न्याय पंचायत</th>
                    <th>विकास खंड</th>
                    <th>पूर्व निवास</th>
                    <th>अन्य</th>
                    <th>वर्ष</th>
                  </tr>
                </thead>
                <tbody>
                  ${data.map(f => 
                    f.members.map(m => {
                      let year = "-";
                      if (m.birth) {
                        year = new Date(m.birth).getFullYear() + ' (जन्म वर्ष)';
                      } else if (m.death) {
                        year = new Date(m.birth).getFullYear() + ' (मृत्यु वर्ष)';
                      }
                      return `
                        <tr>
                          <td>${f.lineageName || "-"}</td>
                          <td>${m.name || "-"}</td>
                          <td>${m.guardianName || "-"}</td>
                          <td>${f.clan || "-"}</td>
                          <td>${f.village || "-"}</td>
                          <td>${f.nyayPanchayat || "-"}</td>
                          <td>${f.block || "-"}</td>
                          <td>${f.oldResidence || "-"}</td>
                          <td>${m.otherDetails || "-"}</td>
                          <td>${year}</td>
                        </tr>
                      `;
                    }).join("")
                  ).join("")}
                </tbody>
              </table>
            </div>
          `;
      }
    } catch (err) {
      resultsDiv.innerHTML = "<p style='color:red;'>सर्वर त्रुटि</p>";
    }
  });

  backBtn.addEventListener("click", () => {
    familt_result_section.style.display = "none";
    backBtnSection.style.display = "none";
    form_section.style.display = "block";
    form.reset();
    document.getElementById("nyaySelect").disabled = true;
    document.getElementById("villageSelect").disabled = true;
    document.getElementById("filter-btn").disabled = true;
  });

});
