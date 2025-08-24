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
    "गौरा": {
      "सुल्तानपुर": ["सुल्तानपुर", "सुल्तानपुर कठार", "रिशालगढ़", "टिकैता", "अतरी", "जाजपुर", "बिरई पुर", "रामनगर", "दमदम", "घीनापुर", "बोर्रा", "सुल्तानपुर", "सुल्तानपुर कठार", "रिशालगढ़"]
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
      const isMobile = window.innerWidth <= 600;
      const res = await fetch(`/family/search?block=${block}&nyayPanchayat=${nyayPanchayat}&village=${village}`);
      const data = await res.json();
      data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
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
        resultsDiv.innerHTML = "<p style='color: red;'>कोई परिवार नहीं मिला</p>";
        resultsDiv.style.textAlign = "center";
      } else {
        backBtnSection.style.display = "block";
        familt_result_section.style.display = "block"; 
        form_section.style.display = "none";
        document.querySelector(".family-list").style.display = "none";
        resultsDiv.innerHTML = data.map(family => {
            const members = [...family.members].sort(
              (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
            );

            if (isMobile) {
              if (members.length === 0) {
                return `
                  <div class="family-card">
                    <h4>🏠 परिवार: ${family.lineageName}</h4>
                    <h6 class="family-meta"">
                  (क्षत्रिय: ${family.clan}, 
                   ग्राम: ${family.village},
                   न्याय पंचायत: ${family.nyayPanchayat},
                   विकास खंड: ${family.block},
                   पूर्व निवास: ${family.oldResidence})
                  </h6>
                    <p class="no-members" style="text-align: center;">अभी तक कोई सदस्य नहीं जोड़ा गया है।</p>
                  </div>
                `;
              }

              let mobileCards = members.map(m => `
                <div class="member-item">
                  <p><strong>नाम:</strong> ${m.name}</p>
                  <p><strong>पिता का नाम:</strong> ${m.guardianName}</p>
                  <p><strong>अन्य:</strong> ${m.otherDetails || "—"}</p>
                  ${m.year ? `<p><strong>${m.yearType === "birth" ? "जन्म वर्ष:" : "मृत्यु वर्ष:"}</strong> ${m.year}</p>` : ""}
                  
                </div>
              `).join("");

              return `
                <div class="family-card">
                  <h4>🏠 परिवार: ${family.lineageName}</h4>
                  <h6 class="family-meta"">
                  (क्षत्रिय: ${family.clan}, 
                   ग्राम: ${family.village},
                   न्याय पंचायत: ${family.nyayPanchayat},
                   विकास खंड: ${family.block},
                   पूर्व निवास: ${family.oldResidence})
                  </h6>
                  ${mobileCards}
                </div>
              `;
            } else {
              if (members.length === 0) {
                return `
                  <div class="table-container">
                    <h3 style="text-align: center;">🏠 परिवार: ${family.lineageName}</h3>
                    <h6 class="family-meta"">
                  (क्षत्रिय: ${family.clan}, 
                   ग्राम: ${family.village},
                   न्याय पंचायत: ${family.nyayPanchayat},
                   विकास खंड: ${family.block},
                   पूर्व निवास: ${family.oldResidence})
                  </h6>
                    <p class="no-members" style="text-align: center;">अभी तक कोई सदस्य नहीं जोड़ा गया है।</p>
                  </div>
                `;
              }

              let tableRows = members.map(m => `
                <tr>
                  <td>${m.name}</td>
                  <td>${m.guardianName}</td>
                  <td>${m.otherDetails || "—"}</td>
                  <td>${m.year ? m.year + " (" + (m.yearType === "birth" ? "जन्म" : "मृत्यु") + ")" : "—"}</td>
                  
                </tr>
              `).join("");

              return `
                <div class="table-container">
                  <h3 style="text-align: center;">🏠 परिवार: ${family.lineageName}</h3>
                  <h6 class="family-meta"">
                  (क्षत्रिय: ${family.clan}, 
                   ग्राम: ${family.village},
                   न्याय पंचायत: ${family.nyayPanchayat},
                   विकास खंड: ${family.block},
                   पूर्व निवास: ${family.oldResidence})
                  </h6>
                  <table class="family-table">
                    <thead>
                      <tr>
                        <th>नाम</th>
                        <th>पिता का नाम</th>
                        <th>अन्य</th>
                        <th>जन्म/मृत्यु वर्ष</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${tableRows}
                    </tbody>
                  </table>
                </div>
              `;
            }
          }).join("");        
      
        // resultsDiv.innerHTML = `
        //   <h3 style="text-align:center">परिवार सूची:</h3>
        //   <div class="table-container">
        //     <table class="family-table">
        //       <thead>
        //         <tr>
        //           <th>वंश</th>
        //           <th>नाम</th>
        //           <th>पिता</th>
        //           <th>क्षत्रिय</th>
        //           <th>ग्राम</th>
        //           <th>न्याय पंचायत</th>
        //           <th>विकास खंड</th>
        //           <th>पूर्व निवास</th>
        //           <th>अन्य</th>
        //           <th>वर्ष</th>
        //         </tr>
        //       </thead>
        //       <tbody>
        //         ${data.map(f => {
        //           let familyHeader = `
        //             <tr class="family-heading">
        //               <td colspan="10" style="text-align:center; font-weight:bold; background:#f0f0f0;">
        //                 वंश: ${f.lineageName || "-"}
        //               </td>
        //             </tr>
        //           `;

        //           if (!f.members || f.members.length === 0) {
        //             return familyHeader + `
        //               <tr>
        //                 <td colspan="10" style="text-align:center;">कोई सदस्य नहीं</td>
        //               </tr>
        //             `;
        //           }

        //           return familyHeader + f.members.map(m => {
        //             let year = "-";
        //             if (m.birth) {
        //               year = new Date(m.birth).getFullYear() + " (जन्म वर्ष)";
        //             } else if (m.death) {
        //               year = new Date(m.death).getFullYear() + " (मृत्यु वर्ष)";
        //             }

        //             return `
        //               <tr>
        //                 <td>${f.lineageName || "-"}</td>
        //                 <td>${m.name || "-"}</td>
        //                 <td>${m.guardianName || "-"}</td>
        //                 <td>${f.clan || "-"}</td>
        //                 <td>${f.village || "-"}</td>
        //                 <td>${f.nyayPanchayat || "-"}</td>
        //                 <td>${f.block || "-"}</td>
        //                 <td>${f.oldResidence || "-"}</td>
        //                 <td>${m.otherDetails || "-"}</td>
        //                 <td>${year}</td>
        //               </tr>
        //             `;
        //           }).join("");
        //         }).join("")}
        //       </tbody>
        //     </table>
        //   </div>
        // `;
       
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
