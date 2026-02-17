const U_HEIGHT = 24;

const editToggle = document.getElementById("editToggle");
const backdrop = document.getElementById("panelBackdrop");

function isEditEnabled() {
    return editToggle && editToggle.checked;
}

// Persist edit mode
if (localStorage.getItem("editMode") === "true") {
    editToggle.checked = true;
    document.body.classList.add("edit-mode");
}

editToggle?.addEventListener("change", () => {
    const enabled = editToggle.checked;

    localStorage.setItem("editMode", enabled);

    document.body.classList.toggle("edit-mode", enabled);
});

/* ===================== DRAG ===================== */

document.querySelectorAll(".draggable").forEach(el => {

    el.addEventListener("mousedown", (e) => {
        if (!isEditEnabled()) return;

        if (e.target.closest(".server-config-btn")) return;

        if (e.target.closest(".server-edit-btn")) return;

        if (e.target.closest(".delete-form")) return;

        if (e.target.closest(".resize-handle")) return;

        const startX = e.clientX;
        const startY = e.clientY;



        e.preventDefault();


        let hasMoved = false;
        const originalRack = el.parentElement;
        const originalTop = parseInt(el.dataset.originalTop);

        const heightU = parseInt(el.dataset.height);
        const serverId = el.dataset.id;

        let currentRack = originalRack;

        function restoreOriginal() {
            originalRack.appendChild(el);
            el.style.top = originalTop + "px";
        }

        function getRackUnderMouse(x, y) {
            const racks = document.querySelectorAll(".rack");

            for (const rack of racks) {
                const rect = rack.getBoundingClientRect();
                if (
                    x >= rect.left &&
                    x <= rect.right &&
                    y >= rect.top &&
                    y <= rect.bottom
                ) {
                    return rack;
                }
            }
            return null;
        }

        function calculatePosition(rack, clientY) {
            const rect = rack.getBoundingClientRect();
            const rackHeightU = rack.clientHeight / U_HEIGHT;

            let relativeY = clientY - rect.top;

            if (relativeY < 0) relativeY = 0;
            if (relativeY > rack.clientHeight - el.clientHeight)
                relativeY = rack.clientHeight - el.clientHeight;

            const snappedTop =
                Math.round(relativeY / U_HEIGHT) * U_HEIGHT;

            const uStart =
                rackHeightU - (snappedTop / U_HEIGHT) - heightU + 1;

            const uEnd = uStart + heightU - 1;

            return { snappedTop, uStart, uEnd };
        }

        function checkCollision(rack, uStart, uEnd) {
            const rackHeightU = rack.clientHeight / U_HEIGHT;

            const others = Array.from(
                rack.querySelectorAll(".draggable")
            ).filter(s => s !== el);

            for (const s of others) {

                const otherTop = parseInt(s.style.top);
                const otherHeight = parseInt(s.dataset.height);

                const otherUStart =
                    rackHeightU - (otherTop / U_HEIGHT) - otherHeight + 1;

                const otherUEnd = otherUStart + otherHeight - 1;

                if (uStart <= otherUEnd && uEnd >= otherUStart) {
                    return true;
                }
            }
            return false;
        }

        function onMouseMove(e) {

            const deltaX = Math.abs(e.clientX - startX);
            const deltaY = Math.abs(e.clientY - startY);

            // Require small movement before drag activates
            if (!hasMoved) {
                if (deltaX < 5 && deltaY < 5) return;
                hasMoved = true;
            }

            const targetRack = getRackUnderMouse(e.clientX, e.clientY);
            if (!targetRack) return;

            if (targetRack !== currentRack) {
                currentRack = targetRack;
                targetRack.appendChild(el);
            }

            const { snappedTop, uStart, uEnd } =
                calculatePosition(currentRack, e.clientY);

            const collision =
                checkCollision(currentRack, uStart, uEnd);

            el.style.top = snappedTop + "px";

            el.classList.toggle("invalid", collision);
            el.classList.toggle("valid", !collision);
        }


        function onMouseUp(e) {

            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);

            if (!hasMoved) return;
            el.classList.remove("valid", "invalid");

            const { snappedTop, uStart, uEnd } =
                calculatePosition(currentRack, e.clientY);

            const collision =
                checkCollision(currentRack, uStart, uEnd);

            if (collision) {
                restoreOriginal();
                return;
            }

            const orientation =
                currentRack.dataset.orientation;

            fetch("/servers/move", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: serverId,
                    position_u_start: uStart,
                    orientation
                })
            })
                .then(res => res.json())
                .then(() => {
                    // update canonical top after successful move
                    el.dataset.originalTop = snappedTop;
                    el.style.top = snappedTop + "px";
                });
        }

        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
    });

});


