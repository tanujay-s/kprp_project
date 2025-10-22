// document.addEventListener("DOMContentLoaded", async () => {
//   const form = document.querySelector(".admin-member-form");
//   const blockSelect = document.getElementById("blockSelect");
//   const nyaySelect = document.getElementById("nyaySelect");
//   const villageSelect = document.getElementById("villageSelect");
//   const resultsDiv = document.getElementById("familyResults");
//   const filterBtn = document.getElementById("filter-btn");
//   const backBtnSection = document.querySelector(".back__btn");
//   const backBtn = document.getElementById("backBtn");
//   const form_section = document.getElementById('adminMemberPlaceSection');
//   const familt_result_section = document.getElementById("family-results-section");
//   const family_search_tab = document.querySelector('.family-search-tabs');
//   const familySearchByLocationTab = document.getElementById('familySearchByLocationTab');
//   const familySearchByNameTab = document.getElementById('familySearchByNameTab');
//   // const nameSearchInput = document.getElementById("nameSearchInput");
//   const nameSearchContainer = document.getElementById("adminMemberNameSection");
//   const searchByNameBtn = document.getElementById("searchByNameBtn");
//   const nameSearchInput = document.getElementById("nameSearchInput");
//   const suggestionList = document.getElementById("suggestionList");
//   let debounceTimer;
//   nameSearchContainer.style.display = "none";

//   try {
//     // Fetch hierarchy from backend
//     const res = await fetch("/admin/hierarchy");
//     if (!res.ok) throw new Error("Failed to load hierarchy");
//     const data = await res.json();

//     const { blocks, nyayPanchayats, villages } = data;

//     // Store for filtering
//     window.nyayPanchayats = nyayPanchayats;
//     window.villages = villages;

//     // Populate blocks
//     populateDropdown(blockSelect, blocks);

//   } catch (err) {
//     console.error(err);
//     alert("⚠️ Failed to load hierarchy data");
//   }

//   function populateDropdown(selectElement, list) {
//     if (!selectElement) return;
//     selectElement.innerHTML = '<option value="" disabled selected>-- Choose --</option>';
//     list.forEach(item => {
//       const option = document.createElement("option");
//       option.value = item.name; // store name for compatibility
//       option.textContent = item.name;
//       selectElement.appendChild(option);
//     });
//   }

//   // Filter nyay panchayats by selected block
//   blockSelect.addEventListener("change", () => {
//     const blockName = blockSelect.value;
//     const filteredPanchayats = (window.nyayPanchayats || []).filter(
//       p => p.blockId && p.blockId.name === blockName
//     );

//     if (filteredPanchayats.length) {
//       nyaySelect.disabled = false;
//       populateDropdown(nyaySelect, filteredPanchayats);
//     } else {
//       nyaySelect.disabled = true;
//       nyaySelect.innerHTML = '<option value="" disabled selected>No Panchayats found</option>';
//     }

//     villageSelect.disabled = true;
//     villageSelect.innerHTML = '<option value="" disabled selected>-- पहले न्याय पंचायत चुनें --</option>';
//   });

//   // Filter villages by selected nyay panchayat
//   nyaySelect.addEventListener("change", () => {
//     const nyayName = nyaySelect.value;
//     const filteredVillages = (window.villages || []).filter(
//       v => v.nyayPanchayatId && v.nyayPanchayatId.name === nyayName
//     );

//     if (filteredVillages.length) {
//       villageSelect.disabled = false;
//       populateDropdown(villageSelect, filteredVillages);
//     } else {
//       villageSelect.disabled = true;
//       villageSelect.innerHTML = '<option value="" disabled selected>No villages found</option>';
//     }
//   });

//   // const hierarchy = {
//   //   "गौरा": {
//   //     "सुल्तानपुर": ["सुल्तानपुर", "सुल्तानपुर कठार", "रिशालगढ़", "टिकैता", "अतरी", "जाजापुर", "बिरई पुर", "रामनगर", "दमदम", "घीनापुर", "बोर्रा"]
//   //   }
//   // };


