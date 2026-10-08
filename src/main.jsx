import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Boxes,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Package,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShoppingCart,
  Sun,
  Truck,
  UserRound,
  Users,
  Warehouse,
  X,
  Zap
} from "lucide-react";

import "./styles.css";

const API = "http://localhost:8081/api";

const tokenKey = "supplyflow_token";
const userKey = "supplyflow_user";

/* =========================================================
   API HELPER
========================================================= */

async function api(path, options = {}) {
  const token = sessionStorage.getItem(tokenKey);

  const headers = {
    ...(options.headers || {})
  };

  if (options.body) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API}${path}`, {
    ...options,
    headers
  });

  if (res.status === 204) {
    return null;
  }

  const text = await res.text();

  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    throw new Error(
      data?.message ||
      data?.error ||
      `Request failed (${res.status})`
    );
  }

  return data;
}

/* =========================================================
   SERVICES
========================================================= */

const services = {
  categories: {
    path: "/categories",
    label: "Categories",
    icon: Boxes
  },

  products: {
    path: "/products",
    label: "Products",
    icon: Package
  },

  warehouses: {
    path: "/warehouses",
    label: "Warehouses",
    icon: Warehouse
  },

  suppliers: {
    path: "/suppliers",
    label: "Suppliers",
    icon: Users
  },

  inventory: {
    path: "/inventory",
    label: "Inventory",
    icon: Boxes
  },

  orders: {
    path: "/orders",
    label: "Orders",
    icon: ShoppingCart
  },

  "purchase-orders": {
    path: "/purchase-orders",
    label: "Purchase Orders",
    icon: ClipboardList
  },

  shipments: {
    path: "/shipments",
    label: "Shipments",
    icon: Truck
  },

  "stock-movements": {
    path: "/stock-movements",
    label: "Stock Movements",
    icon: Activity
  }
};

/* =========================================================
   NAVIGATION
========================================================= */

const nav = [
  ["dashboard", "Overview", LayoutDashboard],
  ["inventory", "Inventory", Boxes],
  ["products", "Products", Package],
  ["orders", "Orders", ShoppingCart],
  ["purchase-orders", "Purchase Orders", ClipboardList],
  ["shipments", "Shipments", Truck],
  ["warehouses", "Warehouses", Warehouse],
  ["suppliers", "Suppliers", Users],
  ["stock-movements", "Stock Movements", Activity]
];

/* =========================================================
   HASH ROUTING
========================================================= */

function useHash() {
  const [page, setPage] = useState(
    window.location.hash.replace("#/", "") || "dashboard"
  );

  useEffect(() => {
    const fn = () => {
      setPage(
        window.location.hash.replace("#/", "") || "dashboard"
      );
    };

    window.addEventListener("hashchange", fn);

    return () => {
      window.removeEventListener("hashchange", fn);
    };
  }, []);

  return [
    page,
    (p) => {
      window.location.hash = `/${p}`;
    }
  ];
}

/* =========================================================
   LOGIN
========================================================= */

function Login({ onLogin }) {
  const [username, setUsername] = useState("productuser");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();

    setBusy(true);
    setError("");

    try {
      const data = await api("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          username,
          password
        })
      });

      const token =
        data?.token ||
        data?.jwt ||
        data?.accessToken;

      if (!token) {
        throw new Error(
          "Login succeeded but no JWT token was returned."
        );
      }

      sessionStorage.setItem(tokenKey, token);

      sessionStorage.setItem(
        userKey,
        JSON.stringify({ username })
      );

      onLogin();

    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-shell">

      <div className="login-glow glow-a" />
      <div className="login-glow glow-b" />

      <div className="login-card">

        <div className="brand-mark">
          <Zap size={22} />
        </div>

        <div className="eyebrow">
          SUPPLYFLOW PRO
        </div>

        <h1>
          Control your supply chain.
        </h1>

        <p className="muted">
          One command center for inventory,
          procurement, orders and logistics.
        </p>

        <form onSubmit={submit}>

          <label>
            Username

            <input
              value={username}
              onChange={(e) =>
                setUsername(e.target.value)
              }
              placeholder="username"
            />
          </label>

          <label>
            Password

            <input
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              placeholder="••••••••"
            />
          </label>

          {error && (
            <div className="error-box">
              {error}
            </div>
          )}

          <button
            className="primary full"
            disabled={busy}
          >
            {busy ? "Signing in…" : "Sign in"}

            <ArrowUpRight size={17} />
          </button>

        </form>

        <div className="login-foot">

          <span>
            <CheckCircle2 size={15} />
            Secure JWT access
          </span>

          <span>
            <Activity size={15} />
            Live API
          </span>

        </div>

      </div>

    </div>
  );
}

/* =========================================================
   APP
========================================================= */

function App() {
  const [authed, setAuthed] = useState(
    !!sessionStorage.getItem(tokenKey)
  );

  if (!authed) {
    return (
      <Login
        onLogin={() => setAuthed(true)}
      />
    );
  }

  return (
    <Shell
      onLogout={() => {
        sessionStorage.clear();
        setAuthed(false);
      }}
    />
  );
}

/* =========================================================
   SHELL
========================================================= */

function Shell({ onLogout }) {
  const [page, setPage] = useHash();

  const [collapsed, setCollapsed] =
    useState(false);

  const [dark, setDark] =
    useState(
      localStorage.theme !== "light"
    );

  const [toast, setToast] =
    useState(null);

  /*
   * FIXED REACT WARNING
   *
   * The previous version returned the value
   * of the assignment expression.
   */
  useEffect(() => {
    document.documentElement.dataset.theme =
      dark ? "dark" : "light";

    localStorage.theme =
      dark ? "dark" : "light";
  }, [dark]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(
        () => setToast(null),
        3500
      );

      return () => clearTimeout(timer);
    }
  }, [toast]);

  const title =
    nav.find((x) => x[0] === page)?.[1] ||
    "Overview";

  return (
    <div
      className={`app ${
        collapsed ? "collapsed" : ""
      }`}
    >

      <aside className="sidebar">

        <div className="brand">

          <div className="brand-mark small">
            <Zap size={18} />
          </div>

          <span>
            SupplyFlow
          </span>

        </div>

        <div className="side-label">
          WORKSPACE
        </div>

        <nav>

          {nav.map(
            ([id, label, Icon]) => (
              <a
                key={id}
                className={
                  page === id
                    ? "active"
                    : ""
                }
                href={`#/${id}`}
              >
                <Icon size={18} />

                <span>
                  {label}
                </span>
              </a>
            )
          )}

        </nav>

        <div className="sidebar-bottom">

          <div className="side-label">
            SYSTEM
          </div>

          <a href="#/settings">

            <Settings size={18} />

            <span>
              Settings
            </span>

          </a>

          <button
            className="logout-link"
            onClick={onLogout}
          >

            <LogOut size={18} />

            <span>
              Sign out
            </span>

          </button>

        </div>

      </aside>

      <main className="main">

        <header className="topbar">

          <button
            className="icon-btn mobile-menu"
            onClick={() =>
              setCollapsed(!collapsed)
            }
          >
            <Menu />
          </button>

          <div>

            <div className="breadcrumb">
              Workspace /{" "}
              <b>{title}</b>
            </div>

            <h2>
              {title}
            </h2>

          </div>

          <div className="top-actions">

            <button
              className="icon-btn"
              onClick={() =>
                setDark(!dark)
              }
            >
              {dark ? (
                <Sun size={19} />
              ) : (
                <Moon size={19} />
              )}
            </button>

            <div className="avatar">
              <UserRound size={17} />
            </div>

          </div>

        </header>

        <section className="content">

          <Page
            page={page}
            toast={setToast}
          />

        </section>

      </main>

      {toast && (
        <div className="toast">

          <CheckCircle2 size={18} />

          {toast}

        </div>
      )}

    </div>
  );
}