/* ===================== RESIZE ===================== */

document.querySelectorAll(".resize-handle").forEach(handle => {

    handle.addEventListener("mousedown", (e) => {

        if (!isEditEnabled()) return;

        e.stopPropagation();

        const server = handle.closest(".server");

        const startY = e.clientY;
        const startHeight = server.clientHeight;

        function onMouseMove(e) {
            const delta = e.clientY - startY;
            let newHeight = startHeight + delta;

            newHeight =
                Math.round(newHeight / U_HEIGHT) * U_HEIGHT;

            if (newHeight < U_HEIGHT) newHeight = U_HEIGHT;
            if (newHeight > U_HEIGHT * 2)
                newHeight = U_HEIGHT * 2;

            server.style.height = newHeight + "px";
        }

        function onMouseUp() {
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);

            const newHeightU =
                parseInt(server.style.height) / U_HEIGHT;

            fetch("/servers/resize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: server.dataset.id,
                    height_u: newHeightU
                })
            })
                .then(res => res.json())
                .then(() => location.reload());
        }

        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
    });

});

/* ===================== DELETE CONFIRM ===================== */

document.querySelectorAll(".delete-form").forEach(form => {
    form.addEventListener("submit", function (e) {

        if (!isEditEnabled()) {
            e.preventDefault();
            return;
        }

        if (!confirm("Delete this server?")) {
            e.preventDefault();
        }
    });
});

function highlightOccupied() {

    document.querySelectorAll(".rack").forEach(rack => {

        rack.querySelectorAll(".u-highlight").forEach(el => el.remove());

        const servers = rack.querySelectorAll(".server");

        servers.forEach(server => {

            const highlight = document.createElement("div");

            highlight.className = "u-highlight";

            highlight.style.top = server.style.top;
            highlight.style.height = server.style.height;

            rack.appendChild(highlight);
        });

    });
}

highlightOccupied();

const serverPanel = document.getElementById("serverPanel");
let currentServerId = null;

document.querySelectorAll(".server-config-btn").forEach(btn => {

    btn.addEventListener("mousedown", function (e) {
        e.stopPropagation();
    });

    btn.addEventListener("click", function (e) {

        e.stopPropagation();
        e.preventDefault();

        const server = btn.closest(".server");
        currentServerId = server.dataset.id;

        fetch(`/servers/${currentServerId}/disks`)
            .then(res => res.json())
            .then(data => {

                renderServerPanel(data);
                serverPanel.classList.add("open");
                backdrop.classList.add("active");
            });
    });

});

document.querySelectorAll(".server-edit-btn").forEach(btn => {

    btn.addEventListener("mousedown", e => e.stopPropagation());

    btn.addEventListener("click", function (e) {

        e.stopPropagation();
        e.preventDefault();

        const server = btn.closest(".server");

        document.getElementById("serverId").value = server.dataset.id;
        document.getElementById("serverName").value = server.dataset.name || "";
        document.getElementById("serverBrand").value = server.dataset.brand || "";
        document.getElementById("serverSn").value = server.dataset.sn || "";
        document.getElementById("serverType").value = server.dataset.type || "";
        document.getElementById("serverOrientation").value = server.dataset.orientation;
        document.getElementById("serverHeight").value = server.dataset.height;
        document.getElementById("serverPosition").value = server.dataset.position;

        document.getElementById("serverSubmitBtn").textContent = "Update Server";

        const form = document.getElementById("serverForm");
        form.action = "/servers/update";

        form.scrollIntoView({ behavior: "smooth", block: "center" });
    });

});