//   // blockSelect.addEventListener("change", () => {
//   //   nyaySelect.innerHTML = '<option value="">-- न्याय पंचायत चुनें --</option>';
//   //   villageSelect.innerHTML = '<option value="">-- पहले न्याय पंचायत चुनें --</option>';
//   //   nyaySelect.disabled = true;
//   //   villageSelect.disabled = true;
//   //   filterBtn.disabled = true;

//   //   const block = blockSelect.value;
//   //   if (block && hierarchy[block]) {
//   //     nyaySelect.disabled = false;
//   //     Object.keys(hierarchy[block]).forEach(nyay => {
//   //       const opt = document.createElement("option");
//   //       opt.value = nyay;
//   //       opt.textContent = nyay;
//   //       nyaySelect.appendChild(opt);
//   //     });
//   //   }
//   // });

//   // nyaySelect.addEventListener("change", () => {
//   //   villageSelect.innerHTML = '<option value="">-- गांव चुनें --</option>';
//   //   villageSelect.disabled = true;
//   //   filterBtn.disabled = true;

//   //   const block = blockSelect.value;
//   //   const nyay = nyaySelect.value;

//   //   if (nyay && hierarchy[block][nyay]) {
//   //     villageSelect.disabled = false;
//   //     hierarchy[block][nyay].forEach(village => {
//   //       const opt = document.createElement("option");
//   //       opt.value = village;
//   //       opt.textContent = village;
//   //       villageSelect.appendChild(opt);
//   //     });
//   //   }
//   // });

//   // villageSelect.addEventListener("change", () => {
//   //   filterBtn.disabled = !villageSelect.value;
//   // });

//   // [blockSelect, nyaySelect, villageSelect].forEach(select => {
//   //   select.addEventListener("change", () => {
//   //     document.querySelector(".filter-btn").disabled =
//   //       !blockSelect.value || !nyaySelect.value || !villageSelect.value;
//   //   });
//   // });

//   // Common reusable function to fetch families
//   async function fetchFamilies(url) {
//     try {
//       const res = await fetch(url);
//       const data = await res.json();

//       if (!res.ok) throw new Error("Request failed");
//       return data;
//     } catch (err) {
//       console.error("Error fetching families:", err);
//       return { error: true };
//     }
//   }

//   // Render family data for both desktop and mobile
//   function renderFamilies(data) {
//     const isMobile = window.innerWidth <= 600;

//     if (!data || data.error) {
//       resultsDiv.innerHTML = "<p style='color:red; text-align:center;'>सर्वर त्रुटि</p>";
//       return;
//     }

//     if (data.length === 0) {
//       resultsDiv.innerHTML = "<p style='color:red; text-align:center;'>कोई परिवार नहीं मिला</p>";
//       return;
//     }

//     resultsDiv.innerHTML = data.map((family, index) => {
//       const members = [...family.members];
//       const familyInfo = `
//         <h6 class="family-meta">
//           (क्षत्रिय: ${family.clan}, ग्राम: ${family.village},
//           न्याय पंचायत: ${family.nyayPanchayat},
//           विकास खंड: ${family.block},
//           पूर्व निवास: ${family.oldResidence})
//         </h6>
//       `;