/* =========================================================
   PAGE ROUTER
========================================================= */

function Page({ page, toast }) {

  if (page === "dashboard") {
    return (
      <Dashboard
        toast={toast}
      />
    );
  }

  if (page === "settings") {
    return <SettingsPage />;
  }

  const service =
    services[page] ||
    services.inventory;

  return (
    <CrudPage
      type={page}
      service={service}
      toast={toast}
    />
  );
}

/* =========================================================
   DASHBOARD
========================================================= */

function Dashboard({ toast }) {
  const [data, setData] =
    useState({});

  const [loading, setLoading] =
    useState(true);

  async function load() {

    setLoading(true);

    const entries =
      await Promise.all(
        Object.entries(services).map(
          async ([key, service]) => {

            try {
              return [
                key,
                await api(service.path)
              ];
            } catch {
              return [
                key,
                []
              ];
            }

          }
        )
      );

    setData(
      Object.fromEntries(entries)
    );

    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const count = (key) =>
    Array.isArray(data[key])
      ? data[key].length
      : 0;

  const cards = [
    [
      "Inventory",
      count("inventory"),
      Boxes,
      "accent"
    ],
    [
      "Products",
      count("products"),
      Package,
      "blue"
    ],
    [
      "Orders",
      count("orders"),
      ShoppingCart,
      "purple"
    ],
    [
      "Shipments",
      count("shipments"),
      Truck,
      "orange"
    ]
  ];

  return (
    <div className="animate-in">

      <div className="hero">

        <div>

          <div className="eyebrow">
            OPERATIONS CENTER
          </div>

          <h1>
            Good to see you.
          </h1>

          <p>
            Here’s what’s happening
            across your supply chain today.
          </p>

        </div>

        <button
          className="secondary"
          onClick={load}
        >
          <RefreshCw size={16} />
          Refresh data
        </button>

      </div>

      <div className="stats-grid">

        {cards.map(
          ([name, value, Icon, tone]) => (

            <div
              className="stat-card"
              key={name}
            >

              <div
                className={`stat-icon ${tone}`}
              >
                <Icon size={21} />
              </div>

              <div className="stat-title">
                {name}
              </div>

              <div className="stat-value">
                {loading
                  ? "—"
                  : value}
              </div>

              <div className="stat-foot">
                <ArrowUpRight size={14} />
                Connected to API
              </div>

            </div>

          )
        )}

      </div>

      <div className="grid-2">

        <div className="panel chart-panel">

          <div className="panel-head">

            <div>

              <h3>
                Operational snapshot
              </h3>

              <p>
                Entity distribution across
                the platform
              </p>

            </div>

            <span className="live-dot">
              LIVE
            </span>

          </div>

          <div className="bars">

            {cards.map(
              ([name, value, , tone]) => (

                <div
                  className="bar-row"
                  key={name}
                >

                  <span>
                    {name}
                  </span>

                  <div className="bar">

                    <i
                      className={tone}
                      style={{
                        width: `${Math.max(
                          8,
                          Math.min(
                            100,
                            value * 10 + 18
                          )
                        )}%`
                      }}
                    />

                  </div>

                  <b>
                    {value}
                  </b>

                </div>

              )
            )}

          </div>

        </div>

        <div className="panel">

          <div className="panel-head">

            <div>

              <h3>
                Quick actions
              </h3>

              <p>
                Jump into your daily workflows
              </p>

            </div>

          </div>

          <div className="quick-grid">

            {nav
              .slice(1, 5)
              .map(
                ([id, label, Icon]) => (

                  <a
                    className="quick"
                    href={`#/${id}`}
                    key={id}
                  >

                    <Icon size={19} />

                    <span>
                      {label}
                    </span>

                    <ChevronRight size={16} />

                  </a>

                )
              )}

          </div>

        </div>

      </div>

      <div className="panel activity-panel">

        <div className="panel-head">

          <div>

            <h3>
              System health
            </h3>

            <p>
              Frontend connected to
              Spring Boot on port 8081
            </p>

          </div>

          <span className="health">
            <span />
            Connected
          </span>

        </div>

        <div className="health-grid">

          <Health
            label="Authentication"
            ok
          />

          <Health
            label="REST API"
            ok
          />

          <Health
            label="Database"
            ok
          />

          <Health
            label="JWT"
            ok
          />

        </div>

      </div>

    </div>
  );
}

/* =========================================================
   HEALTH
========================================================= */

function Health({ label, ok }) {

  return (
    <div className="health-item">

      <CheckCircle2 size={18} />

      <span>
        {label}
      </span>

      <b>
        {ok
          ? "Operational"
          : "Issue"}
      </b>

    </div>
  );
}

/* =========================================================
   CRUD PAGE
========================================================= */

function CrudPage({
  type,
  service,
  toast
}) {

  const [rows, setRows] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [query, setQuery] =
    useState("");

  const [modal, setModal] =
    useState(false);

  const [editing, setEditing] =
    useState(null);

  async function load() {

    setLoading(true);
    setError("");

    try {

      const data =
        await api(service.path);

      setRows(
        Array.isArray(data)
          ? data
          : data
            ? [data]
            : []
      );

    } catch (e) {

      setError(e.message);

    } finally {

      setLoading(false);

    }
  }

  useEffect(() => {
    load();
  }, [type]);

  const filtered =
    useMemo(
      () =>
        rows.filter((row) =>
          JSON.stringify(row)
            .toLowerCase()
            .includes(
              query.toLowerCase()
            )
        ),
      [rows, query]
    );

  /* =====================================================
     SAVE
  ===================================================== */

  async function save(form) {

    try {

      const payload =
        buildPayload(type, form);

      const method =
        editing ? "PUT" : "POST";

      const path =
        editing
          ? `${service.path}/${editing.id}`
          : service.path;

      await api(path, {
        method,
        body: JSON.stringify(payload)
      });

      setModal(false);
      setEditing(null);

      toast(
        `${singular(service.label)} ${
          editing
            ? "updated"
            : "created"
        } successfully`
      );

      load();

    } catch (e) {

      toast(
        `Could not save: ${e.message}`
      );

    }
  }

  /* =====================================================
     DELETE
  ===================================================== */

  async function remove(id) {

    if (
      !window.confirm(
        "Delete this record?"
      )
    ) {
      return;
    }

    try {

      await api(
        `${service.path}/${id}`,
        {
          method: "DELETE"
        }
      );

      toast(
        "Record deleted"
      );

      load();

    } catch (e) {

      toast(
        `Delete failed: ${e.message}`
      );

    }
  }

  const columns =
    columnsFor(type);

  const canDelete =
    type !== "stock-movements";

  return (
    <div className="animate-in">

      <div className="page-head">

        <div>

          <div className="eyebrow">
            MANAGEMENT
          </div>

          <h1>
            {service.label}
          </h1>

          <p>
            Manage and monitor your{" "}
            {service.label.toLowerCase()}{" "}
            from one workspace.
          </p>

        </div>

        <button
          className="primary"
          onClick={() => {
            setEditing(null);
            setModal(true);
          }}
        >

          <Plus size={17} />

          Add{" "}
          {singular(service.label)}

        </button>

      </div>

      <div className="toolbar">

        <div className="search">

          <Search size={17} />

          <input
            value={query}
            onChange={(e) =>
              setQuery(e.target.value)
            }
            placeholder={`Search ${service.label.toLowerCase()}…`}
          />

        </div>

        <button
          className="secondary"
          onClick={load}
        >

          <RefreshCw size={16} />

          Refresh

        </button>

      </div>

      <div className="panel table-panel">

        {error ? (

          <div className="error-state">

            <AlertTriangle />

            <h3>
              Could not load data
            </h3>

            <p>
              {error}
            </p>

            <button
              className="secondary"
              onClick={load}
            >
              Try again
            </button>

          </div>

        ) : loading ? (

          <TableSkeleton />

        ) : filtered.length === 0 ? (

          <div className="empty">

            <Package size={34} />

            <h3>
              No records found
            </h3>

            <p>
              Create your first{" "}
              {singular(
                service.label
              ).toLowerCase()}{" "}
              or adjust your search.
            </p>

            <button
              className="primary"
              onClick={() => {
                setEditing(null);
                setModal(true);
              }}
            >

              <Plus size={16} />

              Add record

            </button>

          </div>

        ) : (

          <div className="table-wrap">

            <table>

              <thead>

                <tr>

                  {columns.map(
                    (column) => (
                      <th
                        key={column.key}
                      >
                        {column.label}
                      </th>
                    )
                  )}

                  <th>
                    Actions
                  </th>

                </tr>

              </thead>

              <tbody>

                {filtered.map(
                  (row, index) => (

                    <tr
                      key={
                        row.id ||
                        index
                      }
                    >

                      {columns.map(
                        (column) => (

                          <td
                            key={
                              column.key
                            }
                          >
                            {renderValue(
                              row,
                              column.key
                            )}
                          </td>

                        )
                      )}

                      <td>

                        <div className="row-actions">

                          <button
                            className="tiny"
                            onClick={() => {
                              setEditing(row);
                              setModal(true);
                            }}
                          >
                            Edit
                          </button>

                          {canDelete && (
                            <button
                              className="tiny danger"
                              onClick={() =>
                                remove(row.id)
                              }
                            >
                              Delete
                            </button>
                          )}

                        </div>

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        )}

      </div>

      {modal && (

        <FormModal
          type={type}
          item={editing}
          onClose={() => {
            setModal(false);
            setEditing(null);
          }}
          onSave={save}
        />

      )}

    </div>
  );
}

/* =========================================================
   BUILD BACKEND PAYLOAD
========================================================= */

function buildPayload(type, form) {

  /* -------------------------------------------------------
     PRODUCT

     Backend expects:

     {
       ...
       "category": {
          "id": 1
       }
     }
  ------------------------------------------------------- */

  if (type === "products") {

    return {
      sku: form.sku,
      name: form.name,
      description: form.description,
      category: {
        id: Number(form.categoryId)
      },
      unitPrice: Number(form.unitPrice),
      reorderLevel: Number(form.reorderLevel),
      active: Boolean(form.active)
    };
  }

  /* -------------------------------------------------------
     CATEGORY
  ------------------------------------------------------- */

  if (type === "categories") {

    return {
      name: form.name,
      description: form.description,
      active: Boolean(form.active)
    };
  }

  /* -------------------------------------------------------
     WAREHOUSE
  ------------------------------------------------------- */

  if (type === "warehouses") {

    return {
      name: form.name,
      location: form.location,
      managerName: form.managerName,
      capacity: Number(form.capacity),
      active: Boolean(form.active)
    };
  }

  /* -------------------------------------------------------
     SUPPLIER
  ------------------------------------------------------- */

  if (type === "suppliers") {

    return {
      name: form.name,
      contactPerson: form.contactPerson,
      email: form.email,
      phone: form.phone,
      address: form.address,
      active: Boolean(form.active)
    };
  }

  /* -------------------------------------------------------
     INVENTORY
  ------------------------------------------------------- */

  if (type === "inventory") {

    return {
      product: {
        id: Number(form.productId)
      },

      warehouse: {
        id: Number(form.warehouseId)
      },

      quantity: Number(form.quantity),

      reservedQuantity:
        Number(form.reservedQuantity)
    };
  }

  /* -------------------------------------------------------
     ORDER
  ------------------------------------------------------- */

  if (type === "orders") {

    return {
      orderNumber: form.orderNumber,
      customerName: form.customerName,
      customerEmail: form.customerEmail,
      customerPhone: form.customerPhone,

      warehouse: {
        id: Number(form.warehouseId)
      },

      status: form.status,
      orderDate: form.orderDate,
      totalAmount: Number(form.totalAmount)
    };
  }

  /* -------------------------------------------------------
     PURCHASE ORDER
  ------------------------------------------------------- */

  if (type === "purchase-orders") {

    return {
      poNumber: form.poNumber,

      supplier: {
        id: Number(form.supplierId)
      },

      warehouse: {
        id: Number(form.warehouseId)
      },

      status: form.status,
      orderDate: form.orderDate,
      expectedDate: form.expectedDate,
      totalAmount: Number(form.totalAmount)
    };
  }

  /* -------------------------------------------------------
     SHIPMENT
  ------------------------------------------------------- */

  if (type === "shipments") {

    return {
      shipmentNumber: form.shipmentNumber,

      order: {
        id: Number(form.orderId)
      },

      status: form.status,
      carrierName: form.carrierName,
      trackingNumber: form.trackingNumber,
      shippingAddress: form.shippingAddress
    };
  }

  /* -------------------------------------------------------
     STOCK MOVEMENT
  ------------------------------------------------------- */

  if (type === "stock-movements") {

    return {
      product: {
        id: Number(form.productId)
      },

      warehouse: {
        id: Number(form.warehouseId)
      },

      movementType: form.movementType,

      quantity: Number(form.quantity),

      referenceType:
        form.referenceType,

      referenceId:
        form.referenceId
          ? Number(form.referenceId)
          : null,

      notes: form.notes
    };
  }

  return {
    ...form
  };
}

/* =========================================================
   SINGULAR
========================================================= */

function singular(value) {

  const special = {
    Categories: "Category",
    Products: "Product",
    Warehouses: "Warehouse",
    Suppliers: "Supplier",
    Inventory: "Inventory",
    Orders: "Order",
    "Purchase Orders":
      "Purchase Order",
    Shipments: "Shipment",
    "Stock Movements":
      "Stock Movement"
  };

  return (
    special[value] ||
    value
  );
}

/* =========================================================
   TABLE COLUMNS
========================================================= */

function columnsFor(type) {

  const map = {

    products: [
      ["id", "ID"],
      ["sku", "SKU"],
      ["name", "Name"],
      ["category", "Category"],
      ["unitPrice", "Unit Price"],
      ["reorderLevel", "Reorder Level"],
      ["active", "Status"]
    ],

    categories: [
      ["id", "ID"],
      ["name", "Name"],
      ["description", "Description"],
      ["active", "Status"]
    ],

    warehouses: [
      ["id", "ID"],
      ["name", "Name"],
      ["location", "Location"],
      ["managerName", "Manager"],
      ["capacity", "Capacity"],
      ["active", "Status"]
    ],

    suppliers: [
      ["id", "ID"],
      ["name", "Name"],
      ["contactPerson", "Contact"],
      ["email", "Email"],
      ["phone", "Phone"],
      ["active", "Status"]
    ],

    inventory: [
      ["id", "ID"],
      ["product", "Product"],
      ["warehouse", "Warehouse"],
      ["quantity", "Quantity"],
      ["reservedQuantity", "Reserved"]
    ],

    orders: [
      ["id", "ID"],
      ["orderNumber", "Order #"],
      ["customerName", "Customer"],
      ["status", "Status"],
      ["orderDate", "Order Date"],
      ["totalAmount", "Total"]
    ],

    "purchase-orders": [
      ["id", "ID"],
      ["poNumber", "PO #"],
      ["supplier", "Supplier"],
      ["warehouse", "Warehouse"],
      ["status", "Status"],
      ["totalAmount", "Total"]
    ],

    shipments: [
      ["id", "ID"],
      ["shipmentNumber", "Shipment #"],
      ["status", "Status"],
      ["carrierName", "Carrier"],
      ["trackingNumber", "Tracking"]
    ],

    "stock-movements": [
      ["id", "ID"],
      ["product", "Product"],
      ["warehouse", "Warehouse"],
      ["movementType", "Type"],
      ["quantity", "Quantity"],
      ["createdAt", "Created"]
    ]

  };

  return (
    map[type] ||
    [["id", "ID"]]
  ).map(
    ([key, label]) => ({
      key,
      label
    })
  );
}

/* =========================================================
   RENDER TABLE VALUE
========================================================= */

function renderValue(row, key) {

  let value = row[key];

  if (
    value &&
    typeof value === "object"
  ) {

    value =
      value.name ||
      value.sku ||
      value.id ||
      JSON.stringify(value);
  }

  if (key === "active") {

    return (
      <span
        className={`pill ${
          value
            ? "success"
            : "muted-pill"
        }`}
      >
        {value
          ? "Active"
          : "Inactive"}
      </span>
    );
  }

  if (
    key === "status" ||
    key === "movementType"
  ) {

    return (
      <span className="pill status">
        {String(
          value ?? "—"
        )}
      </span>
    );
  }

  if (
    key
      .toLowerCase()
      .includes("price") ||
    key === "totalAmount"
  ) {

    return value == null
      ? "—"
      : `₹${Number(
          value
        ).toLocaleString("en-IN")}`;
  }

  return (
    value == null ||
    value === ""
      ? "—"
      : String(value)
  );
}

/* =========================================================
   FORM MODAL
========================================================= */

function FormModal({
  type,
  item,
  onClose,
  onSave
}) {

  const fields =
    formFields(type);

  const [form, setForm] =
    useState(() => {

      const initial = {};

      fields.forEach(
        (field) => {

          /*
           * Product relationship:
           *
           * item.category.id
           * ->
           * categoryId
           */
          if (
            field.key ===
            "categoryId"
          ) {

            initial[field.key] =
              item?.category?.id ??
              "";

          } else if (
            field.key ===
            "productId"
          ) {

            initial[field.key] =
              item?.product?.id ??
              "";

          } else if (
            field.key ===
            "warehouseId"
          ) {

            initial[field.key] =
              item?.warehouse?.id ??
              "";

          } else if (
            field.key ===
            "supplierId"
          ) {

            initial[field.key] =
              item?.supplier?.id ??
              "";

          } else if (
            field.key ===
            "orderId"
          ) {

            initial[field.key] =
              item?.order?.id ??
              "";

          } else {

            initial[field.key] =
              item?.[field.key] ??
              field.default ??
              "";
          }

        }
      );

      return initial;
    });

  function set(key, value) {

    setForm(
      (previous) => ({
        ...previous,
        [key]: value
      })
    );
  }

  return (
    <div className="modal-backdrop">

      <div className="modal">

        <div className="modal-head">

          <div>

            <div className="eyebrow">
              {item
                ? "EDIT"
                : "CREATE"}
            </div>

            <h2>
              {item
                ? "Update"
                : "Add"}{" "}
              {singular(
                services[type]?.label ||
                type
              )}
            </h2>

          </div>

          <button
            className="icon-btn"
            onClick={onClose}
          >
            <X />
          </button>

        </div>

        <div className="form-grid">

          {fields.map(
            (field) => (

              <label
                key={field.key}
              >

                {field.label}

                {field.type ===
                "textarea" ? (

                  <textarea
                    value={
                      form[field.key]
                    }
                    onChange={(e) =>
                      set(
                        field.key,
                        e.target.value
                      )
                    }
                  />

                ) : field.type ===
                  "checkbox" ? (

                  <input
                    type="checkbox"
                    checked={Boolean(
                      form[field.key]
                    )}
                    onChange={(e) =>
                      set(
                        field.key,
                        e.target.checked
                      )
                    }
                  />

                ) : (

                  <input
                    type={
                      field.type ||
                      "text"
                    }
                    value={
                      form[field.key]
                    }
                    onChange={(e) =>
                      set(
                        field.key,
                        field.type ===
                        "number"
                          ? Number(
                              e.target.value
                            )
                          : e.target.value
                      )
                    }
                    placeholder={
                      field.placeholder ||
                      ""
                    }
                  />

                )}

              </label>

            )
          )}

        </div>

        <div className="modal-actions">

          <button
            className="secondary"
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            className="primary"
            onClick={() =>
              onSave(form)
            }
          >
            {item
              ? "Save changes"
              : "Create record"}
          </button>

        </div>

      </div>

    </div>
  );
}

/* =========================================================
   FORM FIELDS
========================================================= */

function formFields(type) {

  const common = {

    products: [
      [
        "sku",
        "SKU"
      ],
      [
        "name",
        "Name"
      ],
      [
        "description",
        "Description",
        "textarea"
      ],
      [
        "categoryId",
        "Category ID",
        "number"
      ],
      [
        "unitPrice",
        "Unit Price",
        "number",
        0
      ],
      [
        "reorderLevel",
        "Reorder Level",
        "number",
        10
      ],
      [
        "active",
        "Active",
        "checkbox",
        true
      ]
    ],

    categories: [
      [
        "name",
        "Name"
      ],
      [
        "description",
        "Description",
        "textarea"
      ],
      [
        "active",
        "Active",
        "checkbox",
        true
      ]
    ],

    warehouses: [
      [
        "name",
        "Name"
      ],
      [
        "location",
        "Location"
      ],
      [
        "managerName",
        "Manager Name"
      ],
      [
        "capacity",
        "Capacity",
        "number",
        0
      ],
      [
        "active",
        "Active",
        "checkbox",
        true
      ]
    ],

    suppliers: [
      [
        "name",
        "Name"
      ],
      [
        "contactPerson",
        "Contact Person"
      ],
      [
        "email",
        "Email",
        "email"
      ],
      [
        "phone",
        "Phone"
      ],
      [
        "address",
        "Address",
        "textarea"
      ],
      [
        "active",
        "Active",
        "checkbox",
        true
      ]
    ],

    inventory: [
      [
        "productId",
        "Product ID",
        "number"
      ],
      [
        "warehouseId",
        "Warehouse ID",
        "number"
      ],
      [
        "quantity",
        "Quantity",
        "number",
        0
      ],
      [
        "reservedQuantity",
        "Reserved Quantity",
        "number",
        0
      ]
    ],

    orders: [
      [
        "orderNumber",
        "Order Number"
      ],
      [
        "customerName",
        "Customer Name"
      ],
      [
        "customerEmail",
        "Customer Email",
        "email"
      ],
      [
        "customerPhone",
        "Customer Phone"
      ],
      [
        "warehouseId",
        "Warehouse ID",
        "number"
      ],
      [
        "status",
        "Status"
      ],
      [
        "orderDate",
        "Order Date"
      ],
      [
        "totalAmount",
        "Total Amount",
        "number",
        0
      ]
    ],

    "purchase-orders": [
      [
        "poNumber",
        "PO Number"
      ],
      [
        "supplierId",
        "Supplier ID",
        "number"
      ],
      [
        "warehouseId",
        "Warehouse ID",
        "number"
      ],
      [
        "status",
        "Status"
      ],
      [
        "orderDate",
        "Order Date"
      ],
      [
        "expectedDate",
        "Expected Date"
      ],
      [
        "totalAmount",
        "Total Amount",
        "number",
        0
      ]
    ],

    shipments: [
      [
        "shipmentNumber",
        "Shipment Number"
      ],
      [
        "orderId",
        "Order ID",
        "number"
      ],
      [
        "status",
        "Status"
      ],
      [
        "carrierName",
        "Carrier"
      ],
      [
        "trackingNumber",
        "Tracking Number"
      ],
      [
        "shippingAddress",
        "Shipping Address",
        "textarea"
      ]
    ],

    "stock-movements": [
      [
        "productId",
        "Product ID",
        "number"
      ],
      [
        "warehouseId",
        "Warehouse ID",
        "number"
      ],
      [
        "movementType",
        "Movement Type"
      ],
      [
        "quantity",
        "Quantity",
        "number"
      ],
      [
        "referenceType",
        "Reference Type"
      ],
      [
        "referenceId",
        "Reference ID",
        "number"
      ],
      [
        "notes",
        "Notes",
        "textarea"
      ]
    ]

  };

  return (
    common[type] ||
    [["name", "Name"]]
  ).map(
    (field) => ({
      key: field[0],
      label: field[1],
      type:
        field[2] || "text",
      default:
        field[3]
    })
  );
}

/* =========================================================
   TABLE SKELETON
========================================================= */

function TableSkeleton() {

  return (
    <div className="skeleton-table">

      {[1, 2, 3, 4, 5].map(
        (item) => (

          <div
            key={item}
            className="skeleton-row"
          >
            <i />
            <i />
            <i />
            <i />
            <i />
          </div>

        )
      )}

    </div>
  );
}

/* =========================================================
   SETTINGS
========================================================= */

function SettingsPage() {

  return (
    <div className="animate-in">

      <div className="page-head">

        <div>

          <div className="eyebrow">
            SYSTEM
          </div>

          <h1>
            Settings
          </h1>

          <p>
            Workspace configuration
            and connection details.
          </p>

        </div>

      </div>

      <div className="grid-2">

        <div className="panel settings-card">

          <h3>
            API Connection
          </h3>

          <p className="muted">
            Your frontend is configured
            for the existing Spring Boot
            service.
          </p>

          <div className="setting-line">

            <span>
              Base URL
            </span>

            <code>
              http://localhost:8081/api
            </code>

          </div>

          <div className="setting-line">

            <span>
              Authentication
            </span>

            <span className="pill success">
              JWT Bearer
            </span>

          </div>

        </div>

        <div className="panel settings-card">

          <h3>
            Product mode
          </h3>

          <p className="muted">
            Professional portfolio
            configuration.
          </p>

          <div className="feature-list">

            <span>
              <CheckCircle2 />
              Responsive layout
            </span>

            <span>
              <CheckCircle2 />
              Animated interactions
            </span>

            <span>
              <CheckCircle2 />
              REST API integration
            </span>

            <span>
              <CheckCircle2 />
              Error & loading states
            </span>

          </div>

        </div>

      </div>

    </div>
  );
}

/* =========================================================
   START APPLICATION
========================================================= */

createRoot(
  document.getElementById("root")
).render(
  <App />
);