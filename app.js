const STORAGE_KEY = "observed-crm-erp-v4";
const AUTH_KEY = "observed-auth";
const ACCESS_USER = "admin";
const ACCESS_PASS = "1234";

const defaultData = {
  products: [
    {
      id: "hoodie-black",
      name: "Hoodie OBSERVED Black",
      description: "Prenda insignia del drop principal. Ideal para el look completo de la marca.",
      image: "img/hoodie-black.png",
      sizes: ["S", "M", "L", "XL"],
      price: 139.90,
      cost: 78.00,
      stock: 20,
      active: true,
      tag: "Top seller"
    },
    {
      id: "hoodie-white",
      name: "Hoodie OBSERVED White",
      description: "Versión blanca del drop con una presencia visual limpia y fuerte.",
      image: "img/hoodie-white.png",
      sizes: ["S", "M", "L", "XL"],
      price: 139.90,
      cost: 78.00,
      stock: 18,
      active: true,
      tag: "Trending"
    },
    {
      id: "polo-oversized",
      name: "Polo Oversized OBSERVED",
      description: "Básico fuerte para atraer clientes nuevos sin bajar la imagen de la marca.",
      image: "img/polo-oversized.png",
      sizes: ["S", "M", "L", "XL"],
      price: 64.90,
      cost: 33.00,
      stock: 34,
      active: true,
      tag: "Streetwear"
    },
    {
      id: "gorra",
      name: "Gorra OBSERVED",
      description: "Accesorio clave para completar el estilo de la marca y elevar el outfit.",
      image: "img/gorra.png",
      sizes: ["Ú", "Fit"],
      price: 59.90,
      cost: 29.00,
      stock: 12,
      active: true,
      tag: "Essential"
    }
  ],
  clients: [],
  leads: [],
  orders: [],
  receipts: [],
  expenses: [],
  tasks: [],
  counters: {
    client: 1,
    lead: 1,
    order: 201,
    receipt: 1,
    task: 1,
    product: 100
  }
};

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function getData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) return JSON.parse(raw);
  const initial = deepClone(defaultData);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
  return initial;
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function soles(value) {
  return "S/ " + Number(value).toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function dateNow() {
  const d = new Date();
  return d.toLocaleDateString("es-PE") + " " + d.toLocaleTimeString("es-PE", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function getStatus(stock) {
  if (stock <= 0) return { text: "Agotado", cls: "red", buyText: "Agotado" };
  if (stock <= 12) return { text: "Stock bajo", cls: "orange", buyText: "Comprar" };
  if (stock <= 18) return { text: "Medio", cls: "blue", buyText: "Comprar" };
  return { text: "Disponible", cls: "green", buyText: "Comprar" };
}

function calcMargin(product) {
  if (!product.price) return 0;
  return ((product.price - product.cost) / product.price) * 100;
}

function badgeClassForLead(stage) {
  if (stage === "Nuevo") return "white";
  if (stage === "Contactado") return "blue";
  if (stage === "Negociación") return "orange";
  if (stage === "Ganado") return "green";
  return "white";
}

function badgeClassForOrder(status) {
  if (status === "Preparando") return "blue";
  if (status === "Pagado") return "green";
  if (status === "Enviado") return "orange";
  if (status === "Entregado") return "purple";
  return "white";
}

function getClientById(data, id) {
  return data.clients.find(c => Number(c.id) === Number(id));
}

function getProductById(data, id) {
  return data.products.find(p => p.id === id);
}

function getTotals(data) {
  const income = data.orders.reduce((acc, o) => acc + Number(o.total), 0);
  const expenses = data.expenses.reduce((acc, e) => acc + Number(e.amount), 0);
  const costTotal = data.orders.reduce((acc, o) => {
    const product = getProductById(data, o.productId);
    if (!product) return acc;
    return acc + Number(product.cost) * Number(o.qty);
  }, 0);
  const gain = income - expenses - costTotal;
  const stock = data.products.reduce((acc, p) => acc + Number(p.stock), 0);
  const leadsOpen = data.leads.filter(l => l.stage !== "Ganado").length;
  return { income, expenses, gain, stock, leadsOpen };
}

function safeEncode(text) {
  return encodeURIComponent(text);
}

/* STORE */
function renderStore() {
  const page = document.body.dataset.page;
  if (page !== "store") return;

  const data = getData();
  const container = document.getElementById("storeCatalog");
  const empty = document.getElementById("storeEmpty");
  const search = document.getElementById("storeSearch");
  const term = search ? search.value.trim().toLowerCase() : "";

  const visibleProducts = data.products.filter(p => p.active);
  const filtered = visibleProducts.filter(p =>
    p.name.toLowerCase().includes(term) ||
    p.description.toLowerCase().includes(term)
  );

  container.innerHTML = "";

  if (!filtered.length) {
    empty.classList.remove("hidden");
    return;
  }

  empty.classList.add("hidden");

  filtered.forEach(product => {
    const status = getStatus(product.stock);
    const waText = `Hola, quiero ${product.name}. ¿Está disponible?`;
    const tags = [
      product.tag || "Producto",
      status.text
    ];

    const article = document.createElement("article");
    article.className = "product";
    article.innerHTML = `
      <div class="product-image">
        <img src="${product.image}" alt="${product.name}">
        <div class="product-tags">
          ${tags.map((tag, i) => `<span class="badge ${i === 0 ? "white" : status.cls}">${tag}</span>`).join("")}
        </div>
      </div>
      <div class="product-body">
        <h4>${product.name}</h4>
        <p>${product.description}</p>

        <div class="sizes">
          ${product.sizes.map(size => `<div class="size">${size}</div>`).join("")}
        </div>

        <div class="product-bottom">
          <div class="price">${soles(product.price)}</div>
          ${
            product.stock <= 0
              ? `<span class="badge red">Agotado</span>`
              : `<a class="btn btn-primary btn-sm" href="https://wa.me/51936998349?text=${safeEncode(waText)}" target="_blank">Comprar</a>`
          }
        </div>
      </div>
    `;
    container.appendChild(article);
  });
}

function setupStoreEvents() {
  const search = document.getElementById("storeSearch");
  if (search) {
    search.addEventListener("input", renderStore);
  }
}

/* ADMIN */
function protectAdmin() {
  if (document.body.dataset.page !== "admin") return;
  const login = document.getElementById("loginScreen");
  if (sessionStorage.getItem(AUTH_KEY) === "ok") {
    login.classList.add("hidden");
  } else {
    login.classList.remove("hidden");
  }
}

function setupLogin() {
  if (document.body.dataset.page !== "admin") return;

  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const loginUser = document.getElementById("loginUser");
  const loginPass = document.getElementById("loginPass");
  const loginError = document.getElementById("loginError");

  function tryLogin() {
    const user = loginUser.value.trim();
    const pass = loginPass.value;

    if (user === ACCESS_USER && pass === ACCESS_PASS) {
      sessionStorage.setItem(AUTH_KEY, "ok");
      document.getElementById("loginScreen").classList.add("hidden");
      loginError.textContent = "";
    } else {
      loginError.textContent = "Usuario o contraseña incorrectos.";
    }
  }

  loginBtn?.addEventListener("click", tryLogin);
  loginUser?.addEventListener("keydown", e => {
    if (e.key === "Enter") tryLogin();
  });
  loginPass?.addEventListener("keydown", e => {
    if (e.key === "Enter") tryLogin();
  });

  logoutBtn?.addEventListener("click", () => {
    sessionStorage.removeItem(AUTH_KEY);
    document.getElementById("loginScreen").classList.remove("hidden");
    loginPass.value = "";
  });
}

function renderAdminCatalog() {
  const page = document.body.dataset.page;
  if (page !== "admin") return;

  const data = getData();
  const container = document.getElementById("adminCatalog");
  if (!container) return;

  container.innerHTML = "";

  data.products.forEach(product => {
    const status = getStatus(product.stock);
    const card = document.createElement("article");
    card.className = "product";
    card.dataset.search = `${product.name} ${product.description}`.toLowerCase();

    card.innerHTML = `
      <div class="product-image">
        <img src="${product.image}" alt="${product.name}">
        <div class="product-tags">
          <span class="badge white">${product.tag || "Producto"}</span>
          <span class="badge ${product.active ? "green" : "red"}">${product.active ? "Visible" : "Oculto"}</span>
        </div>
      </div>
      <div class="product-body">
        <h4>${product.name}</h4>
        <p>${product.description}</p>

        <div class="sizes">
          ${product.sizes.map(size => `<div class="size">${size}</div>`).join("")}
        </div>

        <div class="product-bottom">
          <div class="price">${soles(product.price)}</div>
          <span class="badge ${status.cls}">${status.text}</span>
        </div>

        <div class="admin-tools">
          <input class="input" id="price-${product.id}" type="number" min="0" step="0.01" value="${product.price}">
          <input class="input" id="stock-${product.id}" type="number" min="0" step="1" value="${product.stock}">
        </div>

        <div class="admin-tools">
          <input class="input" id="cost-${product.id}" type="number" min="0" step="0.01" value="${product.cost}">
          <input class="input" id="tag-${product.id}" type="text" value="${product.tag || ""}">
        </div>

        <div class="admin-actions section-space">
          <button class="btn btn-soft" onclick="updateProduct('${product.id}')">Guardar</button>
          <button class="btn btn-soft" onclick="toggleProductVisibility('${product.id}')">${product.active ? "Ocultar" : "Mostrar"}</button>
          <button class="btn btn-danger" onclick="deleteProduct('${product.id}')">Eliminar</button>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

function addProduct() {
  const data = getData();

  const name = document.getElementById("prodName").value.trim();
  const price = Number(document.getElementById("prodPrice").value);
  const cost = Number(document.getElementById("prodCost").value);
  const stock = Number(document.getElementById("prodStock").value);
  const sizesRaw = document.getElementById("prodSizes").value.trim();
  const tag = document.getElementById("prodTags").value.trim();
  const active = document.getElementById("prodActive").value === "true";
  const image = document.getElementById("prodImage").value;
  const description = document.getElementById("prodDescription").value.trim();

  if (!name || !description || !sizesRaw || price < 0 || cost < 0 || stock < 0 || Number.isNaN(price) || Number.isNaN(cost) || Number.isNaN(stock)) {
    alert("Completa bien todos los datos del producto.");
    return;
  }

  const id = slugify(name) + "-" + data.counters.product++;
  const sizes = sizesRaw.split(",").map(x => x.trim()).filter(Boolean);

  data.products.push({
    id,
    name,
    description,
    image,
    sizes,
    price: Number(price.toFixed(2)),
    cost: Number(cost.toFixed(2)),
    stock: Number(stock),
    active,
    tag: tag || "Nuevo"
  });

  saveData(data);
  clearProductForm();
  refreshAdmin();
}

function clearProductForm() {
  document.getElementById("prodName").value = "";
  document.getElementById("prodPrice").value = "";
  document.getElementById("prodCost").value = "";
  document.getElementById("prodStock").value = "";
  document.getElementById("prodSizes").value = "";
  document.getElementById("prodTags").value = "";
  document.getElementById("prodDescription").value = "";
  document.getElementById("prodActive").value = "true";
  document.getElementById("prodImage").value = "img/hoodie-black.png";
}

window.updateProduct = function(id) {
  const data = getData();
  const product = data.products.find(p => p.id === id);
  if (!product) return;

  const price = Number(document.getElementById(`price-${id}`).value);
  const stock = Number(document.getElementById(`stock-${id}`).value);
  const cost = Number(document.getElementById(`cost-${id}`).value);
  const tag = document.getElementById(`tag-${id}`).value.trim();

  if (Number.isNaN(price) || Number.isNaN(stock) || Number.isNaN(cost) || price < 0 || stock < 0 || cost < 0) {
    alert("Datos inválidos.");
    return;
  }

  product.price = Number(price.toFixed(2));
  product.stock = Number(stock);
  product.cost = Number(cost.toFixed(2));
  product.tag = tag || "Producto";

  saveData(data);
  refreshAdmin();
};

window.toggleProductVisibility = function(id) {
  const data = getData();
  const product = data.products.find(p => p.id === id);
  if (!product) return;
  product.active = !product.active;
  saveData(data);
  refreshAdmin();
};

window.deleteProduct = function(id) {
  const data = getData();
  const used = data.orders.some(order => order.productId === id);
  if (used) {
    alert("No puedes eliminar un producto con pedidos registrados.");
    return;
  }
  data.products = data.products.filter(p => p.id !== id);
  saveData(data);
  refreshAdmin();
};

function renderClients() {
  const data = getData();
  const tbody = document.getElementById("clientsTable");
  if (!tbody) return;

  tbody.innerHTML = "";

  data.clients.forEach(client => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${client.name}</td>
      <td>${client.phone}</td>
      <td><span class="badge ${client.type === "VIP" ? "green" : client.type === "Recurrente" ? "purple" : "blue"}">${client.type}</span></td>
      <td><span class="badge ${client.active === false ? "red" : "green"}">${client.active === false ? "Inactivo" : "Activo"}</span></td>
      <td>${soles(client.total || 0)}</td>
      <td>
        <button class="btn btn-soft btn-sm" onclick="toggleClient('${client.id}')">${client.active === false ? "Activar" : "Desactivar"}</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function addClient() {
  const data = getData();
  const name = document.getElementById("clientName").value.trim();
  const phone = document.getElementById("clientPhone").value.trim();
  const email = document.getElementById("clientEmail").value.trim();
  const type = document.getElementById("clientType").value;

  if (!name || !phone) {
    alert("Completa nombre y teléfono.");
    return;
  }

  data.clients.push({
    id: String(data.counters.client++),
    name,
    phone,
    email,
    type,
    total: 0,
    active: true
  });

  saveData(data);
  document.getElementById("clientName").value = "";
  document.getElementById("clientPhone").value = "";
  document.getElementById("clientEmail").value = "";
  document.getElementById("clientType").value = "Nuevo";
  refreshAdmin();
}

window.toggleClient = function(id) {
  const data = getData();
  const client = data.clients.find(c => String(c.id) === String(id));
  if (!client) return;
  client.active = client.active === false ? true : false;
  saveData(data);
  refreshAdmin();
};

function renderLeads() {
  const data = getData();
  const tbody = document.getElementById("leadsTable");
  if (!tbody) return;
  tbody.innerHTML = "";

  data.leads.forEach(lead => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${lead.name}</td>
      <td>${lead.phone}</td>
      <td>${lead.source}</td>
      <td><span class="badge ${badgeClassForLead(lead.stage)}">${lead.stage}</span></td>
      <td>
        <div class="admin-actions">
          <button class="btn btn-soft btn-sm" onclick="advanceLead('${lead.id}')">Avanzar</button>
          <button class="btn btn-soft btn-sm" onclick="convertLead('${lead.id}')">Convertir</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function addLead() {
  const data = getData();
  const name = document.getElementById("leadName").value.trim();
  const phone = document.getElementById("leadPhone").value.trim();
  const source = document.getElementById("leadSource").value;
  const stage = document.getElementById("leadStage").value;

  if (!name || !phone) {
    alert("Completa nombre y teléfono del lead.");
    return;
  }

  data.leads.push({
    id: String(data.counters.lead++),
    name,
    phone,
    source,
    stage
  });

  saveData(data);
  document.getElementById("leadName").value = "";
  document.getElementById("leadPhone").value = "";
  document.getElementById("leadSource").value = "WhatsApp";
  document.getElementById("leadStage").value = "Nuevo";
  refreshAdmin();
}

window.advanceLead = function(id) {
  const data = getData();
  const lead = data.leads.find(l => String(l.id) === String(id));
  if (!lead) return;

  const stages = ["Nuevo", "Contactado", "Negociación", "Ganado"];
  const index = stages.indexOf(lead.stage);
  lead.stage = stages[Math.min(index + 1, stages.length - 1)];

  saveData(data);
  refreshAdmin();
};

window.convertLead = function(id) {
  const data = getData();
  const lead = data.leads.find(l => String(l.id) === String(id));
  if (!lead) return;

  const exists = data.clients.some(client => client.phone === lead.phone);
  if (!exists) {
    data.clients.push({
      id: String(data.counters.client++),
      name: lead.name,
      phone: lead.phone,
      email: "",
      type: "Nuevo",
      total: 0,
      active: true
    });
  }

  lead.stage = "Ganado";
  saveData(data);
  refreshAdmin();
};

function renderOrderSelects() {
  const data = getData();

  const clientSelect = document.getElementById("orderClient");
  const productSelect = document.getElementById("orderProduct");

  if (!clientSelect || !productSelect) return;

  const activeClients = data.clients.filter(c => c.active !== false);
  clientSelect.innerHTML = activeClients.length
    ? activeClients.map(c => `<option value="${c.id}">${c.name}</option>`).join("")
    : `<option value="">No hay clientes</option>`;

  productSelect.innerHTML = data.products.length
    ? data.products.map(p => `<option value="${p.id}">${p.name} • ${soles(p.price)} • stock ${p.stock}</option>`).join("")
    : `<option value="">No hay productos</option>`;
}

function addOrder() {
  const data = getData();

  const clientId = document.getElementById("orderClient").value;
  const productId = document.getElementById("orderProduct").value;
  const qty = Number(document.getElementById("orderQty").value);
  const payment = document.getElementById("orderPayment").value;
  const channel = document.getElementById("orderChannel").value;
  const status = document.getElementById("orderStatus").value;

  const client = getClientById(data, clientId);
  const product = getProductById(data, productId);

  if (!client || !product) {
    alert("Selecciona cliente y producto.");
    return;
  }

  if (!qty || qty < 1) {
    alert("Cantidad inválida.");
    return;
  }

  if (product.stock < qty) {
    alert("No hay suficiente stock.");
    return;
  }

  const total = Number((product.price * qty).toFixed(2));
  const orderId = "OB-" + data.counters.order++;
  const receiptId = "B-" + String(data.counters.receipt++).padStart(4, "0");

  data.orders.push({
    id: orderId,
    clientId: client.id,
    clientName: client.name,
    productId: product.id,
    productName: product.name,
    qty,
    total,
    payment,
    channel,
    status
  });

  data.receipts.push({
    id: receiptId,
    orderId,
    clientName: client.name,
    total,
    date: dateNow()
  });

  product.stock -= qty;
  client.total = Number((Number(client.total || 0) + total).toFixed(2));

  if (client.total >= 300) {
    client.type = "VIP";
  } else if (client.total >= 150 && client.type === "Nuevo") {
    client.type = "Recurrente";
  }

  const lead = data.leads.find(l => l.phone === client.phone && l.stage !== "Ganado");
  if (lead) lead.stage = "Ganado";

  saveData(data);
  document.getElementById("orderQty").value = 1;
  refreshAdmin();
}

function renderOrders() {
  const data = getData();
  const tbody = document.getElementById("ordersTable");
  if (!tbody) return;

  tbody.innerHTML = "";

  [...data.orders].reverse().forEach(order => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${order.id}</td>
      <td>${order.clientName}</td>
      <td>${order.productName}</td>
      <td>${order.qty}</td>
      <td>${soles(order.total)}</td>
      <td>${order.payment}</td>
      <td><span class="badge ${badgeClassForOrder(order.status)}">${order.status}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

function renderReceipts() {
  const data = getData();
  const tbody = document.getElementById("receiptsTable");
  if (!tbody) return;
  tbody.innerHTML = "";

  [...data.receipts].reverse().forEach(receipt => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${receipt.id}</td>
      <td>${receipt.clientName}</td>
      <td>${soles(receipt.total)}</td>
      <td>${receipt.date}</td>
    `;
    tbody.appendChild(tr);
  });
}

function addExpense() {
  const data = getData();
  const concept = document.getElementById("expenseConcept").value.trim();
  const amount = Number(document.getElementById("expenseAmount").value);

  if (!concept || !amount || amount <= 0) {
    alert("Ingresa concepto y monto válido.");
    return;
  }

  data.expenses.push({
    concept,
    amount: Number(amount.toFixed(2))
  });

  saveData(data);
  document.getElementById("expenseConcept").value = "";
  document.getElementById("expenseAmount").value = "";
  refreshAdmin();
}

function addTask() {
  const data = getData();
  const text = document.getElementById("taskText").value.trim();

  if (!text) {
    alert("Escribe una tarea.");
    return;
  }

  data.tasks.push({
    id: String(data.counters.task++),
    text,
    done: false
  });

  saveData(data);
  document.getElementById("taskText").value = "";
  refreshAdmin();
}

function renderTasks() {
  const data = getData();
  const list = document.getElementById("taskList");
  if (!list) return;
  list.innerHTML = "";

  data.tasks.forEach(task => {
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `
      <div class="left">
        <div class="avatar">${task.done ? "✔" : "📝"}</div>
        <div class="info">
          <h4 style="${task.done ? "text-decoration:line-through;opacity:.7;" : ""}">${task.text}</h4>
          <p>${task.done ? "Completada" : "Pendiente"}</p>
        </div>
      </div>
      <div class="admin-actions">
        <button class="btn btn-soft btn-sm" onclick="toggleTask('${task.id}')">${task.done ? "Reabrir" : "Completar"}</button>
        <button class="btn btn-danger btn-sm" onclick="deleteTask('${task.id}')">Eliminar</button>
      </div>
    `;
    list.appendChild(div);
  });
}

window.toggleTask = function(id) {
  const data = getData();
  const task = data.tasks.find(t => String(t.id) === String(id));
  if (!task) return;
  task.done = !task.done;
  saveData(data);
  refreshAdmin();
};

window.deleteTask = function(id) {
  const data = getData();
  data.tasks = data.tasks.filter(t => String(t.id) !== String(id));
  saveData(data);
  refreshAdmin();
};

function renderInsights() {
  const data = getData();
  const list = document.getElementById("insightsList");
  if (!list) return;

  list.innerHTML = "";

  const totals = getTotals(data);

  const topProduct = [...data.products].sort((a, b) => {
    const sumA = data.orders.filter(o => o.productId === a.id).reduce((acc, o) => acc + o.total, 0);
    const sumB = data.orders.filter(o => o.productId === b.id).reduce((acc, o) => acc + o.total, 0);
    return sumB - sumA;
  })[0];

  const lowStock = data.products.filter(p => p.stock <= 12);
  const topClient = [...data.clients].sort((a, b) => (b.total || 0) - (a.total || 0))[0];
  const avgTicket = data.orders.length ? totals.income / data.orders.length : 0;

  const insights = [
    {
      icon: "🔥",
      title: topProduct ? `Producto más fuerte: ${topProduct.name}` : "Aún no hay producto top",
      text: topProduct ? `Buen candidato para promocionar más. Precio actual: ${soles(topProduct.price)}.` : "Registra pedidos para ver análisis."
    },
    {
      icon: "⚠️",
      title: lowStock.length ? `${lowStock.length} producto(s) con stock bajo` : "Stock estable",
      text: lowStock.length ? "Conviene reponer o usar urgencia visual en tienda." : "No hay alertas críticas de inventario."
    },
    {
      icon: "👑",
      title: topClient ? `Cliente top: ${topClient.name}` : "Aún no hay cliente top",
      text: topClient ? `Ha gastado ${soles(topClient.total || 0)}. Puedes ofrecerle combo o preventa.` : "Cuando registres pedidos aparecerá aquí."
    },
    {
      icon: "📊",
      title: `Ticket promedio: ${soles(avgTicket)}`,
      text: "Úsalo para medir si tus combos realmente elevan el valor por compra."
    }
  ];

  insights.forEach(item => {
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `
      <div class="left">
        <div class="avatar">${item.icon}</div>
        <div class="info">
          <h4>${item.title}</h4>
          <p>${item.text}</p>
        </div>
      </div>
    `;
    list.appendChild(div);
  });
}

function renderSummary() {
  const data = getData();
  const totals = getTotals(data);

  const kpiVentas = document.getElementById("kpiVentas");
  const kpiGanancia = document.getElementById("kpiGanancia");
  const kpiPedidos = document.getElementById("kpiPedidos");
  const kpiClientes = document.getElementById("kpiClientes");
  const kpiLeads = document.getElementById("kpiLeads");
  const kpiStock = document.getElementById("kpiStock");
  const cashIncome = document.getElementById("cashIncome");
  const cashExpenses = document.getElementById("cashExpenses");
  const cashBalance = document.getElementById("cashBalance");
  const topSummary = document.getElementById("topSummary");

  if (!kpiVentas) return;

  kpiVentas.textContent = soles(totals.income);
  kpiGanancia.textContent = soles(totals.gain);
  kpiPedidos.textContent = data.orders.length;
  kpiClientes.textContent = data.clients.length;
  kpiLeads.textContent = totals.leadsOpen;
  kpiStock.textContent = totals.stock;

  cashIncome.textContent = soles(totals.income);
  cashExpenses.textContent = soles(totals.expenses);
  cashBalance.textContent = soles(totals.income - totals.expenses);

  topSummary.innerHTML = `
    Panel activo. <strong>${data.products.length}</strong> productos,
    <strong>${data.clients.length}</strong> clientes,
    <strong>${data.orders.length}</strong> pedidos
    y <strong>${soles(totals.income)}</strong> en ventas.
  `;
}

let salesChart;
let leadChart;

function renderCharts() {
  if (document.body.dataset.page !== "admin") return;
  if (typeof Chart === "undefined") return;

  const data = getData();

  const salesCanvas = document.getElementById("salesChart");
  const leadCanvas = document.getElementById("leadChart");
  if (!salesCanvas || !leadCanvas) return;

  const labels = data.products.map(p => p.name);
  const sales = data.products.map(p => {
    return data.orders
      .filter(o => o.productId === p.id)
      .reduce((acc, o) => acc + Number(o.total), 0);
  });

  const stages = ["Nuevo", "Contactado", "Negociación", "Ganado"];
  const stageCounts = stages.map(stage => data.leads.filter(l => l.stage === stage).length);

  if (salesChart) salesChart.destroy();
  if (leadChart) leadChart.destroy();

  salesChart = new Chart(salesCanvas, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Ventas",
        data: sales,
        backgroundColor: ["#b6ff00", "#47d7ff", "#8f7cff", "#ffb84d", "#ff6b6b"],
        borderRadius: 10
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: "#e5e5e5" } }
      },
      scales: {
        x: {
          ticks: { color: "#a3a3a3" },
          grid: { color: "rgba(255,255,255,.05)" }
        },
        y: {
          ticks: {
            color: "#a3a3a3",
            callback: value => "S/ " + value
          },
          grid: { color: "rgba(255,255,255,.05)" }
        }
      }
    }
  });

  leadChart = new Chart(leadCanvas, {
    type: "doughnut",
    data: {
      labels: stages,
      datasets: [{
        data: stageCounts,
        backgroundColor: ["#ffffff55", "#47d7ff", "#ffb84d", "#b6ff00"],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "66%",
      plugins: {
        legend: {
          position: "bottom",
          labels: { color: "#e5e5e5", padding: 16 }
        }
      }
    }
  });
}

function setupGlobalSearch() {
  const input = document.getElementById("globalSearch");
  if (!input) return;

  input.addEventListener("input", () => {
    const term = input.value.trim().toLowerCase();

    document.querySelectorAll("tbody tr").forEach(row => {
      row.style.display = row.textContent.toLowerCase().includes(term) ? "" : "none";
    });

    document.querySelectorAll("#adminCatalog .product").forEach(card => {
      card.style.display = card.dataset.search.includes(term) ? "" : "none";
    });
  });
}

function resetData() {
  if (!confirm("¿Seguro que quieres resetear todos los datos?")) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(deepClone(defaultData)));
  refreshAdmin();
  renderStore();
}

function setupAdminEvents() {
  if (document.body.dataset.page !== "admin") return;

  document.getElementById("addProductBtn")?.addEventListener("click", addProduct);
  document.getElementById("addClientBtn")?.addEventListener("click", addClient);
  document.getElementById("addLeadBtn")?.addEventListener("click", addLead);
  document.getElementById("addOrderBtn")?.addEventListener("click", addOrder);
  document.getElementById("addExpenseBtn")?.addEventListener("click", addExpense);
  document.getElementById("addTaskBtn")?.addEventListener("click", addTask);
  document.getElementById("resetDataBtn")?.addEventListener("click", resetData);
}

function refreshAdmin() {
  if (document.body.dataset.page !== "admin") return;
  renderAdminCatalog();
  renderClients();
  renderLeads();
  renderOrderSelects();
  renderOrders();
  renderReceipts();
  renderTasks();
  renderInsights();
  renderSummary();
  renderCharts();
}

document.addEventListener("DOMContentLoaded", () => {
  protectAdmin();
  setupLogin();
  setupStoreEvents();
  setupAdminEvents();
  setupGlobalSearch();
  renderStore();
  refreshAdmin();
});