//       const memberList =
//         members.length === 0
//           ? `<p class="no-members" style="text-align:center;">अभी तक कोई सदस्य नहीं जोड़ा गया है।</p>`
//           : (isMobile
//             ? members.map(m => `
//               <div class="member-item">
//                 <p><strong>नाम:</strong> ${m.name}</p>
//                 <p><strong>पिता का नाम:</strong> ${m.guardianName}</p>
//                 <p><strong>अन्य:</strong> ${m.otherDetails || "—"}</p>
//                 ${m.year
//                 ? `<p><strong>${m.yearType === "birth" ? "जन्म वर्ष:" : "मृत्यु वर्ष:"}</strong> ${new Date(m.year).toLocaleDateString("en-GB")}</p>`
//                 : ""
//               }
//               </div>
//             `).join("")
//             : `
//               <table class="family-table">
//                 <thead>
//                   <tr>
//                     <th>नाम</th>
//                     <th>पिता का नाम</th>
//                     <th>अन्य</th>
//                     <th>जन्म/मृत्यु वर्ष</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   ${members.map(m => `
//                     <tr>
//                       <td>${m.name}</td>
//                       <td>${m.guardianName}</td>
//                       <td>${m.otherDetails || "—"}</td>
//                       <td>${m.year ? new Date(m.year).toLocaleDateString("en-GB") + " (" + (m.yearType === "birth" ? "जन्म" : "मृत्यु") + ")" : "—"}</td>
//                     </tr>
//                   `).join("")}
//                 </tbody>
//               </table>
//             `);

//       const isSingle = data.length === 1;
//       const isActiveClass = isSingle ? "active" : "";
//       const arrowSymbol = isSingle ? "▼" : "▶";

//       return `
//         <div class="family-box">
//           <div class="family-header" onclick="toggleFamily(${index})">
//             🏠 वंश: ${family.lineageName}
//             <span class="arrow">${arrowSymbol}</span>
//           </div>
//           <div class="family-content ${isActiveClass}" id="family-${index}">
//             ${familyInfo}
//             ${memberList}
//           </div>
//         </div>
//       `;
//     }).join("");

//     window.toggleFamily = function (index) {
//       document.querySelectorAll(".family-content").forEach((el, i) => {
//         const arrow = el.previousElementSibling.querySelector(".arrow");
//         if (i === index) {
//           el.classList.toggle("active");
//           arrow.textContent = el.classList.contains("active") ? "▼" : "▶";
//         } else {
//           el.classList.remove("active");
//           arrow.textContent = "▶";
//         }
//       });
//     };
//   }

//   // Common function to toggle visibility for results view
//   function showResultsSection() {
//     familt_result_section.style.display = "block";
//     backBtnSection.style.display = "block";
//     form_section.style.display = "none";
//     nameSearchContainer.style.display = "none";
//     family_search_tab.style.display = "none";
//     document.querySelector(".family-list").style.display = "none";
//   }

//   // --- LOCATION BASED SEARCH ---
//   form.addEventListener("submit", async (e) => {
//     e.preventDefault();

//     const block = blockSelect.value;
//     const nyayPanchayat = nyaySelect.value;
//     const village = villageSelect.value;

//     const url = `/family/search?block=${block}&nyayPanchayat=${nyayPanchayat}&village=${village}`;
//     const data = await fetchFamilies(url);

//     showResultsSection();
//     renderFamilies(data);
//   });

//   // --- NAME BASED SEARCH ---
//   nameSearchInput.addEventListener("input", () => {
//     clearTimeout(debounceTimer);
//     const q = nameSearchInput.value.trim();

//     if (!q) {
//       suggestionList.style.display = "none";
//       suggestionList.innerHTML = "";
//       return;
//     }

//     debounceTimer = setTimeout(async () => {
//       const res = await fetch(`/admin/search-family?q=${encodeURIComponent(q)}`);
//       const data = await res.json();
//       showSuggestions(data);
//     }, 300);
//   });

//   function showSuggestions(families) {
//     if (!families.length) {
//       suggestionList.style.display = "none";
//       return;
//     }

//     suggestionList.innerHTML = families.map(f => `
//     <li data-id="${f._id}">
//       ${f.lineageName} — <small>${f.village}</small>
//     </li>
//   `).join("");

//     suggestionList.style.display = "block";

//     document.querySelectorAll("#suggestionList li").forEach(item => {
//       item.addEventListener("click", async () => {
//         const id = item.dataset.id;
//         nameSearchInput.value = item.textContent.split("—")[0].trim();
//         suggestionList.style.display = "none";

