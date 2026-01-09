# ws-chatbot

**ws-chatbot** is a WhatsApp automation platform built with **Node.js** that integrates with multiple Brazilian banks and financial services to automate customer interactions, loan simulations, document processing, and CRM workflows.

---

## 🚀 Overview

This project implements a robust WhatsApp chatbot designed to handle end-to-end financial service conversations. It orchestrates complex business logic, integrates with multiple banking APIs, manages customer data, and supports automated decision-making flows.

The architecture is modular and extensible, allowing new banks, workflows, or integrations to be added with minimal coupling.

---

## ⭐ Key Features

- **Multi-Bank Integration**  
  Integrations with BMG, C6, Facta, Mercantil, PAN, and Safra APIs.

- **WhatsApp Automation**  
  Automated messaging, conversation state management, and flow control.

- **FGTS Loan Processing**  
  File creation and validation for FGTS loan requests.

- **CRM Integration**  
  RD Station integration for lead and customer data management.

- **Spreadsheet Automation**  
  Google Sheets API for proposal management and data synchronization.

- **Web Scraping**  
  Lemit crawler for financial data extraction.

- **Persistent Conversations**  
  Stateful storage of customer interactions.

- **Error Handling & Recovery**  
  Centralized error handling and logging for business-critical flows.

---

## 🧠 Architecture

The project separates **API integrations**, **business logic**, and **routing**, following a layered structure:

```text
src/
├── api/
│ ├── banks/ # Bank API integrations
│ ├── counter/ # Tracking and counters
│ ├── crm/ # CRM integrations (RD Station)
│ └── whatsapp/ # WhatsApp API handlers
├── app/
│ ├── banks/ # Bank-specific workflows and validators
│ ├── factorybelt/ # Workflow automation and cadence logic
│ ├── lemit/ # Web scraping modules
│ └── whatsapp/ # Conversation rules and flow handling
├── database/ # Express routes and controllers
└── util/ # Shared utilities
```

Additional important files:
- `app.js` / `server.js` — Application entry points
- `database.js` — Database connection setup
- `googleAPI.js` — Google Sheets integration
- `wsutils.js` — WhatsApp utilities
- `error.js` — Error handling helpers

---

## 🧪 Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Messaging:** WhatsApp API
- **CRM:** RD Station API
- **Data Sync:** Google API
- **Web Scraping:** Puppeteer
- **Storage:** PostgreSQL / MongoDB (depending on environment)

---

## ⚠️ Notes

> This repository contains a **legacy codebase** provided for reference.  
> While functional, it may require refactoring or dependency updates for modern production use.

---

## 🔧 Setup (Optional)

```bash
git clone https://github.com/yourusername/ws-chatbot.git
cd ws-chatbot
npm install
npm start
```

## 🎯 Why This Project

This project showcases:

- Real-world financial API integrations
- Complex conversational automation via WhatsApp
- End-to-end backend ownership
- Handling of edge cases, failures, and business constraints
- Pragmatic engineering decisions under real operational conditions