document.getElementById("cancelEditBtn")?.addEventListener("click", () => {

    const form = document.getElementById("serverForm");

    form.reset();
    form.action = "/servers/create";
    document.getElementById("serverSubmitBtn").textContent = "Add Server";

});

function enableDiskDrag() {
    document.querySelectorAll('.disk-grid').forEach(grid => {

        let dragged = null;

        grid.querySelectorAll('.disk-block').forEach(block => {

            block.setAttribute('draggable', true);

            block.addEventListener('dragstart', () => {
                dragged = block;
                block.style.opacity = 0.5;
            });

            block.addEventListener('dragend', () => {
                block.style.opacity = '';
            });

            block.addEventListener('dragover', e => {
                e.preventDefault();
            });

            block.addEventListener('drop', e => {
                e.preventDefault();
                if (dragged && dragged !== block) {
                    grid.insertBefore(dragged, block);
                    saveDiskOrder(grid);
                }
            });

        });

    });
}



function renderServerPanel(data) {

    if (!data || !data.server) return;

    serverPanel.innerHTML = `
        <div class="panel-header">
        <h3>${data.server.name}</h3>
            <button id="closePanelBtn">✖</button>
        </div>
<div class="accordion">
        <div class="accordion-header" id="toggleAddDisk">
            ➕ Add Disk
        </div>
        <div class="accordion-body collapsed">
        <form id="addDiskForm" class="disk-form">

            <div class="form-row">
                <select name="placement">
                    <option value="front">Front</option>
                    <option value="inside">Inside</option>
                    <option value="back">Back</option>
                </select>

                <select name="subtype">
                    <option value="sff">SFF</option>
                    <option value="lff">LFF</option>
                    <option value="pci">PCI</option>
                </select>

                <select name="type">
                    <option value="hdd">HDD</option>
                    <option value="ssd">SSD</option>
                    <option value="nvme">NVMe</option>
                </select>
            </div>

            <div class="form-row">
                <input name="brand" placeholder="Brand">
                <input name="name" placeholder="Model Name">
                <input name="serial" placeholder="Serial Number">
                <input name="capacity" placeholder="Capacity">
            </div>

            <div class="form-row">
                <input name="power_on_time" placeholder="Power On Time">
                <input name="health" placeholder="Health %">
                <input name="tbw" placeholder="TBW">
                <input name="remaining_time" placeholder="Remaining Time">
            </div>
            <div class="form-row">
            <input name="slot_id" placeholder="Slot ID (e.g. I:1:3)">
            <input name="pci_group" type="number" placeholder="PCI Group">
            </div>



            <button type="submit">Add Disk</button>

        </form>
        </div>
        <div class="server-visual-horizontal">

            <div class="server-section front">
                <div class="section-title">
                    Front
                    <span class="section-badge">${data.disks.front.length}</span>
                    <span class="collapse-icon">▾</span>
                </div>
                <div class="section-content">
                    ${renderGrid(data.disks.front, 2, "front")}
                </div>
            </div>

            <div class="server-section inside">
                <div class="section-title collapsible">
                    Inside
                    <span class="section-badge">${data.disks.inside.length}</span>
                    <span class="collapse-icon">▾</span>
                </div>
                <div class="section-content collapsed">
                    ${renderGrid(data.disks.inside, 4, "inside")}
                </div>
            </div>

            <div class="server-section back">
                <div class="section-title">
                    Back
                    <span class="section-badge">${data.disks.back.length}</span>
                    <span class="collapse-icon">▾</span>
                </div>
                <div class="section-content">
                    ${renderGrid(data.disks.back, 2, "back")}
                </div>
            </div>


        </div>

        
        
    `;
    const toggle = serverPanel.querySelector("#toggleAddDisk");
    const body = serverPanel.querySelector(".accordion-body");

    toggle.addEventListener("click", () => {
        body.classList.toggle("collapsed");
    });

    serverPanel.querySelectorAll(".server-section").forEach(section => {

        const header = section.querySelector(".section-title");
        if (!header) return;

        header.addEventListener("click", () => {
            section.classList.toggle("section-collapsed");
        });

    });
    serverPanel.querySelector(".server-section.inside")
        ?.classList.add("section-collapsed");


    /* ================= Placement Logic ================= */

    const placementSelect = serverPanel.querySelector(
        'select[name="placement"]'
    );

    const subtypeSelect = serverPanel.querySelector(
        'select[name="subtype"]'
    );

    if (placementSelect && subtypeSelect) {

        placementSelect.addEventListener("change", function () {

            if (this.value === "back") {
                subtypeSelect.innerHTML = `
                    <option value="sff">SFF</option>
                    <option value="lff">LFF</option>
                    <option value="pci">PCI</option>
                `;
            } else {
                subtypeSelect.innerHTML = `
                    <option value="sff">SFF</option>
                    <option value="lff">LFF</option>
                `;
            }

        });

    }

    /* ================= Submit Logic ================= */

    const form = serverPanel.querySelector("#addDiskForm");

    form.addEventListener("submit", function (e) {

        e.preventDefault();

        const formData = new FormData(this);
        const payload = Object.fromEntries(formData.entries());

        fetch(`/servers/${currentServerId}/disks`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        })
            .then(res => res.json())
            .then(() => {

                this.reset();

                fetch(`/servers/${currentServerId}/disks`)
                    .then(res => res.json())
                    .then(updated => {
                        renderServerPanel(updated);
                        serverPanel.classList.add("open");
                        backdrop.classList.add("active");
                    });

            });

    });

    enableDiskDrag();

}

