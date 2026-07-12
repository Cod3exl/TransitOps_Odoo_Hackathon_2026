# 🚚 TransitOps — Smart Transport Operations Platform

<div align="center">
  <img src="./dashboard.png" alt="TransitOps Dashboard" width="800" />
</div>

<br />

**TransitOps** is an end-to-end transport operations platform that digitizes vehicle, driver, dispatch, maintenance, and expense management while enforcing strict business rules and providing real-time operational insights. Built for the **Odoo Hackathon 2026**.

## 📖 Description

Many logistics companies still rely on spreadsheets and manual logbooks to manage their transport operations. This leads to scheduling conflicts, underutilized vehicles, missed maintenance, and poor operational visibility. 

TransitOps solves this by providing a centralized platform that manages the complete lifecycle of transport operations—from vehicle registration and driver management to dispatching, maintenance, fuel logging, and analytics. It enforces mandatory business rules automatically so that dispatchers cannot assign suspended drivers or vehicles currently in the shop.

---

## 📸 Application Flow & Features

<details open>
<summary><b>1. Vehicle Registry</b></summary>
<br/>
<img src="./vehicles.png" width="800" />
Maintain a master list of all fleet assets, track their active status, odometer readings, and payload capacities.
</details>

<details open>
<summary><b>2. Driver Management</b></summary>
<br/>
<img src="./drivers.png" width="800" />
Track driver certifications, safety scores, and ensure dispatchers cannot assign suspended drivers or drivers with expired licenses.
</details>

<details open>
<summary><b>3. Trip Dispatching</b></summary>
<br/>
<img src="./trips.png" width="800" />
Safely dispatch trips validating payload capacities, driver statuses, and vehicle availability.
</details>

<details open>
<summary><b>4. Maintenance Workflow</b></summary>
<br/>
<img src="./maintenance.png" width="800" />
Log maintenance records and automatically mark vehicles as "In Shop" to prevent unsafe dispatching.
</details>

<details open>
<summary><b>5. Fuel & Expenses</b></summary>
<br/>
<img src="./finance.png" width="800" />
Track fuel consumption and operational costs with automated calculations.
</details>

<details open>
<summary><b>6. Reports & Analytics</b></summary>
<br/>
<img src="./reports.png" width="800" />
View Fleet Utilization, Fuel Efficiency, and per-vehicle ROI calculations across your whole fleet.
</details>

---

## 🧪 Proper Test Workflow (End-to-End Pointers)

To fully verify the enforcement of our mandatory business rules, follow this example workflow from the frontend interface:

### Part 1: Registration & Validation
- **Pointer 1:** Log in as **Fleet Manager** and navigate to the **Vehicles** tab. Add a new Vehicle (e.g., `Van-05`) with a maximum capacity of `500 kg`. Verify it appears with an `Available` status.
- **Pointer 2:** Navigate to the **Drivers** tab as a **Safety Officer**. Register a driver (e.g., `Alex`) with a valid driving license.
- **Pointer 3:** Navigate to **Trips** as a **Dispatcher**. Try to create a trip for `Van-05` and `Alex` with a Cargo Weight of `600 kg`. The system will block you (capacity rule). 

### Part 2: The Dispatch Lifecycle
- **Pointer 4:** Correct the Cargo Weight to `450 kg` (≤ 500 kg) and create the trip. 
- **Pointer 5:** Dispatch the trip. Notice that the system automatically changes both `Van-05` and `Alex`'s status to **`On Trip`** globally.
- **Pointer 6:** Try to create a *new* trip while they are dispatched. Notice that neither `Van-05` nor `Alex` appear in the selection dropdowns.
- **Pointer 7:** Complete the trip, entering the final odometer reading and fuel consumed. The system will mark both entities back to **`Available`**.

### Part 3: Maintenance & Finance
- **Pointer 8:** Log in as **Fleet Manager** and open **Maintenance**. Create an Oil Change record for `Van-05`. Observe that its status instantly updates to **`In Shop`** and it is hidden from the dispatcher.
- **Pointer 9:** Log in as **Financial Analyst** and visit **Reports**. See the operational costs and fuel efficiency dynamically updated based on the completed trip and maintenance log.

---

## 🚀 How to Run Locally

### Prerequisites
- Node.js 20+
- A PostgreSQL database (local or hosted, e.g., Railway/Render/Neon)

### 1. Start the Backend (API)
```bash
cd server
npm install

# Set up your environment variables
cp .env.example .env 
# Edit .env and ensure DATABASE_URL and JWT_SECRET are set

# Initialize DB schema and seed demo data
npx prisma migrate dev --name init
npm run seed

# Start the Express server
npm run dev
# The server will run at http://localhost:4000
```

### 2. Start the Frontend (Client)
```bash
cd client
npm install

# Start the Vite development server
npm run dev
# The UI will run at http://localhost:5173
```
> **Note:** The Vite dev server proxies `/api/*` to the backend on port 4000 automatically.

### 3. Demo Accounts
Use password **`demo1234`** for all accounts:
- **Fleet Manager:** `manager@transitops.dev`
- **Dispatcher:** `dispatcher@transitops.dev`
- **Safety Officer:** `safety@transitops.dev`
- **Financial Analyst:** `finance@transitops.dev`

---

## 🛠️ Tech Stack
- **Frontend:** React 19, Vite, Tailwind CSS v4, shadcn/ui, Recharts
- **Backend:** Node.js, Express, Prisma ORM
- **Database:** PostgreSQL
- **Language:** TypeScript