//         const url = `/family/search?id=${id}`;
//         const data = await fetchFamilies(url);

//         showResultsSection();
//         renderFamilies(data);
//       });
//     });
//   }

//   document.addEventListener("click", e => {
//     if (!e.target.closest(".form-group")) {
//       suggestionList.style.display = "none";
//     }
//   });


//   async function fetchAndRenderFamilyDetails(familyId) {
//     try {
//       const res = await fetch(`/family/search/${familyId}`);
//       if (!res.ok) throw new Error("Failed to fetch family details");

//       const family = await res.json();
//       renderFamilies([family]);
//     } catch (err) {
//       console.error(err);
//       resultsDiv.innerHTML = "<p style='color:red; text-align:center;'>सर्वर त्रुटि</p>";
//     }
//   }

//   backBtn.addEventListener("click", () => {
//     familt_result_section.style.display = "none";
//     backBtnSection.style.display = "none";
//     form_section.style.display = "block";
//     family_search_tab.style.display = "block";
//     familySearchByLocationTab.classList.add("active");
//     familySearchByNameTab.classList.remove("active");
//     form.reset();
//     document.getElementById("nyaySelect").disabled = true;
//     document.getElementById("villageSelect").disabled = true;
//     document.getElementById("filter-btn").disabled = true;
//   });

//   familySearchByLocationTab.addEventListener("click", ()=> {
//     familySearchByLocationTab.classList.add("active");
//     familySearchByNameTab.classList.remove("active");
    
//     nameSearchContainer.style.display = "none";
//     form_section.style.display = "block";
    
//   });
  
//   familySearchByNameTab.addEventListener("click", ()=>{
//     familySearchByNameTab.classList.add("active");
//     familySearchByLocationTab.classList.remove("active");
    
//     nameSearchContainer.style.display = "block";
//     form_section.style.display = "none";
//   });

// });

