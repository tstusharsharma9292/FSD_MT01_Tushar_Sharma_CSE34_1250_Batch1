# Student Record Management API (Set B)

A REST API and web UI for managing student records using **Node.js** and **Express.js** with an in-memory JavaScript array store.

## Setup & Run Instructions

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the server:
   ```bash
   node server.js
   ```
   The server runs on port **3000** (`http://localhost:3000`).

3. Open the Web UI in your browser at `http://localhost:3000`.

## API Endpoints

| Method | Endpoint | Description | Status Codes |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/students` | Get all student records | `200` |
| `GET` | `/api/students/filter?branch=value` | Case-insensitive filter by branch | `200`, `400` |
| `GET` | `/api/students/:id` | Get a student record by numeric ID | `200`, `404` |
| `POST` | `/api/students` | Create a new student record | `201`, `400` |
| `PUT` | `/api/students/:id` | Update an existing student record | `200`, `400`, `404` |
| `DELETE` | `/api/students/:id` | Delete a student record by ID | `200`, `404` |

## Sample Request Body (`POST` / `PUT`)

```json
{
  "rollNumber": "IT2404",
  "name": "Meera Gupta",
  "branch": "IT",
  "semester": 3,
  "email": "meera@example.com"
}
```