function getHealthColor(health) {

    const h = parseInt(health);

    if (isNaN(h)) return "#4a90e2";
    if (h >= 70) return "#2ecc71";
    if (h >= 35) return "#f1c40f";
    return "#e74c3c";
}


function renderGrid(disks, columns, placement) {

    if (!disks.length) return '<div class="empty">Empty</div>';

    if (placement === "back") {
        return renderBackLayout(disks);
    }

    return `
        <div class="disk-grid ${columns === 2 ? 'grid-2' : 'grid-4'}">
            ${disks.map(d => renderDisk(d)).join('')}
        </div>
    `;
}

function renderBackLayout(disks) {

    const groups = {};

    disks.forEach(d => {

        if (d.subtype === 'pci' && d.pci_group !== null && d.pci_group !== undefined) {
            const group = d.pci_group;

            if (!groups[group]) groups[group] = [];
            groups[group].push(d);
        } else {
            if (!groups["_ungrouped"]) groups["_ungrouped"] = [];
            groups["_ungrouped"].push(d);
        }

    });


    return `
        <div class="pci-container">
            ${Object.keys(groups).map(groupId => {

        if (groupId === "_ungrouped") {
            return `
            <div class="pci-row">
                ${groups[groupId].map(d => renderDisk(d)).join('')}
            </div>
        `;
        }

        return `
        <div class="pci-group">
            <div class="pci-group-title">
                PCI Group ${groupId}
            </div>
            <div class="pci-row">
                ${groups[groupId].map(d => renderDisk(d)).join('')}
            </div>
        </div>
    `;

    }).join('')}

        </div>
    `;
}

