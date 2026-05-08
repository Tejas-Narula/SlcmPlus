const table = document.querySelector('#kt_ViewTable');

if (!table) {
  console.log("Table not found");
} else {
  const url = window.location.href;
  if (url.includes("AttendanceSummaryForStudent")) {
    // Existing attendance logic
    const observer = new MutationObserver(() => {
      const rows = table.querySelectorAll('tr');
      if (rows.length > 0) {
        rows.forEach(row => {
          if (row.cells.length > 8) { // ensure columns exist
            const present = parseInt(row.cells[6].textContent.trim());
            const absent  = parseInt(row.cells[7].textContent.trim());
            const total   = parseInt(row.cells[8].textContent.trim());
            const lastElem = row.cells[9];
            const needed = Math.max(0, Math.ceil(3 * total - 4 * present));
            const extra = Math.floor(present/0.75 - total)
            if(needed>0){
              lastElem.innerHTML += `<div><span class="needed">${needed} ${needed == 1 ? 'class' : 'classes'} needed 😔</span></div>`
            }else if(extra>-1){
              lastElem.innerHTML += `<div><span class="needed">${extra} bunk(s) left ${extra== 0 ?'🙄' : '😃' }</span></div>`
            }
          }
        });
        observer.disconnect();
      }
    });
    observer.observe(table, {
      childList: true,
      subtree: true
    });
  } else if (url.includes("InternalMarkForStudent")) {
    // New feature: sum columns horizontally for each row and show total
    let observer;
    const processTable = () => {
      if (observer) observer.disconnect();
      const rows = table.querySelectorAll('tr');
      if (rows.length > 1) {
        // Add 'Total' heading if not present
        const headerRow = rows[0];
        if (headerRow && headerRow.cells.length >= 8 && headerRow.cells[headerRow.cells.length - 1].textContent.trim() !== 'Total') {
          const th = document.createElement('th');
          th.textContent = 'Total';
          th.style.background = '#e0e0e0';
          headerRow.appendChild(th);
        }
        // For each data row, sum horizontally and add cell
        for (let i = 1; i < rows.length; i++) {
          const cells = rows[i].cells;
          if (cells.length >= 8) {
            const parseCell = idx => {
              const val = cells[idx].textContent.trim();
              const num = parseFloat(val.replace(/[^\d.\-]/g, ''));
              return (!isNaN(num) && val !== '-' && val !== '') ? num : 0;
            };
            const total = parseCell(2) + parseCell(3) + parseCell(4) + parseCell(5) + parseCell(6) + parseCell(7);
            // Add or update total cell
            if (cells.length === 8) {
              const td = document.createElement('td');
              td.innerHTML = `<span class=\"needed\">${total}</span>`;
              rows[i].appendChild(td);
            } else if (cells.length === 9) {
              cells[8].innerHTML = `<span class=\"needed\">${total}</span>`;
            }
          }
        }
      }
      if (observer) observer.observe(table, { childList: true, subtree: true });
    };
    observer = new MutationObserver(() => {
      processTable();
    });
    processTable();
  }else if (url.includes("GradesForStudent")){
    let observer;

    const gradePointMap = {
      "A+": 10,
      A: 9,
      B: 8,
      C: 7,
      D: 6,
      E: 5,
      P: 5,
      F: 0,
      U: 0,
      I: 0,
      AB: 0
    };

    const getGradePoint = (grade) => {
      const normalized = (grade || "").toUpperCase().replace(/\s+/g, "");
      if (Object.prototype.hasOwnProperty.call(gradePointMap, normalized)) {
        return gradePointMap[normalized];
      }
      return null;
    };

    const processGradesTable = () => {
      if (observer) observer.disconnect();

      const existingRow = table.querySelector('#slcmplus-gpa-row');
      if (existingRow) {
        existingRow.remove();
      }

      const rows = table.querySelectorAll('tr');
      let weightedPoints = 0;
      let includedCredits = 0;

      rows.forEach(row => {
        const cells = row.cells;
        if (cells.length < 6) return;

        const creditsText = cells[4].textContent.trim();
        const gradeText = cells[5].textContent.trim();
        const credits = parseFloat(creditsText);
        const gradePoint = getGradePoint(gradeText);

        if (isNaN(credits) || credits <= 0 || gradePoint === null) return;

        weightedPoints += credits * gradePoint;
        includedCredits += credits;
      });

      if (includedCredits > 0) {
        const gpa = weightedPoints / includedCredits;
        const gpaRow = document.createElement('tr');
        gpaRow.id = 'slcmplus-gpa-row';
        gpaRow.style.backgroundColor = '#EAF2F8';

        gpaRow.innerHTML = `
          <td colspan="4" align="right"><b>Calculated Semester GPA</b></td>
          <td align="center"><span class="slcmplus-credits">${includedCredits}</span></td>
          <td align="center"><span class="slcmplus-gpa">${gpa.toFixed(2)}</span></td>
        `;

        table.appendChild(gpaRow);
      }

      if (observer) observer.observe(table, { childList: true, subtree: true });
    };

    observer = new MutationObserver(() => {
      processGradesTable();
    });

    processGradesTable();
  }
}