# 🛠️ Service Manager Web

![Badge Status](https://img.shields.io/badge/Status-Completed-success)
![Badge Node](https://img.shields.io/badge/Node.js-v18+-green)
![Badge Firebird](https://img.shields.io/badge/Database-FirebirdSQL-orange)
![Badge License](https://img.shields.io/badge/License-MIT-blue)

> **Modernizing Service Order Management:** A Fullstack web application developed to integrate and modernize workflows for technical support centers using legacy databases (Firebird SQL).

## 🎯 About the Project

This project was born from the need to streamline service in technical assistance environments. The main goal was to create a modern, responsive, and agile web interface that consumes data directly from a legacy Desktop ERP, without the need for complex data migrations.

The system allows technicians to manage Service Orders (SO) in real-time, collect digital signatures, and eliminate physical paper usage during daily operations, facilitating routine tasks and speeding up standard company procedures.



## ✨ Key Features

* **📊 Interactive Dashboard:** Overview of new, in-progress, and completed Service Orders with real-time performance indicators.
* **📋 Modern Workflow:** Rapid status updates (New → In Progress → Completed) via a clean, technician-focused interface.
* **✍️ Digital Signature:** Capture customer signatures directly on the screen (touch or mouse) using `signature_pad`.
* **🖨️ Smart Printing:** CSS layout optimized for both thermal receipt printers (POS) and standard A4 document printing.
* **🔍 Optimized Search:** Intelligent client and SO search designed to handle legacy database constraints efficiently.

## 🛠️ Tech Stack

* **Backend:** Node.js, Express.js.
* **Frontend:** EJS (Server-side rendering), Responsive CSS3, JavaScript (ES6+).
* **Database:** Firebird SQL (Direct integration via `node-firebird`).
* **Tools:** `dotenv` (environment variables), `express-session` (authentication).

## 📸 Screenshots

| Dashboard | SO Editor |
| :---: | :---: |
| <img src="https://github.com/user-attachments/assets/9bf82179-53c5-44db-83ce-3b4fcf974111" width="400"> | <img src="https://github.com/user-attachments/assets/7fec92ac-73a2-4c5d-ae22-ca274ed741b4" width="400"> |

| Kanban Flow | Digital Signature |
| :---: | :---: |
| <img src="https://github.com/user-attachments/assets/ee7f9aab-adb0-4c16-ad36-2acb867d4e51" width="400"> | <img src="https://github.com/user-attachments/assets/bbb76887-f5d6-4208-9ddf-79fe4a65b225" width="400"> |

## 🚀 Getting Started

### Prerequisites

* [Node.js](https://nodejs.org/) installed (v18 or higher).
* Firebird Database engine installed (or access to a `.FDB` file).

### Installation

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/theussant/service-manager-web.git](https://github.com/theussant/service-manager-web.git)
   cd service-manager-web
