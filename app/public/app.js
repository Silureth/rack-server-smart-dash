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
function enableRackItemDrag() {
    document.querySelectorAll(".draggable").forEach(el => {

        el.addEventListener("mousedown", (e) => {
            if (!isEditEnabled()) return;

            if (e.target.closest(".item-config-btn")) return;

            if (e.target.closest(".item-edit-btn")) return;

            if (e.target.closest(".delete-form")) return;

            if (e.target.closest(".resize-handle")) return;

            const startX = e.clientX;
            const startY = e.clientY;



            e.preventDefault();


            let hasMoved = false;
            const originalRack = el.parentElement;
            const originalTop = parseInt(el.dataset.originalTop);

            const heightU = parseInt(el.dataset.height);
            const rackItemId = el.dataset.id;

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

                fetch("/rack-items/move", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        id: rackItemId,
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
}
enableRackItemDrag();


/* ===================== RESIZE ===================== */

document.querySelectorAll(".resize-handle").forEach(handle => {

    handle.addEventListener("mousedown", (e) => {

        if (!isEditEnabled()) return;

        e.stopPropagation();

        const item = handle.closest(".rack-item");

        const startY = e.clientY;
        const startHeight = item.clientHeight;

        function onMouseMove(e) {
            const delta = e.clientY - startY;
            let newHeight = startHeight + delta;

            newHeight =
                Math.round(newHeight / U_HEIGHT) * U_HEIGHT;

            if (newHeight < U_HEIGHT) newHeight = U_HEIGHT;
            if (newHeight > U_HEIGHT * 2)
                newHeight = U_HEIGHT * 2;

            item.style.height = newHeight + "px";
        }

        function onMouseUp() {
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);

            const newHeightU =
                parseInt(item.style.height) / U_HEIGHT;

            fetch("/rack-items/resize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: item.dataset.id,
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

        const servers = rack.querySelectorAll(".rack-item");

        servers.forEach(item => {

            const highlight = document.createElement("div");

            highlight.className = "u-highlight";

            highlight.style.top = item.style.top;
            highlight.style.height = item.style.height;

            rack.appendChild(highlight);
        });

    });
}

highlightOccupied();

const itemPanel = document.getElementById("itemPanel");
let currentItemId = null;

document.querySelectorAll(".item-config-btn").forEach(btn => {

    btn.addEventListener("mousedown", function (e) {
        e.stopPropagation();
    });

    btn.addEventListener("click", function (e) {

        e.stopPropagation();
        e.preventDefault();

        const item = btn.closest(".rack-item");
        currentItemId = item.dataset.id;

        fetch(`/rack-items/${currentItemId}/disks`)
            .then(res => res.json())
            .then(data => {

                renderItemPanel(data);
                itemPanel.classList.add("open");
                backdrop.classList.add("active");
            });
    });

});

document.querySelectorAll(".item-edit-btn").forEach(btn => {

    btn.addEventListener("mousedown", e => e.stopPropagation());

    btn.addEventListener("click", function (e) {

        e.stopPropagation();
        e.preventDefault();

        const item = btn.closest(".rack-item");

        document.getElementById("rackItemId").value = item.dataset.id;
        document.getElementById("serverName").value = item.dataset.name || "";
        document.getElementById("serverBrand").value = item.dataset.brand || "";
        document.getElementById("serverSn").value = item.dataset.sn || "";
        document.getElementById("itemType").value = item.dataset.type || "";
        document.getElementById("serverOrientation").value = item.dataset.orientation;
        document.getElementById("itemHeight").value = item.dataset.height;
        document.getElementById("itemPosition").value = item.dataset.position;

        document.getElementById("serverSubmitBtn").textContent = "Update Rack item";

        const form = document.getElementById("rackItemForm");
        form.action = "/rack-items/update";

        form.scrollIntoView({ behavior: "smooth", block: "center" });
    });

});

document.getElementById("cancelEditBtn")?.addEventListener("click", () => {

    const form = document.getElementById("rackItemForm");

    form.reset();
    form.action = "/rack-items/create";
    document.getElementById("serverSubmitBtn").textContent = "Add Rack item";

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

function renderAddDiskAccordion() {
    return `
    <div class="accordion">
        <div class="accordion-header toggle-accordion">
            ➕ Add Disk
        </div>
        <div class="accordion-body collapsed">
            <form class="disk-form add-disk-form">

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
    </div>
    `;
}
function renderAddPortAccordion() {
    return `
    <div class="accordion">
        <div class="accordion-header toggle-accordion">
            ➕ Add Port
        </div>
        <div class="accordion-body collapsed">
            <form class="port-form add-port-form">
                <div class="form-row">
                    <input name="name" placeholder="Port Name (e.g. eth0)">
                    <input name="role" placeholder="Role (uplink, mgmt, lan)">
                </div>
                <button type="submit">Add Port</button>
            </form>
        </div>
    </div>
    `;
}
function renderAddPowerInputAccordion() {
    return `
    <div class="accordion">
        <div class="accordion-header toggle-accordion">
            🔌 Add Power Input
        </div>
        <div class="accordion-body collapsed">
            <form class="power-input-form add-power-input-form">
                <div class="form-row">
                    <input name="name" placeholder="Input Name (PSU1, PSU2)" required>
                    <input name="type" placeholder="Connector Type (C14, C20)">
                </div>
                <button type="submit">Add Power Input</button>
            </form>
        </div>
    </div>
    `;
}
function renderAddPowerOutletAccordion() {
    return `
    <div class="accordion">
        <div class="accordion-header toggle-accordion">
            ⚡ Add Power Outlet
        </div>
        <div class="accordion-body collapsed">
            <form class="power-outlet-form add-power-outlet-form">
                <div class="form-row">
                    <input name="name" placeholder="Outlet Name (Outlet 1)" required>
                    <input name="type" placeholder="Outlet Type (C13, C19)">
                </div>
                <button type="submit">Add Power Outlet</button>
            </form>
        </div>
    </div>
    `;
}




function renderItemPanel(data) {

    if (!data || !data.rackItem) return;

    itemPanel.innerHTML = `
        <div class="panel-header">
        <h3>${data.rackItem.name}</h3>
            <button id="closePanelBtn">✖</button>
        </div>
        
        ${data.rackItem.type === 'server' ? renderAddDiskAccordion() : ''}
        ${['server', 'switch', 'pdu'].includes(data.rackItem.type) ? renderAddPortAccordion() : ''}        
        ${['server', 'switch', 'pdu'].includes(data.rackItem.type) ? renderAddPowerInputAccordion() : ''}
        ${data.rackItem.type === 'pdu' ? renderAddPowerOutletAccordion() : ''}
        <div class="item-components">
            ${data.ports ? `
                <div class="server-section ports">
                    <div class="section-title">
                        Ports
                        <span class="section-badge">
                            ${data.ports.length}
                        </span>
                    </div>
                    <div class="section-content">
                        ${renderPorts(data.ports)}
                    </div>
                </div>
            ` : ''}
           ${data.powerInputs ? `
                <div class="server-section power-inputs">
                    <div class="section-title">
                        🔌 Power Inputs
                        <span class="section-badge">
                            ${data.powerInputs.length}
                        </span>
                    </div>
                    <div class="section-content">
                        ${renderPowerInputs(data.powerInputs)}
                    </div>
                </div>
            ` : ''}

            ${data.rackItem.type === 'pdu' ? `
                <div class="server-section power-outlets">
                    <div class="section-title">
                        ⚡ Power Outlets
                        <span class="section-badge">
                            ${data.powerOutlets ? data.powerOutlets.length : 0}
                        </span>
                    </div>
                    <div class="section-content">
                        ${renderPowerOutlets(data.powerOutlets || [])}
                    </div>
                </div>
            ` : ''}
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
            </div>
        </div>        
        
    `;

    itemPanel.querySelectorAll(".server-section").forEach(section => {

        const header = section.querySelector(".section-title");
        if (!header) return;

        header.addEventListener("click", () => {
            section.classList.toggle("section-collapsed");
        });

    });
    itemPanel.querySelector(".server-section.inside")
        ?.classList.add("section-collapsed");


    /* ================= Placement Logic ================= */

    const placementSelect = itemPanel.querySelector(
        'select[name="placement"]'
    );

    const subtypeSelect = itemPanel.querySelector(
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
    enableDiskDrag();

}

function handleDiskSubmit(e, form) {
    e.preventDefault();

    const payload = Object.fromEntries(
        new FormData(form).entries()
    );

    fetch(`/rack-items/${currentItemId}/disks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    })
        .then(res => res.json())
        .then(() => refreshPanel());
}
function handlePortSubmit(e, form) {
    e.preventDefault();

    const payload = Object.fromEntries(
        new FormData(form).entries()
    );

    fetch(`/rack-items/${currentItemId}/ports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    })
        .then(res => res.json())
        .then(() => refreshPanel());
}
function handlePowerInputSubmit(e, form) {
    e.preventDefault();

    const payload = Object.fromEntries(
        new FormData(form).entries()
    );

    fetch(`/rack-items/${currentItemId}/power-inputs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    })
        .then(res => res.json())
        .then(() => refreshPanel());
}

function handlePowerOutletSubmit(e, form) {
    e.preventDefault();

    const payload = Object.fromEntries(
        new FormData(form).entries()
    );

    fetch(`/rack-items/${currentItemId}/power-outlets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    })
        .then(res => res.json())
        .then(() => refreshPanel());
}


function getHealthColor(health) {

    const h = parseInt(health);

    if (isNaN(h)) return "#4a90e2";
    if (h >= 70) return "#2ecc71";
    if (h >= 35) return "#f1c40f";
    return "#e74c3c";
}

function renderPorts(ports) {

    if (!ports || !ports.length)
        return '<div class="empty">No ports</div>';

    return `
        <div class="port-grid">
            ${ports.map(p => `
                <div class="port-block" data-id="${p.id}">
                    <div class="port-name">${p.name}</div>
                    <div class="port-role">${p.role}</div>
                    <button class="port-delete-btn" data-id="${p.id}">✖</button>
                </div>
            `).join('')}
        </div>
    `;
}
function renderPowerInputs(inputs) {

    if (!inputs || !inputs.length)
        return '<div class="empty">No power inputs</div>';

    return `
        <div class="power-grid">
            ${inputs.map(i => `
                <div class="power-block" data-id="${i.id}">
                    <div class="power-name">${i.name}</div>
                    <div class="power-type">${i.type || ''}</div>
                    <button class="power-delete-btn" data-id="${i.id}">✖</button>
                </div>
            `).join('')}
        </div>
    `;
}
function renderPowerOutlets(outlets) {

    if (!outlets || !outlets.length)
        return '<div class="empty">No power outlets</div>';

    return `
        <div class="power-grid">
            ${outlets.map(o => `
                <div class="power-block outlet" data-id="${o.id}">
                    <div class="power-name">${o.name}</div>
                    <div class="power-type">${o.type || ''}</div>
                    <button class="power-delete-btn" data-id="${o.id}">✖</button>
                </div>
            `).join('')}
        </div>
    `;
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


function refreshPanel() {

    if (!currentItemId) return;

    fetch(`/rack-items/${currentItemId}/disks`)
        .then(res => res.json())
        .then(updated => {
            renderItemPanel(updated);
            itemPanel.classList.add("open");
            backdrop.classList.add("active");
        });
}


function closePanel() {
    itemPanel.classList.remove("open");
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

    fetch(`/rack-items/${currentItemId}/disks/reorder`, {
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

itemPanel.addEventListener("click", function (e) {

    // CLOSE PANEL
    if (e.target.id === "closePanelBtn") {
        closePanel();
        return;
    }

    // ACCORDION
    const accordionHeader = e.target.closest(".toggle-accordion");
    if (accordionHeader) {
        const body = accordionHeader.nextElementSibling;
        if (body) body.classList.toggle("collapsed");
        return;
    }

    // DELETE DISK
    if (e.target.classList.contains("disk-delete-btn")) {
        const diskId = e.target.dataset.id;
        if (!confirm("Delete this disk?")) return;

        fetch(`/rack-items/disks/${diskId}`, { method: "DELETE" })
            .then(res => res.json())
            .then(() => refreshPanel());
        return;
    }

    // SAVE DISK
    if (e.target.classList.contains("disk-save-btn")) {
        const diskBlock = e.target.closest(".disk-block");

        const rawGroup = diskBlock.querySelector('input[name="pci_group"]').value;

        const payload = {
            slot_id: diskBlock.querySelector('input[name="slot_id"]').value,
            pci_group: rawGroup !== "" ? parseInt(rawGroup) : null,
            brand: diskBlock.querySelector('input[name="brand"]').value,
            name: diskBlock.querySelector('input[name="name"]').value,
            serial: diskBlock.querySelector('input[name="serial"]').value
        };

        fetch(`/rack-items/disks/${diskBlock.dataset.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        })
            .then(res => res.json())
            .then(() => refreshPanel());
        return;
    }

    // INLINE EDIT
    const diskBlock = e.target.closest(".disk-block");
    if (diskBlock && e.target.closest(".disk-view")) {
        diskBlock.classList.toggle("editing");
        return;
    }

});

itemPanel.addEventListener("submit", function (e) {

    const form = e.target;

    if (form.classList.contains("add-disk-form")) {
        handleDiskSubmit(e, form);
        return;
    }

    if (form.classList.contains("add-port-form")) {
        handlePortSubmit(e, form);
        return;
    }


    if (form.classList.contains("add-power-input-form")) {
        handlePowerInputSubmit(e, form);
    }

    if (form.classList.contains("add-power-outlet-form")) {
        handlePowerOutletSubmit(e, form);
    }
});