function renderDisk(d) {
    return `
        <div class="disk-block detailed"
            style="background:${getHealthColor(d.health)}"
            data-id="${d.id}">

            <div class="disk-view">
                <div class="disk-slot-id">
                    ${d.slot_id || '-'}
                </div>

                <div class="disk-header">
                    <div class="disk-title">
                        ${d.brand || ''} ${d.name || ''}
                    </div>

                    <div class="disk-meta">
                        <span class="disk-type">
                            ${(d.type || '').toUpperCase()}
                        </span>
                        ${d.capacity ? `<span class="disk-capacity">[${d.capacity}]</span>` : ''}
                    </div>
                </div>


                <div class="disk-serial">
                    SN: ${d.serial || '-'}
                </div>

                <div class="disk-metrics">
                    <div>Pwr: ${d.power_on_time || '-'}</div>
                    <div>Health: ${d.health || '-'}</div>
                    <div>TBW: ${d.tbw || '-'}</div>
                    <div>Remain: ${d.remaining_time || '-'}</div>
                </div>
            </div>

            <div class="disk-edit hidden">
                <input name="slot_id" value="${d.slot_id || ''}">
                <input name="pci_group" value="${d.pci_group || 0}">
                <input name="brand" value="${d.brand || ''}">
                <input name="name" value="${d.name || ''}">
                <input name="serial" value="${d.serial || ''}">
                <button class="disk-save-btn" data-id="${d.id}">
                    Save
                </button>
            </div>

            <button class="disk-delete-btn" data-id="${d.id}">✖</button>
        </div>
    `;
}



serverPanel.addEventListener("click", function (e) {

    /* ================= CLOSE BUTTON ================= */

    if (e.target.id === "closePanelBtn") {
        closePanel();
        return;
    }

    /* ================= DELETE DISK ================= */

    if (e.target.classList.contains("disk-delete-btn")) {

        const diskId = e.target.dataset.id;

        if (!confirm("Delete this disk?")) return;

        fetch(`/servers/disks/${diskId}`, {
            method: "DELETE"
        })
            .then(res => res.json())
            .then(() => refreshPanel());

        return;
    }

    /* ================= SAVE DISK ================= */

    if (e.target.classList.contains("disk-save-btn")) {

        const diskId = e.target.dataset.id;
        const diskBlock = e.target.closest(".disk-block");

        const inputs = diskBlock.querySelectorAll("input");
        const rawGroup = diskBlock.querySelector('input[name="pci_group"]').value;

        const payload = {
            slot_id: diskBlock.querySelector('input[name="slot_id"]').value,
            pci_group: rawGroup !== "" ? parseInt(rawGroup) : null,
            brand: diskBlock.querySelector('input[name="brand"]').value,
            name: diskBlock.querySelector('input[name="name"]').value,
            serial: diskBlock.querySelector('input[name="serial"]').value
        };

        //inputs.forEach(i => payload[i.name] = i.value);

        fetch(`/servers/disks/${diskId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        })
            .then(res => res.json())
            .then(() => refreshPanel());

        return;
    }

    /* ================= INLINE EDIT TOGGLE ================= */

    const diskBlock = e.target.closest(".disk-block");

    if (diskBlock && e.target.closest(".disk-view")) {
        diskBlock.classList.toggle("editing");
        return;
    }

});
function refreshPanel() {

    if (!currentServerId) return;

    fetch(`/servers/${currentServerId}/disks`)
        .then(res => res.json())
        .then(updated => {
            renderServerPanel(updated);
            serverPanel.classList.add("open");
            backdrop.classList.add("active");
        });
}


function closePanel() {
    serverPanel.classList.remove("open");
    backdrop.classList.remove("active");
}

function saveDiskOrder(grid) {

    const ids = Array.from(grid.querySelectorAll('.disk-block'))
        .map(b => parseInt(b.dataset.id));

    const section = grid.closest(".server-section");
    const placement =
        section.classList.contains("front") ? "front" :
            section.classList.contains("inside") ? "inside" :
                "back";

    fetch(`/servers/${currentServerId}/disks/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            placement,
            order: ids
        })
    });
}




backdrop.addEventListener("click", closePanel);

document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closePanel();
});