document.addEventListener("DOMContentLoaded", async () => {
  const form = document.querySelector(".admin-member-form");
  const blockSelect = document.getElementById("blockSelect");
  const nyaySelect = document.getElementById("nyaySelect");
  const villageSelect = document.getElementById("villageSelect");
  const resultsDiv = document.getElementById("familyResults");
  const filterBtn = document.getElementById("filter-btn");
  const backBtnSection = document.querySelector(".back__btn");
  const backBtn = document.getElementById("backBtn");
  const form_section = document.getElementById('adminMemberPlaceSection');
  const familt_result_section = document.getElementById("family-results-section");
  const family_search_tab = document.querySelector('.family-search-tabs');
  const familySearchByLocationTab = document.getElementById('familySearchByLocationTab');
  const familySearchByNameTab = document.getElementById('familySearchByNameTab');
  const nameSearchContainer = document.getElementById("adminMemberNameSection");
  const nameSearchInput = document.getElementById("nameSearchInput");
  const suggestionList = document.getElementById("suggestionList");
  let debounceTimer;

  nameSearchContainer.style.display = "none";

  try {
    // Fetch hierarchy from backend
    const res = await fetch("/admin/hierarchy");
    if (!res.ok) throw new Error("Failed to load hierarchy");
    const data = await res.json();

    const { blocks, nyayPanchayats, villages } = data;

    // Store for filtering
    window.nyayPanchayats = nyayPanchayats;
    window.villages = villages;

    // Populate blocks
    populateDropdown(blockSelect, blocks);

  } catch (err) {
    console.error(err);
    alert("⚠️ Failed to load hierarchy data");
  }

  // Populate dropdown helper
  function populateDropdown(selectElement, list) {
    if (!selectElement) return;
    selectElement.innerHTML = '<option value="" disabled selected>-- Choose --</option>';
    list.forEach(item => {
      const option = document.createElement("option");
      option.value = item.name; // store names for compatibility
      option.textContent = item.name;
      selectElement.appendChild(option);
    });
  }

  // Filter nyay panchayats by selected block
  blockSelect.addEventListener("change", () => {
    const blockName = blockSelect.value;
    const filteredPanchayats = (window.nyayPanchayats || []).filter(
      p => p.blockId && p.blockId.name === blockName
    );

    if (filteredPanchayats.length) {
      nyaySelect.disabled = false;
      populateDropdown(nyaySelect, filteredPanchayats);
    } else {
      nyaySelect.disabled = true;
      nyaySelect.innerHTML = '<option value="" disabled selected>No Panchayats found</option>';
    }

    villageSelect.disabled = true;
    villageSelect.innerHTML = '<option value="" disabled selected>-- पहले न्याय पंचायत चुनें --</option>';
    filterBtn.disabled = true;
  });

  // Filter villages by selected nyay panchayat
  nyaySelect.addEventListener("change", () => {
    const nyayName = nyaySelect.value;
    const filteredVillages = (window.villages || []).filter(
      v => v.nyayPanchayatId && v.nyayPanchayatId.name === nyayName
    );

    if (filteredVillages.length) {
      villageSelect.disabled = false;
      populateDropdown(villageSelect, filteredVillages);
    } else {
      villageSelect.disabled = true;
      villageSelect.innerHTML = '<option value="" disabled selected>No villages found</option>';
    }
    filterBtn.disabled = true;
  });

  villageSelect.addEventListener("change", () => {
    filterBtn.disabled = !villageSelect.value;
  });

  // --- LOCATION BASED SEARCH ---
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const block = blockSelect.value;
    const nyayPanchayat = nyaySelect.value;
    const village = villageSelect.value;

    const url = `/family/search?block=${block}&nyayPanchayat=${nyayPanchayat}&village=${village}`;
    const data = await fetchFamilies(url);

    showResultsSection();
    renderFamilies(data);
  });

  // --- NAME BASED SEARCH ---
  nameSearchInput.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    const q = nameSearchInput.value.trim();

    if (!q) {
      suggestionList.style.display = "none";
      suggestionList.innerHTML = "";
      return;
    }

    debounceTimer = setTimeout(async () => {
      const res = await fetch(`/admin/search-family?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      showSuggestions(data);
    }, 300);
  });

  function showSuggestions(families) {
    if (!families.length) {
      suggestionList.style.display = "none";
      return;
    }

    suggestionList.innerHTML = families.map(f => `
      <li data-id="${f._id}">
        ${f.lineageName} — <small>${f.village}</small>
      </li>
    `).join("");

    suggestionList.style.display = "block";

    document.querySelectorAll("#suggestionList li").forEach(item => {
      item.addEventListener("click", async () => {
        const id = item.dataset.id;
        nameSearchInput.value = item.textContent.split("—")[0].trim();
        suggestionList.style.display = "none";

        const url = `/family/search?id=${id}`;
        const data = await fetchFamilies(url);

        showResultsSection();
        renderFamilies(data);
      });
    });
  }

  document.addEventListener("click", e => {
    if (!e.target.closest(".form-group")) {
      suggestionList.style.display = "none";
    }
  });

  async function fetchFamilies(url) {
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error("Request failed");
      return data;
    } catch (err) {
      console.error("Error fetching families:", err);
      return { error: true };
    }
  }

  function renderFamilies(data) {
    const isMobile = window.innerWidth <= 600;

    if (!data || data.error) {
      resultsDiv.innerHTML = "<p style='color:red; text-align:center;'>सर्वर त्रुटि</p>";
      return;
    }

    if (data.length === 0) {
      resultsDiv.innerHTML = "<p style='color:red; text-align:center;'>कोई परिवार नहीं मिला</p>";
      return;
    }

    resultsDiv.innerHTML = data.map((family, index) => {
      const members = [...family.members];
      const familyInfo = `
        <h6 class="family-meta">
          (क्षत्रिय: ${family.clan}, ग्राम: ${family.village},
          न्याय पंचायत: ${family.nyayPanchayat},
          विकास खंड: ${family.block},
          पूर्व निवास: ${family.oldResidence})
        </h6>
      `;

      const memberList =
        members.length === 0
          ? `<p class="no-members" style="text-align:center;">अभी तक कोई सदस्य नहीं जोड़ा गया है।</p>`
          : (isMobile
            ? members.map(m => `
              <div class="member-item">
                <p><strong>नाम:</strong> ${m.name}</p>
                <p><strong>पिता का नाम:</strong> ${m.guardianName}</p>
                <p><strong>अन्य:</strong> ${m.otherDetails || "—"}</p>
                ${m.year
                  ? `<p><strong>${m.yearType === "birth" ? "जन्म वर्ष:" : "मृत्यु वर्ष:"}</strong> ${new Date(m.year).toLocaleDateString("en-GB")}</p>`
                  : ""}
              </div>
            `).join("")
            : `<table class="family-table">
                <thead>
                  <tr>
                    <th>नाम</th>
                    <th>पिता का नाम</th>
                    <th>अन्य</th>
                    <th>जन्म/मृत्यु वर्ष</th>
                  </tr>
                </thead>
                <tbody>
                  ${members.map(m => `
                    <tr>
                      <td>${m.name}</td>
                      <td>${m.guardianName}</td>
                      <td>${m.otherDetails || "—"}</td>
                      <td>${m.year ? new Date(m.year).toLocaleDateString("en-GB") + " (" + (m.yearType === "birth" ? "जन्म" : "मृत्यु") + ")" : "—"}</td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>`
          );

      const isSingle = data.length === 1;
      const isActiveClass = isSingle ? "active" : "";
      const arrowSymbol = isSingle ? "▼" : "▶";

      return `
        <div class="family-box">
          <div class="family-header" onclick="toggleFamily(${index})">
            🏠 वंश: ${family.lineageName}
            <span class="arrow">${arrowSymbol}</span>
          </div>
          <div class="family-content ${isActiveClass}" id="family-${index}">
            ${familyInfo}
            ${memberList}
          </div>
        </div>
      `;
    }).join("");

    window.toggleFamily = function (index) {
      document.querySelectorAll(".family-content").forEach((el, i) => {
        const arrow = el.previousElementSibling.querySelector(".arrow");
        if (i === index) {
          el.classList.toggle("active");
          arrow.textContent = el.classList.contains("active") ? "▼" : "▶";
        } else {
          el.classList.remove("active");
          arrow.textContent = "▶";
        }
      });
    };
  }

  function showResultsSection() {
    familt_result_section.style.display = "block";
    backBtnSection.style.display = "block";
    form_section.style.display = "none";
    nameSearchContainer.style.display = "none";
    family_search_tab.style.display = "none";
    document.querySelector(".family-list").style.display = "none";
  }

  backBtn.addEventListener("click", () => {
    familt_result_section.style.display = "none";
    backBtnSection.style.display = "none";
    form_section.style.display = "block";
    family_search_tab.style.display = "block";
    familySearchByLocationTab.classList.add("active");
    familySearchByNameTab.classList.remove("active");
    form.reset();
    nyaySelect.disabled = true;
    villageSelect.disabled = true;
    filterBtn.disabled = true;
  });

  familySearchByLocationTab.addEventListener("click", () => {
    familySearchByLocationTab.classList.add("active");
    familySearchByNameTab.classList.remove("active");
    nameSearchContainer.style.display = "none";
    form_section.style.display = "block";
  });

  familySearchByNameTab.addEventListener("click", () => {
    familySearchByNameTab.classList.add("active");
    familySearchByLocationTab.classList.remove("active");
    nameSearchContainer.style.display = "block";
    form_section.style.display = "none";
  });
});
